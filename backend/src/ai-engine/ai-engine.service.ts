import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { AnthropicClient } from './anthropic-client';
import { parseJson, round1 } from '../common/utils/json';
import { scheduleStatus } from '../common/utils/schedule';
import { RISK_SYSTEM, riskUser } from './prompts/risk-detection.prompt';
import { PROCUREMENT_SYSTEM, procurementUser } from './prompts/procurement-suggestion.prompt';
import { ASK_SYSTEM, askUser } from './prompts/document-search.prompt';
import { SUMMARY_SYSTEM, summaryUser } from './prompts/executive-summary.prompt';
import { BUILDING_SYSTEM, buildingUser } from './prompts/building-maintenance.prompt';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
interface Risk { type: string; severity: Severity; title: string; detail: string; recommendation: string }

@Injectable()
export class AiEngineService {
  constructor(private prisma: PrismaService, private alerts: AlertsService, private claude: AnthropicClient) {}

  status() { return { aiEnabled: this.claude.enabled, model: this.claude.model }; }

  // ------------------------------------------------------------------ context
  async buildProjectContext(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: { orderBy: { orderIndex: 'asc' } },
        tasks: true,
        materials: true,
        purchaseOrders: { where: { status: 'ORDERED' }, include: { supplier: true, material: true } },
        siteUpdates: { orderBy: { createdAt: 'desc' }, take: 5, include: { author: { select: { name: true } } } },
        alerts: { where: { resolved: false } },
        documents: { select: { title: true, type: true }, take: 20 },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    const suppliers = await this.prisma.supplier.findMany();
    const now = Date.now();
    const sched = scheduleStatus(project.startDate, project.endDate, project.progressPercent);
    const lookahead = this.alerts.lookaheadDays();

    return {
      today: new Date().toISOString().slice(0, 10),
      lookaheadDays: lookahead,
      project: {
        id: project.id, name: project.name, type: project.type, status: project.status,
        progressPercent: project.progressPercent,
        startDate: project.startDate, endDate: project.endDate,
        schedule: sched,
        budgetTotal: project.budgetTotal, budgetSpent: project.budgetSpent,
        budgetPercentUsed: project.budgetTotal ? Math.round((project.budgetSpent / project.budgetTotal) * 100) : 0,
      },
      tasks: {
        total: project.tasks.length,
        done: project.tasks.filter((t) => t.status === 'DONE').length,
        blocked: project.tasks.filter((t) => t.status === 'BLOCKED').map((t) => t.title),
        overdue: project.tasks.filter((t) => t.status !== 'DONE' && t.dueDate && t.dueDate.getTime() < now).map((t) => t.title),
      },
      milestones: project.milestones.map((m) => ({ title: m.title, status: m.status })),
      materials: project.materials.map((m) => ({
        id: m.id, name: m.name, unit: m.unit,
        required: m.quantityRequired, delivered: m.quantityDelivered, onSite: m.quantityOnSite,
        remainingToDeliver: Math.max(m.quantityRequired - m.quantityDelivered, 0),
        dailyUsage: m.dailyUsage,
        daysOfCover: m.dailyUsage > 0 ? round1(m.quantityOnSite / m.dailyUsage) : null,
        status: m.status,
      })),
      openPurchaseOrders: project.purchaseOrders.map((p) => ({
        material: p.material.name, supplier: p.supplier.name, quantity: p.quantity, expectedDelivery: p.expectedDelivery,
      })),
      suppliers: suppliers.map((s) => ({ id: s.id, name: s.name, supplies: s.materialsSupplied, leadTimeDays: s.leadTimeDays })),
      recentSiteUpdates: project.siteUpdates.map((u) => ({ at: u.createdAt, by: u.author.name, note: u.note })),
      documents: project.documents,
      openAlerts: project.alerts.map((a) => ({ type: a.type, severity: a.severity, message: a.message })),
    };
  }

