import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BillingWebhookController } from './billing-webhook.controller';
import { LiqPayService } from '../../infrastructure/liqpay/liqpay.service';
import { SubscriptionService } from '../services/subscription.service';
import { PaymentService } from '../services/payment.service';
import { PlanType } from '../enums/subscription-plan.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Payment } from '../entities/payment.entity';

describe('BillingWebhookController', () => {
  let controller: BillingWebhookController;
  let liqPayService: {
    verifySignature: jest.Mock;
    decodeCallbackData: jest.Mock;
  };
  let subscriptionService: {
    findByLiqPayOrderId: jest.Mock;
    activateSubscription: jest.Mock;
    renewSubscription: jest.Mock;
    handleReversedPayment: jest.Mock;
  };
  let paymentService: {
    mapLiqPayStatus: jest.Mock;
    findByOrderId: jest.Mock;
    createFromCallback: jest.Mock;
    updateFromCallback: jest.Mock;
  };

  const sampleData = 'base64-encoded-data';
  const sampleSignature = 'valid-signature';

  beforeEach(async () => {
    liqPayService = {
      verifySignature: jest.fn(),
      decodeCallbackData: jest.fn(),
    };

    subscriptionService = {
      findByLiqPayOrderId: jest.fn(),
      activateSubscription: jest.fn(),
      renewSubscription: jest.fn(),
      handleReversedPayment: jest.fn(),
    };

    paymentService = {
      mapLiqPayStatus: jest.fn((status: string) =>
        PaymentService.mapLiqPayStatus(status),
      ),
      findByOrderId: jest.fn(),
      createFromCallback: jest.fn(),
      updateFromCallback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingWebhookController],
      providers: [
        { provide: LiqPayService, useValue: liqPayService },
        { provide: SubscriptionService, useValue: subscriptionService },
        { provide: PaymentService, useValue: paymentService },
      ],
    }).compile();

    controller = module.get<BillingWebhookController>(BillingWebhookController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation & Signature Verification', () => {
    it('should throw BadRequestException if data or signature is missing', async () => {
      await expect(
        controller.handleLiqPayCallback('', sampleSignature),
      ).rejects.toThrow(new BadRequestException('Missing data or signature'));

      await expect(
        controller.handleLiqPayCallback(sampleData, ''),
      ).rejects.toThrow(new BadRequestException('Missing data or signature'));
    });

    it('should throw BadRequestException if signature is invalid', async () => {
      liqPayService.verifySignature.mockReturnValue(false);

      await expect(
        controller.handleLiqPayCallback(sampleData, 'invalid-signature'),
      ).rejects.toThrow(new BadRequestException('Invalid signature'));
    });
  });

  describe('Webhook Processing Flows', () => {
    const userId = 'usr-uuid-123';
    const orderId = `sub_${userId}_PRO_random-uuid-999`;

    beforeEach(() => {
      liqPayService.verifySignature.mockReturnValue(true);
    });

    it('should handle initial pending payment (processing status) without activating subscription', async () => {
      const callbackData = {
        order_id: orderId,
        status: 'processing',
        amount: 299,
        currency: 'UAH',
        payment_id: 111,
      };
      liqPayService.decodeCallbackData.mockReturnValue(callbackData);
      paymentService.findByOrderId.mockResolvedValue(null);

      const result = await controller.handleLiqPayCallback(sampleData, sampleSignature);

      expect(paymentService.createFromCallback).toHaveBeenCalledWith(callbackData, userId);
      expect(subscriptionService.activateSubscription).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok' });
    });

    it('should transition payment from PENDING to SUCCESS and activate subscription', async () => {
      const existingPendingPayment = {
        id: 'pay-1',
        orderId,
        status: PaymentStatus.PENDING,
        externalTransactionId: '111',
      } as Payment;

      const callbackData = {
        order_id: orderId,
        status: 'success',
        amount: 299,
        currency: 'UAH',
        payment_id: 111,
        action: 'subscribe',
      };

      liqPayService.decodeCallbackData.mockReturnValue(callbackData);
      paymentService.findByOrderId.mockResolvedValue(existingPendingPayment);

      const result = await controller.handleLiqPayCallback(sampleData, sampleSignature);

      expect(paymentService.updateFromCallback).toHaveBeenCalledWith(
        existingPendingPayment,
        callbackData,
      );
      expect(subscriptionService.activateSubscription).toHaveBeenCalledWith(
        userId,
        PlanType.PRO,
        orderId,
      );
      expect(result).toEqual({ status: 'ok' });
    });

    it('should ignore duplicate webhook if payment is already in final SUCCESS status', async () => {
      const existingSuccessPayment = {
        id: 'pay-1',
        orderId,
        status: PaymentStatus.SUCCESS,
        externalTransactionId: '111',
      } as Payment;

      const callbackData = {
        order_id: orderId,
        status: 'success',
        amount: 299,
        currency: 'UAH',
        payment_id: 111,
        action: 'subscribe',
      };

      liqPayService.decodeCallbackData.mockReturnValue(callbackData);
      paymentService.findByOrderId.mockResolvedValue(existingSuccessPayment);

      const result = await controller.handleLiqPayCallback(sampleData, sampleSignature);

      expect(paymentService.updateFromCallback).not.toHaveBeenCalled();
      expect(subscriptionService.activateSubscription).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'already_processed' });
    });

    it('should process recurring renewal payment (action: regular) and renew subscription', async () => {
      const existingPayment = {
        id: 'pay-1',
        orderId,
        status: PaymentStatus.SUCCESS,
        externalTransactionId: '111',
      } as Payment;

      const renewalCallbackData = {
        order_id: orderId,
        status: 'success',
        amount: 299,
        currency: 'UAH',
        payment_id: 222, // New transaction ID for renewal
        action: 'regular',
      };

      liqPayService.decodeCallbackData.mockReturnValue(renewalCallbackData);
      paymentService.findByOrderId.mockResolvedValue(existingPayment);

      const result = await controller.handleLiqPayCallback(sampleData, sampleSignature);

      expect(paymentService.updateFromCallback).toHaveBeenCalledWith(
        existingPayment,
        renewalCallbackData,
      );
      expect(subscriptionService.renewSubscription).toHaveBeenCalledWith(userId);
      expect(subscriptionService.activateSubscription).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok' });
    });

    it('should handle reversed/refunded payment and call handleReversedPayment', async () => {
      const existingPayment = {
        id: 'pay-1',
        orderId,
        status: PaymentStatus.SUCCESS,
        externalTransactionId: '111',
      } as Payment;

      const reversedCallbackData = {
        order_id: orderId,
        status: 'reversed',
        amount: 299,
        currency: 'UAH',
        payment_id: 111,
      };

      liqPayService.decodeCallbackData.mockReturnValue(reversedCallbackData);
      paymentService.findByOrderId.mockResolvedValue(existingPayment);

      const result = await controller.handleLiqPayCallback(sampleData, sampleSignature);

      expect(paymentService.updateFromCallback).toHaveBeenCalledWith(
        existingPayment,
        reversedCallbackData,
      );
      expect(subscriptionService.handleReversedPayment).toHaveBeenCalledWith(
        userId,
        orderId,
      );
      expect(result).toEqual({ status: 'ok' });
    });

    it('should fallback to subscription lookup if orderId does not match sub_userId_plan format', async () => {
      const customOrderId = 'custom_renewal_order_888';
      const callbackData = {
        order_id: customOrderId,
        status: 'success',
        amount: 299,
        currency: 'UAH',
        payment_id: 333,
        action: 'regular',
      };

      liqPayService.decodeCallbackData.mockReturnValue(callbackData);
      paymentService.findByOrderId.mockResolvedValue(null);
      subscriptionService.findByLiqPayOrderId.mockResolvedValue({
        userId: 'usr-custom',
        planType: PlanType.PRO,
      });

      const result = await controller.handleLiqPayCallback(sampleData, sampleSignature);

      expect(subscriptionService.findByLiqPayOrderId).toHaveBeenCalledWith(customOrderId);
      expect(subscriptionService.renewSubscription).toHaveBeenCalledWith('usr-custom');
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
