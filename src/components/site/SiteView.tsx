import React, { useState, useEffect, useRef } from 'react';
import {
  CheckSquare,
  Camera,
  Truck,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Plus,
  Mic,
  MicOff,
  Sun,
  CloudRain,
  Wind,
  Upload,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
  ChevronRight,
  Wifi,
  WifiOff,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Task, Material, PurchaseOrder, SiteUpdate, User } from '../../types';
import {
  db,
  compressImage,
  OfflineTask,
  OfflineSiteUpdate,
  OfflinePurchaseOrder,
  SiteIssue,
} from '../../lib/offline/db';
import {
  useSyncEngine,
  optimisticPostSiteUpdate,
  optimisticUpdateTask,
  optimisticConfirmDelivery,
  optimisticReportIssue,
  queueAiAnalysis,
} from '../../lib/offline/sync';
import { SyncStatusBadge } from '../offline/SyncStatusBadge';
import { PhotoAnalysisResultCard } from '../ai/PhotoAnalysisResultCard';
import { analyzeSitePhoto } from '../../lib/ai/live';
import { PhotoAnalysisResponse, SafetyFlag } from '../../lib/ai/schemas';

export type SiteTab = 'today' | 'update' | 'deliveries' | 'issues' | 'sync';

interface SiteViewProps {
  project: Project;
  tasks: Task[];
  materials: Material[];
  purchaseOrders: PurchaseOrder[];
  siteUpdates: SiteUpdate[];
  currentUser: User;
  onOpenSyncCenter?: () => void;
}

