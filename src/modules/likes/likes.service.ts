import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { QueuesService } from '../queues/queues.service';
import { TogglePostLikeDto, ToggleCommentLikeDto, ToggleReplyLikeDto } from './dto/likes.dto';
import { ReactionType } from '@prisma/client';

@Injectable()
export class LikesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(QueuesService) private readonly queuesService: QueuesService,
  ) {}

  async togglePostLike(userId: number, dto: TogglePostLikeDto) {
    const postId = dto.post_id;
    const type = dto.type;

    const postExists = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!postExists) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });

    let isLikedNow = true;
    let nextReactionType: ReactionType | null = type;

    if (existingLike) {
      if (existingLike.type === type) {
        // Toggle off (remove reaction)
        await this.prisma.$transaction([
          this.prisma.postLike.delete({
            where: {
              user_id_post_id: {
                user_id: userId,
                post_id: postId,
              },
            },
          }),
          this.prisma.post.update({
            where: { id: postId },
            data: { likes_count: { decrement: 1 } },
          }),
        ]);
        isLikedNow = false;
        nextReactionType = null;
      } else {
        // Change reaction type
        await this.prisma.postLike.update({
          where: {
            user_id_post_id: {
              user_id: userId,
              post_id: postId,
            },
          },
          data: { type },
        });
        isLikedNow = true;
        nextReactionType = type;
      }
    } else {
      // Create new reaction
      await this.prisma.$transaction([
        this.prisma.postLike.create({
          data: {
            user_id: userId,
            post_id: postId,
            type,
          },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likes_count: { increment: 1 } },
        }),
      ]);
      isLikedNow = true;
      nextReactionType = type;
    }

    this.invalidateFeedCache();

    // Trigger Notification asynchronously on like creation
    if (isLikedNow && postExists.user_id !== userId) {
      this.queuesService.addNotificationJob({
        type: 'LIKE_POST',
        actorId: userId,
        targetId: postExists.user_id,
        entityId: postId,
      });
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { likes_count: true },
    });

    const latestLikes = await this.prisma.postLike.findMany({
      where: { post_id: postId },
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    return {
      isLiked: isLikedNow,
      userReactionType: nextReactionType,
      likesCount: post?.likes_count || 0,
      likers: latestLikes.map((l) => ({
        id: l.user.id,
        first_name: l.user.first_name,
        last_name: l.user.last_name,
        reaction_type: l.type,
      })),
    };
  }

  async toggleCommentLike(userId: number, dto: ToggleCommentLikeDto) {
    const commentId = dto.comment_id;

    const commentExists = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!commentExists) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        user_id_comment_id: {
          user_id: userId,
          comment_id: commentId,
        },
      },
    });

    let isLikedNow = true;

    if (existingLike) {
      await this.prisma.$transaction([
        this.prisma.commentLike.delete({
          where: {
            user_id_comment_id: {
              user_id: userId,
              comment_id: commentId,
            },
          },
        }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likes_count: { decrement: 1 } },
        }),
      ]);
      isLikedNow = false;
    } else {
      await this.prisma.$transaction([
        this.prisma.commentLike.create({
          data: {
            user_id: userId,
            comment_id: commentId,
          },
        }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likes_count: { increment: 1 } },
        }),
      ]);
      isLikedNow = true;
    }

    this.invalidateFeedCache();

    // Trigger Notification asynchronously on comment like creation
    if (isLikedNow && commentExists.user_id !== userId) {
      this.queuesService.addNotificationJob({
        type: 'LIKE_COMMENT',
        actorId: userId,
        targetId: commentExists.user_id,
        entityId: commentId,
      });
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { likes_count: true },
    });

    const latestLikes = await this.prisma.commentLike.findMany({
      where: { comment_id: commentId },
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    return {
      isLiked: isLikedNow,
      likesCount: comment?.likes_count || 0,
      likers: latestLikes.map((l) => l.user),
    };
  }

  async toggleReplyLike(userId: number, dto: ToggleReplyLikeDto) {
    const replyId = dto.reply_id;

    const replyExists = await this.prisma.reply.findUnique({
      where: { id: replyId },
    });
    if (!replyExists) {
      throw new NotFoundException('Reply not found');
    }

    const existingLike = await this.prisma.replyLike.findUnique({
      where: {
        user_id_reply_id: {
          user_id: userId,
          reply_id: replyId,
        },
      },
    });

    let isLikedNow = true;

    if (existingLike) {
      await this.prisma.$transaction([
        this.prisma.replyLike.delete({
          where: {
            user_id_reply_id: {
              user_id: userId,
              reply_id: replyId,
            },
          },
        }),
        this.prisma.reply.update({
          where: { id: replyId },
          data: { likes_count: { decrement: 1 } },
        }),
      ]);
      isLikedNow = false;
    } else {
      await this.prisma.$transaction([
        this.prisma.replyLike.create({
          data: {
            user_id: userId,
            reply_id: replyId,
          },
        }),
        this.prisma.reply.update({
          where: { id: replyId },
          data: { likes_count: { increment: 1 } },
        }),
      ]);
      isLikedNow = true;
    }

    this.invalidateFeedCache();

    // Trigger Notification asynchronously on reply like creation
    if (isLikedNow && replyExists.user_id !== userId) {
      this.queuesService.addNotificationJob({
        type: 'LIKE_REPLY',
        actorId: userId,
        targetId: replyExists.user_id,
        entityId: replyId,
      });
    }

    const reply = await this.prisma.reply.findUnique({
      where: { id: replyId },
      select: { likes_count: true },
    });

    const latestLikes = await this.prisma.replyLike.findMany({
      where: { reply_id: replyId },
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    return {
      isLiked: isLikedNow,
      likesCount: reply?.likes_count || 0,
      likers: latestLikes.map((l) => l.user),
    };
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
