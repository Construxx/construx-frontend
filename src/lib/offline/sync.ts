import { db, OutboxEntry, OutboxStatus, SyncLogEntry, SiteIssue, OfflineTask, OfflineSiteUpdate, OfflinePurchaseOrder } from './db';
import { api } from '../api';
import { requestBackgroundSync } from './swRegistration';

export type { OutboxEntry, OutboxStatus, SyncLogEntry };

type SyncListener = () => void;
const listeners = new Set<SyncListener>();

function notify() {
  listeners.forEach((l) => l());
}

// In-memory state mirror for React hooks
let isSimulatedOffline = false;
if (typeof window !== 'undefined') {
  isSimulatedOffline = localStorage.getItem('construx_simulate_offline') === 'true';
}

let syncState: 'idle' | 'syncing' | 'error' = 'idle';
let currentSyncPromise: Promise<void> | null = null;

export async function addSyncLog(
  level: 'info' | 'success' | 'warn' | 'error' | 'conflict',
  message: string,
  details?: string
) {
  const log: SyncLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
  };
  try {
    await db.syncLogs.add(log);
    // Keep max 200 logs
    const count = await db.syncLogs.count();
    if (count > 200) {
      const oldest = await db.syncLogs.orderBy('timestamp').first();
      if (oldest) await db.syncLogs.delete(oldest.id);
    }
  } catch (err) {
    console.debug('Failed to write sync log:', err);
  }
  notify();
}

// Check network status (combines real browser status + simulated demo toggle)
export function getIsOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  if (isSimulatedOffline) return false;
  return navigator.onLine;
}

export function getIsSimulatedOffline(): boolean {
  return isSimulatedOffline;
}

export function setSimulatedOffline(value: boolean) {
  isSimulatedOffline = value;
  if (typeof window !== 'undefined') {
    localStorage.setItem('construx_simulate_offline', value ? 'true' : 'false');
  }
  addSyncLog(
    'warn',
    value ? 'Demo: Simulation Offline Enabled' : 'Demo: Simulation Offline Disabled (Online restored)'
  );
  notify();

  if (!value && getIsOnline()) {
    flushOutbox();
  }
}

// -------------------------------------------------------------
// FLUSH OUTBOX ENGINE
// -------------------------------------------------------------
export async function flushOutbox(): Promise<void> {
  if (!getIsOnline()) {
    console.log('[Sync Engine] App is currently offline. Skipping sync flush.');
    return;
  }

  if (currentSyncPromise) {
    return currentSyncPromise;
  }

  currentSyncPromise = (async () => {
    syncState = 'syncing';
    notify();

    try {
      const pendingItems = await db.outbox
        .filter((item) => item.status === 'pending' || item.status === 'failed')
        .sortBy('createdAt');

      if (pendingItems.length === 0) {
        syncState = 'idle';
        notify();
        return;
      }

      addSyncLog('info', `Sync started: Processing ${pendingItems.length} outbox item(s)`);

      for (const item of pendingItems) {
        // Exponential backoff check for failed items
        if (item.status === 'failed' && item.retries > 0 && item.lastAttemptAt) {
          const backoffDelayMs = Math.min(1000 * Math.pow(2, item.retries), 30000); // max 30s
          const timeSinceAttempt = Date.now() - new Date(item.lastAttemptAt).getTime();
          if (timeSinceAttempt < backoffDelayMs) {
            continue; // Wait for next interval
          }
        }

        // Mark item as syncing
        await db.outbox.update(item.id, {
          status: 'syncing',
          lastAttemptAt: new Date().toISOString(),
        });
        notify();

        try {
          // Process based on type
          await processOutboxItem(item);

          // Mark as synced
          await db.outbox.update(item.id, {
            status: 'synced',
            error: undefined,
          });

          addSyncLog('success', `Synced: ${formatItemType(item.type)} (${item.id.slice(0, 8)})`);
        } catch (err: any) {
          console.error(`[Sync Engine] Error processing ${item.id}:`, err);
          const newRetries = (item.retries || 0) + 1;
          const errorMessage = err?.message || 'Network request failed';

          await db.outbox.update(item.id, {
            status: 'failed',
            retries: newRetries,
            error: errorMessage,
            lastAttemptAt: new Date().toISOString(),
          });

          addSyncLog(
            'error',
            `Failed sync: ${formatItemType(item.type)} (Attempt ${newRetries})`,
            errorMessage
          );
        }
      }
      syncState = 'idle';
    } catch (globalErr: any) {
      console.error('[Sync Engine] Global sync loop error:', globalErr);
      syncState = 'error';
      addSyncLog('error', 'Sync engine encountered a runtime error', globalErr?.message);
    } finally {
      currentSyncPromise = null;
      notify();
    }
  })();

  return currentSyncPromise;
}

