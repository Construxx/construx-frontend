import React, { useState } from 'react';
import {
  Boxes,
  Truck,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  PackageCheck,
  Building,
  Star,
  Phone,
  Mail,
  History,
  Tag,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Material, PurchaseOrder, InventoryLog, Supplier, AIAlert, Project } from '../../types';
import { PriceTrackerView } from '../supply/PriceTrackerView';
import { SyncStatusBadge } from '../offline/SyncStatusBadge';

interface ProcurementViewProps {
  project: Project;
  materials: Material[];
  purchaseOrders: PurchaseOrder[];
  inventoryLogs: InventoryLog[];
  suppliers: Supplier[];
  alerts: AIAlert[];
  onCreatePO: (data: { materialId: string; supplierId: string; quantity: number; unitCost?: number; notes?: string }) => void;
  onRecordDelivery: (data: { materialId: string; quantityReceived: number; poId?: string; notes?: string }) => void;
  onAiSuggest: (materialId: string) => void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  project,
  materials,
  purchaseOrders,
  inventoryLogs,
  suppliers,
  alerts,
  onCreatePO,
  onRecordDelivery,
  onAiSuggest,
}) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'prices' | 'receiving' | 'purchase_orders' | 'suppliers' | 'inventory_logs'>('materials');
  const [searchTerm, setSearchTerm] = useState('');

  // Wow #1 Delivery Receiving Ripple State
  const [rippleActive, setRippleActive] = useState(false);
  const [rippleDone, setRippleDone] = useState(false);

  // Modals
  const [showCreatePoModal, setShowCreatePoModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  // Form states for Create PO
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [orderQuantity, setOrderQuantity] = useState(3400);
  const [orderNotes, setOrderNotes] = useState('Expedited order for Level 4 electrical installation.');

  // Form states for Record Delivery
  const [deliveryMaterialId, setDeliveryMaterialId] = useState(materials[0]?.id || '');
  const [deliveryQty, setDeliveryQty] = useState(3400);
  const [deliveryNotes, setDeliveryNotes] = useState('Delivery verified and stored in Floor 1 secure warehouse.');

  // Check if cable shortage alert exists
  const cableAlert = alerts.find(
    (a) => a.type === 'procurement_deficit' && !a.resolved
  );

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAiPo = (mat: Material) => {
    setSelectedMaterialId(mat.id);
    const deficit = Math.max(0, mat.quantityRequired - mat.quantityDelivered);
    setOrderQuantity(deficit > 0 ? deficit : 1000);
    const prefSupplier = suppliers.find((s) => s.preferred) || suppliers[0];
    setSelectedSupplierId(prefSupplier.id);
    setOrderNotes(`Pre-filled via CONSTRUX AI Suggestion to cover ${deficit} ${mat.unit} deficit.`);
    setShowCreatePoModal(true);
  };

  const handleOpenDelivery = (mat: Material) => {
    setDeliveryMaterialId(mat.id);
    const deficit = Math.max(0, mat.quantityRequired - mat.quantityDelivered);
    setDeliveryQty(deficit > 0 ? deficit : 500);
    setShowDeliveryModal(true);
  };

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    const mat = materials.find((m) => m.id === selectedMaterialId);
    onCreatePO({
      materialId: selectedMaterialId,
      supplierId: selectedSupplierId,
      quantity: Number(orderQuantity),
      unitCost: mat?.unitCost,
      notes: orderNotes,
    });
    setShowCreatePoModal(false);
  };

  const handleSubmitDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    onRecordDelivery({
      materialId: deliveryMaterialId,
      quantityReceived: Number(deliveryQty),
      notes: deliveryNotes,
    });
    setShowDeliveryModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Supply OS Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full">
                SUPPLY OS // PROCUREMENT ENGINE
              </span>
              <span className="text-xs text-slate-400 font-mono">Project: {project.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Materials & Supply Chain Control
            </h1>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Automated inventory management directly tied to construction milestone consumption. Deliveries update site stock in real-time and transition to digital twin asset specs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const cableMat = materials.find((m) => m.name.toLowerCase().includes('cable'));
                if (cableMat) handleOpenAiPo(cableMat);
                else setShowCreatePoModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/40 border border-cyan-400/40 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>

            <button
              onClick={() => {
                const cableMat = materials.find((m) => m.name.toLowerCase().includes('cable'));
                if (cableMat) handleOpenDelivery(cableMat);
                else setShowDeliveryModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>Record Site Delivery</span>
            </button>
          </div>
        </div>

        {/* Procurement KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Material Lines</div>
            <div className="text-xl font-bold text-white mt-1">{materials.length} Packages</div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">1 Critical Shortage</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Purchase Orders</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">{purchaseOrders.length} Orders</div>
            <div className="text-[10px] font-mono text-emerald-400 mt-1">
              {purchaseOrders.filter((p) => p.status === 'delivered').length} Fulfilled
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Vetted Suppliers</div>
            <div className="text-xl font-bold text-white mt-1">{suppliers.length} Vendors</div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">2 Preferred Partners</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Audit Handshake</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{inventoryLogs.length} Verified Logs</div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">100% Traceable to Tasks</div>
          </div>
        </div>
      </div>

      {/* AI Procurement Suggestion / Deficit Alert Banner */}
      {cableAlert && (
        <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-5 shadow-xl shadow-cyan-950/20 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                    AI PROCUREMENT SUGGESTION
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Inventory Alert #AL-01</span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">{cableAlert.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{cableAlert.message}</p>
                <div className="text-xs text-cyan-200/90 font-medium pt-1">
                  <strong>Recommendation:</strong> {cableAlert.recommendation}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const cableMat = materials.find((m) => m.name.toLowerCase().includes('cable'));
                if (cableMat) handleOpenAiPo(cableMat);
              }}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-transform active:scale-95"
            >
              <span>1-Click Generate PO (3,400m)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          {(
            [
              { key: 'materials', label: `Materials Inventory (${materials.length})`, icon: Boxes },
              { key: 'prices', label: 'Naira Price Desk', icon: DollarSign },
              { key: 'receiving', label: 'Delivery Receiving (Wow #1)', icon: PackageCheck },
              { key: 'purchase_orders', label: `Purchase Orders (${purchaseOrders.length})`, icon: Truck },
              { key: 'suppliers', label: `Suppliers Directory (${suppliers.length})`, icon: Building },
              { key: 'inventory_logs', label: `Audit Trail (${inventoryLogs.length})`, icon: History },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: 1. MATERIALS INVENTORY TABLE */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 w-72 text-xs">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search materials or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white placeholder-slate-500 focus:outline-none w-full"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Displaying {filteredMaterials.length} inventory records
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Material & Category</th>
                  <th className="p-3.5">Required</th>
                  <th className="p-3.5">Delivered</th>
                  <th className="p-3.5">On-Site Stock</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Est. Unit Cost</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMaterials.map((mat) => {
                  const isShortage = mat.status === 'critical_shortage';
                  const isLow = mat.status === 'low_stock';
                  const fulfilledPercent = Math.min(100, Math.round((mat.quantityDelivered / mat.quantityRequired) * 100));

                  return (
                    <tr
                      key={mat.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isShortage ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{mat.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-cyan-400">{mat.category}</span>
                          <span>•</span>
                          <span>Lead time: {mat.leadTimeDays} days</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-300">
                        {mat.quantityRequired.toLocaleString()} {mat.unit}
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono text-slate-200">
                          {mat.quantityDelivered.toLocaleString()} {mat.unit}
                        </div>
                        <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              fulfilledPercent >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${fulfilledPercent}%` }}
                          />
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-amber-300">
                        {mat.currentStock.toLocaleString()} {mat.unit}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold border ${
                            isShortage
                              ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                              : isLow
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {mat.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-300">
                        ₦{mat.unitCost.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        {isShortage ? (
                          <button
                            onClick={() => handleOpenAiPo(mat)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold shadow transition-transform active:scale-95"
                          >
                            AI Suggest PO
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAiPo(mat)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                          >
                            New PO
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDelivery(mat)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] font-semibold transition-colors"
                        >
                          Receive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NAIRA PRICE DESK */}
      {activeTab === 'prices' && (
        <PriceTrackerView
          materials={materials}
          suppliers={suppliers}
          onCreatePO={onCreatePO}
        />
      )}

      {/* TAB CONTENT: DELIVERY RECEIVING (Wow #1 Ripple Moment) */}
      {activeTab === 'receiving' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-[#121821] border border-[#232C3B] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                    QA WAYBILL & RECEIVING PROTOCOL
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Dock: Victoria Heights Floor 1 Warehouse</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                  <PackageCheck className="w-6 h-6 text-emerald-400" />
                  <span>Delivery Receiving & Cross-Pillar Telemetry Ripple</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Confirming a delivery triggers an automated synchronized ripple: site inventory updates, procurement order marks delivered, project materials health jumps, and active schedule risk flags clear.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B0F14] border border-[#232C3B] text-xs font-mono self-start sm:self-auto">
                <div className="text-[10px] text-slate-500 uppercase">Receiving Gate</div>
                <div className="text-emerald-400 font-bold mt-0.5">Bay #1 (Active Staging)</div>
              </div>
            </div>
          </div>

          {/* Ripple Animated Success Banner if Triggered */}
          {rippleActive && (
            <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-950/40 p-6 shadow-2xl text-emerald-200 animate-in fade-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono font-bold text-sm text-emerald-300">
                  <Zap className="w-5 h-5 text-emerald-400 fill-current animate-pulse" />
                  <span>CROSS-PILLAR RIPPLE PROPAGATED IN REAL TIME</span>
                </div>
                <span className="text-xs font-mono bg-emerald-900 px-2.5 py-0.5 rounded-full text-emerald-200 font-bold">
                  TELEMETRY SYNC 100%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400 uppercase">1. Site Inventory</div>
                  <div className="text-base font-black text-white mt-0.5">600m → 4,000m</div>
                  <div className="text-[10px] text-emerald-400">+3,400m Cable Staged</div>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400 uppercase">2. Materials Delivered</div>
                  <div className="text-base font-black text-white mt-0.5">74% → 98%</div>
                  <div className="text-[10px] text-emerald-400">Adequate for Superstructure</div>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400 uppercase">3. PO Status</div>
                  <div className="text-base font-black text-white mt-0.5">IN TRANSIT → DELIVERED</div>
                  <div className="text-[10px] text-emerald-400">ABC Electrical PO #094</div>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400 uppercase">4. AI Schedule Risk</div>
                  <div className="text-base font-black text-emerald-300 mt-0.5">ALERT RESOLVED</div>
                  <div className="text-[10px] text-emerald-400">Critical Path Cleared</div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Delivery Card */}
          <div className="bg-[#121821] border border-[#232C3B] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232C3B] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                  INCOMING CONSIGNMENT // PO-VH-094
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Electrical Armoured Cable (4-Core 16mm² Cu/XLPE/SWA/PVC)
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Consignor: ABC Electrical Supplies Ltd (Alaba Depot) • Truck: LAGOS-489-KJA
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-[10px] text-slate-500 uppercase">Quantity Staged</div>
                <div className="text-xl font-black text-cyan-300">3,400 Meters</div>
                <div className="text-xs text-emerald-400">Covers 100% of Deficit</div>
              </div>
            </div>

            {/* Quality Checklist */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                Mandatory Receiving Gate Verification
              </div>

              <div className="space-y-2 text-xs text-slate-200">
                <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#232C3B] flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Physical drum seal inspection verified intact; zero mechanical abrasion on outer PVC sheath.</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#232C3B] flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Electrical insulation test (Megger 1000V) certificate matched with serial batch #AB-2026-88.</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#232C3B] flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Material tagged with CONSTRUX QR barcode for permanent lifecycle warranty traceability into BuildTwin.</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setRippleActive(true);
                  const cableMat = materials.find((m) => m.name.toLowerCase().includes('cable')) || materials[0];
                  onRecordDelivery({
                    materialId: cableMat.id,
                    quantityReceived: 3400,
                    notes: 'Verified and accepted at Victoria Heights Bay 1 warehouse. Cross-pillar telemetry ripple updated.',
                  });
                  setTimeout(() => setRippleDone(true), 4000);
                }}
                disabled={rippleActive}
                className={`w-full py-4 px-6 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
                  rippleActive
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-950/50'
                }`}
              >
                {rippleActive ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Delivery Confirmed! All Cross-Pillar Telemetry Synchronized</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-5 h-5" />
                    <span>Confirm Delivery & Execute Cross-Pillar Ripple (Wow #1)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. PURCHASE ORDERS */}
      {activeTab === 'purchase_orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Material</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Quantity</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Ordered Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {purchaseOrders.map((po) => {
                const isDelivered = po.status === 'delivered';

                return (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-cyan-300">{po.poNumber}</td>
                    <td className="p-3.5 font-semibold text-white">{po.materialName}</td>
                    <td className="p-3.5 text-slate-300">{po.supplierName}</td>
                    <td className="p-3.5 font-mono text-slate-200">{po.quantity.toLocaleString()}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">
                      ₦{po.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(po.orderedAt).toLocaleDateString()}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold border ${
                            isDelivered
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          }`}
                        >
                          {po.status}
                        </span>
                        <SyncStatusBadge
                          status={(po as any)._syncStatus}
                          isOfflineCreated={(po as any)._isOfflineCreated}
                        />
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      {!isDelivered ? (
                        <button
                          onClick={() => {
                            const mat = materials.find((m) => m.id === po.materialId);
                            if (mat) {
                              onRecordDelivery({
                                materialId: mat.id,
                                quantityReceived: po.quantity,
                                poId: po.id,
                                notes: `Fulfillment of ${po.poNumber}`,
                              });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow"
                        >
                          Accept Delivery
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500">Fulfilled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: 3. SUPPLIER DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{sup.name}</span>
                    {sup.preferred && (
                      <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                        PREFERRED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold font-mono">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{sup.rating}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 mt-1">{sup.location}</div>

                <div className="my-3 space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-cyan-400 font-mono text-[11px]">{sup.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Standard Lead Time: {sup.leadTimeDays} business days</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5">Materials Supplied:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sup.materialsSupplied.map((mat, i) => (
                      <span key={i} className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedSupplierId(sup.id);
                    setShowCreatePoModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Issue RFQ / Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: 4. INVENTORY AUDIT LOGS */}
      {activeTab === 'inventory_logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Immutable Inventory Audit Trail</h3>
              <p className="text-xs text-slate-400">
                Log entries recording deliveries, material distributions to project tasks, and stock reconciliations
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {inventoryLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{log.materialName}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      +{log.changeQty.toLocaleString()} units
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">{log.reason}</p>
                  <div className="text-[10px] font-mono text-slate-400">
                    Logged by {log.author} • {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-slate-400">Previous: {log.previousStock.toLocaleString()}</div>
                  <div className="text-amber-400 font-bold">New Stock: {log.newStock.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER */}
      {showCreatePoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-cyan-400" />
              <span>Issue Purchase Order (Supply OS)</span>
            </h3>

            <form onSubmit={handleSubmitPO} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Select Material Package</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stock: {m.currentStock} / Req: {m.quantityRequired})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Preferred Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.location} - {s.leadTimeDays}d lead time)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Order Quantity</label>
                <input
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  required
                  min={1}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Order Notes / Justification</label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreatePoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md"
                >
                  Authorize & Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD DELIVERY */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              <span>Record Site Material Delivery</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Receiving this delivery immediately updates on-site stock and automatically clears active procurement shortage alerts!
            </p>

            <form onSubmit={handleSubmitDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Material Package</label>
                <select
                  value={deliveryMaterialId}
                  onChange={(e) => setDeliveryMaterialId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Delivered: {m.quantityDelivered} / Needed: {m.quantityRequired})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Quantity Received</label>
                <input
                  type="number"
                  value={deliveryQty}
                  onChange={(e) => setDeliveryQty(Number(e.target.value))}
                  required
                  min={1}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Waybill & Staging Area Notes</label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md"
                >
                  Confirm Delivery & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
