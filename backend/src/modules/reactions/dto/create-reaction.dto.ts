import { IsIn } from 'class-validator';

export class CreateReactionDto {
  @IsIn(['like', 'dislike'])
  reactionType!: 'like' | 'dislike';
}
