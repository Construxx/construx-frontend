import React, { useState } from 'react';
import {
  Building2,
  Cpu,
  Layers,
  Thermometer,
  Zap,
  Wind,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  Activity,
  Droplets,
  Gauge,
  Link as LinkIcon,
  Clock,
  UserCheck,
  Award,
  QrCode,
} from 'lucide-react';
import { Building, Floor, Room, Equipment, BuildingSystem, MaintenanceTask, AIAlert } from '../../types';
import { HandoverCertificateModal } from '../operate/HandoverCertificateModal';

interface BuildTwinViewProps {
  building: Building;
  floors: Floor[];
  rooms: Room[];
  equipment: Equipment[];
  systems: BuildingSystem[];
  maintenance: MaintenanceTask[];
  alerts: AIAlert[];
  onCreateMaintenance: (data: {
    roomId: string;
    equipmentId?: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    assignedTo?: string;
    originAiAlertId?: string;
  }) => void;
  onUpdateMaintenance: (taskId: string, status: any) => void;
}

export const BuildTwinView: React.FC<BuildTwinViewProps> = ({
  building,
  floors,
  rooms,
  equipment,
  systems,
  maintenance,
  alerts,
  onCreateMaintenance,
  onUpdateMaintenance,
}) => {
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeRoomTab, setActiveRoomTab] = useState<'equipment' | 'systems' | 'maintenance'>('equipment');

  // New maintenance task modal
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const currentFloor = floors.find((f) => f.floorNumber === selectedFloorNumber) || floors[0];
  const floorRooms = rooms.filter((r) => r.floorId === currentFloor?.id);
  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || floorRooms[0] || rooms[0];

  const roomEquipment = equipment.filter((e) => e.roomId === currentRoom?.id);
  const roomSystems = systems.filter((s) => s.roomId === currentRoom?.id);
  const roomMaintenance = maintenance.filter((m) => m.roomId === currentRoom?.id);
  const roomAlerts = alerts.filter(
    (a) => a.buildingId === building.id && a.metadata?.roomNumber === currentRoom?.roomNumber && !a.resolved
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;

    const matchedAlert = alerts.find(
      (a) => a.metadata?.roomNumber === currentRoom.roomNumber && !a.resolved
    );

    onCreateMaintenance({
      roomId: currentRoom.id,
      equipmentId: roomEquipment[0]?.id,
      title: newTitle,
      description: newDesc,
      originAiAlertId: matchedAlert?.id,
    });

    setShowNewTaskModal(false);
  };

  const handle1ClickAiMaintenance = () => {
    if (!currentRoom) return;
    onCreateMaintenance({
      roomId: currentRoom.id,
      equipmentId: roomEquipment[1]?.id || roomEquipment[0]?.id,
      title: 'Maintenance recommended by alert',
      description: roomAlerts[0]?.message ?? 'Review and service this equipment based on its recorded maintenance dates.',
      originAiAlertId: roomAlerts[0]?.id,
    });
  };

  return (
    <div className="space-y-6">
      {/* BuildTwin Master Operating Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                BUILDTWIN // DIGITAL OPERATING LAYER
              </span>
              {building.handoverContractRef && <span className="text-xs text-slate-400 font-mono">Contract: {building.handoverContractRef}</span>}
              <span className="text-slate-600">•</span>
              {building.energyRating && <span className="text-xs text-emerald-400 font-semibold">{building.energyRating}</span>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              {building.name}
              <span className="text-sm font-normal text-slate-400 font-mono">
                ({building.totalFloors} Floors • {building.totalAreaSqm.toLocaleString()} m²)
              </span>
            </h1>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Active Digital Twin instantiated from construction handover. Equipment, MEP systems, and room specifications carry permanent traceability back to procurement and field installation records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <button
              onClick={() => setShowCertModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/50 text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
              title="Inspect verified Handover Certificate and QR Equipment Tags"
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span>Handover Deed & QR Tags</span>
            </button>

            <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Unresolved Alerts</div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">{building.activeAlertsCount}</div>
                <div className="text-[10px] font-mono text-emerald-300">Recorded by the API</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800/80 pt-4 text-xs text-slate-400" role="status">
          Live temperature, energy, air-quality, and fire-panel telemetry is not available because no sensor integration is configured.
        </div>
      </div>

      {/* AI Preventive Maintenance Recommendation Banner */}
      {roomAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-5 shadow-xl shadow-amber-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full font-bold">
                    BUILDTWIN AI PREVENTIVE MAINTENANCE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Selected Room Context</span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">{roomAlerts[0].title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{roomAlerts[0].message}</p>
                <div className="text-xs text-amber-200/90 font-medium pt-1">
                  <strong>Action Recommended:</strong> {roomAlerts[0].recommendation}
                </div>
              </div>
            </div>

            <button
              onClick={handle1ClickAiMaintenance}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-transform active:scale-95"
            >
              <span>1-Click Dispatch Work Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Digital Twin Grid: Vertical Floor Selector + Room Grid + Room Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vertical Floor Stack Selector (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Floor Stack</div>
            <span className="text-[10px] font-mono text-slate-500">{floors.length} Levels</span>
          </div>

          <div className="space-y-1 max-h-[560px] overflow-y-auto pr-1">
            {floors.map((fl) => {
              const isSelected = fl.floorNumber === selectedFloorNumber;
              const hasAlert = fl.status === 'alert';

              return (
                <button
                  key={fl.id}
                  onClick={() => {
                    setSelectedFloorNumber(fl.floorNumber);
                    const roomsForFl = rooms.filter((r) => r.floorId === fl.id);
                    if (roomsForFl.length > 0) {
                      setSelectedRoomId(roomsForFl[0].id);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/60 shadow-md text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                        isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {fl.floorNumber === 0 ? 'G' : fl.floorNumber === 12 ? 'R' : fl.floorNumber}
                    </span>
                    <div className="text-xs truncate max-w-[130px]">
                      {fl.floorNumber === 0
                        ? 'Ground Lobby'
                        : fl.floorNumber === 12
                        ? 'Rooftop Plant'
                        : `Floor ${fl.floorNumber}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasAlert && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Maintenance Notice" />
                    )}
                    <span className="text-[10px] font-mono text-slate-500">{fl.totalRooms} rms</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center & Right Column: Interactive Room Grid + Room Detail Panel (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Spatial Room Selector on Current Floor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Level {selectedFloorNumber} Spatial Map</span>
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    ({floorRooms.length} Active Zones)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Click a room to inspect live equipment, MEP telemetry, and maintenance records</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {floorRooms.map((rm) => {
                const isSelected = rm.id === currentRoom?.id;
                const isRoom204 = rm.roomNumber === '204';
                const hasNotice = isRoom204 && roomAlerts.length > 0;

                return (
                  <button
                    key={rm.id}
                    onClick={() => setSelectedRoomId(rm.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/80 shadow-lg text-white ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    {hasNotice && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}

                    <div className="text-[10px] font-mono uppercase text-slate-400">Room {rm.roomNumber}</div>
                    <div className="text-xs font-bold text-white truncate mt-0.5">{rm.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-2 flex items-center justify-between">
                      <span>{rm.temperature}°C</span>
                      <span>{rm.powerLoadKw} kW</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Room Twin Inspector */}
          {currentRoom && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Room Header with Traceability Banner */}
              <div className="space-y-3 pb-5 border-b border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
                        ROOM {currentRoom.roomNumber}
                      </span>
                      <span className="text-xs text-slate-400 font-mono uppercase">{currentRoom.type}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">{currentRoom.name}</h2>
                  </div>

                  <button
                    onClick={() => setShowNewTaskModal(true)}
                    className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Create Work Order</span>
                  </button>
                </div>

                {/* The Legendary Lifecycle Traceability Banner */}
                {currentRoom.handoverOriginTask && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
                    <LinkIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-300">Construction Handshake Traceability:</span>{' '}
                      <span className="text-slate-300">{currentRoom.handoverOriginTask}</span>
                    </div>
                  </div>
                )}

                {/* Live Room Telemetry Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Room Temp</div>
                    <div className="font-bold text-white mt-0.5">{currentRoom.temperature} °C</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Relative Humidity</div>
                    <div className="font-bold text-white mt-0.5">{currentRoom.humidity} %</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Zone Power Demand</div>
                    <div className="font-bold text-amber-300 mt-0.5">{currentRoom.powerLoadKw} kW</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Air Quality Index</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{currentRoom.airQualityIndex} AQI</div>
                  </div>
                </div>
              </div>

              {/* Inspector Sub-Tabs: Equipment, Systems, Maintenance */}
              <div className="flex items-center gap-1 border-b border-slate-800 pb-px">
                {(
                  [
                    { key: 'equipment', label: `Equipment Registry (${roomEquipment.length})`, icon: Cpu },
                    { key: 'systems', label: `Building Systems (${roomSystems.length})`, icon: Layers },
                    { key: 'maintenance', label: `Maintenance Logs (${roomMaintenance.length})`, icon: Wrench },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeRoomTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveRoomTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                        isActive
                          ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* SUBTAB 1: EQUIPMENT REGISTRY */}
              {activeRoomTab === 'equipment' && (
                <div className="space-y-3">
                  {roomEquipment.map((eq) => {
                    const isOptimal = eq.status === 'optimal';
                    const isWarning = eq.status === 'warning';

                    return (
                      <div
                        key={eq.id}
                        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isWarning
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{eq.name}</span>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                                isOptimal
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`}
                            >
                              {eq.status}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 font-mono">
                            Model: {eq.model} • S/N: {eq.serialNumber} • Rating: {eq.powerRating}
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                            {eq.lastMaintenance && <span>Last Service: {new Date(eq.lastMaintenance).toLocaleDateString()}</span>}
                            {eq.nextMaintenance && <span className={isWarning ? 'text-amber-300 font-bold' : ''}>Next Service: {new Date(eq.nextMaintenance).toLocaleDateString()}</span>}
                            {!eq.lastMaintenance && !eq.nextMaintenance && <span>Maintenance dates not recorded</span>}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isWarning && (
                            <button
                              onClick={handle1ClickAiMaintenance}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
                            >
                              Service Unit
                            </button>
                          )}
                          {eq.model && <span className="px-2.5 py-1.5 text-slate-400 text-xs">Model {eq.model}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SUBTAB 2: SYSTEMS */}
              {activeRoomTab === 'systems' && (
                <div className="space-y-3">
                  {roomSystems.map((sys) => (
                    <div key={sys.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{sys.name}</span>
                          <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {sys.type}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                            sys.status === 'optimal'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {sys.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                        {Object.entries(sys.metrics).map(([k, v]) => (
                          <div key={k} className="p-2 rounded bg-slate-900 border border-slate-800/80">
                            <div className="text-[9px] text-slate-400 uppercase">{k.replace(/([A-Z])/g, ' $1')}</div>
                            <div className="font-semibold text-slate-200 mt-0.5">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SUBTAB 3: MAINTENANCE LOGS */}
              {activeRoomTab === 'maintenance' && (
                <div className="space-y-3">
                  {roomMaintenance.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-slate-800 rounded-xl">
                      No maintenance work orders recorded for {currentRoom.name}.
                    </div>
                  ) : (
                    roomMaintenance.map((m) => {
                      const isCompleted = m.status === 'completed';

                      return (
                        <div
                          key={m.id}
                          className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{m.title}</span>
                            </div>
                            <p className="text-xs text-slate-300 font-sans">{m.description}</p>
                            <div className="text-[10px] font-mono text-slate-400">
                              {m.assignedTo && `Assigned to ${m.assignedTo}`}{m.assignedTo && m.dueDate ? ' • ' : ''}{m.dueDate ? `Due ${new Date(m.dueDate).toLocaleDateString()}` : 'No due date'}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isCompleted ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>COMPLETED</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => onUpdateMaintenance(m.id, 'completed')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                              >
                                Mark Completed
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE WORK ORDER MODAL */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              <span>Create Facility Maintenance Ticket</span>
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Ticket Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Work Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <p className="text-xs text-slate-400">The current API stores a description, status, room/equipment, and due date. Priority and technician assignment are not available.</p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Handover Certificate Modal */}
      <HandoverCertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        building={building}
      />
    </div>
  );
};
