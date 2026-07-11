import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'post_id is required.' })
  post_id!: number;

  @IsString()
  @IsNotEmpty({ message: 'Comment content is required.' })
  content!: string;
}

export class CreateReplyDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'comment_id is required.' })
  comment_id!: number;

  @IsString()
  @IsNotEmpty({ message: 'Reply content is required.' })
  content!: string;
}
