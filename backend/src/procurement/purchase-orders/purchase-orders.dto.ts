import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePurchaseOrderDto {
  @IsString() materialId: string;
  @IsString() supplierId: string;
  @IsNumber() @Min(0.0001) quantity: number;
  @IsOptional() @IsNumber() @Min(0) cost?: number;
  @IsOptional() @IsDateString() expectedDelivery?: string;
}

export class DeliverPurchaseOrderDto {
  /** defaults to the full ordered quantity */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) quantityReceived?: number;
}
