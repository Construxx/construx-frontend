import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Building2,
  ShieldCheck,
  QrCode,
  Printer,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Building, Project } from '../../types';

interface HandoverCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building;
  project?: Project;
}

export const HandoverCertificateModal: React.FC<HandoverCertificateModalProps> = ({
  isOpen,
  onClose,
  building,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<'certificate' | 'qr_tags'>('certificate');

  if (!isOpen) return null;

  const equipmentQrList = [
    {
      id: 'eq-1',
      room: 'Room 204 (Floor 2 Executive Suite)',
      name: 'Daikin VRV Condensing Unit RXQ16T',
      category: 'HVAC Mechanical',
      serial: 'DKN-VRV-2026-0941',
      specUrl: 'https://construx.internal/twin/rm-204/equipment/eq-1',
      warranty: 'Valid through 28 Oct 2028',
    },
    {
      id: 'eq-2',
      room: 'Room 204 (Floor 2 Executive Suite)',
      name: 'Schneider Electric 3-Phase Distribution Board (DB-L4)',
      category: 'Electrical LV',
      serial: 'SE-ACTI9-415V-882',
      specUrl: 'https://construx.internal/twin/rm-204/equipment/eq-2',
      warranty: 'Valid through 15 Nov 2031',
    },
    {
      id: 'eq-3',
      room: 'Ground Floor Plant Room',
      name: 'Grundfos Hydro Multi-E Booster Pump Set',
      category: 'Plumbing & Fire',
      serial: 'GF-HME-98721',
      specUrl: 'https://construx.internal/twin/ground/equipment/eq-3',
      warranty: 'Valid through 12 Dec 2029',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121821] border border-[#232C3B] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232C3B] bg-[#0B0F14]/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>CONSTRUX Lifecycle Handover Certificate</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                  VERIFIED DEED
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Asset: {building.name} • Ref: {building.handoverContractRef}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('certificate')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'certificate' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Official Deed
              </button>
              <button
                onClick={() => setActiveTab('qr_tags')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'qr_tags' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Asset QR Codes (3)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'certificate' ? (
            <div className="bg-[#0B0F14] border-2 border-amber-500/40 rounded-3xl p-8 relative overflow-hidden shadow-2xl text-slate-200">
              {/* Decorative Certificate Watermark Seal */}
              <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-amber-500/5 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-amber-500/20 flex items-center justify-center">
                  <Award className="w-24 h-24 text-amber-500/10" />
                </div>
              </div>

              {/* Certificate Header */}
              <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  <ShieldCheck className="w-4 h-4" />
                  <span>CONSTRUX CERTIFICATE OF PRACTICAL COMPLETION & DIGITAL TWIN DEED</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide pt-2">
                  CERTIFICATE OF HANDOVER
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Issued under the Lagos State Urban Planning & Building Control Regulations • Deed Ref: {building.handoverContractRef}
                </p>
              </div>

              {/* Certificate Body Paragraphs */}
              <div className="py-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>
                  This is to formally certify that the high-rise structure known as{' '}
                  <strong className="text-white text-base">{building.name}</strong>, comprising{' '}
                  <strong className="text-white">{building.totalFloors} suspended floors</strong> and{' '}
                  <strong className="text-white">{building.totalAreaSqm.toLocaleString()} m²</strong> of gross floor area,
                  situated in Victoria Island, Lagos, has completed all mandatory structural, MEP rough-in, life safety,
                  and architectural finishing protocols.
                </p>
                <p>
                  Pursuant to CONSTRUX operating system standards, all construction tasks, supplier warranties, material test certificates, and as-built BIM records have been digitally bound and transferred directly into the <strong>BuildTwin Digital Twin Operating Model</strong>.
                </p>
              </div>

              {/* Specifications Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-500">General Contractor</div>
                  <div className="font-bold text-white mt-0.5">Julius Berger & Cappa JV</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Handover Date</div>
                  <div className="font-bold text-emerald-400 mt-0.5">28 September 2026</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Building Energy Rating</div>
                  <div className="font-bold text-cyan-400 mt-0.5">{building.energyRating}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Initial Twin Health</div>
                  <div className="font-bold text-purple-400 mt-0.5">{building.healthScore}% Optimal</div>
                </div>
              </div>

              {/* Signatures & Seal Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 mt-6 border-t-2 border-slate-800 text-center font-mono">
                <div className="space-y-1">
                  <div className="h-10 flex items-center justify-center text-amber-300 font-serif italic text-base">
                    Babatunde Adeyemi
                  </div>
                  <div className="border-t border-slate-700 pt-1 text-xs font-bold text-white">Engr. Babatunde Adeyemi</div>
                  <div className="text-[10px] text-slate-500">Lead Structural & Site Engineer</div>
                </div>

                <div className="space-y-1">
                  <div className="h-10 flex items-center justify-center text-cyan-300 font-serif italic text-base">
                    David Sterling
                  </div>
                  <div className="border-t border-slate-700 pt-1 text-xs font-bold text-white">David Sterling</div>
                  <div className="text-[10px] text-slate-500">Facility & Digital Twin Director</div>
                </div>

                <div className="space-y-1 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-400/60 flex items-center justify-center text-amber-400 bg-amber-400/10">
                    <Award className="w-7 h-7" />
                  </div>
                  <div className="text-[9px] text-amber-300 uppercase tracking-widest mt-1">CONSTRUX OS SEAL</div>
                </div>
              </div>
            </div>
          ) : (
            /* QR Code Tags Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200">
                Each room and major MEP asset in {building.name} carries a tamper-evident physical QR code badge linking technicians directly to live sensor telemetry, supplier purchase order records, and maintenance logs in BuildTwin.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {equipmentQrList.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#0B0F14] border border-[#232C3B] flex flex-col justify-between space-y-4 text-center items-center shadow-lg hover:border-purple-500/40 transition-colors"
                  >
                    {/* Simulated SVG QR Code */}
                    <div className="w-32 h-32 p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950">
                        {/* QR Matrix Pattern Mock */}
                        <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                        <rect x="5" y="5" width="20" height="20" fill="white" />
                        <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                        <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                        <rect x="75" y="5" width="20" height="20" fill="white" />
                        <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                        <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                        <rect x="5" y="75" width="20" height="20" fill="white" />
                        <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                        {/* Random Data Dots */}
                        <rect x="40" y="10" width="10" height="10" fill="currentColor" />
                        <rect x="55" y="15" width="8" height="8" fill="currentColor" />
                        <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                        <rect x="15" y="45" width="10" height="10" fill="currentColor" />
                        <rect x="75" y="45" width="15" height="10" fill="currentColor" />
                        <rect x="45" y="75" width="15" height="15" fill="currentColor" />
                        <rect x="70" y="70" width="20" height="10" fill="currentColor" />
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-purple-400 uppercase font-bold">{item.category}</div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.room}</div>
                      <div className="text-[10px] font-mono text-slate-500">Serial: {item.serial}</div>
                    </div>

                    <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      {item.warranty}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#0B0F14] border-t border-[#232C3B] flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">
            Hash: SHA256-VH2026-98AC74B-BUILDTWIN
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Deed</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/50"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
