import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaymentStatus } from '../enums/payment-status.enum';

export class PaymentSearchAdminDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Users UUID for filtering' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Payment status (PENDING, SUCCESS, FAILURE, ERROR, REVERSED)',
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
