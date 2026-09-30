import React, { useState } from 'react';
import {
  MapPin,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  HardHat,
} from 'lucide-react';
import { Project, Building } from '../../types';

interface PortfolioMapViewProps {
  projects: Project[];
  buildings: Building[];
  onSelectProject: (project: Project) => void;
  onSelectBuilding: (building: Building) => void;
  onNavigateToModule: (module: 'build' | 'supply' | 'operate') => void;
}

interface MapLocation {
  id: string;
  name: string;
  code: string;
  zone: string;
  type: 'project' | 'building';
  status: 'on_track' | 'at_risk' | 'handed_over';
  budget: number;
  spent: number;
  progress: number;
  floors: number;
  contractor: string;
  x: number; // percentage on map
  y: number; // percentage on map
  riskNote?: string;
  refId: string;
}

export const PortfolioMapView: React.FC<PortfolioMapViewProps> = ({
  projects,
  buildings,
  onSelectProject,
  onSelectBuilding,
  onNavigateToModule,
}) => {
  const [selectedPinId, setSelectedPinId] = useState<string>('vh-pin');

  const locations: MapLocation[] = [
    {
      id: 'vh-pin',
      name: 'Victoria Heights',
      code: 'VH-2026',
      zone: 'Victoria Island, Lagos',
      type: 'project',
      status: 'at_risk',
      budget: 430000000,
      spent: 295000000,
      progress: 68,
      floors: 12,
      contractor: 'Julius Berger & Cappa D’Alberto JV',
      x: 48,
      y: 62,
      riskNote: 'Level 4 electrical cable deficit (5-day variance). In progress.',
      refId: 'proj-victoria',
    },
    {
      id: 'mwc-pin',
      name: 'Marina Waterfront Centre',
      code: 'MWC-2025',
      zone: 'Marina CBD, Lagos Island',
      type: 'building',
      status: 'handed_over',
      budget: 820000000,
      spent: 780000000,
      progress: 100,
      floors: 18,
      contractor: 'El-Alan Construction Co.',
      x: 36,
      y: 54,
      riskNote: 'Active BuildTwin Digital Twin. Optimal health score (94%).',
      refId: 'bldg-marina',
    },
    {
      id: 'lih-pin',
      name: 'Lekki Innovation Hub',
      code: 'LIH-2026',
      zone: 'Lekki Phase 1 / Free Zone',
      type: 'project',
      status: 'on_track',
      budget: 310000000,
      spent: 110000000,
      progress: 32,
      floors: 6,
      contractor: 'Dredging & Heavy Civil Consortium',
      x: 68,
      y: 68,
      riskNote: 'Piling complete, superstructure columns underway.',
      refId: 'proj-lekki',
    },
    {
      id: 'ikoyi-pin',
      name: 'Ikoyi Royal Terraces',
      code: 'IRT-2026',
      zone: 'Ikoyi, Lagos',
      type: 'project',
      status: 'on_track',
      budget: 650000000,
      spent: 510000000,
      progress: 79,
      floors: 10,
      contractor: 'Costain West Africa',
      x: 52,
      y: 48,
      riskNote: 'MEP rough-in verified. Façade glazing underway.',
      refId: 'proj-victoria',
    },
    {
      id: 'eko-pin',
      name: 'Eko Atlantic Financial Tower',
      code: 'EAT-2027',
      zone: 'Eko Atlantic City, Lagos',
      type: 'project',
      status: 'on_track',
      budget: 1250000000,
      spent: 380000000,
      progress: 28,
      floors: 26,
      contractor: 'South Energyx Engineering',
      x: 42,
      y: 72,
      riskNote: 'Deep foundation piles load-tested successfully.',
      refId: 'proj-victoria',
    },
  ];

  const selectedLoc = locations.find((l) => l.id === selectedPinId) || locations[0];

  // Aggregate Portfolio Stats
  const totalPipelineCapital = locations.reduce((sum, l) => sum + l.budget, 0);
  const totalSpentCapital = locations.reduce((sum, l) => sum + l.spent, 0);
  const totalFloors = locations.reduce((sum, l) => sum + l.floors, 0);

  const handleLaunchTarget = () => {
    if (selectedLoc.type === 'building') {
      const bldg = buildings.find((b) => b.id === selectedLoc.refId) || buildings[0];
      if (bldg) onSelectBuilding(bldg);
      onNavigateToModule('operate');
    } else {
      const proj = projects.find((p) => p.id === selectedLoc.refId) || projects[0];
      if (proj) onSelectProject(proj);
      onNavigateToModule('build');
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header & KPIs */}
      <div className="bg-[#121821] border border-[#232C3B] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-full font-bold">
                ENTERPRISE METROPOLITAN PORTFOLIO
              </span>
              <span className="text-xs text-slate-400 font-mono">Greater Lagos Mega-City Cluster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Lagos Project Pipeline & Digital Twin Operations
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time geospatial telemetry monitoring active developments across Victoria Island, Lekki, Marina CBD, Ikoyi, and Eko Atlantic.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 self-stretch sm:self-auto text-xs font-mono">
            <div className="p-3 rounded-2xl bg-[#0B0F14] border border-[#232C3B]">
              <div className="text-[10px] text-slate-500 uppercase">Capital Pipeline</div>
              <div className="text-base font-black text-white mt-0.5">₦{(totalPipelineCapital / 1e9).toFixed(2)}B</div>
              <div className="text-[10px] text-emerald-400">₦{(totalSpentCapital / 1e9).toFixed(2)}B Absorbed</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#0B0F14] border border-[#232C3B]">
              <div className="text-[10px] text-slate-500 uppercase">Active Towers</div>
              <div className="text-base font-black text-amber-400 mt-0.5">5 Sites</div>
              <div className="text-[10px] text-slate-400">{totalFloors} Suspended Floors</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#0B0F14] border border-[#232C3B]">
              <div className="text-[10px] text-slate-500 uppercase">Twin Status</div>
              <div className="text-base font-black text-purple-400 mt-0.5">1 Operating</div>
              <div className="text-[10px] text-purple-300">4 In Build OS</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive SVG Lagos Map (8 cols) */}
        <div className="lg:col-span-8 bg-[#0B0F14] border border-[#232C3B] rounded-3xl p-6 shadow-2xl relative min-h-[480px] flex flex-col justify-between overflow-hidden">
          {/* Map Top Indicators */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-300 font-semibold">Live Geospatial Telemetry</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-400">On Track</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-400">At Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-400">Digital Twin (Handed Over)</span>
              </div>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-[380px] my-auto">
            {/* Lagos Lagoon and Coastline Stylized Geometry */}
            <svg
              viewBox="0 0 1000 600"
              className="w-full h-full object-cover select-none pointer-events-none opacity-85"
            >
              <defs>
                <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#08101a" />
                  <stop offset="100%" stopColor="#050a12" />
                </linearGradient>
                <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#141c28" />
                  <stop offset="100%" stopColor="#0e141f" />
                </linearGradient>
              </defs>

              {/* Water Background */}
              <rect width="1000" height="600" fill="url(#waterGrad)" />

              {/* Lagos Mainland */}
              <path
                d="M 50 50 Q 250 80 400 60 Q 550 40 700 80 L 700 220 Q 500 240 350 200 Q 200 220 50 180 Z"
                fill="url(#landGrad)"
                stroke="#1f2c3d"
                strokeWidth="2"
              />

              {/* Lagos Island & Marina */}
              <path
                d="M 280 270 Q 380 250 440 280 Q 420 350 330 360 Q 260 330 280 270 Z"
                fill="#182333"
                stroke="#2a3c54"
                strokeWidth="2"
              />

              {/* Ikoyi Island */}
              <path
                d="M 450 260 Q 560 250 600 300 Q 560 360 470 350 Q 430 310 450 260 Z"
                fill="#1b283b"
                stroke="#2a3c54"
                strokeWidth="2"
              />

              {/* Victoria Island */}
              <path
                d="M 330 380 Q 480 370 580 390 Q 560 480 400 490 Q 320 460 330 380 Z"
                fill="#203047"
                stroke="#354c6b"
                strokeWidth="2.5"
              />

              {/* Lekki Peninsula Strip */}
              <path
                d="M 580 390 Q 750 410 950 430 Q 950 500 780 490 Q 640 480 580 390 Z"
                fill="#182333"
                stroke="#2a3c54"
                strokeWidth="2"
              />

              {/* Eko Atlantic Reclaimed Island */}
              <path
                d="M 360 510 Q 480 505 520 540 Q 450 585 360 570 Q 320 545 360 510 Z"
                fill="#1a2b3d"
                stroke="#3b597d"
                strokeDasharray="4 4"
                strokeWidth="2"
              />

              {/* Major Arteries / Bridges */}
              {/* Third Mainland Bridge */}
              <line x1="320" y1="190" x2="360" y2="270" stroke="#3b82f6" strokeWidth="2" opacity="0.6" strokeDasharray="3 3" />
              {/* Lekki-Ikoyi Link Bridge */}
              <line x1="520" y1="340" x2="540" y2="390" stroke="#f59e0b" strokeWidth="2.5" opacity="0.8" />
              {/* Eko Bridge */}
              <line x1="220" y1="180" x2="300" y2="280" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />

              {/* Water Labels */}
              <text x="180" y="240" fill="#2d3d52" fontSize="14" fontFamily="monospace" fontWeight="bold">LAGOS LAGOON</text>
              <text x="350" y="590" fill="#2d3d52" fontSize="14" fontFamily="monospace" fontWeight="bold">GULF OF GUINEA (ATLANTIC)</text>
              <text x="750" y="380" fill="#2d3d52" fontSize="14" fontFamily="monospace" fontWeight="bold">LEKKI FREE ZONE</text>
            </svg>

            {/* Interactive Pins Positioned over Map */}
            {locations.map((loc) => {
              const isSelected = selectedPinId === loc.id;
              const isAtRisk = loc.status === 'at_risk';
              const isTwin = loc.status === 'handed_over';

              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedPinId(loc.id)}
                  style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing Aura */}
                    <div
                      className={`absolute w-9 h-9 rounded-full opacity-60 animate-ping ${
                        isTwin
                          ? 'bg-purple-500'
                          : isAtRisk
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />

                    {/* Main Pin Badge */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-2xl border-2 transition-all ${
                        isTwin
                          ? 'bg-purple-600 text-white border-purple-300'
                          : isAtRisk
                          ? 'bg-amber-500 text-slate-950 border-amber-200'
                          : 'bg-emerald-500 text-slate-950 border-emerald-200'
                      }`}
                    >
                      {isTwin ? (
                        <Building2 className="w-3.5 h-3.5" />
                      ) : (
                        <HardHat className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Pin Label Tooltip */}
                    <div className="absolute top-8 whitespace-nowrap bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-200 border border-slate-700 shadow-xl pointer-events-none">
                      {loc.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-500 z-10 flex items-center justify-between">
            <span>Coordinates: 6.4281° N, 3.4219° E</span>
            <span>Click any location pin to inspect telemetry</span>
          </div>
        </div>

        {/* Selected Project / Twin Detail Drawer (4 cols) */}
        <div className="lg:col-span-4 bg-[#121821] border border-[#232C3B] rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                {selectedLoc.code}
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                  selectedLoc.status === 'handed_over'
                    ? 'bg-purple-950 text-purple-300 border-purple-800'
                    : selectedLoc.status === 'at_risk'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                {selectedLoc.status.replace('_', ' ')}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">{selectedLoc.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedLoc.zone}</span>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-[#232C3B]">
              <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#232C3B]">
                <div className="text-[10px] text-slate-500">Total Budget</div>
                <div className="font-bold text-white mt-0.5">₦{(selectedLoc.budget / 1e6).toFixed(0)}M</div>
                <div className="text-[10px] text-slate-400">Spent: ₦{(selectedLoc.spent / 1e6).toFixed(0)}M</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#232C3B]">
                <div className="text-[10px] text-slate-500">Physical Progress</div>
                <div className="font-bold text-amber-400 mt-0.5">{selectedLoc.progress}%</div>
                <div className="text-[10px] text-slate-400">{selectedLoc.floors} Suspended Floors</div>
              </div>
            </div>

            {/* Contractor */}
            <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#232C3B] text-xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase">General Contractor</div>
              <div className="font-bold text-slate-200 mt-0.5">{selectedLoc.contractor}</div>
            </div>

            {/* Status Note */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-200 space-y-1">
              <div className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Active Telemetry Note</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                {selectedLoc.riskNote}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#232C3B]">
            <button
              onClick={handleLaunchTarget}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                selectedLoc.type === 'building'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/50'
              }`}
            >
              <span>{selectedLoc.type === 'building' ? 'Launch Digital Twin in Operate' : 'Open in Build OS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
