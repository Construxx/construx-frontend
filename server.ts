import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  Project,
  Task,
  Milestone,
  SiteUpdate,
  Document,
  Material,
  Supplier,
  PurchaseOrder,
  InventoryLog,
  Building,
  Floor,
  Room,
  Equipment,
  BuildingSystem,
  MaintenanceTask,
  AIAlert,
  User,
  Role,
} from './src/types/index.ts';
import { handlePhotoAnalysis, handleBoQImport } from './src/lib/ai/serverHandlers.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI with key:', err);
  }
}

// -------------------------------------------------------------
// In-Memory Database with Full Relational Integrity
// -------------------------------------------------------------
const users: User[] = [
  {
    id: 'usr-1',
    name: 'Engr. Babatunde Adeyemi',
    email: 'babatunde@construx.internal',
    role: 'SITE_ENGINEER',
    title: 'Lead Structural & Site Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-2',
    name: 'Chioma Okonkwo',
    email: 'chioma@construx.internal',
    role: 'PROCUREMENT_OFFICER',
    title: 'Chief Supply Chain Officer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-3',
    name: 'David Sterling',
    email: 'david@construx.internal',
    role: 'FACILITY_MANAGER',
    title: 'Digital Twin & Operations Director',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-4',
    name: 'Fola Adeleke',
    email: 'fola@construx.internal',
    role: 'ADMIN',
    title: 'Project Director & VP Operations',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
];

let currentUser = users[0];

function generateSeedState() {
  const projects: Project[] = [
    {
      id: 'proj-victoria',
      name: 'Victoria Heights',
      code: 'VH-2026',
      type: 'Commercial & Luxury Residential',
      budgetTotal: 430000000, // ₦430,000,000
      budgetSpent: 295000000,  // ₦295,000,000
      startDate: '2025-01-10',
      endDate: '2026-11-30',
      status: 'on_track',
      progressPercent: 68,
      location: 'Victoria Island, Lagos',
      contractor: 'Julius Berger & Cappa D’Alberto Joint Venture',
      floorsTotal: 12,
      activeBuildingId: undefined,
      description: '12-floor premium mixed-use tower with high-efficiency MEP, double-glazed curtain walls, and intelligent digital twin integration.',
    },
    {
      id: 'proj-marina',
      name: 'Marina Waterfront Centre',
      code: 'MWC-2025',
      type: 'Commercial Office & Retail',
      budgetTotal: 820000000,
      budgetSpent: 780000000,
      startDate: '2024-03-15',
      endDate: '2025-10-15',
      status: 'handed_over',
      progressPercent: 100,
      location: 'Marina CBD, Lagos',
      contractor: 'El-Alan Construction Co.',
      floorsTotal: 18,
      activeBuildingId: 'bldg-marina',
      handedOverAt: '2025-10-12T14:30:00Z',
      description: '18-floor financial office tower, successfully handed over and active in BuildTwin.',
    },
    {
      id: 'proj-lekki',
      name: 'Lekki Innovation Hub',
      code: 'LIH-2026',
      type: 'Industrial & Technology Park',
      budgetTotal: 310000000,
      budgetSpent: 110000000,
      startDate: '2025-06-01',
      endDate: '2027-02-28',
      status: 'on_track',
      progressPercent: 32,
      location: 'Lekki Free Zone, Lagos',
      contractor: 'Dredging & Heavy Civil Consortium',
      floorsTotal: 6,
      description: 'Multi-campus technical research center with solar micro-grid and smart metering.',
    },
  ];

  const tasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'proj-victoria',
      title: 'Structural Works & Reinforced Concrete Frame',
      description: 'Foundations, shear walls, cast columns, and suspended floor slabs up to Level 12.',
      category: 'structural',
      status: 'completed',
      assignedTo: 'Engr. Babatunde Adeyemi',
      dueDate: '2025-08-15',
      progress: 100,
      floorLevel: 'Levels 1 - 12',
      criticalPath: true,
    },
    {
      id: 'task-2',
      projectId: 'proj-victoria',
      title: 'MEP Rough-in Installation',
      description: 'Chilled water pipework, drainage risers, and primary cable containment.',
      category: 'mep',
      status: 'completed',
      assignedTo: 'Tariq Al-Mansoor (MEP Sub)',
      dueDate: '2025-12-20',
      progress: 100,
      floorLevel: 'Levels 1 - 3',
      criticalPath: true,
    },
    {
      id: 'task-3',
      projectId: 'proj-victoria',
      title: 'Electrical Installation & Armoured Cabling',
      description: 'Distribution board installation, 4-core 16mm² feeder cabling, sub-station tie-ins.',
      category: 'electrical',
      status: 'in_progress',
      assignedTo: 'Engr. Babatunde Adeyemi',
      dueDate: '2026-10-10',
      progress: 40,
      floorLevel: 'Level 4 (Rooms 401-408)',
      criticalPath: true,
    },
    {
      id: 'task-4',
      projectId: 'proj-victoria',
      title: 'HVAC Air Handling & VRV Outdoor Systems',
      description: 'Ductwork distribution, diffusers, Daikin VRV condenser mounting on Level 4 plant deck.',
      category: 'mep',
      status: 'in_progress',
      assignedTo: 'CoolTech HVAC Solutions',
      dueDate: '2026-10-25',
      progress: 35,
      floorLevel: 'Levels 4 - 6',
      criticalPath: false,
    },
    {
      id: 'task-5',
      projectId: 'proj-victoria',
      title: 'Architectural Glazing & Curtain Wall Panels',
      description: 'Double-glazed thermal acoustic curtain wall facade installation.',
      category: 'civil',
      status: 'in_progress',
      assignedTo: 'Alumaco Facades Ltd',
      dueDate: '2026-11-05',
      progress: 55,
      floorLevel: 'Levels 5 - 8',
      criticalPath: false,
    },
    {
      id: 'task-6',
      projectId: 'proj-victoria',
      title: 'Interior Finishing & Gypsum Drywalls',
      description: 'Partitions, acoustic ceilings, door ironmongery, and paint prep.',
      category: 'finishing',
      status: 'pending',
      assignedTo: 'Prime Interiors Ltd',
      dueDate: '2026-11-20',
      progress: 0,
      floorLevel: 'Levels 1 - 4',
      criticalPath: true,
    },
  ];

  const milestones: Milestone[] = [
    {
      id: 'ms-1',
      projectId: 'proj-victoria',
      title: 'Substructure & Bored Piling',
      stage: 'Phase 1',
      status: 'completed',
      dueDate: '2025-04-10',
      orderIndex: 1,
      isHandover: false,
    },
    {
      id: 'ms-2',
      projectId: 'proj-victoria',
      title: 'Superstructure Concrete Frame Topped Out',
      stage: 'Phase 2',
      status: 'completed',
      dueDate: '2025-09-30',
      orderIndex: 2,
      isHandover: false,
    },
    {
      id: 'ms-3',
      projectId: 'proj-victoria',
      title: 'MEP & High Voltage Electrical Rough-in',
      stage: 'Phase 3',
      status: 'in_progress',
      dueDate: '2026-10-15',
      orderIndex: 3,
      isHandover: false,
    },
    {
      id: 'ms-4',
      projectId: 'proj-victoria',
      title: 'Façade Enclosure & Pressure Testing',
      stage: 'Phase 4',
      status: 'upcoming',
      dueDate: '2026-11-01',
      orderIndex: 4,
      isHandover: false,
    },
    {
      id: 'ms-5',
      projectId: 'proj-victoria',
      title: 'Handover to BuildTwin (Digital Operating Model)',
      stage: 'Phase 5 (Handover)',
      status: 'upcoming',
      dueDate: '2026-11-30',
      orderIndex: 5,
      isHandover: true,
    },
  ];

  const siteUpdates: SiteUpdate[] = [
    {
      id: 'upd-1',
      projectId: 'proj-victoria',
      author: 'Engr. Babatunde Adeyemi',
      authorRole: 'Site Engineer',
      note: 'Level 3 MEP inspection passed with structural consultant. Ready for Level 4 electrical cable pulling and feeder conduits.',
      photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
      tags: ['Inspection', 'MEP', 'Passed'],
      timestamp: '2026-09-24T10:15:00Z',
      completionReported: 66,
      verified: true,
    },
    {
      id: 'upd-2',
      projectId: 'proj-victoria',
      author: 'Tariq Al-Mansoor',
      authorRole: 'MEP Subcontractor',
      note: 'Chilled water manifold installed on Floor 2 plant deck. Pressure tested to 12.5 bar for 24 hours with zero drop.',
      photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      tags: ['PressureTest', 'ChilledWater'],
      timestamp: '2026-09-26T16:45:00Z',
      completionReported: 67,
      verified: true,
    },
  ];

  const documents: Document[] = [
    {
      id: 'doc-1',
      projectId: 'proj-victoria',
      title: 'VH-DWG-E401_Electrical_Schematic_L4.pdf',
      category: 'electrical',
      fileType: 'PDF',
      size: '14.2 MB',
      uploadDate: '2026-09-15',
      uploadedBy: 'Engr. Babatunde Adeyemi',
      url: '#',
    },
    {
      id: 'doc-2',
      projectId: 'proj-victoria',
      title: 'VH-BIM-L4_Integrated_MEP_Model.rvt',
      category: 'mep',
      fileType: 'Revit / IFC',
      size: '88.5 MB',
      uploadDate: '2026-09-18',
      uploadedBy: 'David Sterling',
      url: '#',
    },
    {
      id: 'doc-3',
      projectId: 'proj-victoria',
      title: 'VH-QA-Structural_Concrete_Core_Tests_L12.pdf',
      category: 'structural',
      fileType: 'PDF',
      size: '6.4 MB',
      uploadDate: '2026-08-28',
      uploadedBy: 'Fola Adeleke',
      url: '#',
    },
    {
      id: 'doc-4',
      projectId: 'proj-victoria',
      title: 'Lagos_State_LASPPPA_Final_Enclosure_Permit.pdf',
      category: 'permits',
      fileType: 'PDF',
      size: '2.1 MB',
      uploadDate: '2025-02-10',
      uploadedBy: 'Fola Adeleke',
      url: '#',
    },
  ];

  const materials: Material[] = [
    {
      id: 'mat-1',
      projectId: 'proj-victoria',
      name: 'Electrical Armoured Cable (4-Core 16mm²)',
      category: 'Electrical',
      unit: 'meters',
      quantityRequired: 4000,
      quantityDelivered: 600,
      currentStock: 600,
      status: 'critical_shortage',
      unitCost: 4200, // ₦4,200/m
      leadTimeDays: 2,
    },
    {
      id: 'mat-2',
      projectId: 'proj-victoria',
      name: 'Portland Cement Grade 42.5',
      category: 'Civil & Finishing',
      unit: 'bags (50kg)',
      quantityRequired: 12000,
      quantityDelivered: 11500,
      currentStock: 1200,
      status: 'adequate',
      unitCost: 8500,
      leadTimeDays: 1,
    },
    {
      id: 'mat-3',
      projectId: 'proj-victoria',
      name: 'Galvanized Steel Spiral Ducting (400mm)',
      category: 'HVAC',
      unit: 'sections',
      quantityRequired: 850,
      quantityDelivered: 620,
      currentStock: 140,
      status: 'low_stock',
      unitCost: 19500,
      leadTimeDays: 4,
    },
    {
      id: 'mat-4',
      projectId: 'proj-victoria',
      name: 'Daikin VRV IV-X Outdoor Condensing Units',
      category: 'HVAC Equipment',
      unit: 'units',
      quantityRequired: 12,
      quantityDelivered: 8,
      currentStock: 3,
      status: 'adequate',
      unitCost: 4800000,
      leadTimeDays: 7,
    },
    {
      id: 'mat-5',
      projectId: 'proj-victoria',
      name: '3-Phase Main Distribution Boards (250A)',
      category: 'Electrical Equipment',
      unit: 'panels',
      quantityRequired: 12,
      quantityDelivered: 4,
      currentStock: 1,
      status: 'low_stock',
      unitCost: 1250000,
      leadTimeDays: 3,
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup-1',
      name: 'ABC Electrical Supplies Ltd',
      location: 'Plot 14 Commercial Ave, Ikeja, Lagos',
      contact: 'Engr. Nnamdi Eze',
      phone: '+234 803 555 0192',
      email: 'orders@abcelectrical.ng',
      rating: 4.9,
      leadTimeDays: 2,
      materialsSupplied: ['Electrical Armoured Cable', 'Distribution Panels', 'Conduit & Trunking'],
      preferred: true,
    },
    {
      id: 'sup-2',
      name: 'Dangote Cement & Building Distribution',
      location: 'Terminal 2, Apapa Port Corridor, Lagos',
      contact: 'Alhaji Musa Bello',
      phone: '+234 802 444 8831',
      email: 'logistics@dangotebuild.ng',
      rating: 4.8,
      leadTimeDays: 1,
      materialsSupplied: ['Portland Cement', 'Aggregates', 'Ready-Mix Concrete'],
      preferred: true,
    },
    {
      id: 'sup-3',
      name: 'CoolTech HVAC Systems West Africa',
      location: 'Oregun Industrial Estate, Lagos',
      contact: 'Sandra van Dijk',
      phone: '+234 818 900 2311',
      email: 'sandravd@cooltech.com.ng',
      rating: 4.6,
      leadTimeDays: 4,
      materialsSupplied: ['Galvanized Ducting', 'VRV Condensers', 'Chilled Water Valves'],
      preferred: false,
    },
    {
      id: 'sup-4',
      name: 'Apex Steel & Cable Distribution',
      location: 'Trade Fair Complex, Lagos-Badagry',
      contact: 'Kelechi Amadi',
      phone: '+234 809 333 1190',
      email: 'sales@apexsteelcables.com',
      rating: 4.4,
      leadTimeDays: 5,
      materialsSupplied: ['Armoured Cable', 'Rebar High-Tensile', 'Copper Tubing'],
      preferred: false,
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-101',
      poNumber: 'PO-VH-2026-089',
      projectId: 'proj-victoria',
      materialId: 'mat-1',
      materialName: 'Electrical Armoured Cable (4-Core 16mm²)',
      supplierId: 'sup-1',
      supplierName: 'ABC Electrical Supplies Ltd',
      quantity: 600,
      unitCost: 4200,
      totalAmount: 2520000,
      status: 'delivered',
      orderedAt: '2026-09-10T09:00:00Z',
      expectedDelivery: '2026-09-12T15:00:00Z',
      deliveredAt: '2026-09-12T14:15:00Z',
      notes: 'Initial batch for Level 1-2 risers.',
    },
    {
      id: 'po-102',
      poNumber: 'PO-VH-2026-092',
      projectId: 'proj-victoria',
      materialId: 'mat-3',
      materialName: 'Galvanized Steel Spiral Ducting (400mm)',
      supplierId: 'sup-3',
      supplierName: 'CoolTech HVAC Systems West Africa',
      quantity: 300,
      unitCost: 19500,
      totalAmount: 5850000,
      status: 'delivered',
      orderedAt: '2026-09-14T11:20:00Z',
      expectedDelivery: '2026-09-18T12:00:00Z',
      deliveredAt: '2026-09-18T11:45:00Z',
      notes: 'Delivered and stacked on Level 3 staging area.',
    },
  ];

  const inventoryLogs: InventoryLog[] = [
    {
      id: 'inv-1',
      projectId: 'proj-victoria',
      materialId: 'mat-1',
      materialName: 'Electrical Armoured Cable (4-Core 16mm²)',
      changeQty: 600,
      previousStock: 0,
      newStock: 600,
      reason: 'PO-VH-2026-089 Delivery Accepted',
      author: 'Chioma Okonkwo',
      timestamp: '2026-09-12T14:15:00Z',
    },
    {
      id: 'inv-2',
      projectId: 'proj-victoria',
      materialId: 'mat-3',
      materialName: 'Galvanized Steel Spiral Ducting (400mm)',
      changeQty: 300,
      previousStock: 320,
      newStock: 620,
      reason: 'PO-VH-2026-092 Delivery Accepted',
      author: 'Chioma Okonkwo',
      timestamp: '2026-09-18T11:45:00Z',
    },
  ];

  const aiAlerts: AIAlert[] = [
    {
      id: 'alt-1',
      projectId: 'proj-victoria',
      type: 'procurement_deficit',
      severity: 'critical',
      title: 'Material Shortfall: 3,400m Armoured Cable Required',
      message: 'Electrical Armoured Cable stock (600m available) is insufficient for upcoming Level 4 wiring milestone requiring 4,000m total. Estimated 14-day supply gap.',
      recommendation: 'Issue immediate PO for 3,400m to ABC Electrical Supplies (2-day lead time). Pre-fill purchase order with guaranteed stock allocation.',
      resolved: false,
      createdAt: '2026-09-27T08:30:00Z',
      metadata: {
        materialId: 'mat-1',
        shortfall: 3400,
        suggestedSupplierId: 'sup-1',
      },
    },
  ];

  // Buildings (Living Digital Twins)
  const buildings: Building[] = [
    {
      id: 'bldg-marina',
      projectId: 'proj-marina',
      name: 'Marina Waterfront Centre',
      code: 'B-MWC-01',
      totalFloors: 18,
      totalAreaSqm: 36000,
      handedOverAt: '2025-10-12T14:30:00Z',
      handoverContractRef: 'HNDV-MWC-2025-088',
      healthScore: 98,
      activeAlertsCount: 0,
      energyRating: 'LEED Gold Certified (42 kWh/m²/yr)',
      location: 'Marina CBD, Lagos',
    },
  ];

  const floors: Floor[] = [
    {
      id: 'fl-marina-g',
      buildingId: 'bldg-marina',
      floorNumber: 0,
      name: 'Ground Floor & Grand Lobby',
      totalRooms: 8,
      areaSqm: 2000,
      occupancy: 42,
      status: 'normal',
    },
    {
      id: 'fl-marina-2',
      buildingId: 'bldg-marina',
      floorNumber: 2,
      name: 'Level 2 — Executive Suites & Tech Wings',
      totalRooms: 6,
      areaSqm: 2000,
      occupancy: 78,
      status: 'normal',
    },
  ];

  const rooms: Room[] = [
    {
      id: 'rm-marina-201',
      floorId: 'fl-marina-2',
      buildingId: 'bldg-marina',
      roomNumber: '201',
      name: 'Boardroom West',
      areaSqm: 95,
      type: 'conference',
      temperature: 21.2,
      humidity: 48,
      powerLoadKw: 3.4,
      airQualityIndex: 18,
      handoverOriginTask: 'Task #14: Executive Finishes & Acoustic Glazing',
    },
  ];

  const equipmentList: Equipment[] = [
    {
      id: 'eq-marina-1',
      roomId: 'rm-marina-201',
      floorId: 'fl-marina-2',
      buildingId: 'bldg-marina',
      name: 'VRV Indoor Fan Coil 1',
      model: 'Daikin FXMQ-P',
      serialNumber: 'DK-2025-09881',
      category: 'hvac',
      status: 'optimal',
      installDate: '2025-07-15',
      lastMaintenance: '2026-08-01',
      nextMaintenance: '2027-02-01',
      runtimeHours: 3200,
      powerRating: '0.8 kW',
      originProjectId: 'proj-marina',
    },
  ];

  const buildingSystems: BuildingSystem[] = [
    {
      id: 'sys-marina-elec',
      roomId: 'rm-marina-201',
      floorId: 'fl-marina-2',
      buildingId: 'bldg-marina',
      type: 'electrical',
      name: 'Sub-Distribution Panel L2-West',
      status: 'optimal',
      metrics: {
        voltage: '415V 3-Phase',
        frequency: '50.02 Hz',
        powerFactor: 0.98,
        activeLoad: '34.2 kW',
      },
    },
  ];

  const maintenanceTasks: MaintenanceTask[] = [
    {
      id: 'mt-1',
      buildingId: 'bldg-marina',
      roomId: 'rm-marina-201',
      roomName: 'Boardroom West',
      equipmentId: 'eq-marina-1',
      equipmentName: 'VRV Indoor Fan Coil 1',
      title: 'Routine 6-Month Filter Inspection',
      description: 'Clean electrostatic intake filters and verify refrigerant temperature delta.',
      priority: 'low',
      status: 'completed',
      assignedTo: 'David Sterling',
      dueDate: '2026-08-01',
      createdAt: '2026-07-20T10:00:00Z',
      completedAt: '2026-08-01T15:20:00Z',
    },
  ];

  return {
    projects,
    tasks,
    milestones,
    siteUpdates,
    documents,
    materials,
    suppliers,
    purchaseOrders,
    inventoryLogs,
    aiAlerts,
    buildings,
    floors,
    rooms,
    equipmentList,
    buildingSystems,
    maintenanceTasks,
  };
}

