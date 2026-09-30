import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Trash2,
  Database,
  ArrowRight,
  Info,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSyncEngine, OutboxEntry, SyncLogEntry } from '../../lib/offline/sync';

interface SyncCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncCenterDrawer: React.FC<SyncCenterDrawerProps> = ({ isOpen, onClose }) => {
  const {
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
  } = useSyncEngine();

  const [activeTab, setActiveTab] = useState<'outbox' | 'logs'>('outbox');
  const [filter, setFilter] = useState<'all' | 'pending' | 'failed' | 'synced'>('all');

  if (!isOpen) return null;

  const filteredItems = outboxItems.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.status === 'pending' || item.status === 'syncing';
    return item.status === filter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="w-full max-w-md bg-[#0B0F14] border-l border-[#232C3B] h-full flex flex-col shadow-2xl text-slate-100">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#232C3B] bg-[#121821]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Sync Center</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  IndexedDB
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs">
                {isOnline ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <Wifi className="w-3 h-3" /> Online (Cloud Connected)
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <WifiOff className="w-3 h-3" /> Offline (Local Storage Active)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DEMO SWITCH: Simulate Offline Toggle Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="pr-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulate Offline Mode (Demo Switch)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Test jobsite offline behavior on stage without disconnecting WiFi.
              </p>
            </div>
            <button
              onClick={() => setSimulatedOffline(!isSimulatedOffline)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isSimulatedOffline ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                  isSimulatedOffline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sync Action & Summary Strip */}
        <div className="px-4 py-3 bg-[#121821] border-b border-[#232C3B] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 font-mono">
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingCount} Pending</span>
            </span>
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{failedCount} Failed</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{syncedCount} Synced</span>
            </span>
          </div>

          <button
            onClick={() => flushOutbox()}
            disabled={syncState === 'syncing' || !isOnline || pendingCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
              syncState === 'syncing'
                ? 'bg-blue-600 text-white cursor-wait opacity-80'
                : !isOnline
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : pendingCount === 0
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${syncState === 'syncing' ? 'animate-spin' : ''}`}
            />
            <span>{syncState === 'syncing' ? 'Syncing…' : 'Sync Now'}</span>
          </button>
        </div>

        {/* Tabs: Outbox Queue vs. Sync Log */}
        <div className="flex border-b border-[#232C3B] bg-[#0B0F14] px-4 pt-2">
          <button
            onClick={() => setActiveTab('outbox')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'outbox'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Outbox Queue ({outboxItems.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sync Log & Conflicts ({syncLogs.length})
          </button>
        </div>

        {/* Tab 1: Outbox Queue */}
        {activeTab === 'outbox' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter pills */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#121821]/50 border-b border-[#232C3B] text-[11px]">
              <div className="flex items-center gap-1">
                {(['all', 'pending', 'failed', 'synced'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-0.5 rounded-lg capitalize transition-colors ${
                      filter === f
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {syncedCount > 0 && (
                <button
                  onClick={clearSyncedItems}
                  className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                  title="Clear synced records from local list"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear synced</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p>No outbox items in this view.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Jobsite actions logged offline will queue here automatically.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <OutboxCard key={item.id} item={item} onRetry={() => retryOutboxItem(item.id)} />
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Sync Log & Conflicts */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
            {syncLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No sync activity logged yet.</p>
              </div>
            ) : (
              syncLogs.map((log) => <SyncLogCard key={log.id} log={log} />)
            )}
          </div>
        )}

        {/* Drawer Footer with iOS / Background sync note */}
        <div className="p-3 bg-[#121821] border-t border-[#232C3B] text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Online + on-focus triggers active</span>
          </span>
          <span className="text-[10px] text-slate-600">iOS Safari & PWA Compliant</span>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Outbox Card
const OutboxCard: React.FC<{ item: OutboxEntry; onRetry: () => void }> = ({ item, onRetry }) => {
  const getBadge = () => {
    switch (item.status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Synced</span>
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Syncing…</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed ({item.retries} retries)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Pending Sync</span>
          </span>
        );
    }
  };

  const getTitle = () => {
    switch (item.type) {
      case 'postSiteUpdate':
        return 'Site Observation Note';
      case 'updateTaskProgress':
        return `Task Progress: ${item.payload?.progress}%`;
      case 'confirmDelivery':
        return `Delivery Received: +${item.payload?.quantityReceived}`;
      case 'createPurchaseOrder':
        return `Purchase Order: ${item.payload?.poData?.quantity} units`;
      case 'reportIssue':
        return `Site Issue: ${item.payload?.title || 'Defect'}`;
      case 'ai_analysis':
        return 'AI Analysis Request (Queued)';
      default:
        return item.type;
    }
  };

  return (
    <div className="bg-[#121821] border border-[#232C3B] rounded-xl p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-200">{getTitle()}</span>
        {getBadge()}
      </div>

      <div className="text-[11px] text-slate-400 line-clamp-2">
        {item.payload?.note ||
          item.payload?.description ||
          item.payload?.notes ||
          `Action payload: ${JSON.stringify(item.payload).slice(0, 80)}...`}
      </div>

      {item.error && (
        <div className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[10px]">
          Error: {item.error}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-[#232C3B]/60 text-[10px] font-mono text-slate-500">
        <span>{new Date(item.createdAt).toLocaleTimeString()}</span>

        {item.status === 'failed' && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry Now</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Sub-component: Sync Log Card
const SyncLogCard: React.FC<{ log: SyncLogEntry }> = ({ log }) => {
  const getLevelStyle = () => {
    switch (log.level) {
      case 'success':
        return 'border-l-emerald-500 text-emerald-300';
      case 'error':
        return 'border-l-rose-500 text-rose-300';
      case 'warn':
        return 'border-l-amber-500 text-amber-300';
      case 'conflict':
        return 'border-l-purple-500 text-purple-300';
      default:
        return 'border-l-blue-500 text-blue-300';
    }
  };

  return (
    <div className={`bg-[#121821] border border-[#232C3B] border-l-4 rounded-lg p-2.5 ${getLevelStyle()}`}>
      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
        <span className="uppercase font-bold tracking-wider">{log.level}</span>
        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
      </div>
      <div className="text-slate-200 text-xs font-sans">{log.message}</div>
      {log.details && (
        <div className="text-[11px] text-slate-400 mt-1 font-mono break-all">{log.details}</div>
      )}
    </div>
  );
};
