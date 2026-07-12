import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { QueuesService } from '../queues/queues.service';
import { CreatePostDto, UpdatePostDto } from './dto/posts.dto';

@Injectable()
export class PostsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(QueuesService) private readonly queuesService: QueuesService,
  ) {}

  async createPost(userId: number, dto: CreatePostDto) {
    const visibilityEnum = dto.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
    
    const post = await this.prisma.post.create({
      data: {
        user_id: userId,
        content: dto.content,
        image_url: dto.image_url || null,
        visibility: visibilityEnum,
      },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    // Invalidate feed cache keys asynchronously
    this.invalidateFeedCache();

    // Trigger async image processing if image_url exists
    if (post.image_url) {
      this.queuesService.addImageProcessingJob({
        post_id: post.id,
        image_url: post.image_url,
      });
    }

    return {
      ...post,
      likesCount: 0,
      isLiked: false,
      userReactionType: null,
      likers: [],
      comments: [],
    };
  }

  async getFeedPosts(currentUserId: number, cursor?: number | string, limit: number | string = 20) {
    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const parsedCursor = typeof cursor === 'string' ? parseInt(cursor, 10) : cursor;

    const finalLimit = isNaN(parsedLimit) ? 20 : parsedLimit;
    const finalCursor = parsedCursor && !isNaN(parsedCursor) ? parsedCursor : undefined;

    const cacheKey = `feed:${currentUserId}:c:${finalCursor || 'none'}:l:${finalLimit}`;
    
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn('Redis read failed:', err);
    }

    const posts = await this.prisma.post.findMany({
      take: finalLimit,
      ...(finalCursor ? { cursor: { id: finalCursor }, skip: 1 } : {}),
      where: {
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'PRIVATE', user_id: currentUserId },
        ],
      },
      orderBy: {
        id: 'desc',
      },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true },
        },
        likes: {
          where: { user_id: currentUserId },
          select: { type: true },
        },
        comments: {
          orderBy: { created_at: 'asc' },
          include: {
            user: {
              select: { id: true, first_name: true, last_name: true },
            },
            likes: {
              where: { user_id: currentUserId },
              select: { id: true },
            },
            replies: {
              orderBy: { created_at: 'asc' },
              include: {
                user: {
                  select: { id: true, first_name: true, last_name: true },
                },
                likes: {
                  where: { user_id: currentUserId },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => {
      const isLiked = post.likes.length > 0;
      const userReactionType = post.likes[0]?.type || null;

      const formattedComments = post.comments.map((comment) => {
        const isCommentLiked = comment.likes.length > 0;

        const formattedReplies = comment.replies.map((reply) => {
          const isReplyLiked = reply.likes.length > 0;
          return {
            ...reply,
            likesCount: reply.likes_count,
            isLiked: isReplyLiked,
            likers: [],
            likes: undefined,
          };
        });

        return {
          ...comment,
          likesCount: comment.likes_count,
          isLiked: isCommentLiked,
          likers: [],
          replies: formattedReplies,
          likes: undefined,
        };
      });

      return {
        ...post,
        likesCount: post.likes_count,
        commentsCount: post.comments_count,
        isLiked,
        userReactionType,
        likers: [],
        comments: formattedComments,
        likes: undefined,
      };
    });

    const nextCursor = posts.length === finalLimit ? posts[posts.length - 1].id : null;
    const result = {
      posts: formattedPosts,
      nextCursor,
    };

    try {
      await this.redisService.set(cacheKey, JSON.stringify(result), 30);
    } catch (err) {
      console.warn('Redis write failed:', err);
    }

    return result;
  }

  async updatePost(userId: number, postId: number, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (post.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to update this post.');
    }

    const updateData: any = {};
    if (dto.content !== undefined) {
      updateData.content = dto.content;
    }
    if (dto.image_url !== undefined) {
      updateData.image_url = dto.image_url || null;
    }
    if (dto.visibility !== undefined) {
      updateData.visibility = dto.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    this.invalidateFeedCache();

    if (dto.image_url && dto.image_url !== post.image_url) {
      this.queuesService.addImageProcessingJob({
        post_id: updatedPost.id,
        image_url: dto.image_url,
      });
    }

    return updatedPost;
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
