import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SyncStatusBadgeProps {
  status?: 'pending' | 'synced';
  isOfflineCreated?: boolean;
  className?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  isOfflineCreated,
  className = '',
}) => {
  if (!status && !isOfflineCreated) return null;

  if (status === 'pending') {
    return (
      <span
        title="Pending synchronization — saved safely to IndexedDB on device"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="inline-block"
        >
          <Clock className="w-3 h-3 text-amber-400" />
        </motion.span>
        <span>Pending sync</span>
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      title="Synchronized with cloud server"
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${className}`}
    >
      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      <span>Synced</span>
    </motion.span>
  );
};
