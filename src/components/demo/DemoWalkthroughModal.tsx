import React from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  HardHat,
  Sparkles,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface DemoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onExecuteStep: (stepNumber: number) => void;
  onResetDemo: () => void;
  isLoading: boolean;
  lastActionReport: string;
}

export const DEMO_STEPS = [
  {
    step: 1,
    title: 'Initialize Victoria Heights',
    pillar: 'Project OS',
    pillarColor: 'amber',
    badge: 'Project Setup',
    description: '12 floors commercial & luxury tower with ₦430M budget, starting at 68% progress with full subcontractor teams.',
    actionLabel: '1. Load Victoria Heights',
    expectedOutcome: 'Loads baseline project with ₦295M spent of ₦430M budget.',
  },
  {
    step: 2,
    title: 'Review Critical Path Schedule',
    pillar: 'Project OS',
    pillarColor: 'amber',
    badge: 'Tasks & Milestones',
    description: 'Inspect tasks: Structural Concrete (100% ✓), MEP Rough-in (100% ✓), and Electrical Installation & Armoured Cabling (40% In Progress).',
    actionLabel: '2. Review Critical Path Tasks',
    expectedOutcome: 'Highlights Task #3 on Level 4 as the active critical path bottleneck.',
  },
  {
    step: 3,
    title: 'Detect Material Deficit in Supply OS',
    pillar: 'Supply OS',
    pillarColor: 'cyan',
    badge: 'Procurement Alert',
    description: 'Switch to Supply OS: 4-Core 16mm² Armoured Cable requires 4,000m total, but on-site stock is only 600m (3,400m shortage).',
    actionLabel: '3. Inspect Cable Shortage Alert',
    expectedOutcome: 'Surfaces AI Procurement Alert highlighting the 3,400m inventory gap.',
  },
  {
    step: 4,
    title: '1-Click Issue PO to ABC Electrical Supplies',
    pillar: 'Supply OS',
    pillarColor: 'cyan',
    badge: 'Purchase Order',
    description: 'AI suggests preferred vendor ABC Electrical Supplies Ltd (Ikeja, 2-day lead time, ₦4,200/m). Issue expedited PO for 3,400m (₦14.28M).',
    actionLabel: '4. Issue Expedited PO (3,400m)',
    expectedOutcome: 'Creates PO-VH-2026-099-EXP with pre-filled AI parameters.',
  },
  {
    step: 5,
    title: 'Record Delivery & Update Live Inventory',
    pillar: 'Supply OS',
    pillarColor: 'cyan',
    badge: 'Live Handshake',
    description: 'Receive delivery on site: 3,400m logged into warehouse inventory. Stock jumps to 4,000m, and the procurement deficit alert auto-resolves!',
    actionLabel: '5. Accept Delivery & Update Stock',
    expectedOutcome: 'Warehouse stock reaches 4,000m; procurement alert clears.',
  },
  {
    step: 6,
    title: 'Site Engineer Posts Level 4 Field Log',
    pillar: 'Project OS',
    pillarColor: 'amber',
    badge: 'Field Progress',
    description: 'Engr. Babatunde posts site update: "Electrical installation on Level 4 is 40% complete. Containment and trunking ready for cable pulls." with site photo.',
    actionLabel: '6. Post Field Log (Level 4 Electrical)',
    expectedOutcome: 'Logs field inspection into live activity stream with photo attachment.',
  },
  {
    step: 7,
    title: 'AI Moment: Status Flips to "⚠ At Risk — 5 Days"',
    pillar: 'Project OS',
    pillarColor: 'amber',
    badge: 'AI Risk Engine',
    description: 'CONSTRUX AI schedule model correlates field log progress with milestone deadline and flips project status to "⚠ At Risk — 5 days behind schedule".',
    actionLabel: '7. Trigger Predictive AI Risk Evaluation',
    expectedOutcome: 'Project status badge changes to "⚠ At Risk" with actionable mitigation advice.',
  },
  {
    step: 8,
    title: 'Milestone Completion & Handover Trigger',
    pillar: 'BuildTwin',
    pillarColor: 'emerald',
    badge: 'Handover Milestone',
    description: 'Project reaches Phase 5 Handover. Click "Trigger Handover to BuildTwin": transforms Victoria Heights from a construction site into an active Digital Twin!',
    actionLabel: '8. Complete Handover to BuildTwin',
    expectedOutcome: 'Creates living Building record, mapping tasks & materials into operational twins.',
  },
  {
    step: 9,
    title: 'Inspect BuildTwin Floor 2 Room 204 & AI Alert',
    pillar: 'BuildTwin',
    pillarColor: 'emerald',
    badge: 'Living Digital Twin',
    description: 'Open Floor 2 -> Room 204 (MEP Substation): observe the Distribution Board DB-L4-01 and Daikin VRV AC Unit carried over from construction, plus AI Maintenance Alert!',
    actionLabel: '9. Inspect Room 204 Digital Twin',
    expectedOutcome: 'Demonstrates end-to-end data flow: Procurement -> Construction Task -> Operating Asset.',
  },
];

