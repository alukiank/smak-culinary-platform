import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { BillingWebhookController } from '../src/billing/controllers/billing-webhook.controller';
import { LiqPayService } from '../src/infrastructure/liqpay/liqpay.service';
import { SubscriptionService } from '../src/billing/services/subscription.service';
import { PaymentService } from '../src/billing/services/payment.service';
import { ConfigService } from '@nestjs/config';
import { PlanType } from '../src/billing/enums/subscription-plan.enum';
import { PaymentStatus } from '../src/billing/enums/payment-status.enum';

describe('BillingWebhookController (e2e)', () => {
  let app: INestApplication;
  const privateKey = 'test_liqpay_private_key';
  const publicKey = 'test_liqpay_public_key';

  const mockSubscriptionService = {
    activateSubscription: jest.fn(),
    renewSubscription: jest.fn(),
    findByLiqPayOrderId: jest.fn(),
  };

  const mockPaymentService = {
    findByOrderId: jest.fn(),
    createFromCallback: jest.fn(),
    updateFromCallback: jest.fn(),
    mapLiqPayStatus: PaymentService.mapLiqPayStatus,
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'LIQPAY_PUBLIC_KEY') return publicKey;
      if (key === 'LIQPAY_PRIVATE_KEY') return privateKey;
      return null;
    }),
  };

  function createSignedPayload(payloadObj: Record<string, any>) {
    const data = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
    const signature = crypto
      .createHash('sha1')
      .update(privateKey + data + privateKey)
      .digest('base64');
    return { data, signature };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BillingWebhookController],
      providers: [
        LiqPayService,
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /billing/webhook/liqpay', () => {
    it('should reject request when data or signature is missing', async () => {
      await request(app.getHttpServer())
        .post('/billing/webhook/liqpay')
        .send({})
        .expect(400);

      await request(app.getHttpServer())
        .post('/billing/webhook/liqpay')
        .send({ data: 'some-data' })
        .expect(400);
    });

    it('should reject request when signature does not match private key hash', async () => {
      const payload = {
        status: 'success',
        order_id: 'sub_user-1_PRO_1234567890',
        amount: 149,
      };
      const data = Buffer.from(JSON.stringify(payload)).toString('base64');
      const forgedSignature = 'fake-tampered-signature';

      const response = await request(app.getHttpServer())
        .post('/billing/webhook/liqpay')
        .send({ data, signature: forgedSignature })
        .expect(400);

      expect(response.body.message).toBe('Invalid signature');
      expect(mockPaymentService.createFromCallback).not.toHaveBeenCalled();
    });

    it('should accept valid signature, create payment record and activate subscription for new order', async () => {
      const payload = {
        status: 'success',
        order_id: 'sub_user-100_PRO_1234567890',
        amount: 149,
        currency: 'UAH',
        payment_id: 998877,
      };
      const { data, signature } = createSignedPayload(payload);

      mockPaymentService.findByOrderId.mockResolvedValueOnce(null);

      const response = await request(app.getHttpServer())
        .post('/billing/webhook/liqpay')
        .send({ data, signature })
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
      expect(mockPaymentService.createFromCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          order_id: 'sub_user-100_PRO_1234567890',
        }),
        'user-100',
      );
      expect(mockSubscriptionService.activateSubscription).toHaveBeenCalledWith(
        'user-100',
        PlanType.PRO,
        'sub_user-100_PRO_1234567890',
      );
    });

    it('should handle recurring renewal callbacks (action: regular) and renew subscription', async () => {
      const payload = {
        status: 'success',
        action: 'regular',
        order_id: 'sub_user-200_PREMIUM_1234567890',
        amount: 299,
        currency: 'UAH',
        payment_id: 112233,
      };
      const { data, signature } = createSignedPayload(payload);

      mockPaymentService.findByOrderId.mockResolvedValueOnce({
        id: 'pay-existing-1',
        status: PaymentStatus.SUCCESS,
        externalTransactionId: '112233',
      });

      const response = await request(app.getHttpServer())
        .post('/billing/webhook/liqpay')
        .send({ data, signature })
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
      expect(mockPaymentService.updateFromCallback).toHaveBeenCalled();
      expect(mockSubscriptionService.renewSubscription).toHaveBeenCalledWith('user-200');
    });

    it('should ignore exact duplicate callbacks for already processed one-off payments', async () => {
      const payload = {
        status: 'success',
        order_id: 'sub_user-300_PRO_1234567890',
        amount: 149,
        payment_id: 55555,
      };
      const { data, signature } = createSignedPayload(payload);

      mockPaymentService.findByOrderId.mockResolvedValueOnce({
        id: 'pay-existing-2',
        status: PaymentStatus.SUCCESS,
        externalTransactionId: '55555',
      });

      const response = await request(app.getHttpServer())
        .post('/billing/webhook/liqpay')
        .send({ data, signature })
        .expect(200);

      expect(response.body).toEqual({ status: 'already_processed' });
      expect(mockSubscriptionService.activateSubscription).not.toHaveBeenCalled();
    });
  });
});
