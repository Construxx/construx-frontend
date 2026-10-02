import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DAY = 86400000;
const days = (n: number) => new Date(Date.now() + n * DAY);

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo accounts/data in production.');
  }
  if ((await prisma.user.count()) > 0) {
    console.log('Database already seeded. Run "npm run db:reset" to start fresh.');
    return;
  }
  const passwordHash = await bcrypt.hash('password123', 10);
  const mk = (name: string, email: string, role: Role) => prisma.user.create({ data: { name, email, passwordHash, role } });
  const admin = await mk('Admin', 'admin@construx.dev', Role.ADMIN);
  const engineer = await mk('Chidi Okafor (Site Engineer)', 'engineer@construx.dev', Role.SITE_ENGINEER);
  await mk('Amaka Bello (Procurement)', 'procurement@construx.dev', Role.PROCUREMENT_OFFICER);
  await mk('Viewer', 'viewer@construx.dev', Role.VIEWER);

  const [lagosElec, ikeja, powerline] = await Promise.all([
    prisma.supplier.create({ data: { name: 'Lagos Electrical Supplies', contactInfo: '+234 800 000 0001', materialsSupplied: ['Electrical cable', 'Conduit'], leadTimeDays: 4 } }),
    prisma.supplier.create({ data: { name: 'Ikeja Building Materials', contactInfo: '+234 800 000 0002', materialsSupplied: ['Cement', 'Iron rods', 'Sand'], leadTimeDays: 3 } }),
    prisma.supplier.create({ data: { name: 'PowerLine Cables Ltd', contactInfo: '+234 800 000 0003', materialsSupplied: ['Electrical cable'], leadTimeDays: 9 } }),
  ]);
  await prisma.supplier.create({ data: { name: 'CoolAir Systems', contactInfo: '+234 800 000 0004', materialsSupplied: ['AC unit', 'HVAC'], leadTimeDays: 14 } });

  // ---------- Project 1: in progress (demo the procurement alert + handover) ----------
  const vh = await prisma.project.create({
    data: {
      name: 'Victoria Heights', type: 'Residential Tower',
      budgetTotal: 250_000_000, budgetSpent: 90_000_000, progressPercent: 50, status: 'IN_PROGRESS',
      startDate: days(-120), endDate: days(180), createdById: admin.id,
      milestones: {
        create: [
          { title: 'Foundation', status: 'COMPLETED', orderIndex: 1 },
          { title: 'Structure', status: 'IN_PROGRESS', orderIndex: 2 },
          { title: 'Electrical & Plumbing', status: 'PENDING', orderIndex: 3 },
          { title: 'Handover', status: 'PENDING', orderIndex: 4 },
        ],
      },
      tasks: {
        create: [
          { title: 'Pour foundation slab', status: 'DONE', assignedToId: engineer.id },
          { title: 'Electrical installation, Level 4', status: 'DONE', assignedToId: engineer.id, level: 4, roomName: 'Room 204', systemType: 'ELECTRICAL', equipmentName: 'Distribution Board', equipmentModel: 'DB-12W' },
          { title: 'Plumbing rough-in, Level 4', status: 'DONE', level: 4, roomName: 'Room 204', systemType: 'PLUMBING', equipmentName: 'Water Heater', equipmentModel: 'AquaHeat 50L' },
          { title: 'HVAC install, Level 4', status: 'IN_PROGRESS', level: 4, roomName: 'Room 204', systemType: 'HVAC', equipmentName: 'AC Unit', equipmentModel: 'CoolMax 18k', dueDate: days(10) },
          { title: 'Electrical installation, Level 3', status: 'IN_PROGRESS', assignedToId: engineer.id, level: 3, roomName: 'Room 301', systemType: 'ELECTRICAL', equipmentName: 'Distribution Board', equipmentModel: 'DB-12W', dueDate: days(-2) },
          { title: 'Facade cladding', status: 'TODO', dueDate: days(45) },
          { title: 'Lift shaft inspection', status: 'BLOCKED' },
          { title: 'Roof waterproofing', status: 'TODO', dueDate: days(60) },
        ],
      },
    },
  });
  const cable = await prisma.material.create({ data: { projectId: vh.id, name: 'Electrical cable', unit: 'm', quantityRequired: 5000, quantityDelivered: 4400, quantityOnSite: 1200, dailyUsage: 60, status: 'PARTIAL' } });
  await prisma.material.create({ data: { projectId: vh.id, name: 'Cement', unit: 'bags', quantityRequired: 8000, quantityDelivered: 6000, quantityOnSite: 2500, dailyUsage: 120, status: 'PARTIAL' } });
  await prisma.material.create({ data: { projectId: vh.id, name: 'Iron rods', unit: 'tonnes', quantityRequired: 40, quantityDelivered: 30, quantityOnSite: 4, dailyUsage: 0.5, status: 'PARTIAL' } });
  await prisma.inventoryLog.create({ data: { projectId: vh.id, materialId: cable.id, changeQty: 1200, reason: 'Opening stock' } });
  await prisma.siteUpdate.create({ data: { projectId: vh.id, authorId: engineer.id, note: 'Level 4 conduit runs complete. Starting cable pulls on Level 3.' } });
  void lagosElec; void ikeja; void powerline;

  // ---------- Project 2: already handed over (digital twin ready to browse) ----------
  const lekki = await prisma.project.create({
    data: { name: 'Lekki Office Block', type: 'Commercial Office', budgetTotal: 400_000_000, budgetSpent: 385_000_000, progressPercent: 100, status: 'HANDED_OVER', startDate: days(-540), endDate: days(-30), createdById: admin.id },
  });
  await prisma.building.create({
    data: {
      projectId: lekki.id, name: 'Lekki Office Block', totalFloors: 2, handedOverAt: days(-30),
      floors: {
        create: [
          {
            floorNumber: 1, name: 'Level 1',
            rooms: {
              create: [
                { name: 'Reception', areaSqm: 60, systems: { create: [{ type: 'ELECTRICAL' }, { type: 'HVAC' }] },
                  equipment: { create: [{ name: 'AC Unit', model: 'CoolMax 24k', lastMaintenance: days(-200), nextMaintenance: days(-20) }] } },
                { name: 'Server Room', areaSqm: 25, systems: { create: [{ type: 'ELECTRICAL' }, { type: 'HVAC' }] },
                  equipment: { create: [{ name: 'Distribution Board', model: 'DB-24W', lastMaintenance: days(-170), nextMaintenance: days(10) }, { name: 'Precision AC', model: 'CoolMax 36k', lastMaintenance: days(-30), nextMaintenance: days(150) }] } },
              ],
            },
          },
          {
            floorNumber: 2, name: 'Level 2',
            rooms: { create: [{ name: 'Open Office', areaSqm: 240, systems: { create: [{ type: 'ELECTRICAL' }, { type: 'PLUMBING' }] },
              equipment: { create: [{ name: 'Water Heater', model: 'AquaHeat 80L', lastMaintenance: days(-60), nextMaintenance: days(120) }] } }] },
          },
        ],
      },
    },
  });

  console.log('Seeded. Logins (password: password123): admin@construx.dev, engineer@construx.dev, procurement@construx.dev, viewer@construx.dev');
  console.log('Projects: Victoria Heights (in progress) and Lekki Office Block (handed over)');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
