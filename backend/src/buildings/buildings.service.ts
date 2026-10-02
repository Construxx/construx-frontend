import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEquipmentDto, CreateRoomDto, CreateSystemDto, HandoverDto, UpdateEquipmentDto, UpdateSystemDto,
} from './buildings.dto';

const DAY = 86400000;

@Injectable()
export class BuildingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Converts a project into a Building. Every task that carries a location
   * (level + roomName) becomes floor -> room -> system / equipment, so nothing is re-entered.
   */
  async handover(projectId: string, dto: HandoverDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, include: { building: true, tasks: true } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.building) throw new ConflictException('This project has already been handed over');
    if (project.progressPercent < 100 && !dto.force) {
      throw new BadRequestException(
        `Project is only ${project.progressPercent}% complete. Finish all tasks, or send { "force": true } to hand over anyway.`,
      );
    }

    const located = project.tasks.filter((t) => t.level !== null && !!t.roomName);
    const levels = [...new Set(located.map((t) => t.level as number))].sort((a, b) => a - b);

    return this.prisma.$transaction(
      async (tx) => {
        const building = await tx.building.create({
          data: { projectId, name: dto.name ?? project.name, totalFloors: levels.length },
        });
        const floorIds = new Map<number, string>();
        for (const level of levels) {
          const floor = await tx.floor.create({
            data: { buildingId: building.id, floorNumber: level, name: level === 0 ? 'Ground Floor' : `Level ${level}` },
          });
          floorIds.set(level, floor.id);
        }

        const roomIds = new Map<string, string>();
        const systemKeys = new Set<string>();
        const now = new Date();
        for (const t of located) {
          const key = `${t.level}:${t.roomName}`;
          let roomId = roomIds.get(key);
          if (!roomId) {
            const room = await tx.room.create({ data: { floorId: floorIds.get(t.level as number) as string, name: t.roomName as string } });
            roomId = room.id;
            roomIds.set(key, roomId);
          }
          if (t.systemType && !systemKeys.has(`${roomId}:${t.systemType}`)) {
            systemKeys.add(`${roomId}:${t.systemType}`);
            await tx.buildingSystem.create({ data: { roomId, type: t.systemType, status: 'OPERATIONAL' } });
          }
          if (t.equipmentName) {
            await tx.equipment.create({
              data: {
                roomId,
                name: t.equipmentName,
                model: t.equipmentModel,
                lastMaintenance: now,
                nextMaintenance: new Date(now.getTime() + 180 * DAY),
              },
            });
          }
        }

        await tx.project.update({
          where: { id: projectId },
          data: { status: 'HANDED_OVER', ...(dto.force ? { progressPercent: 100 } : {}) },
        });
        return tx.building.findUnique({
          where: { id: building.id },
          include: { floors: { orderBy: { floorNumber: 'asc' }, include: { rooms: true } } },
        });
      },
      { timeout: 20000 },
    );
  }

  list() {
    return this.prisma.building.findMany({
      include: { project: { select: { id: true, name: true, type: true } }, _count: { select: { floors: true } } },
      orderBy: { handedOverAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, type: true } },
        floors: {
          orderBy: { floorNumber: 'asc' },
          include: { rooms: { include: { _count: { select: { equipment: true, systems: true } } } } },
        },
      },
    });
    if (!building) throw new NotFoundException('Building not found');
    const [openAlerts, openMaintenance] = await Promise.all([
      this.prisma.aIAlert.count({ where: { buildingId: id, resolved: false } }),
      this.prisma.maintenanceTask.count({ where: { buildingId: id, status: { not: 'DONE' } } }),
    ]);
    return { ...building, openAlerts, openMaintenance };
  }

  async getRoom(buildingId: string, floorId: string, roomId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, floorId, floor: { buildingId } },
      include: {
        floor: { select: { id: true, name: true, floorNumber: true } },
        equipment: { orderBy: { name: 'asc' } },
        systems: true,
        maintenanceTasks: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async floors(buildingId: string) {
    return this.prisma.floor.findMany({
      where: { buildingId },
      orderBy: { floorNumber: 'asc' },
      include: { rooms: { include: { _count: { select: { equipment: true } } } } },
    });
  }

  // ---- assets ----
  addRoom(floorId: string, dto: CreateRoomDto) { return this.prisma.room.create({ data: { floorId, ...dto } }); }

  addEquipment(roomId: string, dto: CreateEquipmentDto) {
    const { nextMaintenance, ...rest } = dto;
    const interval = dto.maintenanceIntervalDays ?? 180;
    return this.prisma.equipment.create({
      data: {
        roomId,
        ...rest,
        lastMaintenance: new Date(),
        nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : new Date(Date.now() + interval * DAY),
      },
    });
  }

  updateEquipment(id: string, dto: UpdateEquipmentDto) {
    const { nextMaintenance, ...rest } = dto;
    return this.prisma.equipment.update({ where: { id }, data: { ...rest, ...(nextMaintenance && { nextMaintenance: new Date(nextMaintenance) }) } });
  }

  addSystem(roomId: string, dto: CreateSystemDto) { return this.prisma.buildingSystem.create({ data: { roomId, ...dto } }); }
  updateSystem(id: string, dto: UpdateSystemDto) { return this.prisma.buildingSystem.update({ where: { id }, data: dto }); }
}
