import type {
  Project, Task, Milestone, SiteUpdate, Material, PurchaseOrder, InventoryLog,
  Supplier, Building, Floor, Room, Equipment, BuildingSystem, MaintenanceTask,
  AIAlert, ExecutiveSummary, User, Role,
} from '../types';

export interface ProjectDetailResponse {
  project: Project;
  tasks: Task[];
  milestones: Milestone[];
  materials: Material[];
  siteUpdates: SiteUpdate[];
  documents: Array<Record<string, unknown>>;
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '')).replace(/\/$/, '');
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

function apiUrl(path: string) {
  const route = API_BASE_URL === '/api' ? `/api${path}` : path;
  return `${API_BASE_URL === '/api' ? '' : API_BASE_URL}${route}`;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(apiUrl('/auth/refresh'), {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}',
    }).then(async (response) => {
      if (!response.ok) return false;
      const body = await response.json() as { accessToken: string };
      accessToken = body.accessToken;
      return true;
    }).catch(() => false).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  if (!API_BASE_URL) throw new ApiError(503, 'VITE_API_BASE_URL must be configured for this deployment.');
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(apiUrl(path), { ...options, headers, credentials: 'include' });
  if (response.status === 401 && retry && path !== '/auth/login' && path !== '/auth/refresh') {
    if (await refreshAccessToken()) return request<T>(path, options, false);
    accessToken = null;
    window.dispatchEvent(new Event('construx:unauthorized'));
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string | string[]; error?: string } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
    throw new ApiError(response.status, message || `Request failed (${response.status})`, payload);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const iso = (date?: string | Date | null) => date ? new Date(date).toISOString() : '';
