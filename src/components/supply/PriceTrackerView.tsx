import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Material, Supplier } from '../../types';

interface PriceTrackerViewProps {
  materials: Material[];
  suppliers: Supplier[];
  onCreatePO?: (data: { materialId: string; supplierId: string; quantity: number; unitCost?: number; notes?: string }) => void;
}

interface CommodityPrice {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentPrice: number;
  thirtyDayAgoPrice: number;
  ninetyDayAgoPrice: number;
  change30d: number; // percentage
  trend: 'up' | 'down' | 'stable';
  aiVerdict: 'BUY_NOW' | 'HOLD' | 'WAIT';
  confidence: number;
  reasoning: string;
  recommendedVolume: number;
  estimatedSavings: number;
  sparkline: number[];
}

export const PriceTrackerView: React.FC<PriceTrackerViewProps> = ({
  materials,
  suppliers,
  onCreatePO,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '60d' | '90d'>('30d');
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('c-cement');

  const commodities: CommodityPrice[] = [
    {
      id: 'c-cement',
      name: 'Dangote Portland Cement (Grade 42.5)',
      category: 'Civil & Structural',
      unit: '50kg bag',
      currentPrice: 8400,
      thirtyDayAgoPrice: 7750,
      ninetyDayAgoPrice: 7200,
      change30d: 8.38,
      trend: 'up',
      aiVerdict: 'BUY_NOW',
      confidence: 94,
      reasoning: 'Haulage diesel price hikes and scheduled plant maintenance in Ibese are projected to trigger another 6-10% wholesale bump next month.',
      recommendedVolume: 2000,
      estimatedSavings: 1300000,
      sparkline: [7200, 7350, 7400, 7550, 7750, 8050, 8400],
    },
    {
      id: 'c-steel',
      name: 'High-Yield TMT Steel Rebar (16mm Fe500)',
      category: 'Structural',
      unit: 'metric tonne',
      currentPrice: 1240000,
      thirtyDayAgoPrice: 1255000,
      ninetyDayAgoPrice: 1310000,
      change30d: -1.2,
      trend: 'down',
      aiVerdict: 'HOLD',
      confidence: 86,
      reasoning: 'Scrap metal recycling inflows and stable port FX clearing rates have capped local mill prices for the next 3 weeks.',
      recommendedVolume: 25,
      estimatedSavings: 450000,
      sparkline: [1310000, 1290000, 1280000, 1270000, 1255000, 1245000, 1240000],
    },
    {
      id: 'c-cable',
      name: '4-Core 16mm² Armoured Copper Cable',
      category: 'Electrical & MEP',
      unit: 'meter',
      currentPrice: 4200,
      thirtyDayAgoPrice: 3680,
      ninetyDayAgoPrice: 3400,
      change30d: 14.13,
      trend: 'up',
      aiVerdict: 'BUY_NOW',
      confidence: 96,
      reasoning: 'Global London Metal Exchange (LME) copper spikes combined with naira parallel market rates make delaying orders high risk.',
      recommendedVolume: 3400,
      estimatedSavings: 1768000,
      sparkline: [3400, 3450, 3520, 3680, 3850, 4050, 4200],
    },
    {
      id: 'c-blocks',
      name: '9-inch Vibrated Hollow Concrete Blocks',
      category: 'Masonry',
      unit: '1,000 units',
      currentPrice: 650000,
      thirtyDayAgoPrice: 610000,
      ninetyDayAgoPrice: 580000,
      change30d: 6.55,
      trend: 'up',
      aiVerdict: 'BUY_NOW',
      confidence: 89,
      reasoning: 'Directly follows Portland cement index and sand dredging fuel tariffs.',
      recommendedVolume: 5000,
      estimatedSavings: 600000,
      sparkline: [580000, 590000, 600000, 610000, 625000, 638000, 650000],
    },
    {
      id: 'c-sand',
      name: 'Sharp River Sand (Dredged Epe Grade)',
      category: 'Civil',
      unit: '20-tonne tipper',
      currentPrice: 195000,
      thirtyDayAgoPrice: 190000,
      ninetyDayAgoPrice: 185000,
      change30d: 2.63,
      trend: 'stable',
      aiVerdict: 'WAIT',
      confidence: 82,
      reasoning: 'Wet season dredging permits remain normal; supply in Epe and Ikorodu is steady with negligible expected variance.',
      recommendedVolume: 8,
      estimatedSavings: 80000,
      sparkline: [185000, 187000, 188000, 190000, 192000, 194000, 195000],
    },
    {
      id: 'c-granite',
      name: '3/4-inch Crushed Granite Aggregate',
      category: 'Civil',
      unit: '30-tonne tipper',
      currentPrice: 380000,
      thirtyDayAgoPrice: 375000,
      ninetyDayAgoPrice: 360000,
      change30d: 1.33,
      trend: 'stable',
      aiVerdict: 'HOLD',
      confidence: 85,
      reasoning: 'Abeokuta quarry operations operating at full capacity; road transport availability is resilient.',
      recommendedVolume: 12,
      estimatedSavings: 150000,
      sparkline: [360000, 365000, 370000, 375000, 375000, 378000, 380000],
    },
  ];

  const selectedCommodity = commodities.find((c) => c.id === selectedCommodityId) || commodities[0];

  const handle1ClickPo = (c: CommodityPrice) => {
    if (!onCreatePO) return;
    const targetMat = materials.find((m) => m.name.toLowerCase().includes(c.name.split(' ')[0].toLowerCase())) || materials[0];
    const targetSupp = suppliers[0];

    onCreatePO({
      materialId: targetMat.id,
      supplierId: targetSupp.id,
      quantity: c.recommendedVolume,
      unitCost: c.currentPrice,
      notes: `Procured via CONSTRUX Naira Price Tracker. AI recommendation: ${c.aiVerdict} to secure ₦${(c.estimatedSavings / 1e6).toFixed(2)}M in savings.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Price Tracker Header */}
      <div className="bg-[#121821] border border-[#232C3B] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                NIGERIAN CONSTRUCTION COMMODITY DESK
              </span>
              <span className="text-xs text-slate-400 font-mono">Lagos Wholesale Spot Prices (₦)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              <span>Naira Material Price Tracker & AI Procurement Advisor</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Monitors local supply chain inflation across Lagos depots (Alaba, Epe, Ibese, Mile 2). AI predicts price movements and calculates "Buy Now vs Wait" purchasing arbitrage.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#0B0F14] p-1 rounded-xl border border-[#232C3B] self-start lg:self-auto">
            {(['30d', '60d', '90d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  selectedTimeframe === tf
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.toUpperCase()} Trend
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured AI Recommendation Hero Card */}
      <div className="rounded-3xl border border-amber-500/50 bg-gradient-to-br from-amber-950/30 via-[#121821] to-[#0B0F14] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                AI CAPITAL PRESERVATION INTELLIGENCE
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                {selectedCommodity.confidence}% Confidence
              </span>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {selectedCommodity.aiVerdict === 'BUY_NOW' ? '⚡ Urgent Buying Window: ' : '⚖️ Market Position: '}
                {selectedCommodity.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {selectedCommodity.reasoning}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="bg-[#0B0F14] px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-500">Current Spot: </span>
                <span className="font-bold text-white">₦{selectedCommodity.currentPrice.toLocaleString()} / {selectedCommodity.unit}</span>
              </div>
              <div className="bg-[#0B0F14] px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-500">30d Velocity: </span>
                <span className={`font-bold ${selectedCommodity.change30d > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedCommodity.change30d > 0 ? `+${selectedCommodity.change30d}%` : `${selectedCommodity.change30d}%`}
                </span>
              </div>
              <div className="bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800 text-emerald-300 font-bold">
                Potential Savings: ₦{(selectedCommodity.estimatedSavings / 1e6).toFixed(2)}M
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => handle1ClickPo(selectedCommodity)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Lock Order for {selectedCommodity.recommendedVolume.toLocaleString()} {selectedCommodity.unit}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Commodity Price Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commodities.map((c) => {
          const isSelected = selectedCommodityId === c.id;
          const isUp = c.change30d > 0;

          return (
            <div
              key={c.id}
              onClick={() => setSelectedCommodityId(c.id)}
              className={`p-5 rounded-2xl bg-[#121821] border transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:border-emerald-500/40 ${
                isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl' : 'border-[#232C3B]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    {c.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      c.aiVerdict === 'BUY_NOW'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : c.aiVerdict === 'HOLD'
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    AI: {c.aiVerdict.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{c.name}</h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">Unit: {c.unit}</div>
                </div>
              </div>

              {/* Price & Trend Sparkline */}
              <div className="pt-2 border-t border-[#232C3B] flex items-end justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Lagos Spot Price</div>
                  <div className="text-xl font-black font-mono text-white mt-0.5">
                    ₦{c.currentPrice.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono mt-0.5">
                    {isUp ? (
                      <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className={isUp ? 'text-rose-400' : 'text-emerald-400'}>
                      {isUp ? `+${c.change30d}%` : `${c.change30d}%`} (30d)
                    </span>
                  </div>
                </div>

                {/* Mini Visual Sparkline */}
                <div className="w-24 h-10 flex items-end gap-1.5 pb-1">
                  {c.sparkline.map((val, idx) => {
                    const min = Math.min(...c.sparkline);
                    const max = Math.max(...c.sparkline);
                    const range = max - min || 1;
                    const pct = Math.max(15, Math.round(((val - min) / range) * 100));

                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-sm ${
                          isUp ? 'bg-amber-500/70 hover:bg-amber-400' : 'bg-emerald-500/70 hover:bg-emerald-400'
                        }`}
                        style={{ height: `${pct}%` }}
                        title={`Point ${idx + 1}: ₦${val.toLocaleString()}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
