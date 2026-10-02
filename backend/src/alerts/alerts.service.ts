import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertSeverity, Material, Prisma, Supplier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { round1 } from '../common/utils/json';

export interface MaterialAssessment {
  daysOfCover: number | null;
  needQty: number;
  shortfall: number;
  suggestedQty: number;
  atRisk: boolean;
  severity: AlertSeverity;
  supplier: Supplier | null;
}

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  lookaheadDays() {
    return Number(this.config.get('PROCUREMENT_LOOKAHEAD_DAYS') ?? 14);
  }

  /** Pure rule: is on-site stock enough for the next N days of work? */
  assessMaterial(m: Material, suppliers: Supplier[]): MaterialAssessment {
    const none: MaterialAssessment = { daysOfCover: null, needQty: 0, shortfall: 0, suggestedQty: 0, atRisk: false, severity: 'LOW', supplier: null };
    if (m.dailyUsage <= 0) return none;
    const remaining = Math.max(m.quantityRequired - m.quantityDelivered, 0);
    const daysOfCover = m.quantityOnSite / m.dailyUsage;
    const needQty = m.dailyUsage * this.lookaheadDays();
    const shortfall = Math.max(needQty - m.quantityOnSite, 0);
    const atRisk = shortfall > 0 && remaining > 0;
    const suggestedQty = atRisk ? Math.min(Math.ceil(shortfall * 1.1), remaining) : 0;
    const severity: AlertSeverity = daysOfCover <= 5 ? 'HIGH' : daysOfCover <= 10 ? 'MEDIUM' : 'LOW';
    const name = m.name.toLowerCase();
    const supplier =
      suppliers
        .filter((s) => s.materialsSupplied.some((x) => name.includes(x.toLowerCase()) || x.toLowerCase().includes(name)))
        .sort((a, b) => a.leadTimeDays - b.leadTimeDays)[0] ?? null;
    return { daysOfCover, needQty, shortfall, suggestedQty, atRisk, severity, supplier };
  }

  /** Creates, updates or auto-resolves the procurement alert for one material. */
  async evaluateMaterial(materialId: string) {
    const m = await this.prisma.material.findUnique({ where: { id: materialId } });
    if (!m) return null;
    const [suppliers, inbound, open] = await Promise.all([
      this.prisma.supplier.findMany(),
      this.prisma.purchaseOrder.aggregate({ where: { materialId, status: 'ORDERED' }, _sum: { quantity: true } }),
      this.prisma.aIAlert.findFirst({ where: { materialId, type: 'PROCUREMENT', resolved: false } }),
    ]);
    const a = this.assessMaterial(m, suppliers);
    const inboundQty = inbound._sum.quantity ?? 0;

    if (!a.atRisk) {
      if (open) await this.prisma.aIAlert.update({ where: { id: open.id }, data: { resolved: true } });
      return null;
    }
    if (inboundQty >= a.shortfall && !open) return null; // a PO already covers it

    const message =
      `${m.name}: ${round1(m.quantityOnSite)} ${m.unit} on site, about ${round1(a.daysOfCover ?? 0)} days of cover at ${round1(m.dailyUsage)} ${m.unit}/day. ` +
      `The ${this.lookaheadDays()}-day need is ${round1(a.needQty)} ${m.unit}. Suggested order: ${a.suggestedQty} ${m.unit}` +
      (a.supplier ? ` from ${a.supplier.name} (${a.supplier.leadTimeDays}-day lead time)` : '') +
      (inboundQty > 0 ? `. Already inbound: ${round1(inboundQty)} ${m.unit}.` : '.');
    const suggestion = {
      materialId: m.id,
      supplierId: a.supplier?.id ?? null,
      supplierName: a.supplier?.name ?? null,
      quantity: a.suggestedQty,
      unit: m.unit,
      daysOfCover: round1(a.daysOfCover ?? 0),
    } as Prisma.InputJsonObject;

    if (open) {
      return this.prisma.aIAlert.update({ where: { id: open.id }, data: { message, severity: a.severity, suggestion } });
    }
    return this.prisma.aIAlert.create({
      data: { projectId: m.projectId, materialId: m.id, type: 'PROCUREMENT', severity: a.severity, message, suggestion, source: 'RULE' },
    });
  }

  async evaluateProject(projectId: string) {
    const materials = await this.prisma.material.findMany({ where: { projectId }, select: { id: true } });
    for (const m of materials) await this.evaluateMaterial(m.id);
    return this.listForProject(projectId);
  }

  listForProject(projectId: string, includeResolved = false) {
    return this.prisma.aIAlert.findMany({
      where: { projectId, ...(includeResolved ? {} : { resolved: false }) },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  listForBuilding(buildingId: string, includeResolved = false) {
    return this.prisma.aIAlert.findMany({
      where: { buildingId, ...(includeResolved ? {} : { resolved: false }) },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  resolve(id: string) {
    return this.prisma.aIAlert.update({ where: { id }, data: { resolved: true } });
  }
}
