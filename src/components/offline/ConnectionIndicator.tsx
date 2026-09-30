import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useSyncEngine } from '../../lib/offline/sync';

interface ConnectionIndicatorProps {
  onOpenSyncCenter: () => void;
  className?: string;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  onOpenSyncCenter,
  className = '',
}) => {
  const { isOnline, isSimulatedOffline, syncState, pendingCount, failedCount } = useSyncEngine();

  // 1. Syncing State (Blue animated)
  if (syncState === 'syncing' || (isOnline && pendingCount > 0 && syncState !== 'idle')) {
    return (
      <button
        onClick={onOpenSyncCenter}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-xs font-semibold shadow-sm transition-all ${className}`}
        title="Syncing pending changes with server..."
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
        </motion.div>
        <span className="font-mono text-[11px]">
          Syncing {pendingCount} {pendingCount === 1 ? 'change' : 'changes'}…
        </span>
      </button>
    );
  }

  // 2. Offline State (Amber)
  if (!isOnline) {
    return (
      <button
        onClick={onOpenSyncCenter}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-sm transition-all ${className}`}
        title={
          isSimulatedOffline
            ? 'Simulated Offline Mode — click to open Sync Center'
            : 'Device is offline — changes saved safely to device storage'
        }
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="hidden sm:inline">Offline — changes saved on device</span>
        <span className="sm:hidden font-mono text-[11px]">Offline</span>
        {pendingCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] font-mono">
            {pendingCount}
          </span>
        )}
      </button>
    );
  }

  // 3. Failed Item Warning
  if (failedCount > 0) {
    return (
      <button
        onClick={onOpenSyncCenter}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold shadow-sm transition-all ${className}`}
        title="Some offline changes failed to sync. Click to retry."
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        <span className="font-mono text-[11px]">{failedCount} sync failed</span>
      </button>
    );
  }

  // 4. Online State (Green)
  return (
    <button
      onClick={onOpenSyncCenter}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#121821] hover:bg-slate-800 border border-[#232C3B] hover:border-emerald-500/40 text-slate-300 text-xs font-medium transition-all ${className}`}
      title="Connected to cloud server. Click to open Sync Center."
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-emerald-400 font-semibold text-[11px]">Online</span>
      {pendingCount > 0 && (
        <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1 rounded border border-blue-500/30">
          {pendingCount}
        </span>
      )}
    </button>
  );
};
