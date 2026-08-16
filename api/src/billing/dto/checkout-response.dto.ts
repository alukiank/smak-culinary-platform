import { ApiProperty } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty({
    description: 'Encoded payment data',
    example:
      'eyJhY3Rpb24iOiJwYXkiLCJhbW91bnQiOjEwMCwiY3VycmVuY3kiOiJVQUgiLCJkZXNjcmlwdGlvbiI6IlRlc3QiLCJvcmRlcl9pZCI6IjEyMyIsInZlcnNpb24iOjN9',
  })
  data: string;

  @ApiProperty({
    description: 'Payment signature',
    example: 'signature123',
  })
  signature: string;

  @ApiProperty({
    description: 'The URL to redirect the user for payment',
    example: 'https://www.liqpay.ua/api/3/checkout',
  })
  checkoutUrl: string;
}