let db = generateSeedState();

// -------------------------------------------------------------
// Helper: AI Engine Handlers
// -------------------------------------------------------------

async function generateWithGemini(prompt: string, fallbackJson: any) {
  if (!ai) {
    return fallbackJson;
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return fallbackJson;
  } catch (err) {
    console.error('Gemini generation error, using fallback:', err);
    return fallbackJson;
  }
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// Current user & authentication
app.get('/api/auth/me', (_req, res) => {
  res.json({ user: currentUser });
});

app.post('/api/auth/switch-role', (req, res) => {
  const { role } = req.body;
  const found = users.find((u) => u.role === role);
  if (found) {
    currentUser = found;
  }
  res.json({ user: currentUser });
});

app.get('/api/auth/users', (_req, res) => {
  res.json({ users });
});

// Projects
app.get('/api/projects', (_req, res) => {
  res.json({ projects: db.projects });
});

app.get('/api/projects/:id', (req, res) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const projectTasks = db.tasks.filter((t) => t.projectId === project.id);
  const projectMilestones = db.milestones.filter((m) => m.projectId === project.id);
  const projectMaterials = db.materials.filter((m) => m.projectId === project.id);
  const projectSiteUpdates = db.siteUpdates.filter((s) => s.projectId === project.id);
  const projectDocuments = db.documents.filter((d) => d.projectId === project.id);
  const projectAlerts = db.aiAlerts.filter((a) => a.projectId === project.id && !a.resolved);

  res.json({
    project,
    tasks: projectTasks,
    milestones: projectMilestones,
    materials: projectMaterials,
    siteUpdates: projectSiteUpdates,
    documents: projectDocuments,
    alerts: projectAlerts,
  });
});

