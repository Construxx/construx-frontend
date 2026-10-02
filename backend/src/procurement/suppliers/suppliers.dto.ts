import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSupplierDto {
  @IsString() name: string;
  @IsOptional() @IsString() contactInfo?: string;
  @IsArray() @IsString({ each: true }) materialsSupplied: string[];
  @IsOptional() @IsInt() @Min(0) leadTimeDays?: number;
}
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