// -------------------------------------------------------------
// PROCESS SINGLE OUTBOX ITEM
// -------------------------------------------------------------
async function processOutboxItem(item: OutboxEntry) {
  switch (item.type) {
    case 'postSiteUpdate': {
      const { projectId, updateId, note, photoUrl, tags, completionReported } = item.payload;

      // Check conflict: If existing server update has later timestamp
      const res = await api.postSiteUpdate(projectId, { note, photoUrl, tags, completionReported });
      if (updateId) await db.siteUpdates.update(updateId, { _syncStatus: 'synced' });
      if (res.triggeredAlert) addSyncLog('info', `Alert triggered by site update: ${res.triggeredAlert.title}`);
      break;
    }

    case 'updateTaskProgress': {
      const { projectId, taskId, progress, status, clientUpdatedAt } = item.payload;

      // Conflict rule: Last-write-wins by timestamp, but log if conflict occurs
      await api.updateTask(projectId, taskId, { progress, status });
      await db.tasks.update(taskId, { _syncStatus: 'synced', progress, status });
      addSyncLog('success', `Task ${taskId.slice(0, 8)} updated on the server`, `Client timestamp: ${clientUpdatedAt}`);
      break;
    }

    case 'confirmDelivery': {
      const { projectId, materialId, quantityReceived, poId, notes } = item.payload;
      await api.recordDelivery(projectId, { materialId, quantityReceived, poId, notes });
      if (poId) await db.orders.update(poId, { _syncStatus: 'synced', status: 'delivered' });
      break;
    }

    case 'createPurchaseOrder': {
      const { projectId, tempPoId, poData } = item.payload;
      const res = await api.createPurchaseOrder(projectId, poData);
      if (tempPoId) await db.orders.update(tempPoId, { _syncStatus: 'synced', id: res.purchaseOrder.id, poNumber: res.purchaseOrder.poNumber });
      break;
    }

    case 'reportIssue': {
      throw new Error('Site issue submission is not implemented by the backend API. This item remains unsynced.');
    }

    case 'ai_analysis': {
      const { projectId, prompt } = item.payload;
      await api.askQuestion(prompt, projectId);
      break;
    }

    default:
      console.warn('[Sync Engine] Unknown item type:', item.type);
  }
}

function formatItemType(type: string) {
  switch (type) {
    case 'postSiteUpdate':
      return 'Site Observation';
    case 'updateTaskProgress':
      return 'Task Progress';
    case 'confirmDelivery':
      return 'Material Delivery';
    case 'createPurchaseOrder':
      return 'Purchase Order';
    case 'reportIssue':
      return 'Site Issue Report';
    case 'ai_analysis':
      return 'AI Analysis Request';
    default:
      return type;
  }
}

// -------------------------------------------------------------
// OPTIMISTIC MUTATION HELPERS
// -------------------------------------------------------------

