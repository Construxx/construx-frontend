export type Role = 'ADMIN' | 'SITE_ENGINEER' | 'PROCUREMENT_OFFICER' | 'FACILITY_MANAGER' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatar: string;
}

export type ProjectStatus = 'on_track' | 'at_risk' | 'delayed' | 'completed' | 'handed_over';

export interface Project {
  id: string;
  name: string;
  code: string;
  type: string;
  budgetTotal: number;
  budgetSpent: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progressPercent: number;
  location: string;
  contractor: string;
  floorsTotal: number;
  activeBuildingId?: string;
  handedOverAt?: string;
  description: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed';
export type TaskCategory = 'structural' | 'mep' | 'electrical' | 'finishing' | 'civil';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  assignedTo: string;
  dueDate: string;
  progress: number;
  floorLevel: string;
  criticalPath: boolean;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  stage: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  dueDate: string;
  orderIndex: number;
  isHandover: boolean;
}

export interface SiteUpdate {
  id: string;
  projectId: string;
  author: string;
  authorRole: string;
  note: string;
  photoUrl?: string;
  tags: string[];
  timestamp: string;
  completionReported?: number;
  verified: boolean;
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  category: 'architectural' | 'mep' | 'electrical' | 'structural' | 'permits' | 'handover';
  fileType: string;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  url: string;
}

export type MaterialStatus = 'adequate' | 'low_stock' | 'critical_shortage';

export interface Material {
  id: string;
  projectId: string;
  name: string;
  category: string;
  unit: string;
  quantityRequired: number;
  quantityDelivered: number;
  currentStock: number;
  status: MaterialStatus;
  unitCost: number;
  leadTimeDays: number;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  contact: string;
  phone: string;
  email: string;
  rating: number;
  leadTimeDays: number;
  materialsSupplied: string[];
  preferred: boolean;
}

export type POStatus = 'draft' | 'issued' | 'in_transit' | 'delivered';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  projectId: string;
  materialId: string;
  materialName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  status: POStatus;
  orderedAt: string;
  expectedDelivery: string;
  deliveredAt?: string;
  notes?: string;
}

export interface InventoryLog {
  id: string;
  projectId: string;
  materialId: string;
  materialName: string;
  changeQty: number;
  previousStock: number;
  newStock: number;
  reason: string;
  author: string;
  timestamp: string;
}

export interface Building {
  id: string;
  projectId: string;
  name: string;
  code: string;
  totalFloors: number;
  totalAreaSqm: number;
  handedOverAt: string;
  handoverContractRef: string;
  healthScore: number;
  activeAlertsCount: number;
  energyRating: string;
  location: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: number;
  name: string;
  totalRooms: number;
  areaSqm: number;
  occupancy: number;
  status: 'normal' | 'alert' | 'maintenance';
}

export interface Room {
  id: string;
  floorId: string;
  buildingId: string;
  roomNumber: string;
  name: string;
  areaSqm: number;
  type: 'substation' | 'office' | 'conference' | 'server_room' | 'utility' | 'restroom';
  temperature: number;
  humidity: number;
  powerLoadKw: number;
  airQualityIndex: number;
  handoverOriginTask?: string;
}

export type EquipmentStatus = 'optimal' | 'warning' | 'critical' | 'offline';

export interface Equipment {
  id: string;
  roomId: string;
  floorId: string;
  buildingId: string;
  name: string;
  model: string;
  serialNumber: string;
  category: 'electrical' | 'hvac' | 'fire_safety' | 'plumbing' | 'security';
  status: EquipmentStatus;
  installDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  runtimeHours: number;
  powerRating: string;
  originProjectId?: string;
  originTaskId?: string;
}

export interface BuildingSystem {
  id: string;
  roomId: string;
  floorId: string;
  buildingId: string;
  type: 'electrical' | 'hvac' | 'plumbing' | 'fire_safety';
  name: string;
  status: 'optimal' | 'degraded' | 'alert';
  metrics: Record<string, string | number>;
}

export interface MaintenanceTask {
  id: string;
  buildingId: string;
  roomId: string;
  roomName: string;
  equipmentId?: string;
  equipmentName?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'scheduled' | 'in_progress' | 'completed';
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  originAiAlertId?: string;
}

export type AIAlertType = 'schedule_risk' | 'procurement_deficit' | 'maintenance_due' | 'safety_warning';

export interface AIAlert {
  id: string;
  projectId?: string;
  buildingId?: string;
  type: AIAlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendation: string;
  resolved: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface ExecutiveSummary {
  projectId: string;
  projectName: string;
  overallHealth: 'HEALTHY' | 'CAUTION' | 'CRITICAL';
  completionRate: string;
  budgetStatus: string;
  criticalRisks: string[];
  procurementStatus: string;
  recommendedActions: string[];
  summaryText: string;
  generatedAt: string;
}