app.post('/api/projects/:id/tasks', (req, res) => {
  const { title, description, category, assignedTo, dueDate, floorLevel, criticalPath } = req.body;
  const newTask: Task = {
    id: `task-${Date.now()}`,
    projectId: req.params.id,
    title,
    description: description || '',
    category: category || 'structural',
    status: 'pending',
    assignedTo: assignedTo || currentUser.name,
    dueDate: dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    progress: 0,
    floorLevel: floorLevel || 'Level 1',
    criticalPath: Boolean(criticalPath),
  };
  db.tasks.push(newTask);
  res.status(201).json({ task: newTask });
});

app.patch('/api/projects/:id/tasks/:taskId', (req, res) => {
  const task = db.tasks.find((t) => t.id === req.params.taskId && t.projectId === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.body.status) task.status = req.body.status;
  if (req.body.progress !== undefined) task.progress = Number(req.body.progress);
  if (req.body.assignedTo) task.assignedTo = req.body.assignedTo;

  // recalculate project overall progress
  const projectTasks = db.tasks.filter((t) => t.projectId === req.params.id);
  const total = projectTasks.reduce((acc, t) => acc + t.progress, 0);
  const proj = db.projects.find((p) => p.id === req.params.id);
  if (proj && projectTasks.length > 0) {
    proj.progressPercent = Math.round(total / projectTasks.length);
  }

  res.json({ task });
});

// Site Updates (with AI risk hook)
app.post('/api/projects/:id/site-updates', async (req, res) => {
  const { note, photoUrl, tags, completionReported } = req.body;
  const newUpdate: SiteUpdate = {
    id: `upd-${Date.now()}`,
    projectId: req.params.id,
    author: currentUser.name,
    authorRole: currentUser.title,
    note,
    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
    tags: tags || ['SiteProgress', 'DailyLog'],
    timestamp: new Date().toISOString(),
    completionReported: completionReported ? Number(completionReported) : undefined,
    verified: true,
  };
  db.siteUpdates.unshift(newUpdate);

  // If the site update reports Level 4 electrical or delays, trigger risk
  const isLevel4Electrical = note.toLowerCase().includes('electrical') && (note.toLowerCase().includes('level 4') || note.toLowerCase().includes('40%'));
  
  let riskAlert: AIAlert | null = null;
  if (isLevel4Electrical) {
    const proj = db.projects.find((p) => p.id === req.params.id);
    if (proj) {
      proj.status = 'at_risk';
    }

    const existing = db.aiAlerts.find(
      (a) => a.projectId === req.params.id && a.type === 'schedule_risk' && !a.resolved
    );

    if (!existing) {
      riskAlert = {
        id: `alt-${Date.now()}`,
        projectId: req.params.id,
        type: 'schedule_risk',
        severity: 'critical',
        title: 'Schedule Risk: Level 4 MEP At Risk — 5 Days Behind',
        message: 'Site log indicates Level 4 Electrical is at 40% completion with delivery bottleneck on 4-Core 16mm² Armoured Cable. Critical path milestone at risk of 5-day slippage.',
        recommendation: 'Authorize 2 overtime shifts once 3,400m cable delivery arrives from ABC Electrical Supplies. Re-align drywall contractor sequence.',
        resolved: false,
        createdAt: new Date().toISOString(),
        metadata: {
          delayDays: 5,
          affectedTask: 'Electrical Installation & Armoured Cabling',
          criticalPath: true,
        },
      };
      db.aiAlerts.unshift(riskAlert);
    }
  }

  res.status(201).json({ siteUpdate: newUpdate, triggeredAlert: riskAlert });
});

