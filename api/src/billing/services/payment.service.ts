import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { PaginationMetaDto } from '../../shared/dto/pagination-meta.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { LiqPayCallbackData } from '../../infrastructure/liqpay/interfaces/liqpay-callback-data.interface';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    filters?: { userId?: string; status?: PaymentStatus },
  ): Promise<PaginatedResponseDto<Payment>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;

    const [items, totalItems] = await this.paymentRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const meta = new PaginationMetaDto(totalItems, page, limit, items.length);
    return new PaginatedResponseDto(items, meta);
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }
    return payment;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { orderId } });
  }

  async createFromCallback(
    callbackData: LiqPayCallbackData,
    userId: string | null,
  ): Promise<Payment> {
    const status = this.mapLiqPayStatus(callbackData.status);

    const payment = this.paymentRepository.create({
      orderId: callbackData.order_id,
      amount: callbackData.amount,
      currency: callbackData.currency as any,
      status,
      description: callbackData.description,
      externalTransactionId: String(
        callbackData.payment_id ?? callbackData.transaction_id ?? '',
      ),
      externalTransactionData: callbackData as Record<string, any>,
      userId,
    });

    return this.paymentRepository.save(payment);
  }

  private mapLiqPayStatus(liqpayStatus: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      success: PaymentStatus.SUCCESS,
      subscribed: PaymentStatus.SUCCESS,
      failure: PaymentStatus.FAILURE,
      error: PaymentStatus.ERROR,
      reversed: PaymentStatus.REVERSED,
      processing: PaymentStatus.PENDING,
      wait_accept: PaymentStatus.PENDING,
    };
    return map[liqpayStatus] ?? PaymentStatus.PENDING;
  }
}
