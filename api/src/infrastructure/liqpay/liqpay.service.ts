import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { LiqPayCallbackData } from './interfaces/liqpay-callback-data.interface';
import { LiqPayCheckoutParams } from './interfaces/liqpay-checkout-params.interface';

@Injectable()
export class LiqPayService {
  private readonly logger = new Logger(LiqPayService.name);
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor(private readonly configService: ConfigService) {
    this.publicKey = this.configService.get<string>('LIQPAY_PUBLIC_KEY');
    this.privateKey = this.configService.get<string>('LIQPAY_PRIVATE_KEY');
  }

  createCheckoutParams(params: LiqPayCheckoutParams): {
    data: string;
    signature: string;
  } {
    const callbackUrl = this.configService.get<string>('LIQPAY_CALLBACK_URL');

    const payload: Record<string, any> = {
      version: 3,
      public_key: this.publicKey,
      action: params.action,
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      order_id: params.orderId,
      server_url: callbackUrl,
      result_url: params.resultUrl ?? '',
    };

    if (params.action === 'subscribe') {
      payload.subscribe = 1;
      payload.subscribe_periodicity = params.subscribePeriodicity ?? 'month';
      payload.subscribe_date_start =
        params.subscribeDateStart ?? this.getNextMonthDate();
    }

    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = this.buildSignature(data);

    return { data, signature };
  }

  verifySignature(data: string, signature: string): boolean {
    const expectedSignature = this.buildSignature(data);
    return expectedSignature === signature;
  }

  decodeCallbackData(data: string): LiqPayCallbackData {
    const json = Buffer.from(data, 'base64').toString('utf-8');
    return JSON.parse(json) as LiqPayCallbackData;
  }

  async unsubscribe(
    orderId: string,
  ): Promise<{ result: string; status?: string; [key: string]: any }> {
    if (!orderId) {
      return { result: 'error', err_description: 'Missing order_id' };
    }

    const payload = {
      version: 3,
      public_key: this.publicKey,
      action: 'unsubscribe',
      order_id: orderId,
    };

    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = this.buildSignature(data);

    try {
      const formParams = new URLSearchParams();
      formParams.append('data', data);
      formParams.append('signature', signature);

      const response = await fetch('https://www.liqpay.ua/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formParams.toString(),
      });

      const json = await response.json();
      this.logger.log(
        `[LiqPay] Unsubscribe request for order "${orderId}" response: ${JSON.stringify(json)}`,
      );
      return json;
    } catch (error) {
      this.logger.error(
        `[LiqPay] Failed to send unsubscribe for order "${orderId}": ${error.message}`,
        error.stack,
      );
      return { result: 'error', err_description: error.message };
    }
  }

  private buildSignature(data: string): string {
    return crypto
      .createHash('sha1')
      .update(this.privateKey + data + this.privateKey)
      .digest('base64');
  }

  private getNextMonthDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }
}