// Handover Trigger: Project -> Living Digital Twin (BuildTwin)
app.post('/api/projects/:id/handover', (req, res) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const buildingId = `bldg-${project.id.replace('proj-', '')}`;
  project.status = 'handed_over';
  project.progressPercent = 100;
  project.activeBuildingId = buildingId;
  project.handedOverAt = new Date().toISOString();

  // Mark all milestones as completed
  db.milestones
    .filter((m) => m.projectId === project.id)
    .forEach((m) => {
      m.status = 'completed';
    });

  // Check if building already created
  let building = db.buildings.find((b) => b.id === buildingId);
  if (!building) {
    building = {
      id: buildingId,
      projectId: project.id,
      name: project.name,
      code: `B-${project.code}`,
      totalFloors: project.floorsTotal,
      totalAreaSqm: project.floorsTotal * 1650,
      handedOverAt: new Date().toISOString(),
      handoverContractRef: `HNDV-${project.code}-${new Date().getFullYear()}-01`,
      healthScore: 96,
      activeAlertsCount: 1,
      energyRating: 'EDGE Advanced / LEED Certified (38 kWh/m²/yr)',
      location: project.location,
    };
    db.buildings.unshift(building);

    // Create 12 Floors for Victoria Heights
    for (let f = 0; f <= 12; f++) {
      const floorId = `fl-${buildingId}-${f}`;
      const isGround = f === 0;
      const isRoof = f === 12;
      db.floors.push({
        id: floorId,
        buildingId: building.id,
        floorNumber: f,
        name: isGround
          ? 'Ground Floor & Atrium Concierge'
          : isRoof
          ? 'Level 12 — Penthouse & Rooftop Plant Deck'
          : `Floor ${f} — Commercial Office Wings`,
        totalRooms: isGround ? 6 : isRoof ? 4 : 8,
        areaSqm: 1650,
        occupancy: isGround ? 45 : f === 2 ? 82 : 60,
        status: f === 2 ? 'alert' : 'normal',
      });
    }

    // Populate Floor 2 with Rooms including Room 204
    const fl2Id = `fl-${buildingId}-2`;
    const f2Rooms: Room[] = [
      {
        id: `rm-${buildingId}-201`,
        floorId: fl2Id,
        buildingId: building.id,
        roomNumber: '201',
        name: 'Executive Boardroom Alpha',
        areaSqm: 85,
        type: 'conference',
        temperature: 21.5,
        humidity: 49,
        powerLoadKw: 4.8,
        airQualityIndex: 22,
        handoverOriginTask: 'Task #6: Interior Finishing & Gypsum Drywalls',
      },
      {
        id: `rm-${buildingId}-202`,
        floorId: fl2Id,
        buildingId: building.id,
        roomNumber: '202',
        name: 'Open Collaboration Studio',
        areaSqm: 320,
        type: 'office',
        temperature: 22.0,
        humidity: 51,
        powerLoadKw: 18.2,
        airQualityIndex: 26,
        handoverOriginTask: 'Task #5: Architectural Glazing & Curtain Wall Panels',
      },
      {
        id: `rm-${buildingId}-203`,
        floorId: fl2Id,
        buildingId: building.id,
        roomNumber: '203',
        name: 'Edge Telecoms & Server Hub',
        areaSqm: 45,
        type: 'server_room',
        temperature: 18.4,
        humidity: 42,
        powerLoadKw: 24.5,
        airQualityIndex: 12,
        handoverOriginTask: 'Task #2: MEP Rough-in Installation',
      },
      {
        id: `rm-${buildingId}-204`,
        floorId: fl2Id,
        buildingId: building.id,
        roomNumber: '204',
        name: 'MEP Substation & HVAC Control Room',
        areaSqm: 68,
        type: 'substation',
        temperature: 24.2,
        humidity: 55,
        powerLoadKw: 46.8,
        airQualityIndex: 34,
        handoverOriginTask: 'Task #3: Electrical Installation & Armoured Cabling (Carried Over from Construction)',
      },
      {
        id: `rm-${buildingId}-205`,
        floorId: fl2Id,
        buildingId: building.id,
        roomNumber: '205',
        name: 'Facilities & Building Logistics Office',
        areaSqm: 72,
        type: 'utility',
        temperature: 21.8,
        humidity: 50,
        powerLoadKw: 5.1,
        airQualityIndex: 24,
        handoverOriginTask: 'Task #6: Interior Finishing',
      },
    ];
    db.rooms.push(...f2Rooms);

    // Equipment in Room 204
    const eqR204: Equipment[] = [
      {
        id: `eq-${buildingId}-204-db`,
        roomId: `rm-${buildingId}-204`,
        floorId: fl2Id,
        buildingId: building.id,
        name: 'Main Distribution Board DB-L4-01',
        model: 'Schneider Electric PrismaSeT 250A',
        serialNumber: 'SE-2026-VH-00918',
        category: 'electrical',
        status: 'optimal',
        installDate: '2026-09-15',
        lastMaintenance: '2026-09-20',
        nextMaintenance: '2027-03-20',
        runtimeHours: 480,
        powerRating: '160 kW 415V',
        originProjectId: project.id,
        originTaskId: 'task-3',
      },
      {
        id: `eq-${buildingId}-204-ac`,
        roomId: `rm-${buildingId}-204`,
        floorId: fl2Id,
        buildingId: building.id,
        name: 'Daikin VRV IV Air Handling Unit (AHU-04)',
        model: 'Daikin VRV-IV RXQ16TYDN',
        serialNumber: 'DKN-2026-VRV-4412',
        category: 'hvac',
        status: 'warning',
        installDate: '2026-08-10',
        lastMaintenance: '2026-03-15',
        nextMaintenance: '2026-09-15',
        runtimeHours: 4320,
        powerRating: '14.2 kW',
        originProjectId: project.id,
        originTaskId: 'task-4',
      },
      {
        id: `eq-${buildingId}-204-fire`,
        roomId: `rm-${buildingId}-204`,
        floorId: fl2Id,
        buildingId: building.id,
        name: 'Motorized Fire & Smoke Damper System',
        model: 'Belimo FSNF24-S Actuator',
        serialNumber: 'BLM-FD-88910',
        category: 'fire_safety',
        status: 'optimal',
        installDate: '2026-08-25',
        lastMaintenance: '2026-09-18',
        nextMaintenance: '2027-01-18',
        runtimeHours: 1200,
        powerRating: '24V DC / 7VA',
        originProjectId: project.id,
      },
      {
        id: `eq-${buildingId}-204-inverter`,
        roomId: `rm-${buildingId}-204`,
        floorId: fl2Id,
        buildingId: building.id,
        name: 'Automatic Power Factor Correction Capacitor Bank',
        model: 'ABB CLMD43 100kVAR',
        serialNumber: 'ABB-PFC-00449',
        category: 'electrical',
        status: 'optimal',
        installDate: '2026-09-02',
        lastMaintenance: '2026-09-15',
        nextMaintenance: '2027-03-15',
        runtimeHours: 640,
        powerRating: '100 kVAR',
        originProjectId: project.id,
      },
    ];
    db.equipmentList.push(...eqR204);

    // Building Systems in Room 204
    db.buildingSystems.push(
      {
        id: `sys-${buildingId}-elec`,
        roomId: `rm-${buildingId}-204`,
        floorId: fl2Id,
        buildingId: building.id,
        type: 'electrical',
        name: 'Zone 4 3-Phase Electrical Sub-Network',
        status: 'optimal',
        metrics: {
          voltagePhaseA: '240.2 V',
          voltagePhaseB: '239.8 V',
          voltagePhaseC: '240.6 V',
          totalActivePower: '46.8 kW',
          powerFactor: 0.99,
          frequency: '50.01 Hz',
        },
      },
      {
        id: `sys-${buildingId}-hvac`,
        roomId: `rm-${buildingId}-204`,
        floorId: fl2Id,
        buildingId: building.id,
        type: 'hvac',
        name: 'VRV Chilled Air & Condensing Loop',
        status: 'degraded',
        metrics: {
          supplyAirTemp: '16.8 °C',
          returnAirTemp: '24.2 °C',
          filterDeltaPressure: '185 Pa (High)',
          airflowCfm: '740 CFM',
          compressorFrequency: '68 Hz',
        },
      },
      {
        id: `sys-${buildingId}-fire`,
        roomId: `rm-${buildingId}-204`,
        floorId: fl2Id,
        buildingId: building.id,
        type: 'fire_safety',
        name: 'Addressable Optical Smoke & Thermal Sensor Network',
        status: 'optimal',
        metrics: {
          loopStatus: 'Armed & Normal',
          smokeObscuration: '0.02 %/m',
          damperPosition: '100% Open',
          batteryBackup: '100% (27.4 VDC)',
        },
      }
    );

    // AI Preventive Maintenance Alert for the Building
    db.aiAlerts.push({
      id: `alt-twin-${Date.now()}`,
      buildingId: building.id,
      type: 'maintenance_due',
      severity: 'warning',
      title: 'Preventive Maintenance Due: Daikin VRV AC Unit (Room 204)',
      message: 'Air Handling Unit AHU-04 in Room 204 has exceeded 4,300 continuous runtime hours. Differential pressure sensor reads 185 Pa, indicating heavy dust accumulation on electrostatic intake filter coils.',
      recommendation: 'Dispatch facility technician to wash/replace primary intake filters, inspect refrigerant compressor pressure, and reset sensor baseline before peak heat hours.',
      resolved: false,
      createdAt: new Date().toISOString(),
      metadata: {
        roomId: `rm-${buildingId}-204`,
        roomNumber: '204',
        equipmentId: `eq-${buildingId}-204-ac`,
        equipmentName: 'Daikin VRV IV Air Handling Unit (AHU-04)',
      },
    });
  }

  res.json({
    message: 'Project successfully handed over to BuildTwin Digital Twin operating layer!',
    project,
    building,
  });
});

