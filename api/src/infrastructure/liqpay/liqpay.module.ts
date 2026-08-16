import { Module } from '@nestjs/common';
import { LiqPayService } from './liqpay.service';

@Module({
  providers: [LiqPayService],
  exports: [LiqPayService],
})
export class LiqPayModule {}
