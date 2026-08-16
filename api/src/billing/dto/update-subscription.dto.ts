import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PlanType } from '../enums/subscription-plan.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    description: 'The type of subscription plan',
    enum: PlanType,
    example: PlanType.PRO,
  })
  @IsEnum(PlanType)
  @IsOptional()
  planType?: PlanType;

  @ApiPropertyOptional({
    description: 'The status of the subscription',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'When the current subscription period ends',
  })
  @IsDateString()
  @IsOptional()
  currentPeriodEnd?: Date;
}
