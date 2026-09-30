import Dexie, { type Table } from 'dexie';
import { Project, Task, Material, PurchaseOrder, SiteUpdate } from '../../types';

export interface PhotoRecord {
  id: string;
  updateId?: string;
  blob: Blob;
  mimeType: string;
  createdAt: string;
}

export type OutboxStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface OutboxEntry {
  id: string;
  type:
    | 'postSiteUpdate'
    | 'confirmDelivery'
    | 'updateTaskProgress'
    | 'createPurchaseOrder'
    | 'reportIssue'
    | 'ai_analysis';
  payload: any;
  createdAt: string;
  status: OutboxStatus;
  retries: number;
  error?: string;
  lastAttemptAt?: string;
}

export interface SyncMeta {
  key: string;
  value: any;
  updatedAt: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'conflict';
  message: string;
  details?: string;
}

export interface SiteIssue {
  id: string;
  projectId: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'safety' | 'structural' | 'mep' | 'weather' | 'delay';
  description: string;
  photoUrl?: string;
  status: 'open' | 'resolving' | 'resolved';
  reportedBy: string;
  createdAt: string;
  _isOfflineCreated?: boolean;
  _syncStatus?: 'pending' | 'synced';
}

// Extended types with offline metadata
export interface OfflineTask extends Task {
  _isOfflineCreated?: boolean;
  _syncStatus?: 'pending' | 'synced';
}

export interface OfflineSiteUpdate extends SiteUpdate {
  _isOfflineCreated?: boolean;
  _syncStatus?: 'pending' | 'synced';
  photoBlobId?: string;
}

export interface OfflinePurchaseOrder extends PurchaseOrder {
  _isOfflineCreated?: boolean;
  _syncStatus?: 'pending' | 'synced';
}

export class ConstruxLocalDatabase extends Dexie {
  projects!: Table<Project, string>;
  tasks!: Table<OfflineTask, string>;
  materials!: Table<Material, string>;
  orders!: Table<OfflinePurchaseOrder, string>;
  siteUpdates!: Table<OfflineSiteUpdate, string>;
  photos!: Table<PhotoRecord, string>;
  outbox!: Table<OutboxEntry, string>;
  syncMeta!: Table<SyncMeta, string>;
  syncLogs!: Table<SyncLogEntry, string>;
  issues!: Table<SiteIssue, string>;

  constructor() {
    super('ConstruxOfflineDB');
    this.version(1).stores({
      projects: 'id, code, name, status, updatedAt',
      tasks: 'id, projectId, status, assignedTo, dueDate, category, _syncStatus',
      materials: 'id, projectId, name, status, currentStock',
      orders: 'id, poNumber, projectId, materialId, supplierId, status, orderedAt, _syncStatus',
      siteUpdates: 'id, projectId, author, timestamp, verified, _syncStatus',
      photos: 'id, updateId, createdAt',
      outbox: 'id, type, status, createdAt, retries',
      syncMeta: 'key, updatedAt',
      syncLogs: 'id, timestamp, level',
      issues: 'id, projectId, severity, status, createdAt, _syncStatus',
    });
  }
}

export const db = new ConstruxLocalDatabase();

// Compress client-side photos to max 1280px, JPEG ~0.7 before IndexedDB storage
export async function compressImage(
  fileOrBlob: File | Blob,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.7
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression blob conversion failed'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blob,
              dataUrl: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

// Seed local database cache with initial data from backend/mock
export async function seedLocalDataIfEmpty(
  projects: Project[],
  tasks: Task[],
  materials: Material[],
  orders: PurchaseOrder[],
  siteUpdates: SiteUpdate[]
) {
  try {
    const projCount = await db.projects.count();
    if (projCount === 0 && projects.length > 0) {
      await db.projects.bulkPut(projects);
      console.log('[IndexedDB] Cached projects seeded');
    }

    const taskCount = await db.tasks.count();
    if (taskCount === 0 && tasks.length > 0) {
      await db.tasks.bulkPut(tasks.map((t) => ({ ...t, _syncStatus: 'synced' })));
      console.log('[IndexedDB] Cached tasks seeded');
    }

    const matCount = await db.materials.count();
    if (matCount === 0 && materials.length > 0) {
      await db.materials.bulkPut(materials);
      console.log('[IndexedDB] Cached materials seeded');
    }

    const orderCount = await db.orders.count();
    if (orderCount === 0 && orders.length > 0) {
      await db.orders.bulkPut(orders.map((o) => ({ ...o, _syncStatus: 'synced' })));
      console.log('[IndexedDB] Cached orders seeded');
    }

    const updateCount = await db.siteUpdates.count();
    if (updateCount === 0 && siteUpdates.length > 0) {
      await db.siteUpdates.bulkPut(siteUpdates.map((u) => ({ ...u, _syncStatus: 'synced' })));
      console.log('[IndexedDB] Cached site updates seeded');
    }
  } catch (err) {
    console.warn('[IndexedDB] Seeding error:', err);
  }
}
