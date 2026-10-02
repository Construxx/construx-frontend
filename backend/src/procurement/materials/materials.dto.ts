import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateMaterialDto {
  @IsString() name: string;
  @IsString() unit: string;
  @IsNumber() @Min(0) quantityRequired: number;
  @IsOptional() @IsNumber() @Min(0) quantityOnSite?: number;
  @IsOptional() @IsNumber() @Min(0) dailyUsage?: number;
}
export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