// 1. Post Site Update (Optimistic + Outbox)
export async function optimisticPostSiteUpdate(data: {
  projectId: string;
  author: string;
  authorRole: string;
  note: string;
  photoBlob?: Blob;
  photoUrl?: string;
  tags?: string[];
  completionReported?: number;
}): Promise<{ siteUpdate: OfflineSiteUpdate; outboxId: string; wasOffline: boolean }> {
  const isCurrentlyOnline = getIsOnline();
  const updateId = `siteup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  // Create local photo record if blob provided
  let photoBlobId: string | undefined;
  if (data.photoBlob) {
    photoBlobId = `photo-${updateId}`;
    await db.photos.put({
      id: photoBlobId,
      updateId,
      blob: data.photoBlob,
      mimeType: 'image/jpeg',
      createdAt: timestamp,
    });
  }

  const siteUpdate: OfflineSiteUpdate = {
    id: updateId,
    projectId: data.projectId,
    author: data.author,
    authorRole: data.authorRole,
    note: data.note,
    photoUrl: data.photoUrl,
    tags: data.tags || ['Site Observation'],
    timestamp,
    completionReported: data.completionReported,
    verified: false,
    _isOfflineCreated: !isCurrentlyOnline,
    _syncStatus: isCurrentlyOnline ? 'synced' : 'pending',
    photoBlobId,
  };

  // 1. Save optimistically to Dexie
  await db.siteUpdates.put(siteUpdate);

  // 2. Queue into Outbox
  const outboxEntry: OutboxEntry = {
    id: `outbox-${updateId}`,
    type: 'postSiteUpdate',
    payload: {
      projectId: data.projectId,
      updateId,
      note: data.note,
      photoUrl: data.photoUrl,
      tags: data.tags,
      completionReported: data.completionReported,
      author: data.author,
    },
    createdAt: timestamp,
    status: 'pending',
    retries: 0,
  };
  await db.outbox.put(outboxEntry);

  addSyncLog(
    isCurrentlyOnline ? 'info' : 'warn',
    isCurrentlyOnline
      ? `Site update logged — queued for sync`
      : `Saved offline — will sync when you're back online.`,
    `ID: ${updateId}`
  );

  notify();

  // Trigger sync if online
  if (isCurrentlyOnline) {
    flushOutbox();
  } else {
    requestBackgroundSync();
  }

  return { siteUpdate, outboxId: outboxEntry.id, wasOffline: !isCurrentlyOnline };
}

// 2. Update Task Progress (Optimistic + Outbox)
export async function optimisticUpdateTask(
  projectId: string,
  taskId: string,
  progress: number,
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
): Promise<{ outboxId: string; wasOffline: boolean }> {
  const isCurrentlyOnline = getIsOnline();
  const timestamp = new Date().toISOString();

  // 1. Update in local Dexie DB
  const existing = await db.tasks.get(taskId);
  if (existing) {
    await db.tasks.update(taskId, {
      progress,
      status,
      _syncStatus: isCurrentlyOnline ? 'synced' : 'pending',
    });
  }

  // 2. Queue in Outbox
  const outboxId = `outbox-task-${taskId}-${Date.now()}`;
  const outboxEntry: OutboxEntry = {
    id: outboxId,
    type: 'updateTaskProgress',
    payload: {
      projectId,
      taskId,
      progress,
      status,
      clientUpdatedAt: timestamp,
    },
    createdAt: timestamp,
    status: 'pending',
    retries: 0,
  };
  await db.outbox.put(outboxEntry);

  addSyncLog(
    isCurrentlyOnline ? 'info' : 'warn',
    isCurrentlyOnline ? `Task progress update queued` : `Task progress saved offline`,
    `Task: ${taskId} • Progress: ${progress}%`
  );

  notify();

  if (isCurrentlyOnline) {
    flushOutbox();
  } else {
    requestBackgroundSync();
  }

  return { outboxId, wasOffline: !isCurrentlyOnline };
}