// Procurement Endpoints
app.get('/api/projects/:id/procurement', (req, res) => {
  const materials = db.materials.filter((m) => m.projectId === req.params.id);
  const purchaseOrders = db.purchaseOrders.filter((po) => po.projectId === req.params.id);
  const inventoryLogs = db.inventoryLogs.filter((log) => log.projectId === req.params.id);
  const suppliers = db.suppliers;
  const alerts = db.aiAlerts.filter(
    (a) => a.projectId === req.params.id && a.type === 'procurement_deficit' && !a.resolved
  );

  res.json({
    materials,
    purchaseOrders,
    inventoryLogs,
    suppliers,
    alerts,
  });
});

app.post('/api/projects/:id/procurement/purchase-orders', (req, res) => {
  const { materialId, supplierId, quantity, unitCost, notes } = req.body;
  const material = db.materials.find((m) => m.id === materialId);
  const supplier = db.suppliers.find((s) => s.id === supplierId);

  if (!material || !supplier) {
    return res.status(400).json({ error: 'Valid material and supplier are required' });
  }

  const cost = unitCost ? Number(unitCost) : material.unitCost;
  const qty = Number(quantity);
  const total = cost * qty;

  const newPO: PurchaseOrder = {
    id: `po-${Date.now()}`,
    poNumber: `PO-VH-2026-${Math.floor(100 + Math.random() * 900)}`,
    projectId: req.params.id,
    materialId: material.id,
    materialName: material.name,
    supplierId: supplier.id,
    supplierName: supplier.name,
    quantity: qty,
    unitCost: cost,
    totalAmount: total,
    status: 'issued',
    orderedAt: new Date().toISOString(),
    expectedDelivery: new Date(Date.now() + supplier.leadTimeDays * 86400000).toISOString(),
    notes: notes || 'Procurement expedited via CONSTRUX Supply OS.',
  };

  db.purchaseOrders.unshift(newPO);
  res.status(201).json({ purchaseOrder: newPO });
});

// Record Delivery (Supply OS -> Inventory Update -> Auto-Resolve Procurement Alert)
app.post('/api/projects/:id/procurement/deliveries', (req, res) => {
  const { poId, materialId, quantityReceived, notes } = req.body;
  const material = db.materials.find((m) => m.id === materialId && m.projectId === req.params.id);
  if (!material) return res.status(404).json({ error: 'Material not found' });

  const qty = Number(quantityReceived);
  const prevStock = material.currentStock;
  material.quantityDelivered += qty;
  material.currentStock += qty;

  // Check if requirement met
  if (material.quantityDelivered >= material.quantityRequired) {
    material.status = 'adequate';
  } else if (material.currentStock > material.quantityRequired * 0.4) {
    material.status = 'low_stock';
  }

  // Update PO if provided
  let po: PurchaseOrder | undefined = undefined;
  if (poId) {
    po = db.purchaseOrders.find((p) => p.id === poId);
    if (po) {
      po.status = 'delivered';
      po.deliveredAt = new Date().toISOString();
    }
  }

  // Record inventory log
  const log: InventoryLog = {
    id: `inv-${Date.now()}`,
    projectId: req.params.id,
    materialId: material.id,
    materialName: material.name,
    changeQty: qty,
    previousStock: prevStock,
    newStock: material.currentStock,
    reason: notes || `Site Delivery Received (${qty} ${material.unit})`,
    author: currentUser.name,
    timestamp: new Date().toISOString(),
  };
  db.inventoryLogs.unshift(log);

  // Auto-resolve any procurement alert for this material if stock is now sufficient
  if (material.quantityDelivered >= material.quantityRequired) {
    db.aiAlerts
      .filter((a) => a.projectId === req.params.id && a.metadata?.materialId === material.id)
      .forEach((a) => {
        a.resolved = true;
      });
  }

  res.json({
    message: `Delivery of ${qty} ${material.unit} successfully logged. Inventory updated!`,
    material,
    inventoryLog: log,
    purchaseOrder: po,
  });
});

app.get('/api/procurement/suppliers', (_req, res) => {
  res.json({ suppliers: db.suppliers });
});

// Buildings / BuildTwin Digital Twin Endpoints
app.get('/api/buildings', (_req, res) => {
  res.json({ buildings: db.buildings });
});

app.get('/api/buildings/:id', (req, res) => {
  const building = db.buildings.find((b) => b.id === req.params.id);
  if (!building) return res.status(404).json({ error: 'Building not found' });

  const buildingFloors = db.floors
    .filter((f) => f.buildingId === building.id)
    .sort((a, b) => a.floorNumber - b.floorNumber);
  const buildingRooms = db.rooms.filter((r) => r.buildingId === building.id);
  const buildingEquipment = db.equipmentList.filter((e) => e.buildingId === building.id);
  const systems = db.buildingSystems.filter((s) => s.buildingId === building.id);
  const maintenance = db.maintenanceTasks.filter((m) => m.buildingId === building.id);
  const alerts = db.aiAlerts.filter((a) => a.buildingId === building.id && !a.resolved);

  res.json({
    building,
    floors: buildingFloors,
    rooms: buildingRooms,
    equipment: buildingEquipment,
    systems,
    maintenance,
    alerts,
  });
});

