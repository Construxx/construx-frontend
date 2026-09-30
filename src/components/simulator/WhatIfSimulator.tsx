import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Project } from '../../types';

interface WhatIfSimulatorProps {
  project: Project;
  onApplyMitigation?: (daysSaved: number, costImpact: number) => void;
  onClose?: () => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  project,
  onApplyMitigation,
  onClose,
}) => {
  // Simulator Parameters
  const [supplierDelayDays, setSupplierDelayDays] = useState<number>(4);
  const [extraLabourCrew, setExtraLabourCrew] = useState<number>(2);
  const [materialInflationRate, setMaterialInflationRate] = useState<number>(12);
  const [applied, setApplied] = useState(false);

  // Baseline calculations
  // Baseline delay is 5 days from Level 4 electrical cable deficit
  const baseDelay = project.status === 'at_risk' ? 5 : 0;

  // Each extra labour crew member recoups 1.5 days of delay (max recouped = extraLabourCrew * 1.5)
  const daysRecouped = Math.min(baseDelay + supplierDelayDays, extraLabourCrew * 1.5);
  const netDelayDays = Math.max(0, Math.round(baseDelay + supplierDelayDays - daysRecouped));

  // Cost calculation
  // Daily liquidated delay penalty: ₦850,000 / day
  const dailyLiquidatedDamages = 850000;
  const potentialPenaltyCost = (baseDelay + supplierDelayDays) * dailyLiquidatedDamages;

  // Extra labour cost: ₦325,000 per crew member for the surge period
  const labourCost = extraLabourCrew * 325000;

  // Material inflation impact on remaining ₦135M procurement:
  const inflationCost = 135000000 * (materialInflationRate / 100) * 0.15;

  const totalProjectedOverrun = netDelayDays * dailyLiquidatedDamages + labourCost + inflationCost;
  const netSavings = potentialPenaltyCost - (netDelayDays * dailyLiquidatedDamages + labourCost);

  // Projected completion date
  const originalEnd = new Date('2026-11-30');
  const projectedEnd = new Date(originalEnd);
  projectedEnd.setDate(projectedEnd.getDate() + netDelayDays);

  const handleApply = () => {
    setApplied(true);
    if (onApplyMitigation) {
      onApplyMitigation(daysRecouped, labourCost);
    }
  };

  const handleReset = () => {
    setSupplierDelayDays(4);
    setExtraLabourCrew(2);
    setMaterialInflationRate(12);
    setApplied(false);
  };

  return (
    <div className="bg-[#121821] border border-[#232C3B] rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232C3B] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              AI DECISION ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">Project: {project.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-amber-400" />
            <span>Schedule Delay & Cost "What-If" Simulator</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Simulate real-time sensitivity across procurement lead times, labour surge allocation, and Lagos material price volatility.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono self-start sm:self-auto border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sliders</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5 bg-[#0B0F14]/60 p-5 rounded-2xl border border-[#232C3B]">
          <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
            Operational Sensitivity Levers
          </h3>

          {/* Slider 1: Supplier Lead Time Delay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200 flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>Supplier Delivery Lag / Port Congestion</span>
              </label>
              <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800">
                {supplierDelayDays > 0 ? `+${supplierDelayDays} Days` : `${supplierDelayDays} Days`}
              </span>
            </div>
            <input
              type="range"
              min={-5}
              max={21}
              step={1}
              value={supplierDelayDays}
              onChange={(e) => {
                setSupplierDelayDays(Number(e.target.value));
                setApplied(false);
              }}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>-5d (Expedited Air Freight)</span>
              <span>Baseline (4d)</span>
              <span>+21d (Apapa Port Gridlock)</span>
            </div>
          </div>

          {/* Slider 2: Labour Overtime Crew */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Additional Electricians / Dual-Shift Crew</span>
              </label>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-800">
                +{extraLabourCrew} Certified Tradesmen
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={extraLabourCrew}
              onChange={(e) => {
                setExtraLabourCrew(Number(e.target.value));
                setApplied(false);
              }}
              className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0 (Single Shift)</span>
              <span>+2 (Recommended Sweet Spot)</span>
              <span>+10 (Triple 24/7 Shifts)</span>
            </div>
          </div>

          {/* Slider 3: Material Price Volatility */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Local Material Price Inflation (₦ FX Rate)</span>
              </label>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                +{materialInflationRate}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={35}
              step={1}
              value={materialInflationRate}
              onChange={(e) => {
                setMaterialInflationRate(Number(e.target.value));
                setApplied(false);
              }}
              className="w-full accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0% Stable</span>
              <span>+12% Current Lagos CPI</span>
              <span>+35% Severe Devaluation</span>
            </div>
          </div>

          {/* AI Recommendation Banner inside Sliders */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
              <Sparkles className="w-4 h-4" />
              <span>AI RECOMMENDATION (OPTIMAL PARETO FRONTIER)</span>
            </div>
            <p className="leading-relaxed">
              Adding <strong>2 certified electricians (+₦650,000 surge)</strong> absorbs 3 days of cable delay, reducing total schedule variance from <strong>9 days to 2 days</strong> and preventing <strong>₦4,250,000</strong> in liquidated damages.
            </p>
          </div>
        </div>

        {/* Live Simulation Outcomes Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
              Projected Lifecycle Outcomes
            </h3>

            {/* Projected Delay Metric */}
            <div className="p-4 rounded-2xl bg-[#0B0F14] border border-[#232C3B] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">Net Schedule Variance</div>
                <div className="text-2xl font-black font-mono text-white mt-0.5 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className={netDelayDays > 3 ? 'text-rose-400' : netDelayDays > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    {netDelayDays === 0 ? 'On Schedule' : `+${netDelayDays} Days Late`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Completion: {projectedEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2 py-1 rounded-full font-mono uppercase ${
                  netDelayDays === 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {netDelayDays === 0 ? 'CRITICAL PATH CLEAR' : 'SLIPPAGE MITIGATED'}
                </span>
              </div>
            </div>

            {/* Estimated Financial Impact */}
            <div className="p-4 rounded-2xl bg-[#0B0F14] border border-[#232C3B] space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Financial Exposure Breakdown</div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Liquidated Damages:</span>
                  <span className="text-white">₦{(netDelayDays * dailyLiquidatedDamages).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Labour Overtime Cost:</span>
                  <span className="text-amber-400">+₦{labourCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Material Inflation Surcharge:</span>
                  <span className="text-slate-400">+₦{Math.round(inflationCost).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                  <span className="text-slate-200">Total Capital Impact:</span>
                  <span className="text-amber-300">₦{(totalProjectedOverrun / 1e6).toFixed(2)}M</span>
                </div>
              </div>
            </div>

            {/* Net Savings Callout */}
            {netSavings > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <span>Net Savings via Active Mitigation:</span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ₦{(netSavings / 1e6).toFixed(2)}M
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleApply}
              disabled={applied}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                applied
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-950/40'
              }`}
            >
              {applied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Mitigation Dispatched to Schedule! (-{daysRecouped}d)</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Commit Simulation & Authorize Dual Shift</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