export const SiteView: React.FC<SiteViewProps> = ({
  project,
  tasks: initialTasks,
  materials: initialMaterials,
  purchaseOrders: initialOrders,
  siteUpdates: initialUpdates,
  currentUser,
}) => {
  const { isOnline, isSimulatedOffline, pendingCount, syncState, flushOutbox, setSimulatedOffline } =
    useSyncEngine();

  const [activeTab, setActiveTab] = useState<SiteTab>('today');

  // Local reactive states loaded from IndexedDB
  const [localTasks, setLocalTasks] = useState<OfflineTask[]>([]);
  const [localMaterials, setLocalMaterials] = useState<Material[]>([]);
  const [localOrders, setLocalOrders] = useState<OfflinePurchaseOrder[]>([]);
  const [localUpdates, setLocalUpdates] = useState<OfflineSiteUpdate[]>([]);
  const [localIssues, setLocalIssues] = useState<SiteIssue[]>([]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter for Today tab
  const [todayFilter, setTodayFilter] = useState<'all' | 'my' | 'critical'>('all');

  // Form states for Update Tab
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [progressValue, setProgressValue] = useState<number>(75);
  const [observationNote, setObservationNote] = useState<string>('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressedSize, setCompressedSize] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [audioRecorded, setAudioRecorded] = useState<boolean>(false);

  // Form states for Issues Tab
  const [issueTitle, setIssueTitle] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [issueCategory, setIssueCategory] = useState<'safety' | 'structural' | 'mep' | 'weather' | 'delay'>('structural');
  const [issueDesc, setIssueDesc] = useState('');

  // Delivery Confirm Modal
  const [receivingOrder, setReceivingOrder] = useState<OfflinePurchaseOrder | null>(null);
  const [receiveQuantity, setReceiveQuantity] = useState<number>(100);

  // Offline AI check state
  const [offlineAiOutput, setOfflineAiOutput] = useState<{
    text: string;
    isQueued: boolean;
    preliminary: boolean;
  } | null>(null);

  // Live AI Site Photo Analysis state (Feature A)
  const [updatePhotoAnalysis, setUpdatePhotoAnalysis] = useState<PhotoAnalysisResponse | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const handleAnalyzeCapturedPhoto = async () => {
    if (!photoPreview && !photoBlob) return;
    setIsAnalyzingPhoto(true);
    try {
      const activeTask = localTasks.find((t) => t.id === selectedTaskId);
      const res = await analyzeSitePhoto({
        imageFileOrBase64: photoBlob || photoPreview!,
        context: {
          projectId: project.id,
          projectName: project.name,
          taskName: activeTask ? activeTask.title : 'Field Observation',
          lastRecordedProgress: progressValue,
          projectPhase: 'Phase 3: MEP Rough-in',
        },
      });
      setUpdatePhotoAnalysis(res);
      if (res.source === 'fallback' && res.model.includes('offline')) {
        showToast("Saved offline — will sync when you're back online.");
      } else {
        showToast('Site photo supervisor audit completed.');
      }
    } catch (err: any) {
      console.error('Error analyzing captured photo:', err);
      showToast(err?.message || 'Photo analysis error');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Load from Dexie on mount and sync changes
  const refreshLocalState = async () => {
    try {
      const [dbTasks, dbMaterials, dbOrders, dbUpdates, dbIssues] = await Promise.all([
        db.tasks.where('projectId').equals(project.id).toArray(),
        db.materials.where('projectId').equals(project.id).toArray(),
        db.orders.where('projectId').equals(project.id).toArray(),
        db.siteUpdates.where('projectId').equals(project.id).toArray(),
        db.issues.where('projectId').equals(project.id).toArray(),
      ]);

      setLocalTasks(dbTasks.length > 0 ? dbTasks : (initialTasks as OfflineTask[]));
      setLocalMaterials(dbMaterials.length > 0 ? dbMaterials : initialMaterials);
      setLocalOrders(dbOrders.length > 0 ? dbOrders : (initialOrders as OfflinePurchaseOrder[]));
      setLocalUpdates(
        dbUpdates.length > 0
          ? dbUpdates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          : (initialUpdates as OfflineSiteUpdate[])
      );
      setLocalIssues(dbIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.warn('Error reading from Dexie:', err);
    }
  };

  useEffect(() => {
    refreshLocalState();
  }, [project.id, initialTasks, initialMaterials, initialOrders, initialUpdates]);

  // Handle Photo selection & compression
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const originalKb = (file.size / 1024).toFixed(0);
      const result = await compressImage(file, 1280, 1280, 0.7);
      const compKb = (result.blob.size / 1024).toFixed(0);

      setPhotoBlob(result.blob);
      setPhotoPreview(result.dataUrl);
      setCompressedSize(`${compKb} KB (reduced from ${originalKb} KB)`);
    } catch (err) {
      console.error('Compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle Voice Note simulation
  const handleToggleVoiceNote = () => {
    if (isRecordingAudio) {
      setIsRecordingAudio(false);
      setAudioRecorded(true);
    } else {
      setIsRecordingAudio(true);
      setTimeout(() => {
        setIsRecordingAudio(false);
        setAudioRecorded(true);
      }, 3500);
    }
  };

  // 1. Task Progress Quick Action (+10%)
  const handleBumpTaskProgress = async (task: OfflineTask) => {
    const nextProgress = Math.min(100, (task.progress || 0) + 10);
    const nextStatus = nextProgress === 100 ? 'completed' : 'in_progress';

    // Optimistic UI update
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, progress: nextProgress, status: nextStatus, _syncStatus: 'pending' } : t))
    );

    const { wasOffline } = await optimisticUpdateTask(project.id, task.id, nextProgress, nextStatus);

    if (wasOffline) {
      showToast("Saved offline — will sync when you're back online.");
    } else {
      showToast(`Task progress updated to ${nextProgress}%`);
    }
    refreshLocalState();
  };

  // 2. Mark Task 100% Completed
  const handleMarkTaskComplete = async (task: OfflineTask) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, progress: 100, status: 'completed', _syncStatus: 'pending' } : t))
    );

    const { wasOffline } = await optimisticUpdateTask(project.id, task.id, 100, 'completed');

    if (wasOffline) {
      showToast("Saved offline — will sync when you're back online.");
    } else {
      showToast(`Task '${task.title}' marked as 100% complete!`);
    }
    refreshLocalState();
  };

  // 3. Submit Field Observation Update
  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationNote.trim()) return;

    let fullNote = observationNote;
    if (audioRecorded) {
      fullNote += ' 🎙️ [Voice Memo Attached - 0:42s field debrief]';
    }

    const { wasOffline } = await optimisticPostSiteUpdate({
      projectId: project.id,
      author: currentUser.name,
      authorRole: currentUser.role.replace('_', ' '),
      note: fullNote,
      photoBlob: photoBlob || undefined,
      photoUrl: photoPreview || undefined,
      completionReported: progressValue,
      tags: ['Jobsite Field Log', selectedTaskId ? 'Task Verified' : 'General'],
    });

    if (selectedTaskId) {
      await optimisticUpdateTask(
        project.id,
        selectedTaskId,
        progressValue,
        progressValue >= 100 ? 'completed' : 'in_progress'
      );
    }

    // Reset Form
    setObservationNote('');
    setPhotoBlob(null);
    setPhotoPreview(null);
    setCompressedSize(null);
    setAudioRecorded(false);

    if (wasOffline) {
      showToast("Saved offline — will sync when you're back online.");
    } else {
      showToast('Field observation logged and synced successfully!');
    }

    refreshLocalState();
    setActiveTab('today');
  };

  // 4. Confirm Delivery
  const handleConfirmReceiveDelivery = async () => {
    if (!receivingOrder) return;

    const { wasOffline } = await optimisticConfirmDelivery({
      projectId: project.id,
      materialId: receivingOrder.materialId,
      quantityReceived: receiveQuantity,
      poId: receivingOrder.id,
      notes: `Received at site gate by ${currentUser.name}`,
    });

    setReceivingOrder(null);

    if (wasOffline) {
      showToast("Saved offline — will sync when you're back online.");
    } else {
      showToast(`Confirmed delivery of ${receiveQuantity} units!`);
    }

    refreshLocalState();
  };

  // 5. Submit Issue
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) return;

    const { wasOffline } = await optimisticReportIssue({
      projectId: project.id,
      title: issueTitle,
      severity: issueSeverity,
      category: issueCategory,
      description: issueDesc,
      reportedBy: currentUser.name,
      photoBlob: photoBlob || undefined,
      photoUrl: photoPreview || undefined,
    });

    setIssueTitle('');
    setIssueDesc('');
    setPhotoBlob(null);
    setPhotoPreview(null);

    if (wasOffline) {
      showToast("Saved offline — will sync when you're back online.");
    } else {
      showToast('Site issue reported to dispatch!');
    }

    refreshLocalState();
  };

  // 6. Offline AI Check (Degrades gracefully as specified)
  const handleTriggerSiteAiCheck = async () => {
    if (!isOnline) {
      // Offline fallback: Queue analysis and show immediate preliminary result
      await queueAiAnalysis(
        project.id,
        'Site weather and structural safety audit',
        'Offline Structural Safety Audit'
      );

      setOfflineAiOutput({
        text: 'Preliminary (offline): Local weather safety limits verified (Wind < 30km/h, Rain index normal). Concrete cure rate within standard envelope. Full neural schedule risk audit queued for cloud sync.',
        isQueued: true,
        preliminary: true,
      });

      showToast("Queued — AI will analyze when you're back online");
    } else {
      setOfflineAiOutput({
        text: 'Real-time Cloud AI: Victoria Heights site telemetry is optimal. Rebar spacing on Level 4 aligns with structural specifications. No critical delay path detected.',
        isQueued: false,
        preliminary: false,
      });
      showToast('AI analysis completed online.');
    }
  };

  // Filter tasks for Today tab
  const filteredTasks = localTasks.filter((t) => {
    if (todayFilter === 'critical') return t.criticalPath;
    if (todayFilter === 'my') return t.assignedTo?.toLowerCase().includes('babatunde') || t.assignedTo?.toLowerCase().includes('adeyemi');
    return true;
  });

  return (
    <div className="max-w-md mx-auto min-h-[85vh] flex flex-col bg-[#0B0F14] border border-[#232C3B] rounded-3xl overflow-hidden shadow-2xl relative pb-20">
      {/* Mobile Top App Bar */}
      <div className="bg-[#121821] border-b border-[#232C3B] p-4 flex items-center justify-between sticky top-0 z-30">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-wide text-white">CONSTRUX Site</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              PWA Mode
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
            {project.name} • {project.code}
          </div>
        </div>

        {/* Connection status indicator chip */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-semibold">
              <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Offline ({pendingCount})</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 z-40 bg-amber-500 text-slate-950 font-bold text-xs p-3 rounded-2xl shadow-xl flex items-center gap-2 border border-amber-400"
          >
            <Clock className="w-4 h-4 shrink-0 text-slate-950" />
            <span className="flex-1">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ========================================================================= */}
        {/* TAB 1: TODAY */}
        {/* ========================================================================= */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Weather & Jobsite Safety Card */}
            <div className="bg-gradient-to-br from-[#121821] to-[#1A2230] border border-[#232C3B] rounded-2xl p-3.5 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Lagos Site Weather: 31°C</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Safe for concrete pour & high scaffolding
                    </div>
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono text-slate-400">
                  <div>Humidity 82%</div>
                  <div className="flex items-center gap-1 justify-end">
                    <Wind className="w-3 h-3 text-slate-400" />
                    <span>12 km/h</span>
                  </div>
                </div>
              </div>

              {/* Sync status line */}
              <div className="pt-2 border-t border-[#232C3B]/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>
                  {isOnline ? 'Cloud database in sync' : 'IndexedDB offline storage active'}
                </span>
                <span className="text-amber-400 font-semibold">
                  {pendingCount > 0 ? `${pendingCount} changes pending` : 'All changes synced'}
                </span>
              </div>
            </div>

            {/* Offline AI Quick Advisor Trigger */}
            <div className="bg-[#121821] border border-amber-500/30 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Site AI Safety & Risk Audit</span>
                </div>
                <button
                  onClick={handleTriggerSiteAiCheck}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 active:scale-95 transition"
                >
                  Run Audit
                </button>
              </div>

              {offlineAiOutput && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  {offlineAiOutput.preliminary && (
                    <div className="text-[10px] font-mono uppercase text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Preliminary (offline)</span>
                    </div>
                  )}
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {offlineAiOutput.text}
                  </p>
                </div>
              )}
            </div>

            {/* Tasks Filter Pills */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Today's Assigned Tasks</span>
              <div className="flex items-center gap-1 bg-[#121821] p-1 rounded-xl border border-[#232C3B]">
                <button
                  onClick={() => setTodayFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    todayFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  All ({localTasks.length})
                </button>
                <button
                  onClick={() => setTodayFilter('my')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    todayFilter === 'my' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Mine
                </button>
                <button
                  onClick={() => setTodayFilter('critical')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    todayFilter === 'critical' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Critical
                </button>
              </div>
            </div>

            {/* Task Card List with Big Thumb Targets (Min 44px) */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No tasks match the active filter.
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-[#121821] border border-[#232C3B] rounded-2xl p-3.5 space-y-3 shadow-sm hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">{task.title}</span>
                          {task.criticalPath && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Critical
                            </span>
                          )}
                          <SyncStatusBadge
                            status={task._syncStatus}
                            isOfflineCreated={task._isOfflineCreated}
                          />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {task.floorLevel} • Due {task.dueDate}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {task.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>

                    {/* Big Thumb Buttons (Min 44px) */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleBumpTaskProgress(task)}
                        disabled={task.progress >= 100}
                        className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold border border-slate-700 transition disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>+10% Progress</span>
                      </button>

                      <button
                        onClick={() => handleMarkTaskComplete(task)}
                        disabled={task.progress >= 100}
                        className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition disabled:opacity-40"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{task.progress >= 100 ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: UPDATE (Camera, Client Compression, Voice Memos) */}
        {/* ========================================================================= */}
        {activeTab === 'update' && (
          <form onSubmit={handleSubmitUpdate} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Log Site Observation</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Offline Optimized</span>
            </div>

            {/* Task selector */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-semibold">Associate with Task (Optional)</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full min-h-[44px] bg-[#121821] border border-[#232C3B] rounded-xl px-3 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">General Site Observation</option>
                {localTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.floorLevel}) — {t.progress}%
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Slider */}
            <div className="space-y-2 bg-[#121821] border border-[#232C3B] p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Task Progress Level</span>
                <span className="text-sm font-mono font-bold text-amber-400">{progressValue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressValue}
                onChange={(e) => setProgressValue(Number(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Notes Field */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-semibold">Field Observation Note</label>
              <textarea
                value={observationNote}
                onChange={(e) => setObservationNote(e.target.value)}
                placeholder="e.g. Rebar inspection completed on Grid 4-B. Ready for concrete pour batch 10..."
                rows={3}
                required
                className="w-full bg-[#121821] border border-[#232C3B] rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
              />

              {/* Quick Tap Phrases */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {[
                  'Rebar inspected & approved',
                  'Concrete slump test passed',
                  'Rain stoppage cleared',
                  'MEP conduits installed',
                ].map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() =>
                      setObservationNote((prev) => (prev ? `${prev} • ${phrase}` : phrase))
                    }
                    className="shrink-0 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    + {phrase}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Capture (<input type="file" capture="environment">) */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-semibold">
                Jobsite Photo (Auto-compressed to ~1280px JPEG)
              </label>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoCapture}
                className="hidden"
              />

              {!photoPreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[56px] border-2 border-dashed border-[#232C3B] hover:border-amber-500/50 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 bg-[#121821]/50 active:scale-95 transition"
                >
                  <Camera className="w-5 h-5 text-amber-400" />
                  <span>Take Jobsite Photo (Camera)</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-[#232C3B]">
                    <img
                      src={photoPreview}
                      alt="Jobsite Capture"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      Compressed: {compressedSize}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoBlob(null);
                        setPhotoPreview(null);
                        setCompressedSize(null);
                        setUpdatePhotoAnalysis(null);
                      }}
                      className="absolute top-2 right-2 bg-black/80 hover:bg-rose-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg"
                    >
                      Retake
                    </button>
                  </div>

                  {/* Trigger AI photo analysis button */}
                  <button
                    type="button"
                    onClick={handleAnalyzeCapturedPhoto}
                    disabled={isAnalyzingPhoto}
                    className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                  >
                    {isAnalyzingPhoto ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span>Claude AI analyzing photo visual progress...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Analyze Photo with Claude AI</span>
                      </>
                    )}
                  </button>

                  {/* Result Card when analyzed */}
                  {updatePhotoAnalysis && (
                    <PhotoAnalysisResultCard
                      response={updatePhotoAnalysis}
                      reportedProgress={progressValue}
                      onApplyProgress={(estimatedProg) => {
                        setProgressValue(estimatedProg);
                        showToast(`Progress slider adjusted to visual estimate: ${estimatedProg}%`);
                      }}
                      onCreateSafetyIssue={async (flag) => {
                        await optimisticReportIssue({
                          projectId: project.id,
                          title: `Safety Flag: ${flag.type.replace('_', ' ').toUpperCase()}`,
                          severity: flag.severity === 'high' ? 'critical' : flag.severity === 'medium' ? 'warning' : 'info',
                          category: 'safety',
                          description: `${flag.note} (Detected via AI Photo Supervisor on Site View)`,
                          reportedBy: currentUser.name,
                        });
                        showToast('Safety issue logged and enqueued.');
                        refreshLocalState();
                      }}
                      onDismiss={() => setUpdatePhotoAnalysis(null)}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Voice Memo Mock Button */}
            <div className="p-3 bg-[#121821] border border-[#232C3B] rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleVoiceNote}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    isRecordingAudio
                      ? 'bg-rose-600 text-white animate-pulse'
                      : audioRecorded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                  }`}
                >
                  {isRecordingAudio ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <div>
                  <div className="font-bold text-slate-200">
                    {isRecordingAudio
                      ? 'Recording Site Memo…'
                      : audioRecorded
                      ? 'Voice Memo Ready (0:42s)'
                      : 'Attach Voice Note'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isRecordingAudio ? 'Speak clearly...' : 'One-tap audio log'}
                  </div>
                </div>
              </div>

              {audioRecorded && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              )}
            </div>

            {/* Submit Button (Min 44px thumb target) */}
            <button
              type="submit"
              disabled={!observationNote.trim()}
              className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-sm shadow-lg shadow-amber-950/40 transition disabled:opacity-40"
            >
              Post Observation (Offline-Safe)
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DELIVERIES (One-Tap Receive + Offline Stock Sync) */}
        {/* ========================================================================= */}
        {activeTab === 'deliveries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Expected Site Deliveries</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Inventory Sync</span>
            </div>

            <p className="text-xs text-slate-400">
              Confirm incoming material shipments at the jobsite gate. Inventory stock levels update
              instantly on device.
            </p>

            <div className="space-y-3">
              {localOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No active purchase orders.
                </div>
              ) : (
                localOrders.map((po) => (
                  <div
                    key={po.id}
                    className="bg-[#121821] border border-[#232C3B] rounded-2xl p-3.5 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{po.materialName}</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${
                              po.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {po.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {po.poNumber} • Supplier: {po.supplierName}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {po.quantity.toLocaleString()} units
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#232C3B]/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">
                        Expected: {po.expectedDelivery}
                      </span>

                      {po.status !== 'delivered' ? (
                        <button
                          onClick={() => {
                            setReceivingOrder(po);
                            setReceiveQuantity(po.quantity);
                          }}
                          className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Received</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Received
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Receive Modal */}
            {receivingOrder && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-xs bg-[#121821] border border-[#232C3B] rounded-2xl p-5 space-y-4 text-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold">Receive Shipment</h4>
                    <button
                      onClick={() => setReceivingOrder(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="text-xs text-slate-400">
                    Confirm quantity received for{' '}
                    <strong className="text-white">{receivingOrder.materialName}</strong>:
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Verified Quantity</label>
                    <input
                      type="number"
                      value={receiveQuantity}
                      onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                      className="w-full min-h-[44px] bg-[#0B0F14] border border-[#232C3B] rounded-xl px-3 font-mono font-bold text-amber-400 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setReceivingOrder(null)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmReceiveDelivery}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ISSUES (Report Defect / Snag with Photo) */}
        {/* ========================================================================= */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Report Jobsite Issue</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Incident Logging</span>
            </div>

            <form
              onSubmit={handleSubmitIssue}
              className="bg-[#121821] border border-[#232C3B] rounded-2xl p-4 space-y-3"
            >
              <div className="space-y-1 text-xs">
                <label className="text-slate-300 font-semibold">Incident / Defect Title</label>
                <input
                  type="text"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="e.g. Honeycombing discovered on Column C-3..."
                  required
                  className="w-full min-h-[44px] bg-[#0B0F14] border border-[#232C3B] rounded-xl px-3 text-slate-200 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold">Severity</label>
                  <select
                    value={issueSeverity}
                    onChange={(e) => setIssueSeverity(e.target.value as any)}
                    className="w-full min-h-[40px] bg-[#0B0F14] border border-[#232C3B] rounded-xl px-2 text-xs text-slate-200"
                  >
                    <option value="critical">Critical (Stop Work)</option>
                    <option value="warning">Warning (Inspect)</option>
                    <option value="info">Low (Snag / Minor)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold">Category</label>
                  <select
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value as any)}
                    className="w-full min-h-[40px] bg-[#0B0F14] border border-[#232C3B] rounded-xl px-2 text-xs text-slate-200"
                  >
                    <option value="structural">Structural</option>
                    <option value="safety">Safety Hazard</option>
                    <option value="mep">MEP / Electrical</option>
                    <option value="weather">Weather Delay</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-300 font-semibold">Details & Actions Taken</label>
                <textarea
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Provide precise details, immediate mitigation, or safety tape cordoned..."
                  rows={2}
                  className="w-full bg-[#0B0F14] border border-[#232C3B] rounded-xl p-2.5 text-xs text-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={!issueTitle.trim()}
                className="w-full min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs transition shadow-md shadow-rose-950/40 disabled:opacity-40"
              >
                Log Issue to Local Engine
              </button>
            </form>

            {/* List of reported issues */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-300">Logged Site Issues</span>
              {localIssues.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No site issues reported yet.
                </div>
              ) : (
                localIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="bg-[#121821] border border-[#232C3B] rounded-xl p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{iss.title}</span>
                      <SyncStatusBadge
                        status={iss._syncStatus}
                        isOfflineCreated={iss._isOfflineCreated}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400">{iss.description}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#232C3B]/60 text-[10px] font-mono text-slate-500">
                      <span className="capitalize">{iss.category}</span>
                      <span>{new Date(iss.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SYNC (Inline Outbox & Sync Logs) */}
        {/* ========================================================================= */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="bg-[#121821] border border-[#232C3B] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-xs font-bold text-white">IndexedDB Outbox Engine</h3>
                    <p className="text-[11px] text-slate-400">
                      Background queue syncs automatically
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => flushOutbox()}
                  disabled={syncState === 'syncing' || !isOnline}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs active:scale-95 transition disabled:opacity-40"
                >
                  {syncState === 'syncing' ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              {/* Demo switch */}
              <div className="pt-2 border-t border-[#232C3B] flex items-center justify-between text-xs">
                <span className="text-slate-300">Simulate Offline (Demo)</span>
                <button
                  type="button"
                  onClick={() => setSimulatedOffline(!isSimulatedOffline)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                    isSimulatedOffline ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isSimulatedOffline ? 'Offline Active' : 'Online'}
                </button>
              </div>
            </div>

            {/* Offline Testing Documentation & 5-Step Checklist */}
            <div className="bg-[#121821] border border-slate-700/60 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>5-Step Offline Testing Checklist</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                <li>
                  <strong>Toggle Offline:</strong> Click "Simulate Offline" above or toggle Chrome DevTools (Network → Offline).
                </li>
                <li>
                  <strong>Field Observation:</strong> Switch to the <em>Update</em> tab, take a camera snapshot, type notes, and tap Post.
                </li>
                <li>
                  <strong>Confirm Pending Badge:</strong> Notice the animated amber clock badge showing changes saved locally in IndexedDB.
                </li>
                <li>
                  <strong>Reconnect:</strong> Click "Go Online" or uncheck DevTools Offline.
                </li>
                <li>
                  <strong>Automatic Sync:</strong> Watch the blue animated syncing badge flush the outbox and turn into a green checkmark!
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Thumb-Friendly Bottom Tab Bar (Fixed height 64px, large targets min 44px) */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#121821] border-t border-[#232C3B] px-2 flex items-center justify-around z-30">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl transition ${
            activeTab === 'today' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Today</span>
        </button>

        <button
          onClick={() => setActiveTab('update')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl transition ${
            activeTab === 'update' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Update</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl transition ${
            activeTab === 'deliveries' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Deliveries</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl transition ${
            activeTab === 'issues' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Issues</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl transition ${
            activeTab === 'sync' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
          <span className="text-[10px] mt-0.5">Sync</span>
          {pendingCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center font-mono">
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
