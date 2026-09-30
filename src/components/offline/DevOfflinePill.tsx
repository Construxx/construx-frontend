import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSyncEngine } from '../../lib/offline/sync';

export const DevOfflinePill: React.FC<{ onOpenSyncCenter: () => void }> = ({ onOpenSyncCenter }) => {
  const { isSimulatedOffline, isOnline, syncState, pendingCount, setSimulatedOffline, flushOutbox } =
    useSyncEngine();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if ?demo=1 or demo flag in URL or localStorage
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1' || isSimulatedOffline) {
      setIsVisible(true);
    }
  }, [isSimulatedOffline]);

  if (!isVisible && !isSimulatedOffline) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <motion.div
        layout
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`flex items-center gap-2 p-1.5 pl-3 rounded-full shadow-2xl border backdrop-blur-md transition-all ${
          isSimulatedOffline
            ? 'bg-amber-950/90 border-amber-500/60 text-amber-200 shadow-amber-950/50'
            : 'bg-[#121821]/90 border-slate-700 text-slate-300 shadow-black/60'
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {isSimulatedOffline ? (
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="font-semibold text-[11px]">
            {isSimulatedOffline ? 'SIMULATED OFFLINE' : 'DEV MODE'}
          </span>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => {
            const next = !isSimulatedOffline;
            setSimulatedOffline(next);
            if (!next) {
              flushOutbox();
            }
          }}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
            isSimulatedOffline
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
        >
          {isSimulatedOffline ? 'Go Online' : 'Force Offline'}
        </button>

        {/* Quick Sync Center button */}
        <button
          onClick={onOpenSyncCenter}
          className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          title="Open Sync Center"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Sync Animation indicator if sync active */}
        <AnimatePresence>
          {syncState === 'syncing' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              exit={{ scale: 0 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-blue-400 pr-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
