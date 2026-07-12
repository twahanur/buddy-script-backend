import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { QueuesService } from '../queues/queues.service';
import { CreateCommentDto, CreateReplyDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(QueuesService) private readonly queuesService: QueuesService,
  ) {}

  async addComment(userId: number, dto: CreateCommentDto) {
    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          post_id: dto.post_id,
          user_id: userId,
          content: dto.content,
        },
        include: {
          user: {
            select: { id: true, first_name: true, last_name: true },
          },
        },
      }),
      this.prisma.post.update({
        where: { id: dto.post_id },
        data: { comments_count: { increment: 1 } },
      }),
    ]);

    this.invalidateFeedCache();

    // Trigger Notification Job asynchronously
    this.triggerCommentNotification(userId, dto.post_id, comment.id);

    return {
      ...comment,
      likesCount: 0,
      isLiked: false,
      replies: [],
    };
  }

  async addReply(userId: number, dto: CreateReplyDto) {
    const [reply] = await this.prisma.$transaction([
      this.prisma.reply.create({
        data: {
          comment_id: dto.comment_id,
          user_id: userId,
          content: dto.content,
        },
        include: {
          user: {
            select: { id: true, first_name: true, last_name: true },
          },
        },
      }),
      this.prisma.comment.update({
        where: { id: dto.comment_id },
        data: { replies_count: { increment: 1 } },
      }),
    ]);

    this.invalidateFeedCache();

    // Trigger Notification Job asynchronously
    this.triggerReplyNotification(userId, dto.comment_id, reply.id);

    return {
      ...reply,
      likesCount: 0,
      isLiked: false,
    };
  }

  private async triggerCommentNotification(actorId: number, postId: number, commentId: number) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { user_id: true },
      });
      if (post && post.user_id !== actorId) {
        await this.queuesService.addNotificationJob({
          type: 'COMMENT',
          actorId,
          targetId: post.user_id,
          entityId: commentId,
        });
      }
    } catch (err) {
      console.warn('Failed to queue comment notification:', err);
    }
  }

  private async triggerReplyNotification(actorId: number, commentId: number, replyId: number) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { user_id: true },
      });
      if (comment && comment.user_id !== actorId) {
        await this.queuesService.addNotificationJob({
          type: 'REPLY',
          actorId,
          targetId: comment.user_id,
          entityId: replyId,
        });
      }
    } catch (err) {
      console.warn('Failed to queue reply notification:', err);
    }
  }

  private invalidateFeedCache() {
    try {
      const redis = this.redisService.getClient();
      const stream = redis.scanStream({ match: 'feed:*' });
      stream.on('data', async (keys) => {
        if (keys.length) {
          const pipeline = redis.pipeline();
          keys.forEach((key: string) => pipeline.del(key));
          await pipeline.exec();
        }
      });
    } catch (err) {
      console.warn('Failed to invalidate Redis feed cache:', err);
    }
  }
}
