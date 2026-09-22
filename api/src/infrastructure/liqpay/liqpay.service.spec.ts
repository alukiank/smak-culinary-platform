import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { LiqPayService } from './liqpay.service';

describe('LiqPayService', () => {
  let service: LiqPayService;
  let configService: { get: jest.Mock };

  const mockPublicKey = 'sandbox_public_key';
  const mockPrivateKey = 'sandbox_private_key';
  const mockCallbackUrl = 'https://api.smak.ua/billing/webhook/liqpay';

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'LIQPAY_PUBLIC_KEY') return mockPublicKey;
        if (key === 'LIQPAY_PRIVATE_KEY') return mockPrivateKey;
        if (key === 'LIQPAY_CALLBACK_URL') return mockCallbackUrl;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiqPayService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<LiqPayService>(LiqPayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildSignature & verifySignature', () => {
    it('should correctly build and verify SHA1 base64 signature', () => {
      const sampleData = Buffer.from(JSON.stringify({ order_id: 'order_123' })).toString('base64');
      const expectedSignature = crypto
        .createHash('sha1')
        .update(mockPrivateKey + sampleData + mockPrivateKey)
        .digest('base64');

      const isValid = service.verifySignature(sampleData, expectedSignature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid or tampered signature', () => {
      const sampleData = Buffer.from(JSON.stringify({ order_id: 'order_123' })).toString('base64');
      const tamperedSignature = 'invalid-signature-hash';

      const isValid = service.verifySignature(sampleData, tamperedSignature);
      expect(isValid).toBe(false);
    });

    it('should reject when data was tampered even with original signature', () => {
      const sampleData = Buffer.from(JSON.stringify({ order_id: 'order_123' })).toString('base64');
      const signature = crypto
        .createHash('sha1')
        .update(mockPrivateKey + sampleData + mockPrivateKey)
        .digest('base64');

      const tamperedData = Buffer.from(JSON.stringify({ order_id: 'order_hacked' })).toString('base64');
      const isValid = service.verifySignature(tamperedData, signature);

      expect(isValid).toBe(false);
    });
  });

  describe('createCheckoutParams', () => {
    it('should generate base64 data and signature with subscribe parameters for action=subscribe', () => {
      const params = {
        orderId: 'sub_user1_PRO_uuid',
        amount: 299,
        currency: 'UAH',
        description: 'Monthly PRO subscription',
        action: 'subscribe' as const,
        resultUrl: 'https://smak.ua/billing/success',
      };

      const result = service.createCheckoutParams(params);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('signature');

      const decodedJson = JSON.parse(Buffer.from(result.data, 'base64').toString('utf-8'));
      expect(decodedJson.public_key).toBe(mockPublicKey);
      expect(decodedJson.amount).toBe(299);
      expect(decodedJson.currency).toBe('UAH');
      expect(decodedJson.order_id).toBe('sub_user1_PRO_uuid');
      expect(decodedJson.action).toBe('subscribe');
      expect(decodedJson.subscribe).toBe(1);
      expect(decodedJson.subscribe_periodicity).toBe('month');
      expect(decodedJson.server_url).toBe(mockCallbackUrl);
      expect(decodedJson.result_url).toBe('https://smak.ua/billing/success');

      // Verify signature matches
      expect(service.verifySignature(result.data, result.signature)).toBe(true);
    });

    it('should not include subscribe flag when action is pay', () => {
      const params = {
        orderId: 'pay_123',
        amount: 100,
        currency: 'UAH',
        description: 'One-time payment',
        action: 'pay' as const,
      };

      const result = service.createCheckoutParams(params);
      const decodedJson = JSON.parse(Buffer.from(result.data, 'base64').toString('utf-8'));

      expect(decodedJson.action).toBe('pay');
      expect(decodedJson.subscribe).toBeUndefined();
    });
  });

  describe('decodeCallbackData', () => {
    it('should decode base64 encoded callback JSON', () => {
      const callbackPayload = {
        status: 'success',
        order_id: 'sub_123',
        amount: 299,
        currency: 'UAH',
        payment_id: 99887766,
      };

      const base64Data = Buffer.from(JSON.stringify(callbackPayload)).toString('base64');
      const decoded = service.decodeCallbackData(base64Data);

      expect(decoded).toEqual(callbackPayload);
    });
  });

  describe('unsubscribe', () => {
    it('should return error object if orderId is missing', async () => {
      const result = await service.unsubscribe('');
      expect(result).toEqual({ result: 'error', err_description: 'Missing order_id' });
    });

    it('should send unsubscribe request to LiqPay API and return response', async () => {
      const mockResponse = { result: 'ok', status: 'unsubscribed' };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await service.unsubscribe('order_to_cancel');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.liqpay.ua/api/request',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should gracefully handle fetch errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.unsubscribe('order_failing');

      expect(result).toEqual({ result: 'error', err_description: 'Network error' });
    });
  });
});
