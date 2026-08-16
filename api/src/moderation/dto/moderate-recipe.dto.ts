import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ModerationDecision } from '../../moderation/enums/moderation-decision.enum';

export class ModerateRecipeDto {
  @ApiProperty({
    description: 'The moderation decision',
    enum: ModerationDecision,
    example: ModerationDecision.APPROVED,
  })
  @IsEnum(ModerationDecision)
  decision: ModerationDecision;

  @ApiPropertyOptional({
    description: 'The reason for the decision, mandatory if rejected',
    example: 'Low quality images',
  })
  @ValidateIf((o) => o.decision === ModerationDecision.REJECTED)
  @IsString()
  @IsNotEmpty({ message: 'Reason is required when rejecting a recipe' })
  reason?: string;
}
