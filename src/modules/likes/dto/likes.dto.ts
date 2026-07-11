import { IsNotEmpty, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ReactionType } from '@prisma/client';

export class TogglePostLikeDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'post_id is required.' })
  post_id!: number;

  @IsEnum(ReactionType, { message: 'Invalid reaction type.' })
  @IsOptional()
  type: ReactionType = ReactionType.LIKE;
}

export class ToggleCommentLikeDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'comment_id is required.' })
  comment_id!: number;
}

export class ToggleReplyLikeDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'reply_id is required.' })
  reply_id!: number;
}