  // ------------------------------------------------------------- risk check
  async riskCheck(projectId: string) {
    const ctx = await this.buildProjectContext(projectId);
    const raw = await this.claude.complete(RISK_SYSTEM, riskUser(ctx), 1500);
    const parsed = parseJson<{ summary: string; risks: Risk[] }>(raw);
    const ok = parsed && Array.isArray(parsed.risks);
    const result = ok ? { summary: parsed.summary, risks: parsed.risks.slice(0, 5) } : this.ruleRisks(ctx);
    const source = ok ? 'AI' : 'RULE';

    // replace previous risk alerts of this kind with the fresh analysis
    await this.prisma.aIAlert.updateMany({ where: { projectId, type: { startsWith: 'RISK_' }, resolved: false }, data: { resolved: true } });
    const created: Awaited<ReturnType<typeof this.prisma.aIAlert.create>>[] = [];
    for (const r of result.risks) {
      const severity: Severity = ['LOW', 'MEDIUM', 'HIGH'].includes(r.severity) ? r.severity : 'MEDIUM';
      created.push(
        await this.prisma.aIAlert.create({
          data: {
            projectId,
            type: `RISK_${String(r.type ?? 'OTHER').toUpperCase().slice(0, 12)}`,
            severity,
            message: `${r.title}: ${r.detail}`,
            suggestion: { recommendation: r.recommendation } as Prisma.InputJsonObject,
            source,
          },
        }),
      );
    }
    return { mode: ok ? 'ai' : 'fallback', summary: result.summary, risks: result.risks, alerts: created };
  }

  private ruleRisks(ctx: Awaited<ReturnType<AiEngineService['buildProjectContext']>>) {
    const risks: Risk[] = [];
    const p = ctx.project;
    if (p.schedule.status === 'BEHIND') {
      risks.push({
        type: 'SCHEDULE', severity: (p.schedule.variance ?? 0) < -25 ? 'HIGH' : 'MEDIUM',
        title: 'Behind schedule',
        detail: `Progress is ${p.progressPercent}% against an expected ${p.schedule.expectedProgress}% for today.`,
        recommendation: 'Review blocked and overdue tasks and add crew or resequence work.',
      });
    }
    if (p.budgetPercentUsed > p.progressPercent + 15) {
      risks.push({
        type: 'BUDGET', severity: 'HIGH', title: 'Spend is ahead of progress',
        detail: `${p.budgetPercentUsed}% of budget used with ${p.progressPercent}% of work complete.`,
        recommendation: 'Audit recent purchase orders and forecast cost to complete.',
      });
    }
    for (const m of ctx.materials) {
      if (m.daysOfCover !== null && m.daysOfCover < ctx.lookaheadDays && m.remainingToDeliver > 0) {
        risks.push({
          type: 'MATERIAL', severity: m.daysOfCover <= 5 ? 'HIGH' : 'MEDIUM', title: `${m.name} running low`,
          detail: `${m.onSite} ${m.unit} on site is about ${m.daysOfCover} days of cover.`,
          recommendation: 'Raise a purchase order with the fastest supplier.',
        });
      }
    }
    if (ctx.tasks.blocked.length) {
      risks.push({
        type: 'SITE', severity: 'MEDIUM', title: 'Blocked tasks',
        detail: `${ctx.tasks.blocked.length} task(s) are blocked: ${ctx.tasks.blocked.slice(0, 3).join(', ')}.`,
        recommendation: 'Clear the blockers with the responsible team leads.',
      });
    }
    return {
      summary: risks.length ? `${risks.length} issue(s) need attention on ${p.name}.` : `No significant risks found on ${p.name}.`,
      risks: risks.slice(0, 5),
    };
  }

  // ---------------------------------------------------- procurement suggestion
  async procurementSuggestion(projectId: string) {
    const ctx = await this.buildProjectContext(projectId);
    const materials = await this.prisma.material.findMany({ where: { projectId } });
    const suppliers = await this.prisma.supplier.findMany();
    const byId = new Map(materials.map((m) => [m.id, m]));
    const supplierById = new Map(suppliers.map((s) => [s.id, s]));

    const raw = await this.claude.complete(PROCUREMENT_SYSTEM, procurementUser(ctx), 1500);
    const parsed = parseJson<{ summary: string; recommendations: any[] }>(raw);
    if (parsed && Array.isArray(parsed.recommendations)) {
      const recommendations = parsed.recommendations
        .filter((r) => byId.has(r.materialId))
        .map((r) => {
          const m = byId.get(r.materialId)!;
          const s = r.supplierId ? supplierById.get(r.supplierId) : null;
          return {
            materialId: m.id, materialName: m.name, unit: m.unit,
            supplierId: s?.id ?? null, supplierName: s?.name ?? null,
            quantity: Number(r.quantity) || 0, urgency: r.urgency, rationale: r.rationale,
          };
        });
      return { mode: 'ai', summary: parsed.summary, recommendations };
    }

    // fallback: same deterministic rule the alerts use
    const recommendations = materials
      .map((m) => ({ m, a: this.alerts.assessMaterial(m, suppliers) }))
      .filter(({ a }) => a.atRisk)
      .map(({ m, a }) => ({
        materialId: m.id, materialName: m.name, unit: m.unit,
        supplierId: a.supplier?.id ?? null, supplierName: a.supplier?.name ?? null,
        quantity: a.suggestedQty, urgency: a.severity,
        rationale: `About ${round1(a.daysOfCover ?? 0)} days of cover left against a ${this.alerts.lookaheadDays()}-day need.`,
      }));
    return {
      mode: 'fallback',
      summary: recommendations.length ? `${recommendations.length} material(s) should be ordered.` : 'Stock levels are healthy.',
      recommendations,
    };
  }

