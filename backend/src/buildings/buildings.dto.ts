import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { SystemType, TaskStatus } from '@prisma/client';

export class HandoverDto {
  @IsOptional() @IsString() name?: string;
  /** Hand over even if the project isn't 100% complete (handy for demos). */
  @IsOptional() @IsBoolean() force?: boolean;
}

export class CreateEquipmentDto {
  @IsString() name: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsInt() @Min(1) maintenanceIntervalDays?: number;
  @IsOptional() @IsDateString() nextMaintenance?: string;
}
export class UpdateEquipmentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() nextMaintenance?: string;
}
export class UpdateSystemDto {
  @IsString() status: string;
}
export class CreateSystemDto {
  @IsEnum(SystemType) type: SystemType;
  @IsOptional() @IsString() status?: string;
}
export class CreateRoomDto {
  @IsString() name: string;
  @IsOptional() @IsNumber() areaSqm?: number;
}

export class CreateMaintenanceTaskDto {
  @IsString() description: string;
  @IsOptional() @IsString() roomId?: string;
  @IsOptional() @IsString() equipmentId?: string;
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
export class UpdateMaintenanceTaskDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
