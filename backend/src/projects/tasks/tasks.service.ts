import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  list(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(projectId: string, dto: CreateTaskDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const { dueDate, ...rest } = dto;
    const task = await this.prisma.task.create({ data: { ...rest, projectId, dueDate: dueDate ? new Date(dueDate) : undefined } });
    await this.syncProgress(projectId);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const { dueDate, ...rest } = dto;
    const task = await this.prisma.task.update({
      where: { id },
      data: { ...rest, ...(dueDate && { dueDate: new Date(dueDate) }) },
    });
    await this.syncProgress(task.projectId);
    return task;
  }

  async remove(id: string) {
    const task = await this.prisma.task.delete({ where: { id } });
    await this.syncProgress(task.projectId);
    return { deleted: true };
  }

  /** Project progress = share of tasks that are DONE. */
  private async syncProgress(projectId: string) {
    const [total, done] = await Promise.all([
      this.prisma.task.count({ where: { projectId } }),
      this.prisma.task.count({ where: { projectId, status: 'DONE' } }),
    ]);
    if (total > 0) {
      await this.prisma.project.update({ where: { id: projectId }, data: { progressPercent: Math.round((done / total) * 100) } });
    }
  }
}
