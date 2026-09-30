import {
  Project,
  Task,
  Milestone,
  SiteUpdate,
  Material,
  PurchaseOrder,
  InventoryLog,
  Supplier,
  Building,
  Floor,
  Room,
  Equipment,
  BuildingSystem,
  MaintenanceTask,
  AIAlert,
  ExecutiveSummary,
  User,
  Role,
} from '../types';

export interface ProjectDetailResponse {
  project: Project;
  tasks: Task[];
  milestones: Milestone[];
  materials: Material[];
  siteUpdates: SiteUpdate[];
  documents: any[];
  alerts: AIAlert[];
}

export interface ProcurementResponse {
  materials: Material[];
  purchaseOrders: PurchaseOrder[];
  inventoryLogs: InventoryLog[];
  suppliers: Supplier[];
  alerts: AIAlert[];
}

export interface BuildingDetailResponse {
  building: Building;
  floors: Floor[];
  rooms: Room[];
  equipment: Equipment[];
  systems: BuildingSystem[];
  maintenance: MaintenanceTask[];
  alerts: AIAlert[];
}

export interface RoomDetailResponse {
  room: Room;
  equipment: Equipment[];
  systems: BuildingSystem[];
  maintenance: MaintenanceTask[];
  alerts: AIAlert[];
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  getCurrentUser: () => request<{ user: User }>('/api/auth/me'),
  getUsers: () => request<{ users: User[] }>('/api/auth/users'),
  switchRole: (role: Role) =>
    request<{ user: User }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  // Projects
  getProjects: () => request<{ projects: Project[] }>('/api/projects'),
  getProject: (id: string) => request<ProjectDetailResponse>(`/api/projects/${id}`),
  createTask: (projectId: string, taskData: Partial<Task>) =>
    request<{ task: Task }>(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  updateTask: (projectId: string, taskId: string, taskData: Partial<Task>) =>
    request<{ task: Task }>(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    }),
  postSiteUpdate: (projectId: string, updateData: { note: string; photoUrl?: string; tags?: string[]; completionReported?: number }) =>
    request<{ siteUpdate: SiteUpdate; triggeredAlert: AIAlert | null }>(`/api/projects/${projectId}/site-updates`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    }),
  triggerHandover: (projectId: string) =>
    request<{ message: string; project: Project; building: Building }>(`/api/projects/${projectId}/handover`, {
      method: 'POST',
    }),

  // Procurement
  getProcurement: (projectId: string) => request<ProcurementResponse>(`/api/projects/${projectId}/procurement`),
  createPurchaseOrder: (
    projectId: string,
    data: { materialId: string; supplierId: string; quantity: number; unitCost?: number; notes?: string }
  ) =>
    request<{ purchaseOrder: PurchaseOrder }>(`/api/projects/${projectId}/procurement/purchase-orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordDelivery: (
    projectId: string,
    data: { materialId: string; quantityReceived: number; poId?: string; notes?: string }
  ) =>
    request<{ message: string; material: Material; inventoryLog: InventoryLog; purchaseOrder?: PurchaseOrder }>(
      `/api/projects/${projectId}/procurement/deliveries`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  getSuppliers: () => request<{ suppliers: Supplier[] }>('/api/procurement/suppliers'),

  // Buildings (BuildTwin)
  getBuildings: () => request<{ buildings: Building[] }>('/api/buildings'),
  getBuilding: (id: string) => request<BuildingDetailResponse>(`/api/buildings/${id}`),
  getRoomDetail: (buildingId: string, floorId: string, roomId: string) =>
    request<RoomDetailResponse>(`/api/buildings/${buildingId}/floors/${floorId}/rooms/${roomId}`),
  createMaintenanceTask: (
    buildingId: string,
    data: {
      roomId: string;
      equipmentId?: string;
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      assignedTo?: string;
      dueDate?: string;
      originAiAlertId?: string;
    }
  ) =>
    request<{ maintenanceTask: MaintenanceTask }>(`/api/buildings/${buildingId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMaintenanceTask: (buildingId: string, taskId: string, data: { status: 'open' | 'scheduled' | 'in_progress' | 'completed' }) =>
    request<{ maintenanceTask: MaintenanceTask }>(`/api/buildings/${buildingId}/maintenance/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // AI Engine
  checkScheduleRisk: (projectId: string) =>
    request<{ riskAnalysis: any }>('/api/ai/risk-check', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),
  suggestProcurement: (materialId: string) =>
    request<{ procurementSuggestion: any }>('/api/ai/procurement-suggest', {
      method: 'POST',
      body: JSON.stringify({ materialId }),
    }),
  getExecutiveSummary: (projectId: string) =>
    request<{ summary: ExecutiveSummary }>('/api/ai/executive-summary', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),
  getBuildingMaintenanceAI: (buildingId: string) =>
    request<{ maintenanceAdvisor: any }>('/api/ai/building-maintenance', {
      method: 'POST',
      body: JSON.stringify({ buildingId }),
    }),
  askQuestion: (question: string, projectId?: string, buildingId?: string) =>
    request<{ answer: string }>('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, projectId, buildingId }),
    }),

  // Demo Runner & State Reset
  resetDemo: () => request<{ message: string; dbState: string }>('/api/demo/reset', { method: 'POST' }),
  runDemoStep: (stepNumber: number) =>
    request<{ step: number; actionReport: string; project: Project; activeBuildingId?: string }>(
      `/api/demo/step/${stepNumber}`,
      { method: 'POST' }
    ),
};
