import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { scheduleStatus } from '../common/utils/schedule';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({ include: { building: { select: { id: true, totalFloors: true, handedOverAt: true } } }, orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateProjectDto, userId: string) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        type: dto.type,
        budgetTotal: dto.budgetTotal,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdById: userId,
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, include: { building: { select: { id: true, totalFloors: true, handedOverAt: true } } } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    const { startDate, endDate, ...rest } = dto;
    return this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
    });
  }

  /** Aggregated view for the Project Dashboard screen. */
  async dashboard(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { milestones: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!project) throw new NotFoundException('Project not found');

    const [taskGroups, materials, alerts] = await Promise.all([
      this.prisma.task.groupBy({ by: ['status'], where: { projectId: id }, _count: { _all: true } }),
      this.prisma.material.findMany({
        where: { projectId: id },
        select: { quantityRequired: true, quantityDelivered: true },
      }),
      this.prisma.aIAlert.findMany({
        where: { projectId: id, resolved: false },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const required = materials.reduce((s, m) => s + m.quantityRequired, 0);
    const delivered = materials.reduce((s, m) => s + Math.min(m.quantityDelivered, m.quantityRequired), 0);

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      progressPercent: project.progressPercent,
      budget: {
        total: project.budgetTotal,
        spent: project.budgetSpent,
        percentUsed: project.budgetTotal ? Math.round((project.budgetSpent / project.budgetTotal) * 100) : 0,
      },
      schedule: scheduleStatus(project.startDate, project.endDate, project.progressPercent),
      tasks: Object.fromEntries(taskGroups.map((g) => [g.status, g._count._all])),
      materials: { percentDelivered: required ? Math.round((delivered / required) * 100) : 0 },
      milestones: project.milestones,
      alerts,
    };
  }
}
