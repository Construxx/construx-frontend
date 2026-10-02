import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from '../../alerts/alerts.service';
import { CreateMaterialDto, UpdateMaterialDto } from './materials.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService, private alerts: AlertsService) {}

  /** Materials with derived stock-cover fields for the Procurement table. */
  async list(projectId: string) {
    const [materials, inbound, openAlerts] = await Promise.all([
      this.prisma.material.findMany({ where: { projectId }, orderBy: { name: 'asc' } }),
      this.prisma.purchaseOrder.groupBy({ by: ['materialId'], where: { projectId, status: 'ORDERED' }, _sum: { quantity: true } }),
      this.prisma.aIAlert.findMany({ where: { projectId, type: 'PROCUREMENT', resolved: false }, select: { materialId: true } }),
    ]);
    const inboundMap = new Map(inbound.map((i) => [i.materialId, i._sum.quantity ?? 0]));
    const alertSet = new Set(openAlerts.map((a) => a.materialId));
    return materials.map((m) => ({
      ...m,
      daysOfCover: m.dailyUsage > 0 ? Math.round((m.quantityOnSite / m.dailyUsage) * 10) / 10 : null,
      inboundQuantity: inboundMap.get(m.id) ?? 0,
      hasOpenAlert: alertSet.has(m.id),
    }));
  }

  async create(projectId: string, dto: CreateMaterialDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const material = await this.prisma.material.create({ data: { ...dto, projectId } });
    await this.alerts.evaluateMaterial(material.id);
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto) {
    const material = await this.prisma.material.update({ where: { id }, data: dto });
    await this.alerts.evaluateMaterial(id);
    return material;
  }

  logs(materialId: string) {
    return this.prisma.inventoryLog.findMany({ where: { materialId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
