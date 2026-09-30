import React, { useState } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface BusinessModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessModelModal: React.FC<BusinessModelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'commercial' | 'starter' | 'enterprise'>('commercial');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121821] border border-[#232C3B] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232C3B] bg-[#0B0F14]/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>CONSTRUX Market Opportunity & SaaS Commercials</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  PITCH DECK SLIDE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Capturing Africa’s Fastest Growing Construction & Real Estate Capital Market
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: The Nigerian Construction Reality */}
          <div className="p-6 rounded-3xl bg-[#0B0F14] border border-[#232C3B] space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase font-bold tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>THE MASSIVE LOCAL PROBLEM</span>
            </div>

            <h3 className="text-xl font-black text-white">
              Nigerian Real Estate Bleeds Billions in Abandoned Assets & Cost Overruns
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono pt-2">
              <div className="p-4 rounded-2xl bg-[#121821] border border-[#232C3B]">
                <div className="text-[10px] text-slate-500 uppercase">Total Addressable Market</div>
                <div className="text-2xl font-black text-white mt-1">₦12 Trillion</div>
                <div className="text-[11px] text-emerald-400 mt-0.5">Annual Nigerian Construction Output</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#121821] border border-[#232C3B]">
                <div className="text-[10px] text-slate-500 uppercase">Average Project Overrun</div>
                <div className="text-2xl font-black text-rose-400 mt-1">+40% Overrun</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Driven by supply lag & FX swings</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#121821] border border-[#232C3B]">
                <div className="text-[10px] text-slate-500 uppercase">The Post-Handover Void</div>
                <div className="text-2xl font-black text-purple-400 mt-1">92% of Towers</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Have zero digital operating records</div>
              </div>
            </div>
          </div>

          {/* Section 2: Three SaaS Pricing Tiers */}
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-3">
              Subscription Tiers (Billed Monthly per Project or Tower)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Plan 1: Starter */}
              <div
                onClick={() => setSelectedPlan('starter')}
                className={`p-5 rounded-2xl bg-[#0B0F14] border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedPlan === 'starter' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[#232C3B]'
                }`}
              >
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-blue-400">STARTER SITE</div>
                  <div className="text-2xl font-black text-white font-mono">₦450,000</div>
                  <div className="text-[11px] text-slate-500 font-mono">per project / month</div>
                  <p className="text-xs text-slate-300 pt-2">
                    For mid-scale residential up to 6 suspended floors needing basic supply tracking.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Build OS Task Management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Basic Supply & PO Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>WhatsApp Field Feed</span>
                  </li>
                </ul>
              </div>

              {/* Plan 2: Commercial Pro (Recommended) */}
              <div
                onClick={() => setSelectedPlan('commercial')}
                className={`p-5 rounded-2xl bg-[#0B0F14] border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative ${
                  selectedPlan === 'commercial' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl' : 'border-amber-500/40'
                }`}
              >
                <div className="absolute -top-3 right-4 bg-amber-500 text-slate-950 font-bold text-[10px] font-mono px-2 py-0.5 rounded-full">
                  MOST POPULAR
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-amber-400">COMMERCIAL PRO</div>
                  <div className="text-2xl font-black text-white font-mono">₦1,250,000</div>
                  <div className="text-[11px] text-slate-500 font-mono">per tower / month</div>
                  <p className="text-xs text-slate-300 pt-2">
                    For commercial & high-rise towers up to 20 floors requiring predictive AI and What-If simulator.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Full Build + Supply OS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>AI Risk & Schedule Variance Detection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Cost & Delay What-If Simulator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Naira Price Desk & AI Buy Recommendations</span>
                  </li>
                </ul>
              </div>

              {/* Plan 3: Enterprise Portfolio */}
              <div
                onClick={() => setSelectedPlan('enterprise')}
                className={`p-5 rounded-2xl bg-[#0B0F14] border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedPlan === 'enterprise' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-[#232C3B]'
                }`}
              >
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-purple-400">ENTERPRISE PORTFOLIO</div>
                  <div className="text-2xl font-black text-white font-mono">Custom</div>
                  <div className="text-[11px] text-slate-500 font-mono">multi-site developer agreement</div>
                  <p className="text-xs text-slate-300 pt-2">
                    Full lifecycle solution from ground-breaking through 10-year BuildTwin digital twin operation.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Unlimited Towers & Projects</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Full BuildTwin Operating Twin Layer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Custom ERP & LASPPPA Integrations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Dedicated Solution Architect</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: ROI Multiplier Proof */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>The Unbeatable Economic ROI Proposition</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Contractor liquidated damages on Victoria Heights are ₦850,000/day. Catching and resolving just <strong>7 days of schedule delay</strong> saves <strong>₦5.95 Million</strong> — paying for an entire year of CONSTRUX Commercial Pro on Day 1.
              </p>
            </div>
            <div className="font-mono text-center sm:text-right shrink-0">
              <div className="text-[10px] text-slate-400 uppercase">Estimated ROI</div>
              <div className="text-xl font-black text-emerald-400">12.4x</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0B0F14] border-t border-[#232C3B] flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Selected Tier: <strong className="text-white uppercase">{selectedPlan}</strong>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
          >
            Close Pitch Slide
          </button>
        </div>
      </div>
    </div>
  );
};
