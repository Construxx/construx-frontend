import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { MilestoneStatus } from '@prisma/client';

export class CreateMilestoneDto {
  @IsString() title: string;
  @IsOptional() @IsEnum(MilestoneStatus) status?: MilestoneStatus;
  @IsOptional() @IsInt() orderIndex?: number;
}
export class UpdateMilestoneDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsEnum(MilestoneStatus) status?: MilestoneStatus;
  @IsOptional() @IsInt() orderIndex?: number;
}