const asArray = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const statusProject = (status: string): Project['status'] => ({
  PLANNING: 'on_track', IN_PROGRESS: 'on_track', ON_HOLD: 'at_risk', COMPLETED: 'completed', HANDED_OVER: 'handed_over',
}[status] as Project['status'] || 'on_track');
const taskStatus = (status: string): Task['status'] => ({ TODO: 'pending', IN_PROGRESS: 'in_progress', BLOCKED: 'blocked', DONE: 'completed' }[status] as Task['status'] || 'pending');
const alertSeverity = (severity: string): AIAlert['severity'] => ({ LOW: 'info', MEDIUM: 'warning', HIGH: 'critical' }[severity] as AIAlert['severity'] || 'info');
const mapUser = (u: any): User => ({ id: u.id, name: u.name, email: u.email, role: u.role as Role, title: '', avatar: '' });
const mapProject = (p: any): Project => ({
  id: p.id, name: p.name, code: p.code ?? '', type: p.type, budgetTotal: p.budgetTotal, budgetSpent: p.budgetSpent,
  startDate: iso(p.startDate), endDate: iso(p.endDate), status: statusProject(p.status), progressPercent: p.progressPercent,
  location: '', contractor: '', floorsTotal: p.building?.totalFloors ?? 0, activeBuildingId: p.building?.id,
  handedOverAt: iso(p.building?.handedOverAt) || undefined, description: '',
});
const mapTask = (t: any): Task => ({
  id: t.id, projectId: t.projectId, title: t.title, description: '', category: 'structural', status: taskStatus(t.status),
  assignedTo: t.assignedTo?.name ?? '', dueDate: iso(t.dueDate), progress: t.status === 'DONE' ? 100 : 0,
  floorLevel: t.level == null ? '' : String(t.level), criticalPath: t.status === 'BLOCKED',
});
const mapMilestone = (m: any): Milestone => ({
  id: m.id, projectId: m.projectId, title: m.title, stage: '',
  status: ({ PENDING: 'upcoming', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' } as const)[m.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'] ?? 'upcoming',
  dueDate: '', orderIndex: m.orderIndex, isHandover: /handover/i.test(m.title),
});
const mapSiteUpdate = (s: any): SiteUpdate => ({
  id: s.id, projectId: s.projectId, author: s.author?.name ?? '', authorRole: '', note: s.note,
  photoUrl: s.photoUrl ?? undefined, tags: [], timestamp: iso(s.createdAt), verified: false,
});
const mapMaterial = (m: any): Material => ({
  id: m.id, projectId: m.projectId, name: m.name, category: '', unit: m.unit,
  quantityRequired: m.quantityRequired, quantityDelivered: m.quantityDelivered, currentStock: m.quantityOnSite,
  status: m.hasOpenAlert || (m.dailyUsage > 0 && m.quantityOnSite / m.dailyUsage <= 5) ? 'critical_shortage'
    : m.dailyUsage > 0 && m.quantityOnSite / m.dailyUsage <= 14 ? 'low_stock' : 'adequate',
  unitCost: 0, leadTimeDays: 0,
});
const mapSupplier = (s: any): Supplier => ({
  id: s.id, name: s.name, location: '', contact: s.contactInfo ?? '', phone: '', email: '', rating: 0,
  leadTimeDays: s.leadTimeDays, materialsSupplied: s.materialsSupplied ?? [], preferred: false,
});
const mapOrder = (o: any): PurchaseOrder => ({
  id: o.id, poNumber: o.id.slice(0, 8).toUpperCase(), projectId: o.projectId, materialId: o.materialId,
  materialName: o.material?.name ?? '', supplierId: o.supplierId, supplierName: o.supplier?.name ?? '',
  quantity: o.quantity, unitCost: o.quantity ? (o.cost ?? 0) / o.quantity : 0, totalAmount: o.cost ?? 0,
  status: ({ DRAFT: 'draft', ORDERED: 'issued', DELIVERED: 'delivered', CANCELLED: 'delivered' } as const)[o.status as 'DRAFT' | 'ORDERED' | 'DELIVERED' | 'CANCELLED'] ?? 'issued',
  orderedAt: iso(o.orderedAt), expectedDelivery: iso(o.expectedDelivery), deliveredAt: iso(o.deliveredAt) || undefined,
});
const mapLog = (l: any, material?: any): InventoryLog => ({
  id: l.id, projectId: l.projectId, materialId: l.materialId, materialName: material?.name ?? '',
  changeQty: l.changeQty, previousStock: 0, newStock: 0, reason: l.reason, author: '', timestamp: iso(l.createdAt),
});
const mapAlert = (a: any): AIAlert => ({
  id: a.id, projectId: a.projectId ?? undefined, buildingId: a.buildingId ?? undefined,
  type: ({ PROCUREMENT: 'procurement_deficit', SCHEDULE: 'schedule_risk', MAINTENANCE: 'maintenance_due' } as Record<string, AIAlert['type']>)[a.type] ?? 'safety_warning',
  severity: alertSeverity(a.severity), title: a.type.replaceAll('_', ' '), message: a.message,
  recommendation: typeof a.suggestion === 'string' ? a.suggestion : JSON.stringify(a.suggestion ?? ''),
  resolved: a.resolved, createdAt: iso(a.createdAt), metadata: a.suggestion ?? undefined,
});
const mapBuilding = (b: any): Building => ({
  id: b.id, projectId: b.projectId, name: b.name, code: '', totalFloors: b.totalFloors,
  totalAreaSqm: 0, handedOverAt: iso(b.handedOverAt), handoverContractRef: '', healthScore: 0,
  activeAlertsCount: b.openAlerts ?? 0, energyRating: '', location: '',
});
const mapFloor = (f: any): Floor => ({
  id: f.id, buildingId: f.buildingId, floorNumber: f.floorNumber, name: f.name, totalRooms: f.rooms?.length ?? 0,
  areaSqm: 0, occupancy: 0, status: 'normal',
});
const mapRoom = (r: any): Room => ({
  id: r.id, floorId: r.floorId, buildingId: r.floor?.buildingId ?? '', roomNumber: '', name: r.name,
  areaSqm: r.areaSqm ?? 0, type: 'utility', temperature: 0, humidity: 0, powerLoadKw: 0, airQualityIndex: 0,
});
const mapEquipment = (e: any, roomId: string, floorId: string, buildingId: string): Equipment => ({
  id: e.id, roomId, floorId, buildingId, name: e.name, model: e.model ?? '', serialNumber: '', category: 'electrical',
  status: e.status === 'OPERATIONAL' ? 'optimal' : e.status === 'OFFLINE' ? 'offline' : 'warning',
  installDate: '', lastMaintenance: iso(e.lastMaintenance), nextMaintenance: iso(e.nextMaintenance), runtimeHours: 0,
  powerRating: '',
});
const mapSystem = (s: any, floorId: string, buildingId: string): BuildingSystem => ({
  id: s.id, roomId: s.roomId, floorId, buildingId, type: String(s.type).toLowerCase() as BuildingSystem['type'],
  name: String(s.type), status: s.status === 'OPERATIONAL' ? 'optimal' : 'degraded', metrics: {},
});
const mapMaintenance = (m: any, buildingId: string): MaintenanceTask => ({
  id: m.id, buildingId, roomId: m.roomId ?? '', roomName: m.room?.name ?? '', equipmentId: m.equipmentId ?? undefined,
  equipmentName: m.equipment?.name ?? undefined, title: m.description, description: m.description, priority: 'medium',
  status: ({ TODO: 'open', IN_PROGRESS: 'in_progress', DONE: 'completed', BLOCKED: 'open' } as Record<string, MaintenanceTask['status']>)[m.status] ?? 'open',
  assignedTo: m.assignedTo?.name ?? '', dueDate: iso(m.dueDate), createdAt: iso(m.createdAt),
});

async function getMaterials(projectId: string) {
  return asArray<any>(await request(`/projects/${projectId}/materials`)).map(mapMaterial);
}
async function getAlerts(projectId: string) {
  return asArray<any>(await request(`/projects/${projectId}/alerts`)).map(mapAlert);
}
async function getProcurement(projectId: string): Promise<ProcurementResponse> {
  const [rawMaterials, rawOrders, rawSuppliers, rawAlerts] = await Promise.all([
    request<unknown>(`/projects/${projectId}/materials`), request<unknown>(`/projects/${projectId}/purchase-orders`),
    request<unknown>('/suppliers'), request<unknown>(`/projects/${projectId}/alerts`),
  ]);
  const materials = asArray<any>(rawMaterials);
  const inventoryLogs = (await Promise.all(materials.map(async (m) => asArray<any>(await request(`/materials/${m.id}/logs`)).map((l) => mapLog(l, m))))).flat();
  return { materials: materials.map(mapMaterial), purchaseOrders: asArray<any>(rawOrders).map(mapOrder), inventoryLogs,
    suppliers: asArray<any>(rawSuppliers).map(mapSupplier), alerts: asArray<any>(rawAlerts).map(mapAlert) };
}

export const api = {
  setAccessToken(token: string | null) { accessToken = token; },
  async restoreSession() { return refreshAccessToken(); },
  async login(email: string, password: string) {
    const result = await request<{ accessToken: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    accessToken = result.accessToken;
    return { user: mapUser(result.user) };
  },
  async logout() { try { await request('/auth/logout', { method: 'POST' }, false); } finally { accessToken = null; } },
  async getCurrentUser() { return mapUser(await request<any>('/auth/me')); },
  async getUsers() { return asArray<any>(await request('/users')).map(mapUser); },
  async switchRole(_role: Role): Promise<{ user: User }> { throw new ApiError(404, 'Role switching is a demo-only action and is not supported by the production API.'); },

  async getProjects() { return asArray<any>(await request('/projects')).map(mapProject); },
  async getProject(id: string): Promise<ProjectDetailResponse> {
    const [p, t, milestones, materials, siteUpdates, documents, alerts] = await Promise.all([
      request<any>(`/projects/${id}`), request<unknown>(`/projects/${id}/tasks`), request<unknown>(`/projects/${id}/milestones`),
      request<unknown>(`/projects/${id}/materials`), request<unknown>(`/projects/${id}/site-updates`),
      request<unknown>(`/projects/${id}/documents`), request<unknown>(`/projects/${id}/alerts`),
    ]);
    return { project: mapProject(p), tasks: asArray<any>(t).map(mapTask), milestones: asArray<any>(milestones).map(mapMilestone),
      materials: asArray<any>(materials).map(mapMaterial), siteUpdates: asArray<any>(siteUpdates).map(mapSiteUpdate),
      documents: asArray<Record<string, unknown>>(documents), alerts: asArray<any>(alerts).map(mapAlert) };
  },
  async createTask(projectId: string, taskData: Partial<Task>) {
    const result = await request<any>(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify({
      title: taskData.title, status: taskData.status === 'completed' ? 'DONE' : taskData.status === 'blocked' ? 'BLOCKED' : taskData.status === 'in_progress' ? 'IN_PROGRESS' : 'TODO',
      dueDate: taskData.dueDate || undefined,
    }) }); return { task: mapTask(result) };
  },
  async updateTask(_projectId: string, taskId: string, taskData: Partial<Task>) {
    if (taskData.progress !== undefined) throw new ApiError(422, 'Task progress percentages are not persisted by the backend; update the task status instead.');
    const result = await request<any>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({
      ...(taskData.title ? { title: taskData.title } : {}),
      ...(taskData.status ? { status: ({ pending: 'TODO', in_progress: 'IN_PROGRESS', blocked: 'BLOCKED', completed: 'DONE' } as const)[taskData.status] } : {}),
      ...(taskData.dueDate ? { dueDate: taskData.dueDate } : {}),
    }) }); return { task: mapTask(result) };
  },
  async postSiteUpdate(projectId: string, data: { note: string; photoUrl?: string; tags?: string[]; completionReported?: number }) {
    if (data.photoUrl) throw new ApiError(422, 'Photo URLs cannot be submitted as site-update uploads. Use the file upload workflow.');
    if ((data.tags?.length ?? 0) > 0 || data.completionReported !== undefined) throw new ApiError(422, 'The backend currently stores only the site-update note and optional material stock report; tags and completion percentage are not supported.');
    const result = await request<any>(`/projects/${projectId}/site-updates`, { method: 'POST', body: JSON.stringify({ note: data.note }) });
    return { siteUpdate: mapSiteUpdate(result.siteUpdate), triggeredAlert: result.alert ? mapAlert(result.alert) : null };
  },
  async triggerHandover(projectId: string) {
    const raw = await request<any>(`/projects/${projectId}/handover`, { method: 'POST', body: JSON.stringify({}) });
    const building = mapBuilding(raw);
    return { message: 'Handover completed.', project: { id: projectId } as Project, building };
  },

  getProcurement,
  async createPurchaseOrder(projectId: string, data: { materialId: string; supplierId: string; quantity: number; unitCost?: number; notes?: string }) {
    if (data.notes?.trim()) throw new ApiError(422, 'Purchase-order notes are not stored by the backend yet.');
    const result = await request<any>('/purchase-orders', { method: 'POST', body: JSON.stringify({ materialId: data.materialId, supplierId: data.supplierId, quantity: data.quantity, cost: data.unitCost ? data.unitCost * data.quantity : undefined }) });
    return { purchaseOrder: mapOrder(result) };
  },
  async recordDelivery(_projectId: string, data: { materialId: string; quantityReceived: number; poId?: string; notes?: string }) {
    let poId = data.poId;
    if (!poId) {
      const open = asArray<any>(await request(`/projects/${_projectId}/purchase-orders`)).find((order) => order.materialId === data.materialId && order.status === 'ORDERED');
      poId = open?.id;
    }
    if (!poId) throw new ApiError(422, 'Create or select an open purchase order before recording delivery.');
    const result = await request<any>(`/purchase-orders/${poId}/deliver`, { method: 'PATCH', body: JSON.stringify({ quantityReceived: data.quantityReceived }) });
    return { message: result.alertResolved ? 'Delivery recorded; related procurement alert resolved.' : 'Delivery recorded.', material: mapMaterial(result.purchaseOrder.material), inventoryLog: {} as InventoryLog, purchaseOrder: mapOrder(result.purchaseOrder) };
  },
  async getSuppliers() { return asArray<any>(await request('/suppliers')).map(mapSupplier); },
  async getBuildings() { return asArray<any>(await request('/buildings')).map(mapBuilding); },
  async getBuilding(id: string): Promise<BuildingDetailResponse> {
    const raw = await request<any>(`/buildings/${id}`);
    const building = mapBuilding(raw);
    const rawFloors = asArray<any>(raw.floors);
    const floorPairs = rawFloors.map((f) => [f, asArray<any>(f.rooms)] as const);
    const roomDetails = (await Promise.all(floorPairs.flatMap(([floor, rooms]) => rooms.map(async (room) => ({ floor, room, detail: await request<any>(`/buildings/${id}/floors/${floor.id}/rooms/${room.id}`) })))));
    const floors = rawFloors.map(mapFloor);
    const rooms = roomDetails.map(({ room, detail }) => ({ ...mapRoom({ ...room, floor: { ...detail.floor, buildingId: id } }), buildingId: id }));
    const equipment = roomDetails.flatMap(({ floor, room, detail }) => asArray<any>(detail.equipment).map((e) => mapEquipment(e, room.id, floor.id, id)));
    const systems = roomDetails.flatMap(({ floor, detail }) => asArray<any>(detail.systems).map((s) => mapSystem(s, floor.id, id)));
    const [maintenance, alerts] = await Promise.all([request<unknown>(`/buildings/${id}/maintenance-tasks`), request<unknown>(`/buildings/${id}/alerts`)]);
    return { building, floors, rooms, equipment, systems, maintenance: asArray<any>(maintenance).map((m) => mapMaintenance(m, id)), alerts: asArray<any>(alerts).map(mapAlert) };
  },
  async getRoomDetail(buildingId: string, floorId: string, roomId: string): Promise<RoomDetailResponse> {
    const raw = await request<any>(`/buildings/${buildingId}/floors/${floorId}/rooms/${roomId}`);
    const [maintenance, alerts] = await Promise.all([request<unknown>(`/buildings/${buildingId}/maintenance-tasks`), request<unknown>(`/buildings/${buildingId}/alerts`)]);
    return { room: { ...mapRoom(raw), buildingId }, equipment: asArray<any>(raw.equipment).map((e) => mapEquipment(e, roomId, floorId, buildingId)),
      systems: asArray<any>(raw.systems).map((s) => mapSystem(s, floorId, buildingId)),
      maintenance: asArray<any>(maintenance).filter((m: any) => m.roomId === roomId).map((m) => mapMaintenance(m, buildingId)), alerts: asArray<any>(alerts).map(mapAlert) };
  },
  async createMaintenanceTask(buildingId: string, data: { roomId: string; equipmentId?: string; title: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'critical'; assignedTo?: string; dueDate?: string }) {
    const result = await request<any>(`/buildings/${buildingId}/maintenance-tasks`, { method: 'POST', body: JSON.stringify({ roomId: data.roomId || undefined, equipmentId: data.equipmentId, description: data.description || data.title, dueDate: data.dueDate }) });
    return { maintenanceTask: mapMaintenance(result, buildingId) };
  },
  async updateMaintenanceTask(_buildingId: string, taskId: string, data: { status: 'open' | 'scheduled' | 'in_progress' | 'completed' }) {
    const status = ({ open: 'TODO', scheduled: 'TODO', in_progress: 'IN_PROGRESS', completed: 'DONE' } as const)[data.status];
    return { maintenanceTask: mapMaintenance(await request<any>(`/maintenance-tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status }) }), _buildingId) };
  },
  async checkScheduleRisk(projectId: string) { return request(`/ai/risk-check/${projectId}`, { method: 'POST', body: '{}' }); },
  async suggestProcurement(projectId: string) { return request(`/ai/procurement-suggestion/${projectId}`, { method: 'POST', body: '{}' }); },
  async getExecutiveSummary(projectId: string) { return request<{ mode: string; summary: string }>(`/ai/executive-summary/${projectId}`); },
  async getBuildingMaintenanceAI(buildingId: string) { return request(`/ai/building-check/${buildingId}`, { method: 'POST', body: '{}' }); },
  async askQuestion(question: string, projectId?: string, _buildingId?: string) { return request<{ answer: string }>('/ai/ask', { method: 'POST', body: JSON.stringify({ question, projectId }) }); },
  async resetDemo(): Promise<{ message: string; dbState: string }> { throw new ApiError(404, 'Demo reset is not part of the production API.'); },
  async runDemoStep(_stepNumber: number): Promise<{ step: number; actionReport: string; project: Project; activeBuildingId?: string }> { throw new ApiError(404, 'Demo steps are not part of the production API.'); },
};
