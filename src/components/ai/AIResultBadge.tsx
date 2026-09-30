import React from 'react';
import { Sparkles, Cpu, Clock } from 'lucide-react';

interface AIResultBadgeProps {
  source: 'live' | 'fallback' | 'preliminary';
  model?: string;
  latencyMs?: number;
  className?: string;
}

export const AIResultBadge: React.FC<AIResultBadgeProps> = ({
  source,
  model,
  latencyMs,
  className = '',
}) => {
  if (source === 'live') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Live AI · {model || 'Claude'}</span>
        {latencyMs !== undefined && (
          <span className="text-amber-400/70 border-l border-amber-500/30 pl-1.5 flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {latencyMs}ms
          </span>
        )}
      </div>
    );
  }

  if (source === 'preliminary') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
        <Cpu className="w-3 h-3 text-yellow-400" />
        <span>Preliminary (offline) · Queued</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-800/80 text-slate-400 border border-slate-700 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
      <Cpu className="w-3 h-3 text-slate-400" />
      <span>Demo fallback</span>
      {latencyMs !== undefined && (
        <span className="text-slate-500 border-l border-slate-700 pl-1.5 flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          {latencyMs}ms
        </span>
      )}
    </div>
  );
};