  // --------------------------------------------------------------------- ask
  async ask(projectId: string, question: string) {
    if (!this.claude.enabled) throw new ServiceUnavailableException('AI is not configured. Set ANTHROPIC_API_KEY in .env.');
    const ctx = await this.buildProjectContext(projectId);
    const answer = await this.claude.complete(ASK_SYSTEM, askUser(ctx, question), 700);
    if (!answer) throw new ServiceUnavailableException('The AI service did not respond. Try again.');
    return { mode: 'ai', answer };
  }

  // -------------------------------------------------------- executive summary
  async executiveSummary(projectId: string) {
    const ctx = await this.buildProjectContext(projectId);
    const text = await this.claude.complete(SUMMARY_SYSTEM, summaryUser(ctx), 500);
    if (text) return { mode: 'ai', summary: text };
    const p = ctx.project;
    const low = ctx.materials.filter((m) => m.daysOfCover !== null && m.daysOfCover < ctx.lookaheadDays).map((m) => m.name);
    return {
      mode: 'fallback',
      summary:
        `${p.name} is ${p.progressPercent}% complete and ${p.schedule.status === 'BEHIND' ? 'behind' : 'on track with'} schedule. ` +
        `${p.budgetPercentUsed}% of the budget has been spent. ` +
        (low.length ? `Low stock: ${low.join(', ')}. ` : 'Material stock levels are healthy. ') +
        `${ctx.openAlerts.length} open alert(s).`,
    };
  }

  // ---------------------------------------------------------- building check
  /** Flags equipment due for maintenance (30 days), raises alerts and creates maintenance tasks. */
  async buildingCheck(buildingId: string) {
    const building = await this.prisma.building.findUnique({ where: { id: buildingId } });
    if (!building) throw new NotFoundException('Building not found');
    const horizon = new Date(Date.now() + 30 * 86400000);
    const due = await this.prisma.equipment.findMany({
      where: { room: { floor: { buildingId } }, nextMaintenance: { lte: horizon } },
      include: { room: { select: { id: true, name: true, floor: { select: { name: true } } } } },
      orderBy: { nextMaintenance: 'asc' },
    });

    const items: { equipmentId: string; name: string; location: string; overdue: boolean; dueDate: Date | null }[] = [];
    for (const e of due) {
      const overdue = (e.nextMaintenance as Date).getTime() < Date.now();
      const where = `${e.room.floor.name}, ${e.room.name}`;
      const message = `${e.name}${e.model ? ` (${e.model})` : ''} in ${where} is ${overdue ? 'overdue' : 'due'} for preventive maintenance (${(e.nextMaintenance as Date).toISOString().slice(0, 10)}).`;
      const openAlert = await this.prisma.aIAlert.findFirst({ where: { buildingId, refId: e.id, resolved: false } });
      if (!openAlert) {
        await this.prisma.aIAlert.create({
          data: { buildingId, refId: e.id, type: 'MAINTENANCE_DUE', severity: overdue ? 'HIGH' : 'MEDIUM', message, source: 'RULE' },
        });
      }
      const openTask = await this.prisma.maintenanceTask.findFirst({ where: { buildingId, equipmentId: e.id, status: { not: 'DONE' } } });
      if (!openTask) {
        await this.prisma.maintenanceTask.create({
          data: { buildingId, roomId: e.room.id, equipmentId: e.id, description: `Preventive maintenance: ${e.name}`, dueDate: e.nextMaintenance },
        });
      }
      items.push({ equipmentId: e.id, name: e.name, location: where, overdue, dueDate: e.nextMaintenance });
    }

    const briefing = items.length ? await this.claude.complete(BUILDING_SYSTEM, buildingUser(items), 400) : null;
    return {
      mode: briefing ? 'ai' : 'fallback',
      summary: briefing ?? (items.length ? `${items.length} item(s) need preventive maintenance.` : 'No maintenance is due in the next 30 days.'),
      items,
    };
  }
}
