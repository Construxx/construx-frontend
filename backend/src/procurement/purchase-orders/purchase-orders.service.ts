import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from '../../alerts/alerts.service';
import { CreatePurchaseOrderDto, DeliverPurchaseOrderDto } from './purchase-orders.dto';

const include = { material: { select: { id: true, name: true, unit: true } }, supplier: { select: { id: true, name: true } } };

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService, private alerts: AlertsService) {}

  list(projectId: string) {
    return this.prisma.purchaseOrder.findMany({ where: { projectId }, include, orderBy: { orderedAt: 'desc' } });
  }

  async create(dto: CreatePurchaseOrderDto) {
    const [material, supplier] = await Promise.all([
      this.prisma.material.findUnique({ where: { id: dto.materialId } }),
      this.prisma.supplier.findUnique({ where: { id: dto.supplierId } }),
    ]);
    if (!material) throw new NotFoundException('Material not found');
    if (!supplier) throw new NotFoundException('Supplier not found');

    const expected =
      dto.expectedDelivery ? new Date(dto.expectedDelivery) : new Date(Date.now() + supplier.leadTimeDays * 86400000);

    const po = await this.prisma.purchaseOrder.create({
      data: {
        projectId: material.projectId,
        materialId: material.id,
        supplierId: supplier.id,
        quantity: dto.quantity,
        cost: dto.cost,
        status: 'ORDERED',
        expectedDelivery: expected,
      },
      include,
    });
    if (material.status === 'NOT_ORDERED') {
      await this.prisma.material.update({ where: { id: material.id }, data: { status: 'ORDERED' } });
    }
    return po;
  }

  /** Marks the PO received: updates material + inventory log + budget, then re-checks the alert. */
  async deliver(id: string, dto: DeliverPurchaseOrderDto) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id }, include: { material: true } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'ORDERED') throw new BadRequestException(`Purchase order is already ${po.status}`);
    const qty = dto.quantityReceived ?? po.quantity;

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({ where: { id }, data: { status: 'DELIVERED', deliveredAt: new Date() } });
      const fullyDelivered = po.material.quantityDelivered + qty >= po.material.quantityRequired;
      await tx.material.update({
        where: { id: po.materialId },
        data: {
          quantityDelivered: { increment: qty },
          quantityOnSite: { increment: qty },
          status: fullyDelivered ? 'DELIVERED' : 'PARTIAL',
        },
      });
      await tx.inventoryLog.create({
        data: { projectId: po.projectId, materialId: po.materialId, changeQty: qty, reason: `Delivery of PO ${id.slice(0, 8)}` },
      });
      if (po.cost) await tx.project.update({ where: { id: po.projectId }, data: { budgetSpent: { increment: po.cost } } });
    });

    const remainingAlert = await this.alerts.evaluateMaterial(po.materialId);
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({ where: { id }, include });
    return { purchaseOrder, alertResolved: remainingAlert === null };
  }

  async cancel(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'ORDERED') throw new BadRequestException(`Purchase order is already ${po.status}`);
    const updated = await this.prisma.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' }, include });
    await this.alerts.evaluateMaterial(po.materialId);
    return updated;
  }
}
