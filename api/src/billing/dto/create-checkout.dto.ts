import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PlanType } from '../enums/subscription-plan.enum';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'The type of subscription plan to purchase',
    enum: PlanType,
    example: PlanType.PRO,
  })
  @IsEnum(PlanType)
  planType: PlanType;
}
