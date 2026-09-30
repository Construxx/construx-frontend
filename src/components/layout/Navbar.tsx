import React from 'react';
import {
  Building2,
  Boxes,
  HardHat,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  TrendingUp,
  LayoutDashboard,
  DollarSign,
  Command,
  Smartphone,
} from 'lucide-react';
import { Project, Building, User, Role } from '../../types';
import { ConnectionIndicator } from '../offline/ConnectionIndicator';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export type AppModule = 'command_center' | 'build' | 'supply' | 'operate' | 'portfolio' | 'site';

interface NavbarProps {
  currentModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (proj: Project) => void;
  buildings: Building[];
  activeBuilding: Building | null;
  onSelectBuilding: (bldg: Building) => void;
  currentUser: User;
  onSwitchRole: (role: Role) => void;
  onOpenDemo: () => void;
  onOpenCommandPalette: () => void;
  onOpenPricing: () => void;
  onResetDemo: () => void;
  demoStep: number;
  onOpenSyncCenter: () => void;
  onOpenBoQImport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModule,
  onSelectModule,
  projects,
  activeProject,
  onSelectProject,
  buildings,
  activeBuilding,
  onSelectBuilding,
  currentUser,
  onSwitchRole,
  onOpenDemo,
  onOpenCommandPalette,
  onOpenPricing,
  onResetDemo,
  demoStep,
  onOpenSyncCenter,
  onOpenBoQImport,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0f14]/95 backdrop-blur-md border-b border-[#232c3b] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & System Status */}
        <div className="flex items-center gap-5">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onSelectModule('command_center')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl tracking-tighter">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">
                  CONSTRUX
                </span>
                <span className="text-[10px] font-mono uppercase bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                  OS v3.2
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-[10px]">Build • Supply • Operate</span>
              </div>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-[#121821] p-1 rounded-xl border border-[#232c3b] gap-0.5">
            <button
              onClick={() => onSelectModule('command_center')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'command_center'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Center</span>
            </button>

            {/* BUILD (Blue) */}
            <button
              onClick={() => onSelectModule('build')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'build'
                  ? 'bg-blue-600/25 text-blue-300 border border-blue-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <HardHat className="w-3.5 h-3.5 text-blue-400" />
              <span>Build</span>
            </button>

            {/* SUPPLY (Green) */}
            <button
              onClick={() => onSelectModule('supply')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'supply'
                  ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supply</span>
            </button>

            {/* OPERATE (Purple) */}
            <button
              onClick={() => onSelectModule('operate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'operate'
                  ? 'bg-purple-600/25 text-purple-300 border border-purple-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Operate</span>
            </button>

            {/* PORTFOLIO (Map) */}
            <button
              onClick={() => onSelectModule('portfolio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'portfolio'
                  ? 'bg-cyan-600/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Portfolio</span>
            </button>

            {/* SITE VIEW (Mobile PWA) */}
            <button
              onClick={() => onSelectModule('site')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'site'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Site PWA</span>
            </button>
          </nav>
        </div>

        {/* Center / Active Project or Twin Switcher */}
        <div className="hidden xl:flex items-center gap-2">
          {currentModule !== 'operate' ? (
            <div className="flex items-center gap-2 bg-[#121821] px-3 py-1.5 rounded-xl border border-[#232c3b] text-xs">
              <span className="text-slate-500 font-medium">Project:</span>
              <select
                value={activeProject?.id || ''}
                onChange={(e) => {
                  const p = projects.find((x) => x.id === e.target.value);
                  if (p) onSelectProject(p);
                }}
                className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>

              {onOpenBoQImport && (
                <button
                  onClick={onOpenBoQImport}
                  title="Create new project by importing a Bill of Quantities"
                  className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] border border-amber-500/40 transition active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>+ Import BoQ</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#121821] px-3 py-1.5 rounded-xl border border-[#232c3b] text-xs">
              <span className="text-slate-500 font-medium">Digital Twin:</span>
              <select
                value={activeBuilding?.id || ''}
                onChange={(e) => {
                  const b = buildings.find((x) => x.id === e.target.value);
                  if (b) onSelectBuilding(b);
                }}
                className="bg-transparent text-purple-300 font-semibold focus:outline-none cursor-pointer"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                    {b.name} ({b.totalFloors} Fl)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Tools: ⌘K Ask CONSTRUX, Connection status, Install PWA, Market Slide, Demo Script, Role Switcher */}
        <div className="flex items-center gap-2">
          {/* Global Connection / Offline Sync Status Indicator */}
          <ConnectionIndicator onOpenSyncCenter={onOpenSyncCenter} />

          {/* In-App PWA Installation Prompt */}
          <PWAInstallButton />

          {/* ⌘K Command Palette Button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121821] hover:bg-[#1a2230] text-slate-300 hover:text-white border border-[#232c3b] hover:border-amber-500/50 text-xs transition-all"
            title="Ask CONSTRUX AI or jump anywhere (⌘K / Ctrl+K)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-medium">Ask AI</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          {/* Market & SaaS Pricing Modal Trigger */}
          <button
            onClick={onOpenPricing}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121821] hover:bg-[#1a2230] text-emerald-400 border border-[#232c3b] hover:border-emerald-500/50 text-xs font-semibold transition-all"
            title="View Nigerian market TAM and SaaS pricing tiers slide"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pricing</span>
          </button>

          {/* Hackathon Demo Walkthrough Button */}
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-orange-950/40 border border-amber-400/40 transition-transform active:scale-95"
            title="Interactive 9-step Hackathon Demo Script"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">Demo Script</span>
            <span className="bg-black/30 text-amber-200 text-[10px] px-1.5 py-0.2 rounded font-mono">
              {demoStep}/9
            </span>
          </button>

          {/* Reset Demo */}
          <button
            onClick={onResetDemo}
            title="Reset demo data to initial Victoria Heights state"
            className="p-1.5 rounded-xl bg-[#121821] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-[#232c3b] text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Role Switcher Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-2 pl-2 border-l border-[#232c3b] cursor-pointer">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border border-amber-500/40 object-cover"
              />
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-200 truncate max-w-[105px]">
                  {currentUser.name.split(' ')[1] || currentUser.name}
                </div>
                <div className="text-[10px] text-amber-400 font-mono">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#121821] border border-[#232c3b] rounded-2xl shadow-2xl p-2 hidden group-hover:block z-50">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500">Switch Demo Role</div>
              {(['SITE_ENGINEER', 'PROCUREMENT_OFFICER', 'FACILITY_MANAGER', 'ADMIN'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onSwitchRole(r)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                    currentUser.role === r
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{r.replace('_', ' ')}</span>
                  {currentUser.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
