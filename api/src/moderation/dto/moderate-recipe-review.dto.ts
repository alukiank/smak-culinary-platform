import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ModerationDecision } from '../../moderation/enums/moderation-decision.enum';

export class ModerateRecipeReviewDto {
  @ApiProperty({
    description: 'The moderation decision',
    enum: ModerationDecision,
    example: ModerationDecision.APPROVED,
  })
  @IsEnum(ModerationDecision, {
    message: 'Decision must be either APPROVED or REJECTED',
  })
  decision: ModerationDecision;

  @ApiPropertyOptional({
    description: 'The reason for the decision, especially required if rejected',
    example: 'Inappropriate content',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
