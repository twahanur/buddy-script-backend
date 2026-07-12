import { Controller, Post, Get, Body, Query, UseGuards, Inject, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, GetFeedQueryDto, UpdatePostDto } from './dto/posts.dto';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('posts')
@UseGuards(AuthGuard)
export class PostsController {
  constructor(@Inject(PostsService) private readonly postsService: PostsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    const post = await this.postsService.createPost(user.id, dto);
    return {
      success: true,
      message: 'Post created successfully.',
      data: post,
    };
  }

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetFeedQueryDto,
  ) {
    const feed = await this.postsService.getFeedPosts(user.id, query.cursor, query.limit);
    return {
      success: true,
      data: feed,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ) {
    const post = await this.postsService.updatePost(user.id, id, dto);
    return {
      success: true,
      message: 'Post updated successfully.',
      data: post,
    };
  }
}
