import React from 'react';
import { AlertTriangle, AlertCircle, Info, Sparkles, ArrowRight, Check } from 'lucide-react';
import { AIAlert } from '../../types';

interface AIAlertCardProps {
  alert: AIAlert;
  onAction?: (alert: AIAlert) => void;
  actionLabel?: string;
}

export const AIAlertCard: React.FC<AIAlertCardProps> = ({ alert, onAction, actionLabel }) => {
  const isCritical = alert.severity === 'critical';
  const isWarning = alert.severity === 'warning';

  return (
    <div
      className={`rounded-2xl border p-4.5 transition-all ${
        isCritical
          ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
          : isWarning
          ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
          : 'bg-cyan-950/20 border-cyan-500/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl mt-0.5 shrink-0 ${
              isCritical
                ? 'bg-rose-500/20 text-rose-400'
                : isWarning
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-cyan-500/20 text-cyan-400'
            }`}
          >
            {isCritical ? (
              <AlertTriangle className="w-4 h-4" />
            ) : isWarning ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                  isCritical
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : isWarning
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                }`}
              >
                ⚠ AI {alert.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white tracking-wide">{alert.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>

            {alert.recommendation && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-start gap-2 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-amber-200/90 font-medium">{alert.recommendation}</span>
              </div>
            )}
          </div>
        </div>

        {onAction && (
          <button
            onClick={() => onAction(alert)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
              isCritical
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : isWarning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            <span>{actionLabel || 'Apply AI Action'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
