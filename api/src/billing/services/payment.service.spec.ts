import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaymentService } from './payment.service';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Currency } from '../enums/currency.enum';
import { LiqPayCallbackData } from '../../infrastructure/liqpay/interfaces/liqpay-callback-data.interface';

describe('PaymentService', () => {
  let service: PaymentService;
  let repo: jest.Mocked<Repository<Payment>>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    repo = module.get(getRepositoryToken(Payment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mapLiqPayStatus', () => {
    it('should correctly map all LiqPay statuses to PaymentStatus enum', () => {
      expect(service.mapLiqPayStatus('success')).toBe(PaymentStatus.SUCCESS);
      expect(service.mapLiqPayStatus('subscribed')).toBe(PaymentStatus.SUCCESS);
      expect(service.mapLiqPayStatus('failure')).toBe(PaymentStatus.FAILURE);
      expect(service.mapLiqPayStatus('error')).toBe(PaymentStatus.ERROR);
      expect(service.mapLiqPayStatus('reversed')).toBe(PaymentStatus.REVERSED);
      expect(service.mapLiqPayStatus('processing')).toBe(PaymentStatus.PENDING);
      expect(service.mapLiqPayStatus('wait_accept')).toBe(PaymentStatus.PENDING);
      expect(service.mapLiqPayStatus('unknown_status')).toBe(PaymentStatus.PENDING);
    });
  });

  describe('createFromCallback', () => {
    it('should create and save Payment from callback data with correct fields', async () => {
      const callbackData: LiqPayCallbackData = {
        order_id: 'sub_usr-1_PRO_123',
        amount: 299,
        currency: 'UAH',
        status: 'success',
        description: 'PRO Subscription',
        payment_id: 11223344,
        action: 'subscribe',
      } as any;

      const createdEntity = {
        id: 'pay-uuid-1',
        orderId: callbackData.order_id,
        amount: callbackData.amount,
        currency: Currency.UAH,
        status: PaymentStatus.SUCCESS,
        description: callbackData.description,
        externalTransactionId: '11223344',
        externalTransactionData: callbackData,
        userId: 'usr-1',
      };

      repo.create.mockReturnValue(createdEntity as any);
      repo.save.mockResolvedValue(createdEntity as any);

      const result = await service.createFromCallback(callbackData, 'usr-1');

      expect(repo.create).toHaveBeenCalledWith({
        orderId: 'sub_usr-1_PRO_123',
        amount: 299,
        currency: 'UAH',
        status: PaymentStatus.SUCCESS,
        description: 'PRO Subscription',
        externalTransactionId: '11223344',
        externalTransactionData: callbackData,
        userId: 'usr-1',
      });
      expect(repo.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual(createdEntity);
    });
  });

  describe('updateFromCallback', () => {
    it('should update payment status, transaction id and metadata from callback', async () => {
      const existingPayment = {
        id: 'pay-uuid-1',
        orderId: 'sub_usr-1_PRO_123',
        status: PaymentStatus.PENDING,
        externalTransactionId: '',
        externalTransactionData: null,
      } as Payment;

      const callbackData: LiqPayCallbackData = {
        order_id: 'sub_usr-1_PRO_123',
        amount: 299,
        status: 'success',
        payment_id: 887766,
      } as any;

      repo.save.mockImplementation(async (payment) => payment as Payment);

      const result = await service.updateFromCallback(existingPayment, callbackData);

      expect(result.status).toBe(PaymentStatus.SUCCESS);
      expect(result.externalTransactionId).toBe('887766');
      expect(result.externalTransactionData).toEqual(callbackData);
      expect(repo.save).toHaveBeenCalledWith(existingPayment);
    });
  });

  describe('findByOrderId', () => {
    it('should find payment by orderId', async () => {
      const payment = { id: 'p-1', orderId: 'order-123' } as Payment;
      repo.findOne.mockResolvedValue(payment);

      const result = await service.findByOrderId('order-123');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { orderId: 'order-123' } });
      expect(result).toEqual(payment);
    });

    it('should return null if not found', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findByOrderId('unknown');
      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return payment with user relation when found', async () => {
      const payment = { id: 'p-1', orderId: 'order-123', user: { id: 'u-1' } } as Payment;
      repo.findOne.mockResolvedValue(payment);

      const result = await service.findOne('p-1');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        relations: ['user'],
      });
      expect(result).toEqual(payment);
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated list of payments with metadata', async () => {
      const payments = [{ id: 'p-1' }, { id: 'p-2' }] as Payment[];
      repo.findAndCount.mockResolvedValue([payments, 2]);

      const result = await service.findAll(
        { page: 1, limit: 10 },
        { userId: 'u-1', status: PaymentStatus.SUCCESS },
      );

      expect(repo.findAndCount).toHaveBeenCalledWith({
        where: { userId: 'u-1', status: PaymentStatus.SUCCESS },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });

      expect(result.data).toEqual(payments);
      expect(result.meta.totalItems).toBe(2);
      expect(result.meta.currentPage).toBe(1);
    });
  });
});
