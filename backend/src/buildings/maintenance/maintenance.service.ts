import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaintenanceTaskDto, UpdateMaintenanceTaskDto } from '../buildings.dto';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  list(buildingId: string, status?: string) {
    return this.prisma.maintenanceTask.findMany({
      where: { buildingId, ...(status ? { status: status as any } : {}) },
      include: {
        room: { select: { id: true, name: true, floorId: true } },
        equipment: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async create(buildingId: string, dto: CreateMaintenanceTaskDto) {
    const building = await this.prisma.building.findUnique({ where: { id: buildingId } });
    if (!building) throw new NotFoundException('Building not found');
    const { dueDate, ...rest } = dto;
    return this.prisma.maintenanceTask.create({ data: { ...rest, buildingId, dueDate: dueDate ? new Date(dueDate) : undefined } });
  }

  /** Completing a task on equipment resets its service dates and closes the matching alert. */
  async update(id: string, dto: UpdateMaintenanceTaskDto) {
    const { dueDate, ...rest } = dto;
    const task = await this.prisma.maintenanceTask.update({
      where: { id },
      data: { ...rest, ...(dueDate && { dueDate: new Date(dueDate) }) },
    });
    if (dto.status === 'DONE' && task.equipmentId) {
      const equipment = await this.prisma.equipment.findUnique({ where: { id: task.equipmentId } });
      if (equipment) {
        const now = new Date();
        await this.prisma.equipment.update({
          where: { id: equipment.id },
          data: { lastMaintenance: now, nextMaintenance: new Date(now.getTime() + equipment.maintenanceIntervalDays * 86400000), status: 'OPERATIONAL' },
        });
      }
      await this.prisma.aIAlert.updateMany({
        where: { buildingId: task.buildingId, refId: task.equipmentId, resolved: false },
        data: { resolved: true },
      });
    }
    return task;
  }
}
