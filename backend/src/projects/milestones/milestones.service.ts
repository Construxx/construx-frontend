import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  list(projectId: string) {
    return this.prisma.milestone.findMany({ where: { projectId }, orderBy: { orderIndex: 'asc' } });
  }

  async create(projectId: string, dto: CreateMilestoneDto) {
    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined) {
      const last = await this.prisma.milestone.aggregate({ where: { projectId }, _max: { orderIndex: true } });
      orderIndex = (last._max.orderIndex ?? 0) + 1;
    }
    return this.prisma.milestone.create({ data: { projectId, title: dto.title, status: dto.status, orderIndex } });
  }

  update(id: string, dto: UpdateMilestoneDto) {
    return this.prisma.milestone.update({ where: { id }, data: dto });
  }
}
