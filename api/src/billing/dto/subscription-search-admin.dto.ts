import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PlanType } from '../enums/subscription-plan.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class SubscriptionSearchAdminDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Users UUID for filtering' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Plan type (FREE, PRO, PREMIUM)',
    enum: PlanType,
  })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiPropertyOptional({
    description: 'Subscription status (ACTIVE, EXPIRED, CANCELED, PAST_DUE)',
    enum: SubscriptionStatus,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
