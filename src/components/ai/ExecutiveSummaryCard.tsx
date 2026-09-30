import React, { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';
import { ExecutiveSummary } from '../../types';

interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummary | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  summary,
  onRefresh,
  isLoading,
}) => {
  if (!summary) return null;

  const isHealthy = summary.overallHealth === 'HEALTHY';
  const isCaution = summary.overallHealth === 'CAUTION';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Executive Health Briefing
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  isHealthy
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : isCaution
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}
              >
                STATUS: {summary.overallHealth}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              AI synthesis of budget burn rate, schedule critical path, and supply chain readiness.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Regenerate Brief</span>
        </button>
      </div>

      {/* Main Plain-English Summary Text */}
      <div className="my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
        "{summary.summaryText}"
      </div>

      {/* 3 Metric Mini-Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Physical Completion</div>
          <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>{summary.completionRate}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Budget Absorption</div>
          <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
            {summary.budgetStatus}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Supply Chain Readiness</div>
          <div className="text-xs font-semibold text-cyan-300 mt-1 truncate">
            {summary.procurementStatus}
          </div>
        </div>
      </div>

      {/* Risks & Recommended Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 text-xs">
        <div>
          <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Identified Critical Exposures</span>
          </div>
          <ul className="space-y-1.5 text-slate-400">
            {summary.criticalRisks.map((risk, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span className="text-slate-300">{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Actionable Next Steps</span>
          </div>
          <ul className="space-y-1.5 text-slate-400">
            {summary.recommendedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-slate-300">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
