import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Currency } from '../enums/currency.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { UserPrivateDto } from '../../user/dto/user-private.dto';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the payment',
    example: 'uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'The amount paid', example: 100.0 })
  @Expose()
  amount: number;

  @ApiProperty({
    description: 'The currency of the payment',
    enum: Currency,
    example: Currency.UAH,
  })
  @Expose()
  currency: Currency;

  @ApiProperty({
    description: 'The status of the payment',
    enum: PaymentStatus,
    example: PaymentStatus.SUCCESS,
  })
  @Expose()
  status: PaymentStatus;

  @ApiProperty({
    description: 'The order ID associated with the payment',
    example: 'order-123',
  })
  @Expose()
  orderId: string;

  @ApiProperty({
    description: 'A description of the payment',
    example: 'Monthly subscription',
  })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Extra data from the payment provider' })
  @Expose()
  externalTransactionData: Record<string, any>;

  @ApiProperty({
    description: 'The transaction ID from the payment provider',
    example: 'ext-123',
  })
  @Expose()
  externalTransactionId: string;

  @ApiProperty({ description: 'When the payment was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'The ID of the user who made the payment',
    example: 'user-123',
    nullable: true,
  })
  @Expose()
  userId: string | null;

  @ApiProperty({
    description: 'The user who made the payment',
    type: () => UserPrivateDto,
  })
  @Expose()
  @Type(() => UserPrivateDto)
  user: UserPrivateDto;
}
