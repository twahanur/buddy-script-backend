import { Controller, Post, Body, UseGuards, Inject } from '@nestjs/common';
import { LikesService } from './likes.service';
import { TogglePostLikeDto, ToggleCommentLikeDto, ToggleReplyLikeDto } from './dto/likes.dto';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('likes')
@UseGuards(AuthGuard)
export class LikesController {
  constructor(@Inject(LikesService) private readonly likesService: LikesService) {}

  @Post('posts')
  async togglePost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TogglePostLikeDto,
  ) {
    const result = await this.likesService.togglePostLike(user.id, dto);
    return {
      success: true,
      message: result.isLiked ? 'Post liked successfully.' : 'Post unliked successfully.',
      data: result,
    };
  }

  @Post('comments')
  async toggleComment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ToggleCommentLikeDto,
  ) {
    const result = await this.likesService.toggleCommentLike(user.id, dto);
    return {
      success: true,
      message: result.isLiked ? 'Comment liked successfully.' : 'Comment unliked successfully.',
      data: result,
    };
  }

  @Post('replies')
  async toggleReply(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ToggleReplyLikeDto,
  ) {
    const result = await this.likesService.toggleReplyLike(user.id, dto);
    return {
      success: true,
      message: result.isLiked ? 'Reply liked successfully.' : 'Reply unliked successfully.',
      data: result,
    };
  }
}