export const DemoWalkthroughModal: React.FC<DemoWalkthroughModalProps> = ({
  isOpen,
  onClose,
  currentStep,
  onExecuteStep,
  onResetDemo,
  isLoading,
  lastActionReport,
}) => {
  if (!isOpen) return null;

  const activeStepConfig = DEMO_STEPS.find((s) => s.step === currentStep) || DEMO_STEPS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  CONSTRUX Hackathon Demo Script
                </h2>
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
                  9-Step Storyline
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Execute the end-to-end continuous narrative from first construction task to digital twin operation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Feedback Toast Banner */}
        {lastActionReport && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-5 py-2.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-mono">{lastActionReport}</span>
            </div>
            <span className="text-[10px] uppercase font-mono text-amber-400/80">Executed live</span>
          </div>
        )}

        {/* Modal Body: Two column layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Step Navigator (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              Select Demo Step
            </div>
            {DEMO_STEPS.map((s) => {
              const isActive = s.step === currentStep;
              const isPast = s.step < currentStep;

              return (
                <button
                  key={s.step}
                  onClick={() => onExecuteStep(s.step)}
                  disabled={isLoading}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-950/20'
                      : isPast
                      ? 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                      : 'bg-slate-900/30 border-slate-800/50 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950'
                        : isPast
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-semibold truncate ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
                        {s.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          s.pillar === 'Project OS'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            : s.pillar === 'Supply OS'
                            ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        }`}
                      >
                        {s.pillar}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{s.badge}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Step Detail & One-Click Execution (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950/50 border border-slate-800 rounded-2xl p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Active Step {activeStepConfig.step} of 9
                </span>
                <span className="text-xs font-mono text-slate-400">{activeStepConfig.pillar}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-1.5">{activeStepConfig.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{activeStepConfig.description}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Live System Outcome:</div>
                <div className="text-xs font-semibold text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{activeStepConfig.expectedOutcome}</span>
                </div>
              </div>

              {/* Data Flow Indicator */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>The Connected Lifecycle Story:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Notice how a 4-core cable in <span className="text-cyan-300 font-mono">Supply OS</span> feeds directly into Level 4 <span className="text-amber-300 font-mono">Project Tasks</span>, and ultimately becomes the monitored <span className="text-emerald-300 font-mono">Distribution Board in Room 204</span> after Handover.
                </p>
              </div>
            </div>

            {/* Execute Button */}
            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 font-mono">
                {currentStep < 9 ? `Next: Step ${currentStep + 1}` : 'Demo Script Complete'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onExecuteStep(activeStepConfig.step)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-950/40 transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{activeStepConfig.actionLabel}</span>
                </button>

                {currentStep < 9 && (
                  <button
                    onClick={() => onExecuteStep(currentStep + 1)}
                    disabled={isLoading}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Advance to next step"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pitch Footer Quote */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <p className="italic">
            "We don't just manage construction projects. We create the digital operating layer for the entire lifecycle of the building."
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Explore Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