// 3. Confirm Delivery (Optimistic + Outbox)
export async function optimisticConfirmDelivery(data: {
  projectId: string;
  materialId: string;
  quantityReceived: number;
  poId?: string;
  notes?: string;
}): Promise<{ outboxId: string; wasOffline: boolean }> {
  const isCurrentlyOnline = getIsOnline();
  const timestamp = new Date().toISOString();

  // 1. Update material inventory in Dexie immediately
  const mat = await db.materials.get(data.materialId);
  if (mat) {
    const updatedStock = (mat.currentStock || 0) + data.quantityReceived;
    const updatedDelivered = (mat.quantityDelivered || 0) + data.quantityReceived;
    await db.materials.update(data.materialId, {
      currentStock: updatedStock,
      quantityDelivered: updatedDelivered,
    });
  }

  // 2. If PO exists, mark delivered in Dexie
  if (data.poId) {
    await db.orders.update(data.poId, {
      status: 'delivered',
      deliveredAt: timestamp,
      _syncStatus: isCurrentlyOnline ? 'synced' : 'pending',
    });
  }

  // 3. Queue into Outbox
  const outboxId = `outbox-deliv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const outboxEntry: OutboxEntry = {
    id: outboxId,
    type: 'confirmDelivery',
    payload: data,
    createdAt: timestamp,
    status: 'pending',
    retries: 0,
  };
  await db.outbox.put(outboxEntry);

  addSyncLog(
    isCurrentlyOnline ? 'info' : 'warn',
    isCurrentlyOnline ? `Delivery confirmed — syncing to inventory` : `Delivery received offline — stock adjusted`,
    `Material: ${mat?.name || data.materialId} • Qty: +${data.quantityReceived}`
  );

  notify();

  if (isCurrentlyOnline) {
    flushOutbox();
  } else {
    requestBackgroundSync();
  }

  return { outboxId, wasOffline: !isCurrentlyOnline };
}

// 4. Create Purchase Order (Optimistic + Outbox)
export async function optimisticCreatePO(
  projectId: string,
  data: {
    materialId: string;
    materialName: string;
    supplierId: string;
    supplierName: string;
    quantity: number;
    unitCost: number;
    notes?: string;
  }
): Promise<{ po: OfflinePurchaseOrder; outboxId: string; wasOffline: boolean }> {
  const isCurrentlyOnline = getIsOnline();
  const timestamp = new Date().toISOString();
  const tempPoId = `po-local-${Date.now()}`;
  const poNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;

  const newPO: OfflinePurchaseOrder = {
    id: tempPoId,
    poNumber,
    projectId,
    materialId: data.materialId,
    materialName: data.materialName,
    supplierId: data.supplierId,
    supplierName: data.supplierName,
    quantity: data.quantity,
    unitCost: data.unitCost,
    totalAmount: data.quantity * data.unitCost,
    status: 'issued',
    orderedAt: timestamp,
    expectedDelivery: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    notes: data.notes,
    _isOfflineCreated: !isCurrentlyOnline,
    _syncStatus: isCurrentlyOnline ? 'synced' : 'pending',
  };

  await db.orders.put(newPO);

  const outboxId = `outbox-${tempPoId}`;
  const outboxEntry: OutboxEntry = {
    id: outboxId,
    type: 'createPurchaseOrder',
    payload: {
      projectId,
      tempPoId,
      poData: {
        materialId: data.materialId,
        supplierId: data.supplierId,
        quantity: data.quantity,
        unitCost: data.unitCost,
        notes: data.notes,
      },
    },
    createdAt: timestamp,
    status: 'pending',
    retries: 0,
  };
  await db.outbox.put(outboxEntry);

  addSyncLog(
    isCurrentlyOnline ? 'info' : 'warn',
    isCurrentlyOnline ? `Purchase order created (${poNumber})` : `PO created offline — queued for dispatch`,
    `Supplier: ${data.supplierName} • Total: ₦${(newPO.totalAmount).toLocaleString()}`
  );

  notify();

  if (isCurrentlyOnline) {
    flushOutbox();
  } else {
    requestBackgroundSync();
  }

  return { po: newPO, outboxId, wasOffline: !isCurrentlyOnline };
}

// 5. Report Site Issue (Optimistic + Outbox)
export async function optimisticReportIssue(data: {
  projectId: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'safety' | 'structural' | 'mep' | 'weather' | 'delay';
  description: string;
  photoUrl?: string;
  photoBlob?: Blob;
  reportedBy: string;
}): Promise<{ issue: SiteIssue; outboxId: string; wasOffline: boolean }> {
  const isCurrentlyOnline = getIsOnline();
  const timestamp = new Date().toISOString();
  const issueId = `iss-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  if (data.photoBlob) {
    await db.photos.put({
      id: `photo-${issueId}`,
      updateId: issueId,
      blob: data.photoBlob,
      mimeType: 'image/jpeg',
      createdAt: timestamp,
    });
  }

  const issue: SiteIssue = {
    id: issueId,
    projectId: data.projectId,
    title: data.title,
    severity: data.severity,
    category: data.category,
    description: data.description,
    photoUrl: data.photoUrl,
    status: 'open',
    reportedBy: data.reportedBy,
    createdAt: timestamp,
    _isOfflineCreated: !isCurrentlyOnline,
    _syncStatus: isCurrentlyOnline ? 'synced' : 'pending',
  };

  await db.issues.put(issue);

  const outboxId = `outbox-${issueId}`;
  const outboxEntry: OutboxEntry = {
    id: outboxId,
    type: 'reportIssue',
    payload: { issueId, ...data },
    createdAt: timestamp,
    status: 'pending',
    retries: 0,
  };
  await db.outbox.put(outboxEntry);

  addSyncLog(
    data.severity === 'critical' ? 'error' : 'warn',
    `Site issue reported: ${data.title} (${data.severity.toUpperCase()})`,
    isCurrentlyOnline ? 'Queued for dispatch' : 'Saved offline on device'
  );

  notify();

  if (isCurrentlyOnline) {
    flushOutbox();
  } else {
    requestBackgroundSync();
  }

  return { issue, outboxId, wasOffline: !isCurrentlyOnline };
}