app.get('/api/buildings/:id/floors/:floorId/rooms/:roomId', (req, res) => {
  const room = db.rooms.find((r) => r.id === req.params.roomId && r.buildingId === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const roomEquipment = db.equipmentList.filter((e) => e.roomId === room.id);
  const roomSystems = db.buildingSystems.filter((s) => s.roomId === room.id);
  const roomMaintenance = db.maintenanceTasks.filter((m) => m.roomId === room.id);
  const roomAlerts = db.aiAlerts.filter(
    (a) => a.buildingId === req.params.id && a.metadata?.roomNumber === room.roomNumber && !a.resolved
  );

  res.json({
    room,
    equipment: roomEquipment,
    systems: roomSystems,
    maintenance: roomMaintenance,
    alerts: roomAlerts,
  });
});

app.post('/api/buildings/:id/maintenance', (req, res) => {
  const { roomId, equipmentId, title, description, priority, assignedTo, dueDate } = req.body;
  const room = db.rooms.find((r) => r.id === roomId);
  const eq = equipmentId ? db.equipmentList.find((e) => e.id === equipmentId) : undefined;

  const newTask: MaintenanceTask = {
    id: `mt-${Date.now()}`,
    buildingId: req.params.id,
    roomId,
    roomName: room ? room.name : 'Facility Zone',
    equipmentId,
    equipmentName: eq ? eq.name : undefined,
    title,
    description: description || '',
    priority: priority || 'medium',
    status: 'scheduled',
    assignedTo: assignedTo || currentUser.name,
    dueDate: dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };

  db.maintenanceTasks.unshift(newTask);

  // If this addressed an AI alert, mark it resolved
  if (req.body.originAiAlertId) {
    const alert = db.aiAlerts.find((a) => a.id === req.body.originAiAlertId);
    if (alert) alert.resolved = true;
  }

  res.status(201).json({ maintenanceTask: newTask });
});

app.patch('/api/buildings/:id/maintenance/:taskId', (req, res) => {
  const task = db.maintenanceTasks.find(
    (m) => m.id === req.params.taskId && m.buildingId === req.params.id
  );
  if (!task) return res.status(404).json({ error: 'Maintenance task not found' });

  if (req.body.status) {
    task.status = req.body.status;
    if (req.body.status === 'completed') {
      task.completedAt = new Date().toISOString();
    }
  }

  res.json({ maintenanceTask: task });
});

// -------------------------------------------------------------
// AI Engine Server Endpoints (Google GenAI powered)
// -------------------------------------------------------------

// 1. Schedule Risk Check
app.post('/api/ai/risk-check', async (req, res) => {
  const { projectId } = req.body;
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const tasks = db.tasks.filter((t) => t.projectId === projectId);
  const materials = db.materials.filter((m) => m.projectId === projectId);
  const siteUpdates = db.siteUpdates.filter((s) => s.projectId === projectId).slice(0, 3);

  const prompt = `You are the CONSTRUX Construction OS predictive risk intelligence engine.
Analyze this construction project state and determine if there is a schedule or material risk:
Project: ${project.name} (${project.floorsTotal} floors, Budget: ₦${project.budgetTotal.toLocaleString()})
Tasks on Critical Path: ${JSON.stringify(tasks.map((t) => ({ title: t.title, progress: t.progress, due: t.dueDate, status: t.status })))}
Materials & Inventory: ${JSON.stringify(materials.map((m) => ({ name: m.name, required: m.quantityRequired, delivered: m.quantityDelivered, stock: m.currentStock, status: m.status })))}
Recent Field Logs: ${JSON.stringify(siteUpdates.map((s) => ({ note: s.note, time: s.timestamp })))}

Respond with a JSON object:
{
  "hasRisk": boolean,
  "severity": "info" | "warning" | "critical",
  "delayDays": number,
  "title": string,
  "summary": string,
  "rootCause": string,
  "mitigationPlan": string,
  "affectedMilestone": string
}`;

  const fallback = {
    hasRisk: true,
    severity: 'critical',
    delayDays: 5,
    title: 'Schedule Risk: Level 4 MEP & Electrical Bottleneck',
    summary: 'Level 4 electrical cabling is running behind schedule by approximately 5 calendar days due to a 3,400m shortage of 4-Core 16mm² Armoured Cable on site.',
    rootCause: 'Inventory shortfall vs projected 14-day installation burn rate on Floor 4 sub-distribution circuits.',
    mitigationPlan: 'Issue immediate PO to ABC Electrical Supplies for 3,400m with expedited 48hr delivery. Authorize 2 staggered weekend shifts for electrical crews.',
    affectedMilestone: 'MEP & High Voltage Electrical Rough-in (Phase 3)',
  };

  const aiResult = await generateWithGemini(prompt, fallback);

  // If critical risk, update project status
  if (aiResult.hasRisk && aiResult.severity === 'critical') {
    project.status = 'at_risk';
  }

  res.json({ riskAnalysis: aiResult });
});

// 2. Procurement Suggestion
app.post('/api/ai/procurement-suggest', async (req, res) => {
  const { materialId } = req.body;
  const material = db.materials.find((m) => m.id === materialId);
  if (!material) return res.status(404).json({ error: 'Material not found' });

  const suppliers = db.suppliers.filter((s) => s.materialsSupplied.some((mat) => material.name.toLowerCase().includes(mat.toLowerCase())));
  const deficit = Math.max(0, material.quantityRequired - material.quantityDelivered);

  const prompt = `You are the CONSTRUX Supply OS procurement optimization engine.
Recommend an optimal purchase order for this construction material:
Material: ${material.name} (Unit: ${material.unit})
Required: ${material.quantityRequired}, Delivered: ${material.quantityDelivered}, Shortfall: ${deficit}
Candidate Suppliers: ${JSON.stringify(suppliers)}

Respond with a JSON object:
{
  "materialId": "${material.id}",
  "materialName": "${material.name}",
  "recommendedQuantity": ${deficit},
  "suggestedSupplierId": string,
  "suggestedSupplierName": string,
  "unitCost": number,
  "totalEstimatedCost": number,
  "expectedLeadDays": number,
  "confidenceScore": number,
  "justification": string
}`;

  const preferredSupplier = suppliers.find((s) => s.preferred) || suppliers[0] || db.suppliers[0];
  const fallback = {
    materialId: material.id,
    materialName: material.name,
    recommendedQuantity: deficit > 0 ? deficit : 1000,
    suggestedSupplierId: preferredSupplier.id,
    suggestedSupplierName: preferredSupplier.name,
    unitCost: material.unitCost,
    totalEstimatedCost: (deficit > 0 ? deficit : 1000) * material.unitCost,
    expectedLeadDays: preferredSupplier.leadTimeDays,
    confidenceScore: 0.96,
    justification: `ABC Electrical Supplies maintains verified warehouse stock of 4-Core 16mm² armoured cable in Ikeja with a guaranteed 48-hour delivery window and 4.9/5 contractor rating.`,
  };

  const aiResult = await generateWithGemini(prompt, fallback);
  res.json({ procurementSuggestion: aiResult });
});

// 3. Executive Summary
app.post('/api/ai/executive-summary', async (req, res) => {
  const { projectId } = req.body;
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const tasks = db.tasks.filter((t) => t.projectId === projectId);
  const materials = db.materials.filter((m) => m.projectId === projectId);
  const alerts = db.aiAlerts.filter((a) => a.projectId === projectId && !a.resolved);

  const prompt = `You are the chief executive construction advisory AI for CONSTRUX OS.
Synthesize an executive briefing for the Project Director and Investment Board:
Project: ${project.name} (${project.code})
Progress: ${project.progressPercent}%
Budget: ₦${project.budgetSpent.toLocaleString()} spent of ₦${project.budgetTotal.toLocaleString()} total
Status: ${project.status}
Open Tasks: ${tasks.length}
Materials Count: ${materials.length}
Active Critical Alerts: ${JSON.stringify(alerts.map((a) => a.title))}

Respond with a JSON object:
{
  "projectId": "${project.id}",
  "projectName": "${project.name}",
  "overallHealth": "HEALTHY" | "CAUTION" | "CRITICAL",
  "completionRate": "${project.progressPercent}%",
  "budgetStatus": string,
  "criticalRisks": string[],
  "procurementStatus": string,
  "recommendedActions": string[],
  "summaryText": string,
  "generatedAt": "${new Date().toISOString()}"
}`;

  const fallback = {
    projectId: project.id,
    projectName: project.name,
    overallHealth: project.status === 'at_risk' ? 'CAUTION' : 'HEALTHY',
    completionRate: `${project.progressPercent}% overall physical completion`,
    budgetStatus: `₦295M spent of ₦430M budget (68.6% financial absorption, on curve)`,
    criticalRisks: [
      'Level 4 Electrical cabling bottleneck with 5-day variance',
      'Pending 3,400m 4-Core 16mm² armoured cable shipment',
    ],
    procurementStatus: '84% of primary structural packages delivered; MEP packages in active delivery',
    recommendedActions: [
      'Authorize expedited PO for 3,400m cable to ABC Electrical Supplies',
      'Align electrical sub-contractor for double shift upon site receipt',
      'Prepare Handover protocol for early testing & commissioning in BuildTwin',
    ],
    summaryText: `Victoria Heights is advancing at 68% physical completion with ₦295M deployed against the ₦430M authorized budget. Superstructure topped out on schedule. Primary critical path exposure is centered on Level 4 MEP cabling due to local raw material logistics. Immediate procurement sign-off will safeguard the target Phase 4 enclosure milestone without budget overrun.`,
    generatedAt: new Date().toISOString(),
  };

  const aiResult = await generateWithGemini(prompt, fallback);
  res.json({ summary: aiResult });
});

// Live AI: Anthropic Site Photo Analysis (with Zod schema & fallback)
app.post('/api/ai/photo-analysis', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const response = await handlePhotoAnalysis(req.body, ip);
  res.status(response.status).json(response.body);
});

