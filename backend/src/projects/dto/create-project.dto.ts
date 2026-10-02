import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProjectDto {
  @IsString() name: string;
  @IsString() type: string;
  @IsNumber() @Min(0) budgetTotal: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
