import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { SystemType, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString() title: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  // where this work ends up in the finished building (used at handover)
  @IsOptional() @IsInt() level?: number;
  @IsOptional() @IsString() roomName?: string;
  @IsOptional() @IsEnum(SystemType) systemType?: SystemType;
  @IsOptional() @IsString() equipmentName?: string;
  @IsOptional() @IsString() equipmentModel?: string;
}
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