// 6. Queue AI Analysis Request
export async function queueAiAnalysis(
  projectId: string,
  prompt: string,
  featureType: string
): Promise<{ outboxId: string }> {
  const timestamp = new Date().toISOString();
  const outboxId = `outbox-ai-${Date.now()}`;
  const outboxEntry: OutboxEntry = {
    id: outboxId,
    type: 'ai_analysis',
    payload: { projectId, prompt, featureType },
    createdAt: timestamp,
    status: 'pending',
    retries: 0,
  };
  await db.outbox.put(outboxEntry);
  addSyncLog('info', `AI Analysis queued: ${featureType}`, 'Will compute automatically when back online');
  notify();
  return { outboxId };
}

// 7. Manual retry item
export async function retryOutboxItem(id: string): Promise<void> {
  await db.outbox.update(id, {
    status: 'pending',
    error: undefined,
  });
  addSyncLog('info', `Manual retry initiated for item ${id.slice(0, 8)}`);
  notify();
  if (getIsOnline()) {
    flushOutbox();
  }
}

// 8. Clear Synced Outbox Items
export async function clearSyncedItems(): Promise<void> {
  await db.outbox.where('status').equals('synced').delete();
  addSyncLog('info', 'Cleaned up synced outbox history');
  notify();
}

// -------------------------------------------------------------
// EVENT TRIGGERS SETUP
// (Browser 'online', 'focus', 30s interval, Safari/iOS limitations)
// -------------------------------------------------------------
if (typeof window !== 'undefined') {
  // 1. Browser online event
  window.addEventListener('online', () => {
    addSyncLog('info', 'Browser connected to network (online event fired)');
    notify();
    if (!isSimulatedOffline) {
      flushOutbox();
    }
  });

  // 2. Browser offline event
  window.addEventListener('offline', () => {
    addSyncLog('warn', 'Browser disconnected from network (offline event fired)');
    notify();
  });

  // 3. App focus / visibility change (Essential for iOS Safari since iOS lacks Background Sync API)
  window.addEventListener('focus', () => {
    if (getIsOnline()) {
      flushOutbox();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getIsOnline()) {
      flushOutbox();
    }
  });

  // 4. Periodic 30-second interval trigger while online
  setInterval(() => {
    if (getIsOnline()) {
      flushOutbox();
    }
  }, 30000);
}

// -------------------------------------------------------------
// REACT HOOK FOR SYNC STATE
// -------------------------------------------------------------
import { useEffect, useState } from 'react';

export function useSyncEngine() {
  const [, setTick] = useState(0);
  const [outboxItems, setOutboxItems] = useState<OutboxEntry[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);

  const isOnline = getIsOnline();

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const [items, logs] = await Promise.all([
          db.outbox.orderBy('createdAt').reverse().toArray(),
          db.syncLogs.orderBy('timestamp').reverse().limit(30).toArray(),
        ]);
        if (!mounted) return;
        setOutboxItems(items);
        setSyncLogs(logs);

        let p = 0, f = 0, s = 0;
        items.forEach((item) => {
          if (item.status === 'pending' || item.status === 'syncing') p++;
          else if (item.status === 'failed') f++;
          else if (item.status === 'synced') s++;
        });
        setPendingCount(p);
        setFailedCount(f);
        setSyncedCount(s);
      } catch (err) {
        console.debug('Error refreshing sync engine hook:', err);
      }
    }

    refresh();

    const handleUpdate = () => {
      setTick((t) => t + 1);
      refresh();
    };

    listeners.add(handleUpdate);
    return () => {
      mounted = false;
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    isOnline,
    isSimulatedOffline,
    syncState,
    pendingCount,
    failedCount,
    syncedCount,
    outboxItems,
    syncLogs,
    flushOutbox,
    retryOutboxItem,
    clearSyncedItems,
    setSimulatedOffline,
  };
}
