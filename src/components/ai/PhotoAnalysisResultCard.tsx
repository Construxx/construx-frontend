import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
  Eye,
  Check,
  X,
  FileWarning,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoAnalysisResponse, SafetyFlag } from '../../lib/ai/schemas';
import { AIResultBadge } from './AIResultBadge';

interface PhotoAnalysisResultCardProps {
  response: PhotoAnalysisResponse;
  reportedProgress?: number;
  onApplyProgress: (progress: number) => void;
  onCreateSafetyIssue: (flag: SafetyFlag) => void;
  onDismiss: () => void;
  isApplying?: boolean;
}

export const PhotoAnalysisResultCard: React.FC<PhotoAnalysisResultCardProps> = ({
  response,
  reportedProgress,
  onApplyProgress,
  onCreateSafetyIssue,
  onDismiss,
  isApplying = false,
}) => {
  const [showWhy, setShowWhy] = useState(false);
  const [applied, setApplied] = useState(false);
  const [createdFlagIndex, setCreatedFlagIndex] = useState<number | null>(null);

  const { result, source, model, latencyMs, why } = response;
  const estimated = result.estimatedProgressPercent;
  const reported = reportedProgress ?? 40;
  const difference = Math.abs(estimated - reported);
  const isMismatch = difference > 15;

  const confidenceBadgeColor =
    result.confidence === 'high'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : result.confidence === 'medium'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : 'bg-red-500/15 text-red-400 border-red-500/30';

  const handleApply = () => {
    onApplyProgress(estimated);
    setApplied(true);
  };

  const handleCreateIssue = (flag: SafetyFlag, index: number) => {
    onCreateSafetyIssue(flag);
    setCreatedFlagIndex(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#0e141d] border-2 border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4 my-4 relative overflow-hidden"
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232C3B] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-wide">
                Site Supervisor Visual Audit
              </h4>
              <AIResultBadge source={source} model={model} latencyMs={latencyMs} />
            </div>
            <p className="text-[11px] text-slate-400">
              Automated physical progress verification & safety inspection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Confidence Tag */}
          <span
            className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${confidenceBadgeColor}`}
          >
            Confidence: {result.confidence}
          </span>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Dismiss analysis"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Visual Estimate Card */}
        <div className="p-3.5 rounded-xl bg-[#090D12] border border-[#232C3B] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">AI Visual Estimate</span>
            <span className="text-lg font-black font-mono text-amber-400">{estimated}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${estimated}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {result.progressRationale}
          </p>
        </div>

        {/* Reported Benchmark vs Comparison */}
        <div className="p-3.5 rounded-xl bg-[#090D12] border border-[#232C3B] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">Reported Site Progress</span>
            <span className="text-lg font-black font-mono text-slate-200">{reported}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${reported}%` }}
            />
          </div>

          {/* Mismatch Warning Alert */}
          {isMismatch ? (
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-[11px] flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Progress Mismatch Detected ({difference}% difference vs. field report).
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Progress matches reported milestone within normal visual tolerance (±{difference}%).</span>
            </div>
          )}
        </div>
      </div>

      {/* Work Visible Description */}
      <div className="p-3 rounded-xl bg-[#090D12] border border-[#232C3B] space-y-1">
        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
          Visible Construction Elements
        </span>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {result.workVisible}
        </p>
      </div>

      {/* Safety Flags Section */}
      {result.safetyFlags && result.safetyFlags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Safety & Compliance Flags ({result.safetyFlags.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.safetyFlags.map((flag, idx) => {
              const isHigh = flag.severity === 'high';
              const isIssueCreated = createdFlagIndex === idx;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-colors ${
                    isHigh
                      ? 'bg-red-950/30 border-red-500/40 text-red-200'
                      : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase font-black px-1.5 py-0.5 rounded bg-black/40 border border-current">
                        {flag.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase">
                        {flag.severity} risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-snug">
                      {flag.note}
                    </p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCreateIssue(flag, idx)}
                      disabled={isIssueCreated}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                        isIssueCreated
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-red-600/80 hover:bg-red-500 text-white shadow'
                      }`}
                    >
                      {isIssueCreated ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Issue Logged</span>
                        </>
                      ) : (
                        <>
                          <FileWarning className="w-3 h-3" />
                          <span>Create Safety Issue</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quality Observations & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {result.qualityObservations && result.qualityObservations.length > 0 && (
          <div className="p-3 rounded-xl bg-[#090D12] border border-[#232C3B] space-y-1.5">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
              Quality & Workmanship Notes
            </span>
            <ul className="space-y-1 text-slate-300">
              {result.qualityObservations.map((obs, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-tight">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.limitations && (
          <div className="p-3 rounded-xl bg-[#090D12] border border-[#232C3B] space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Optical & Angle Limitations
            </span>
            <p className="text-slate-400 italic text-[11px] leading-relaxed">
              "{result.limitations}"
            </p>
          </div>
        )}
      </div>

      {/* "Why?" Expander */}
      <div className="border-t border-[#232C3B] pt-2.5">
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="text-xs font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Why this recommendation? (Inputs & Methodology)</span>
          {showWhy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {showWhy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2.5 p-3 rounded-xl bg-[#090D12] border border-[#232C3B] text-[11px] font-mono text-slate-400 space-y-1.5 overflow-hidden"
            >
              <div className="font-semibold text-slate-300">Inputs Used:</div>
              <ul className="space-y-0.5 pl-3 list-disc">
                {(why?.inputsUsed || [
                  'Compressed JPEG jobsite image (<= 1280px)',
                  'Active task schedule and reported percentage',
                  'Construction stage constraints',
                ]).map((inp, idx) => (
                  <li key={idx}>{inp}</li>
                ))}
              </ul>
              <div className="pt-1 text-[10px] text-slate-500">
                Inference Engine: {model || 'Claude Sonnet'} • Latency: {latencyMs}ms • Human verification required.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Human-Confirm Action Bar */}
      <div className="border-t border-[#232C3B] pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 italic">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>AI visual estimate — verify on site.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
          >
            Dismiss
          </button>

          <button
            onClick={handleApply}
            disabled={applied || isApplying}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
              applied
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {applied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Estimate Applied ({estimated}%)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Apply Progress Estimate ({estimated}%)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
