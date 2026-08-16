import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { PlanType } from '../enums/subscription-plan.enum';
import { UserPrivateDto } from '../../user/dto/user-private.dto';

export class SubscriptionResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the subscription',
    example: 'uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The type of subscription plan',
    enum: PlanType,
    example: PlanType.FREE,
  })
  @Expose()
  planType: PlanType;

  @ApiProperty({
    description: 'The current status of the subscription',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  @Expose()
  status: SubscriptionStatus;

  @ApiProperty({ description: 'When the current subscription period ends' })
  @Expose()
  currentPeriodEnd: Date;

  @ApiProperty({
    description: 'The LiqPay order ID for this subscription',
    example: 'lp-123',
  })
  @Expose()
  liqpayOrderId: string;

  @ApiProperty({ description: 'When the subscription was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'When the subscription was last updated' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'The ID of the user who owns the subscription',
    example: 'user-123',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'The user who owns the subscription',
    type: () => UserPrivateDto,
  })
  @Expose()
  @Type(() => UserPrivateDto)
  user: UserPrivateDto;
}