// Live AI: Anthropic BoQ Import & Schedule Synthesis (with Zod schema & fallback)
app.post('/api/ai/boq-import', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const response = await handleBoQImport(req.body, ip);
  res.status(response.status).json(response.body);
});

// 4. Building Digital Twin Maintenance AI
app.post('/api/ai/building-maintenance', async (req, res) => {
  const { buildingId } = req.body;
  const building = db.buildings.find((b) => b.id === buildingId);
  if (!building) return res.status(404).json({ error: 'Building not found' });

  const equipment = db.equipmentList.filter((e) => e.buildingId === buildingId);
  const systems = db.buildingSystems.filter((s) => s.buildingId === buildingId);

  const prompt = `You are BuildTwin's AI facility reliability engineer.
Review this operating building's digital twin equipment and telemetry:
Building: ${building.name} (${building.totalFloors} floors, Health: ${building.healthScore}%)
Equipment: ${JSON.stringify(equipment.map((e) => ({ name: e.name, model: e.model, runtimeHours: e.runtimeHours, status: e.status, lastMaintenance: e.lastMaintenance })))}
Systems: ${JSON.stringify(systems.map((s) => ({ name: s.name, metrics: s.metrics })))}

Respond with a JSON object:
{
  "recommendations": [
    {
      "equipmentId": string,
      "equipmentName": string,
      "roomNumber": string,
      "severity": "low" | "medium" | "high" | "critical",
      "issueTitle": string,
      "recommendation": string,
      "preventiveAction": string,
      "estimatedCostNaira": number,
      "suggestedDueDays": number
    }
  ],
  "energyOptimizationNote": string,
  "systemHealthIndex": number
}`;

  const fallback = {
    recommendations: [
      {
        equipmentId: equipment[1]?.id || 'eq-204-ac',
        equipmentName: 'Daikin VRV IV Air Handling Unit (AHU-04)',
        roomNumber: '204',
        severity: 'high',
        issueTitle: 'AC Coil Differential Pressure Alert (185 Pa)',
        recommendation: 'Filter loading has reached 82% threshold after 4,320 operational runtime hours.',
        preventiveAction: 'Wash and replace secondary electrostatic filter mesh, recalibrate supply air pressure transducer, and lubricate blower bearings.',
        estimatedCostNaira: 125000,
        suggestedDueDays: 3,
      },
    ],
    energyOptimizationNote: 'Night setback schedules on Floor 2 VRV loops could reduce baseline off-peak consumption by 11.4%.',
    systemHealthIndex: 96,
  };

  const aiResult = await generateWithGemini(prompt, fallback);
  res.json({ maintenanceAdvisor: aiResult });
});

// 5. Ask CONSTRUX AI Contextual Assistant
app.post('/api/ai/ask', async (req, res) => {
  const { question, projectId, buildingId } = req.body;

  let context = 'CONSTRUX Construction Operating System context:\n';
  if (projectId) {
    const proj = db.projects.find((p) => p.id === projectId);
    if (proj) {
      const tasks = db.tasks.filter((t) => t.projectId === projectId);
      const materials = db.materials.filter((m) => m.projectId === projectId);
      context += `Active Project: ${proj.name}, Status: ${proj.status}, Progress: ${proj.progressPercent}%, Budget: ₦${proj.budgetTotal.toLocaleString()}.\n`;
      context += `Tasks: ${tasks.map((t) => `${t.title} (${t.status}, ${t.progress}%)`).join('; ')}\n`;
      context += `Materials: ${materials.map((m) => `${m.name}: stock ${m.currentStock}/${m.quantityRequired} (${m.status})`).join('; ')}\n`;
    }
  }

  if (buildingId) {
    const bldg = db.buildings.find((b) => b.id === buildingId);
    if (bldg) {
      context += `Active Digital Twin: ${bldg.name}, Total Floors: ${bldg.totalFloors}, Health Score: ${bldg.healthScore}%, Contract Ref: ${bldg.handoverContractRef}.\n`;
      context += `Room 204 Substation has Distribution Board DB-L4-01 (optimal) and Daikin VRV AHU-04 (filter maintenance due).\n`;
    }
  }

  const prompt = `${context}
User question: "${question}"
Answer directly, professionally, with accurate construction management domain precision. Highlight connected traceability across Project OS, Supply OS, and BuildTwin when relevant.`;

  let answerText = '';
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      answerText = response.text || '';
    } catch (e) {
      console.warn('Gemini chat error, fallback used:', e);
    }
  }

  if (!answerText) {
    const qLower = question.toLowerCase();
    if (qLower.includes('delay') || qLower.includes('level 4') || qLower.includes('risk')) {
      answerText = `Victoria Heights is currently marked 'At Risk' with a 5-day projected variance on Task #3 (Electrical Installation & Armoured Cabling on Level 4). The root cause is a raw material bottleneck: 3,400 meters of 4-Core 16mm² armoured cable are required to complete the feeder risers. Once the purchase order to ABC Electrical Supplies is fulfilled, the schedule variance can be recovered with 2 double shifts.`;
    } else if (qLower.includes('cable') || qLower.includes('procurement') || qLower.includes('supplier')) {
      answerText = `In Supply OS, Electrical Armoured Cable (4-Core 16mm²) is in Critical Shortage (stock: 600m / required: 4,000m). AI Supply intelligence recommends ABC Electrical Supplies Ltd (Ikeja, Lagos, Lead time: 2 days, Rating: 4.9/5) at ₦4,200/meter. Generating PO-VH-2026 for 3,400m resolves the shortage immediately upon delivery.`;
    } else if (qLower.includes('room 204') || qLower.includes('maintenance') || qLower.includes('twin')) {
      answerText = `In BuildTwin, Room 204 is the MEP Substation & HVAC Control Room on Floor 2. It holds equipment transferred directly from construction: Main Distribution Board DB-L4-01 and Daikin VRV IV Air Handling Unit AHU-04. The Daikin AHU has accumulated 4,320 operational hours with a 185 Pa filter pressure delta; preventive maintenance is scheduled to wash/replace electrostatic intake filters.`;
    } else {
      answerText = `CONSTRUX links Project OS, Supply OS, and BuildTwin into a continuous data model. Every physical element (cabling, distribution panels, chillers) originates in Procurement, is installed via Project Tasks, and seamlessly persists as a monitored asset in the Digital Twin upon Handover.`;
    }
  }

  res.json({ answer: answerText });
});

// -------------------------------------------------------------
// Interactive Hackathon Demo Script Automation & Reset
// -------------------------------------------------------------

app.post('/api/demo/reset', (_req, res) => {
  db = generateSeedState();
  res.json({ message: 'CONSTRUX demo database reset to clean initial state (Victoria Heights at 68%).', dbState: 'reset_ok' });
});

