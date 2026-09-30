import React from 'react';
import {
  Sparkles,
  HardHat,
  Boxes,
  Building2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sliders,
  DollarSign,
  Award,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Camera,
  Play,
} from 'lucide-react';
import { Project, Building, AIAlert, Material } from '../../types';

interface CommandCenterViewProps {
  projects: Project[];
  activeProject: Project;
  buildings: Building[];
  alerts: AIAlert[];
  materials: Material[];
  onNavigate: (module: 'command_center' | 'build' | 'supply' | 'operate' | 'portfolio') => void;
  onOpenSimulator: () => void;
  onOpenHandoverCert: () => void;
  onOpenPricing: () => void;
  onOpenDemo: () => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  projects,
  activeProject,
  buildings,
  alerts,
  materials,
  onNavigate,
  onOpenSimulator,
  onOpenHandoverCert,
  onOpenPricing,
  onOpenDemo,
}) => {
  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const criticalMaterials = materials.filter((m) => m.status === 'critical_shortage');

  return (
    <div className="space-y-6">
      {/* Executive Morning Briefing Hero Card */}
      <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-[#121821] to-[#0B0F14] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI MORNING BRIEFING // LAGOS CLUSTER</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              CONSTRUX Executive Command Center
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Active oversight across <strong>5 Lagos development sites</strong> with <strong>₦2.21B</strong> in total asset pipeline. Victoria Heights is at <strong>68% physical progress</strong> with ₦295M deployed. Level 4 Electrical cabling has an active <strong>5-day critical path variance</strong> pending delivery of 3,400m armoured copper cable. Marina Waterfront Centre operates normally as a BuildTwin Digital Twin.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
              <span className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                Active Projects: <strong className="text-white">4 Construction</strong>
              </span>
              <span className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                Operating Twins: <strong className="text-purple-400">1 Handed Over</strong>
              </span>
              <span className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                Unresolved AI Flags: <strong className="text-amber-400">{unresolvedAlerts.length} Attention</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={onOpenDemo}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch 9-Step Demo Flow</span>
            </button>
            <button
              onClick={() => onNavigate('build')}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <HardHat className="w-4 h-4" />
              <span>Inspect Victoria Heights</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Core Operating Modules Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: BUILD (Blue) */}
        <div
          onClick={() => onNavigate('build')}
          className="bg-[#121821] border border-blue-500/30 hover:border-blue-500 rounded-3xl p-6 shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <HardHat className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold">
                BUILD MODULE
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                Construction Execution & QA
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Critical path scheduling, WhatsApp-style field log updates, BIM drawings, and delay risk detection.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Active Project:</span>
                <span className="text-white font-bold">{activeProject.name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Progress:</span>
                <span className="text-amber-400 font-bold">{activeProject.progressPercent}% Complete</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Budget Spent:</span>
                <span className="text-slate-200">₦{(activeProject.budgetSpent / 1e6).toFixed(0)}M of ₦{(activeProject.budgetTotal / 1e6).toFixed(0)}M</span>
              </div>
            </div>
          </div>

          <div className="flex items-center text-xs font-bold text-blue-400 gap-1.5 group-hover:translate-x-1 transition-transform">
            <span>Enter Build Module</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Module 2: SUPPLY (Green) */}
        <div
          onClick={() => onNavigate('supply')}
          className="bg-[#121821] border border-emerald-500/30 hover:border-emerald-500 rounded-3xl p-6 shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Boxes className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                SUPPLY MODULE
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                Procurement & Price Desk
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Naira commodity price tracker, AI automated purchase orders, and delivery receiving checklist.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Critical Deficit:</span>
                <span className="text-rose-400 font-bold">Armoured Cable (-3,400m)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Dangote Cement:</span>
                <span className="text-amber-400 font-bold">₦8,400 / bag (+8.4%)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Suppliers Directory:</span>
                <span className="text-emerald-400 font-bold">5 Verified Lagos Partners</span>
              </div>
            </div>
          </div>

          <div className="flex items-center text-xs font-bold text-emerald-400 gap-1.5 group-hover:translate-x-1 transition-transform">
            <span>Enter Supply Module</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Module 3: OPERATE (Purple) */}
        <div
          onClick={() => onNavigate('operate')}
          className="bg-[#121821] border border-purple-500/30 hover:border-purple-500 rounded-3xl p-6 shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-bold">
                OPERATE MODULE
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                BuildTwin Digital Operating Layer
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Post-handover lifecycle operations: isometric 12-floor twin, Room 204 Daikin VRV maintenance, and QR codes.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Active Twin:</span>
                <span className="text-white font-bold">{buildings[0]?.name || 'Victoria Heights'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Building Health:</span>
                <span className="text-emerald-400 font-bold">{buildings[0]?.healthScore || 94}% Optimal</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Active Work Orders:</span>
                <span className="text-purple-300 font-bold">1 AI Preventive Service</span>
              </div>
            </div>
          </div>

          <div className="flex items-center text-xs font-bold text-purple-400 gap-1.5 group-hover:translate-x-1 transition-transform">
            <span>Enter Operate Module</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Quick Interactive Tools Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={onOpenSimulator}
          className="p-4 rounded-2xl bg-[#121821] border border-[#232C3B] hover:border-amber-500/50 transition-all text-left flex items-center gap-3.5 group shadow-md"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
              What-If Simulator
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Test schedule delays & costs</div>
          </div>
        </button>

        <button
          onClick={onOpenHandoverCert}
          className="p-4 rounded-2xl bg-[#121821] border border-[#232C3B] hover:border-purple-500/50 transition-all text-left flex items-center gap-3.5 group shadow-md"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
              Handover Certificate
            </div>
            <div className="text-[10px] text-slate-400 font-mono">View seal & QR asset tags</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('portfolio')}
          className="p-4 rounded-2xl bg-[#121821] border border-[#232C3B] hover:border-cyan-500/50 transition-all text-left flex items-center gap-3.5 group shadow-md"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
              Portfolio Map
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Lagos sites & health pins</div>
          </div>
        </button>

        <button
          onClick={onOpenPricing}
          className="p-4 rounded-2xl bg-[#121821] border border-[#232C3B] hover:border-emerald-500/50 transition-all text-left flex items-center gap-3.5 group shadow-md"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
              Market & SaaS Pricing
            </div>
            <div className="text-[10px] text-slate-400 font-mono">₦12T TAM & pricing tiers</div>
          </div>
        </button>
      </div>
    </div>
  );
};
