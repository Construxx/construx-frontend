import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSiteUpdateDto {
  @IsString() note: string;
  /** Optional: report remaining stock of a material (drives the procurement alert) */
  @IsOptional() @IsString() materialId?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) remainingQty?: number;
}