app.post('/api/demo/step/:stepNumber', async (req, res) => {
  const step = Number(req.params.stepNumber);
  const proj = db.projects.find((p) => p.id === 'proj-victoria');
  if (!proj) return res.status(404).json({ error: 'Victoria Heights project not found' });

  let actionReport = '';

  switch (step) {
    case 1:
      proj.status = 'on_track';
      actionReport = 'Victoria Heights initialized: 12 Floors, ₦430M budget (₦295M spent), 68% progress.';
      break;

    case 2:
      actionReport = 'Tasks reviewed: Structural Works (100% ✓), MEP Rough-in (100% ✓), Electrical Cabling (40% In Progress).';
      break;

    case 3:
      actionReport = 'Supply OS alert active: Electrical Cable required 4,000m, available 600m. Shortfall: 3,400m.';
      break;

    case 4:
      const cableMat = db.materials.find((m) => m.id === 'mat-1');
      const abcSupplier = db.suppliers.find((s) => s.id === 'sup-1');
      if (cableMat && abcSupplier) {
        const po: PurchaseOrder = {
          id: `po-demo-${Date.now()}`,
          poNumber: 'PO-VH-2026-099-EXP',
          projectId: 'proj-victoria',
          materialId: cableMat.id,
          materialName: cableMat.name,
          supplierId: abcSupplier.id,
          supplierName: abcSupplier.name,
          quantity: 3400,
          unitCost: 4200,
          totalAmount: 3400 * 4200, // ₦14,280,000
          status: 'issued',
          orderedAt: new Date().toISOString(),
          expectedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(),
          notes: 'Pre-filled via CONSTRUX AI Suggestion for immediate site replenishment.',
        };
        db.purchaseOrders.unshift(po);
        actionReport = 'PO-VH-2026-099-EXP generated for 3,400m Armoured Cable to ABC Electrical Supplies (₦14.28M).';
      }
      break;

    case 5:
      const cMat = db.materials.find((m) => m.id === 'mat-1');
      if (cMat) {
        cMat.quantityDelivered = 4000;
        cMat.currentStock = 4000;
        cMat.status = 'adequate';
        db.inventoryLogs.unshift({
          id: `inv-demo-${Date.now()}`,
          projectId: 'proj-victoria',
          materialId: cMat.id,
          materialName: cMat.name,
          changeQty: 3400,
          previousStock: 600,
          newStock: 4000,
          reason: 'PO-VH-2026-099-EXP Expedited Delivery Accepted on Site',
          author: 'Chioma Okonkwo (Procurement)',
          timestamp: new Date().toISOString(),
        });

        // Mark purchase order delivered
        const openPo = db.purchaseOrders.find((p) => p.materialId === 'mat-1' && p.status === 'issued');
        if (openPo) {
          openPo.status = 'delivered';
          openPo.deliveredAt = new Date().toISOString();
        }

        // Auto-resolve procurement alert
        db.aiAlerts
          .filter((a) => a.projectId === 'proj-victoria' && a.type === 'procurement_deficit')
          .forEach((a) => {
            a.resolved = true;
          });

        actionReport = 'Recorded delivery of 3,400m cable! On-site stock updated to 4,000m. Supply deficit alert auto-resolved.';
      }
      break;

    case 6:
      const newUpd: SiteUpdate = {
        id: `upd-demo-${Date.now()}`,
        projectId: 'proj-victoria',
        author: 'Engr. Babatunde Adeyemi',
        authorRole: 'Site Engineer',
        note: 'Electrical installation on Level 4 is 40% complete. Containment and trunking ready for cable pulls.',
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
        tags: ['Level4', 'Electrical', 'MilestoneCheck'],
        timestamp: new Date().toISOString(),
        completionReported: 68,
        verified: true,
      };
      db.siteUpdates.unshift(newUpd);
      actionReport = 'Site update posted by Engr. Babatunde: "Electrical installation on Level 4 is 40% complete" with photo.';
      break;

    case 7:
      proj.status = 'at_risk';
      const existing = db.aiAlerts.find(
        (a) => a.projectId === 'proj-victoria' && a.type === 'schedule_risk' && !a.resolved
      );
      if (!existing) {
        db.aiAlerts.unshift({
          id: `alt-demo-risk-${Date.now()}`,
          projectId: 'proj-victoria',
          type: 'schedule_risk',
          severity: 'critical',
          title: 'Schedule Risk: ⚠ At Risk — 5 Days Variance on Level 4',
          message: 'AI Engine detected schedule drag on Level 4 Electrical Installation. 5-day variance against critical path handover.',
          recommendation: 'Deploy available 4,000m cable stock immediately and mobilize overtime shift to recover 5-day schedule buffer.',
          resolved: false,
          createdAt: new Date().toISOString(),
          metadata: { delayDays: 5 },
        });
      }
      actionReport = 'AI Engine Triggered: Project status flipped from "On Track" to "⚠ At Risk — 5 days"!';
      break;

    case 8:
      proj.status = 'handed_over';
      proj.progressPercent = 100;
      proj.activeBuildingId = 'bldg-victoria';
      proj.handedOverAt = new Date().toISOString();

      let vBldg = db.buildings.find((b) => b.id === 'bldg-victoria');
      if (!vBldg) {
        vBldg = {
          id: 'bldg-victoria',
          projectId: 'proj-victoria',
          name: 'Victoria Heights Tower',
          code: 'B-VH-01',
          totalFloors: 12,
          totalAreaSqm: 19800,
          handedOverAt: new Date().toISOString(),
          handoverContractRef: 'HNDV-VH-2026-09',
          healthScore: 97,
          activeAlertsCount: 1,
          energyRating: 'LEED Gold Certified (36 kWh/m²/yr)',
          location: 'Victoria Island, Lagos',
        };
        db.buildings.unshift(vBldg);

        for (let f = 0; f <= 12; f++) {
          db.floors.push({
            id: `fl-victoria-${f}`,
            buildingId: 'bldg-victoria',
            floorNumber: f,
            name: f === 0 ? 'Ground Floor & Grand Atrium' : f === 12 ? 'Rooftop Plant Deck' : `Floor ${f} — Premium Suites`,
            totalRooms: 8,
            areaSqm: 1650,
            occupancy: f === 2 ? 84 : 45,
            status: f === 2 ? 'alert' : 'normal',
          });
        }

        const fl2 = `fl-victoria-2`;
        db.rooms.push({
          id: 'rm-victoria-204',
          floorId: fl2,
          buildingId: 'bldg-victoria',
          roomNumber: '204',
          name: 'MEP Substation & Plant Control',
          areaSqm: 68,
          type: 'substation',
          temperature: 23.8,
          humidity: 52,
          powerLoadKw: 48.2,
          airQualityIndex: 28,
          handoverOriginTask: 'Task #3: Electrical Installation & Armoured Cabling',
        });

        db.equipmentList.push(
          {
            id: 'eq-vh-204-db',
            roomId: 'rm-victoria-204',
            floorId: fl2,
            buildingId: 'bldg-victoria',
            name: 'Main Distribution Board DB-L4-01',
            model: 'Schneider Electric PrismaSeT 250A',
            serialNumber: 'SE-2026-VH-00918',
            category: 'electrical',
            status: 'optimal',
            installDate: '2026-09-15',
            lastMaintenance: '2026-09-20',
            nextMaintenance: '2027-03-20',
            runtimeHours: 480,
            powerRating: '160 kW 415V',
            originProjectId: 'proj-victoria',
            originTaskId: 'task-3',
          },
          {
            id: 'eq-vh-204-ac',
            roomId: 'rm-victoria-204',
            floorId: fl2,
            buildingId: 'bldg-victoria',
            name: 'Daikin VRV IV Air Handling Unit (AHU-04)',
            model: 'Daikin VRV-IV RXQ16TYDN',
            serialNumber: 'DKN-2026-VRV-4412',
            category: 'hvac',
            status: 'warning',
            installDate: '2026-08-10',
            lastMaintenance: '2026-03-15',
            nextMaintenance: '2026-09-15',
            runtimeHours: 4320,
            powerRating: '14.2 kW',
            originProjectId: 'proj-victoria',
            originTaskId: 'task-4',
          }
        );

        db.buildingSystems.push({
          id: 'sys-vh-204-elec',
          roomId: 'rm-victoria-204',
          floorId: fl2,
          buildingId: 'bldg-victoria',
          type: 'electrical',
          name: 'Distribution Board DB-L4-01 Feeder Network',
          status: 'optimal',
          metrics: {
            voltagePhaseA: '240.1 V',
            voltagePhaseB: '239.9 V',
            voltagePhaseC: '240.4 V',
            totalLoadKw: '48.2 kW',
            powerFactor: 0.99,
          },
        });

        db.aiAlerts.push({
          id: `alt-twin-vh-${Date.now()}`,
          buildingId: 'bldg-victoria',
          type: 'maintenance_due',
          severity: 'warning',
          title: 'AC unit due for preventive maintenance (Room 204)',
          message: 'Daikin VRV AHU-04 has logged 4,320 operational hours with high differential filter pressure. Filter cleaning recommended.',
          recommendation: 'Schedule preventive filter replacement for Daikin AC Unit in Room 204 before seasonal high humidity cycle.',
          resolved: false,
          createdAt: new Date().toISOString(),
          metadata: {
            roomId: 'rm-victoria-204',
            roomNumber: '204',
            equipmentId: 'eq-vh-204-ac',
          },
        });
      }
      actionReport = 'Handover Complete! Victoria Heights project converted to living Digital Twin (BuildTwin).';
      break;

    case 9:
      actionReport = 'BuildTwin Floor 2 Room 204 Active: Traceable Distribution Board & Daikin AC with AI Maintenance recommendation displayed!';
      break;

    default:
      actionReport = `Step ${step} executed.`;
  }

  res.json({
    step,
    actionReport,
    project: proj,
    activeBuildingId: proj.activeBuildingId,
  });
});

// -------------------------------------------------------------
// Vite Middleware Mode Setup (or Production Static Server)
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: Number(PORT),
        host: '0.0.0.0',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`CONSTRUX full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CONSTRUX server:', err);
});
