import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, CreateReplyDto } from './dto/comments.dto';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@Controller('comments')
@UseGuards(AuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async createComment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    const comment = await this.commentsService.addComment(user.id, dto);
    return {
      success: true,
      message: 'Comment added successfully.',
      data: comment,
    };
  }

  @Post('replies')
  async createReply(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReplyDto,
  ) {
    const reply = await this.commentsService.addReply(user.id, dto);
    return {
      success: true,
      message: 'Reply added successfully.',
      data: reply,
    };
  }
}
