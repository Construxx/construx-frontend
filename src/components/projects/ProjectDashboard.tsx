import React, { useState } from 'react';
import {
  HardHat,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Camera,
  Plus,
  ArrowRight,
  Sparkles,
  Building2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag,
  Download,
  Check,
  Sliders,
  Mic,
  Play,
  Pause,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Project, Task, Milestone, SiteUpdate, Material, AIAlert } from '../../types';
import { AIAlertCard } from '../ai/AIAlertCard';
import { ExecutiveSummaryCard } from '../ai/ExecutiveSummaryCard';
import { WhatIfSimulator } from '../simulator/WhatIfSimulator';
import { generateProjectPDFReport } from '../../lib/pdfReport';
import { SyncStatusBadge } from '../offline/SyncStatusBadge';
import { PhotoAnalysisResultCard } from '../ai/PhotoAnalysisResultCard';
import { analyzeSitePhoto } from '../../lib/ai/live';
import { PhotoAnalysisResponse, SafetyFlag } from '../../lib/ai/schemas';
import { optimisticReportIssue } from '../../lib/offline/sync';

interface ProjectDashboardProps {
  project: Project;
  tasks: Task[];
  milestones: Milestone[];
  materials: Material[];
  siteUpdates: SiteUpdate[];
  documents: any[];
  alerts: AIAlert[];
  onTriggerHandover: () => void;
  onPostSiteUpdate: (data: { note: string; photoUrl?: string; tags?: string[]; completionReported?: number }) => void;
  onUpdateTaskStatus: (taskId: string, status: any, progress?: number) => void;
  onAddTask: (taskData: Partial<Task>) => void;
  onNavigateToTwin: (buildingId: string) => void;
  onNavigateToProcurement: () => void;
  onRefreshAI: () => void;
  isAiLoading: boolean;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  tasks,
  milestones,
  materials,
  siteUpdates,
  documents,
  alerts,
  onTriggerHandover,
  onPostSiteUpdate,
  onUpdateTaskStatus,
  onAddTask,
  onNavigateToTwin,
  onNavigateToProcurement,
  onRefreshAI,
  isAiLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones' | 'site_updates' | 'documents' | 'simulator'>('overview');
  const [taskFilter, setTaskFilter] = useState<'all' | 'in_progress' | 'completed' | 'critical'>('all');
  
  // WhatsApp & voice note states
  const [playingVoiceNoteId, setPlayingVoiceNoteId] = useState<string | null>(null);
  const [analyzingUpdateId, setAnalyzingUpdateId] = useState<string | null>(null);

  // Live AI Site Photo Analysis states (Feature A)
  const [analyzedPhotos, setAnalyzedPhotos] = useState<Record<string, PhotoAnalysisResponse>>({});
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null);

  const handleAnalyzePhoto = async (upd: SiteUpdate) => {
    if (!upd.photoUrl) return;
    setAnalyzingPhotoId(upd.id);
    try {
      const activeTask = tasks.find((t) => t.status === 'in_progress') || tasks[2] || tasks[0];
      const res = await analyzeSitePhoto({
        imageFileOrBase64: upd.photoUrl,
        context: {
          projectId: project.id,
          projectName: project.name,
          taskName: activeTask ? activeTask.title : 'Electrical Installation & Armoured Cabling',
          lastRecordedProgress: upd.completionReported ?? activeTask?.progress ?? 40,
          projectPhase: 'Phase 3: MEP Rough-in',
          floorLevel: activeTask?.floorLevel || 'Level 4',
        },
      });
      setAnalyzedPhotos((prev) => ({ ...prev, [upd.id]: res }));
    } catch (err) {
      console.error('Error analyzing photo:', err);
    } finally {
      setAnalyzingPhotoId(null);
    }
  };

  const handleApplyProgressEstimate = (upd: SiteUpdate, estimatedPercent: number) => {
    // Update task progress via existing postSiteUpdate or updateTask action
    const activeTask = tasks.find((t) => t.status === 'in_progress') || tasks[2] || tasks[0];
    if (activeTask) {
      onUpdateTaskStatus(activeTask.id, estimatedPercent >= 100 ? 'completed' : 'in_progress', estimatedPercent);
    }
    // Also post updated site update note reflecting verification
    onPostSiteUpdate({
      note: `[AI Verified Visual Estimate] Physical progress calibrated to ${estimatedPercent}% based on supervisor photo review.`,
      completionReported: estimatedPercent,
      tags: ['AIVerified', 'ProgressCalibration'],
    });
  };

  const handleCreateSafetyIssueFromFlag = async (flag: SafetyFlag) => {
    await optimisticReportIssue({
      projectId: project.id,
      title: `Safety Flag: ${flag.type.replace('_', ' ').toUpperCase()}`,
      severity: flag.severity === 'high' ? 'critical' : flag.severity === 'medium' ? 'warning' : 'info',
      category: 'safety',
      description: `${flag.note} (Detected via AI Photo Supervisor)`,
      reportedBy: 'AI Site Supervisor',
    });
  };

  // Site update modal state
  const [showPostUpdateModal, setShowPostUpdateModal] = useState(false);
  const [newUpdateNote, setNewUpdateNote] = useState('');
  const [newUpdatePhoto, setNewUpdatePhoto] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80');
  const [newUpdateTags, setNewUpdateTags] = useState('Level4, Electrical, MEP');
  const [newUpdateProgress, setNewUpdateProgress] = useState(68);

  // New task modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'structural' | 'mep' | 'electrical' | 'finishing'>('electrical');
  const [newTaskFloor, setNewTaskFloor] = useState('Level 4');
  const [newTaskCritical, setNewTaskCritical] = useState(true);

  // Handover confirmation modal
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  // PDF report export state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const isAtRisk = project.status === 'at_risk';
  const isHandedOver = project.status === 'handed_over';

  // Calculations
  const budgetPercent = Math.round((project.budgetSpent / project.budgetTotal) * 100);
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const criticalShortageMaterials = materials.filter((m) => m.status === 'critical_shortage');

  const handleDownloadReport = () => {
    try {
      setIsGeneratingPdf(true);
      generateProjectPDFReport({
        project,
        tasks,
        milestones,
        alerts,
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'in_progress') return t.status === 'in_progress';
    if (taskFilter === 'completed') return t.status === 'completed';
    if (taskFilter === 'critical') return t.criticalPath;
    return true;
  });

  const handleCreateSiteUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateNote.trim()) return;

    onPostSiteUpdate({
      note: newUpdateNote,
      photoUrl: newUpdatePhoto,
      tags: newUpdateTags.split(',').map((s) => s.trim()),
      completionReported: Number(newUpdateProgress),
    });

    setNewUpdateNote('');
    setShowPostUpdateModal(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      title: newTaskTitle,
      category: newTaskCategory,
      floorLevel: newTaskFloor,
      criticalPath: newTaskCritical,
    });

    setNewTaskTitle('');
    setShowAddTaskModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Project Master Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                {project.code}
              </span>
              <span className="text-xs text-slate-400 font-mono">{project.type}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{project.location}</span>

              {/* Status Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isHandedOver
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : isAtRisk
                    ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                {isHandedOver ? (
                  <>
                    <Building2 className="w-3.5 h-3.5" />
                    <span>HANDED OVER TO BUILDTWIN</span>
                  </>
                ) : isAtRisk ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>⚠ AT RISK — 5 DAYS VARIANCE</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ON TRACK</span>
                  </>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              {project.name}
              <span className="text-sm font-normal text-slate-400 font-mono">({project.floorsTotal} Floors)</span>
            </h1>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">{project.description}</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Download Report Button */}
            <button
              onClick={handleDownloadReport}
              disabled={isGeneratingPdf}
              className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs border flex items-center gap-2 transition-all active:scale-95 shadow-sm group ${
                pdfSuccess
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-amber-500/50'
              }`}
              title="Download executive PDF snapshot of progress, budget, and active risks"
            >
              {pdfSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Report Downloaded!</span>
                </>
              ) : isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Download Report</span>
                </>
              )}
            </button>

            {!isHandedOver ? (
              <button
                onClick={() => setShowHandoverModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-transform active:scale-95"
              >
                <Building2 className="w-4 h-4" />
                <span>Handover to BuildTwin</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateToTwin(project.activeBuildingId || 'bldg-victoria')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-transform active:scale-95"
              >
                <Building2 className="w-4 h-4" />
                <span>Open Digital Twin</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setShowPostUpdateModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Post Site Update</span>
            </button>
          </div>
        </div>

        {/* High-Density KPI Dashboard Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* Progress */}
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Overall Progress</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400">{project.progressPercent}%</span>
              <span className="text-xs text-slate-400 font-mono">({completedTasks}/{tasks.length} tasks)</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <motion.div
                key={`master-progress-${project.progressPercent}`}
                initial={{ width: 0 }}
                animate={{ width: `${project.progressPercent}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              />
            </div>
          </div>

          {/* Budget Gauge */}
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Budget Absorption</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-white">₦{(project.budgetSpent / 1e6).toFixed(0)}M</span>
              <span className="text-xs text-slate-400">/ ₦{(project.budgetTotal / 1e6).toFixed(0)}M</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <motion.div
                key={`budget-progress-${budgetPercent}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              />
            </div>
            <div className="text-[10px] font-mono text-emerald-400 mt-1">
              {budgetPercent}% absorbed (On Curve)
            </div>
          </div>

          {/* Supply OS Link Mini-card */}
          <div
            onClick={onNavigateToProcurement}
            className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <span>Supply OS Health</span>
              <ChevronRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-cyan-300">
                {criticalShortageMaterials.length > 0 ? '⚠ Shortage' : '84% Delivered'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-cyan-400/80 mt-1">
              {criticalShortageMaterials.length > 0
                ? `${criticalShortageMaterials.length} critical package requires PO`
                : 'All packages on schedule'}
            </div>
          </div>

          {/* Target Milestone */}
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Milestone</div>
            <div className="text-xs font-bold text-white mt-1.5 truncate">
              {milestones.find((m) => m.status === 'in_progress')?.title || 'Handover & Commissioning'}
            </div>
            <div className="text-[10px] font-mono text-amber-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Target: Nov 30, 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical AI Alerts Banner (if any) */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AIAlertCard
              key={alert.id}
              alert={alert}
              actionLabel={
                alert.type === 'procurement_deficit'
                  ? 'Open Supply OS PO Form'
                  : alert.type === 'schedule_risk'
                  ? 'Apply Overtime Mitigation'
                  : 'Inspect Asset'
              }
              onAction={() => {
                if (alert.type === 'procurement_deficit') {
                  onNavigateToProcurement();
                } else if (alert.type === 'schedule_risk') {
                  alert.resolved = true;
                  project.status = 'on_track';
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          {(
            [
              { key: 'overview', label: 'Executive Overview', icon: Sparkles },
              { key: 'tasks', label: `Tasks (${tasks.length})`, icon: HardHat },
              { key: 'milestones', label: 'Milestones (5)', icon: Layers },
              { key: 'site_updates', label: `Field Updates (${siteUpdates.length})`, icon: Camera },
              { key: 'simulator', label: 'What-If Simulator', icon: Sliders },
              { key: 'documents', label: `Drawings & BIM (${documents.length})`, icon: FileText },
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
                    ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'tasks' && (
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive AI Briefing */}
          <ExecutiveSummaryCard
            summary={{
              projectId: project.id,
              projectName: project.name,
              overallHealth: isAtRisk ? 'CAUTION' : 'HEALTHY',
              completionRate: `${project.progressPercent}% Physical Completion`,
              budgetStatus: `₦${(project.budgetSpent / 1e6).toFixed(0)}M of ₦${(project.budgetTotal / 1e6).toFixed(0)}M spent`,
              criticalRisks: isAtRisk
                ? [
                    'Level 4 Electrical Cabling variance of 5 days',
                    'Armoured cable inventory deficit (600m on site vs 4,000m needed)',
                  ]
                : ['Critical path is stable; monitoring Level 5 curtain wall delivery'],
              procurementStatus: '84% of required materials delivered or in transit',
              recommendedActions: isAtRisk
                ? [
                    'Expedite 3,400m cable purchase order to ABC Electrical Supplies',
                    'Authorize weekend dual shifts for electrical crew',
                    'Prepare testing & commissioning handover protocol',
                  ]
                : ['Prepare pre-commissioning checklist for BuildTwin transition'],
              summaryText: isAtRisk
                ? `${project.name} is at 68% completion with ₦295M deployed. While concrete structural frames are 100% certified, Level 4 MEP & Electrical installation faces a 5-day variance due to raw material delivery lag. Superstructure milestones remain viable provided cable procurement is expedited within 48 hours.`
                : `${project.name} is advancing on schedule with 68% physical completion and balanced financial absorption. All critical path rough-in packages are aligned with Phase 4 enclosure targets.`,
              generatedAt: new Date().toISOString(),
            }}
            onRefresh={onRefreshAI}
            isLoading={isAiLoading}
          />

          {/* Two Columns: Critical Path Tasks & Recent Site Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Critical Path Tasks (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Critical Path Tasks</h3>
                  <p className="text-[11px] text-slate-400">Direct impact on overall handover date</p>
                </div>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {tasks
                  .filter((t) => t.criticalPath)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {task.floorLevel}
                          </span>
                          <span className="text-xs font-semibold text-white truncate">{task.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Assigned: {task.assignedTo} • Due: {task.dueDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-bold text-amber-400">{task.progress}%</div>
                          <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                            <motion.div
                              key={`crit-task-${task.id}-${task.progress}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress}%` }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                              className={`h-full rounded-full ${
                                task.progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">{task.status.replace('_', ' ')}</div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateTaskStatus(task.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Field Updates Feed (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Live Field Feed</h3>
                    <p className="text-[11px] text-slate-400">Site photos and engineer inspection notes</p>
                  </div>
                  <button
                    onClick={() => setShowPostUpdateModal(true)}
                    className="p-1 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {siteUpdates.slice(0, 2).map((upd) => (
                    <div key={upd.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-200">{upd.author}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(upd.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{upd.note}</p>
                      {upd.photoUrl && (
                        <div className="rounded-lg overflow-hidden h-28 w-full border border-slate-800 relative">
                          <img src={upd.photoUrl} alt="Site" className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-[9px] font-mono text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                            GPS Verified
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {upd.tags.map((tag, i) => (
                          <span key={i} className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('site_updates')}
                className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold text-center transition-colors"
              >
                View Full Field Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Filter:</span>
              {(['all', 'in_progress', 'completed', 'critical'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    taskFilter === f
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Task & Location</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Assigned To</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Progress</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {task.criticalPath && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Critical Path" />
                        )}
                        <span className="font-semibold text-white">{task.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {task.floorLevel} • {task.description}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {task.category}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-300">{task.assignedTo}</td>
                    <td className="p-3.5 font-mono text-slate-400">{task.dueDate}</td>

                    <td className="p-3.5">
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            key={`task-prog-${task.id}-${task.progress}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${
                              task.progress === 100
                                ? 'bg-emerald-500'
                                : task.progress > 0
                                ? 'bg-amber-500'
                                : 'bg-slate-700'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <select
                        value={task.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as any;
                          const newProg = newStatus === 'completed' ? 100 : newStatus === 'pending' ? 0 : 50;
                          onUpdateTaskStatus(task.id, newStatus, newProg);
                        }}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer ${
                          task.status === 'completed'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : task.status === 'in_progress'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>

                    <td className="p-3.5 text-right">
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => onUpdateTaskStatus(task.id, 'completed', 100)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          Mark Done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Project Milestone Timeline</h3>
              <p className="text-xs text-slate-400">Sequential project delivery gateways leading to digital twin handover</p>
            </div>
            {!isHandedOver && (
              <button
                onClick={() => setShowHandoverModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Handover to BuildTwin</span>
              </button>
            )}
          </div>

          <div className="relative pl-6 border-l-2 border-slate-800 space-y-8 my-4">
            {milestones.map((ms) => {
              const isDone = ms.status === 'completed' || isHandedOver;
              const isActive = ms.status === 'in_progress' && !isHandedOver;

              return (
                <div key={ms.id} className="relative group">
                  {/* Timeline Bullet */}
                  <div
                    className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : isActive
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : ms.orderIndex}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {ms.stage}
                        </span>
                        <h4 className="text-sm font-bold text-white">{ms.title}</h4>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">Target Date: {ms.dueDate}</div>
                    </div>

                    <div>
                      {ms.isHandover ? (
                        isHandedOver ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>HANDED OVER</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setShowHandoverModal(true)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-transform active:scale-95"
                          >
                            Trigger Handover
                          </button>
                        )
                      ) : (
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full font-mono uppercase ${
                            isDone
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : isActive
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isDone ? 'COMPLETED' : isActive ? 'ACTIVE PHASE' : 'UPCOMING'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. SITE UPDATES FEED (WhatsApp-Style Site Log) */}
      {activeTab === 'site_updates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121821] p-5 rounded-2xl border border-[#232C3B]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>CONSTRUX Field Comms // WhatsApp-Style Site Log</span>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                    LIVE FIELD STREAM
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time field observations with voice notes, photo verifications, and 1-click AI variance audits
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowPostUpdateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Post WhatsApp Note</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {siteUpdates.map((upd) => {
              const isPlayingVoice = playingVoiceNoteId === upd.id;
              const isAnalyzing = analyzingUpdateId === upd.id;

              return (
                <div
                  key={upd.id}
                  className="bg-[#121821] border border-[#232C3B] rounded-2xl overflow-hidden shadow-xl"
                >
                  {/* WhatsApp-Style Chat Bubble Header */}
                  <div className="p-4 bg-[#0B0F14]/70 border-b border-[#232C3B] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                        {upd.author.split(' ')[0][0]}{upd.author.split(' ')[1]?.[0] || ''}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{upd.author}</span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.2 rounded border border-amber-800">
                            {upd.authorRole}
                          </span>
                          <SyncStatusBadge
                            status={(upd as any)._syncStatus}
                            isOfflineCreated={(upd as any)._isOfflineCreated}
                          />
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{new Date(upd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-cyan-400" />
                            <Check className="w-3 h-3 text-cyan-400 -ml-2" />
                            <span>Delivered to CONSTRUX OS</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {upd.completionReported && (
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                        {upd.completionReported}% Site Progress
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Simulated Voice Note Player */}
                    <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-[#232C3B] flex items-center gap-3.5">
                      <button
                        onClick={() => setPlayingVoiceNoteId(isPlayingVoice ? null : upd.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 shrink-0 ${
                          isPlayingVoice ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:text-white'
                        }`}
                      >
                        {isPlayingVoice ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-amber-400" />
                            <span>Site Voice Memo (0:42) — Level 4 Inspection</span>
                          </span>
                          <span className="text-slate-500">{isPlayingVoice ? '0:18 / 0:42' : '0:42'}</span>
                        </div>

                        {/* Animated Equalizer Waveform */}
                        <div className="flex items-center gap-1 h-5 pt-1">
                          {[30, 60, 45, 80, 100, 75, 40, 65, 85, 95, 50, 70, 90, 60, 40, 85, 100, 75, 55, 35, 65, 80, 50, 30].map((h, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all duration-300 ${
                                isPlayingVoice && i < 11
                                  ? 'bg-emerald-400'
                                  : isPlayingVoice
                                  ? 'bg-emerald-600/60 animate-pulse'
                                  : 'bg-slate-700'
                              }`}
                              style={{ height: `${isPlayingVoice ? Math.max(20, (h + (i % 3) * 15) % 100) : h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Note Text */}
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {upd.note}
                    </p>

                    {/* Inspection Photo with Watermark & Analyze Photo Button */}
                    {upd.photoUrl && (
                      <div className="rounded-xl overflow-hidden border border-[#232C3B] relative bg-black/60 max-h-80 group">
                        <img src={upd.photoUrl} alt="Inspection" className="w-full h-full object-cover max-h-80" />
                        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>LASPPPA Registered QA Image</span>
                        </div>
                        <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                          GPS: 6.4281° N, 3.4219° E
                        </div>

                        {/* Top-Right "Analyze photo" button on the photo */}
                        <div className="absolute top-2.5 right-2.5">
                          <button
                            onClick={() => handleAnalyzePhoto(upd)}
                            disabled={analyzingPhotoId === upd.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
                          >
                            {analyzingPhotoId === upd.id ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                <span>Analyzing photo...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                <span>Analyze photo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Result Card for Analyzed Photo */}
                    {analyzedPhotos[upd.id] && (
                      <PhotoAnalysisResultCard
                        response={analyzedPhotos[upd.id]}
                        reportedProgress={upd.completionReported}
                        onApplyProgress={(prog) => handleApplyProgressEstimate(upd, prog)}
                        onCreateSafetyIssue={(flag) => handleCreateSafetyIssueFromFlag(flag)}
                        onDismiss={() => {
                          setAnalyzedPhotos((prev) => {
                            const copy = { ...prev };
                            delete copy[upd.id];
                            return copy;
                          });
                        }}
                      />
                    )}

                    {/* Tags and AI Trigger Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#232C3B]">
                      <div className="flex flex-wrap gap-1.5">
                        {upd.tags.map((t, i) => (
                          <span key={i} className="text-[10px] font-mono bg-[#0B0F14] text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {upd.photoUrl && (
                          <button
                            onClick={() => handleAnalyzePhoto(upd)}
                            disabled={analyzingPhotoId === upd.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95"
                          >
                            {analyzingPhotoId === upd.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                <span>Supervisor AI analyzing...</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-3.5 h-3.5 text-amber-400" />
                                <span>Analyze photo</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setAnalyzingUpdateId(upd.id);
                            setTimeout(() => {
                              setAnalyzingUpdateId(null);
                              onRefreshAI();
                            }, 1200);
                          }}
                          disabled={isAnalyzing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              <span>AI auditing note...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Audit note</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. WHAT-IF SIMULATOR */}
      {activeTab === 'simulator' && (
        <WhatIfSimulator
          project={project}
          onApplyMitigation={(daysSaved) => {
            project.status = 'on_track';
            onRefreshAI();
          }}
        />
      )}

      {/* TAB CONTENT: 6. DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Project BIM, CAD & Permits Hub</h3>
              <p className="text-xs text-slate-400">Architectural drawings, MEP BIM models, and regulatory certificates</p>
            </div>
            <button className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700">
              Upload Document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 font-mono text-xs font-bold">
                    {doc.fileType.split(' ')[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{doc.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {doc.size} • Uploaded by {doc.uploadedBy} on {doc.uploadDate}
                    </div>
                  </div>
                </div>

                <a
                  href={doc.url}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Opening ${doc.title} in document viewer.`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold shrink-0"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POST SITE UPDATE MODAL */}
      {showPostUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              <span>Log Site Progress & Trigger AI Audit</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter inspection notes. If reporting delays on Level 4 or material deficits, the AI schedule risk model will automatically update the project health.
            </p>

            <form onSubmit={handleCreateSiteUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Field Observation Note</label>
                <textarea
                  value={newUpdateNote}
                  onChange={(e) => setNewUpdateNote(e.target.value)}
                  rows={3}
                  required
                  placeholder="e.g. Electrical installation on Level 4 is 40% complete. Containment and trunking ready for cable pulls..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Site Photo URL</label>
                <input
                  type="text"
                  value={newUpdatePhoto}
                  onChange={(e) => setNewUpdatePhoto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newUpdateTags}
                    onChange={(e) => setNewUpdateTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Reported % Complete</label>
                  <input
                    type="number"
                    value={newUpdateProgress}
                    onChange={(e) => setNewUpdateProgress(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPostUpdateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md"
                >
                  Submit & Evaluate AI Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-400" />
              <span>Create Construction Task</span>
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  placeholder="e.g. Electrical Installation & Armoured Cabling"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="structural">Structural</option>
                    <option value="mep">MEP</option>
                    <option value="electrical">Electrical</option>
                    <option value="finishing">Finishing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Floor Level</label>
                  <input
                    type="text"
                    value={newTaskFloor}
                    onChange={(e) => setNewTaskFloor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="criticalPath"
                  checked={newTaskCritical}
                  onChange={(e) => setNewTaskCritical(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="criticalPath" className="text-xs text-slate-300">
                  Part of Critical Path (schedule slippage affects overall project completion)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HANDOVER CONFIRMATION MODAL */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Trigger Handover to BuildTwin Operating Layer?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This executes CONSTRUX's core lifecycle transformation:
            </p>

            <div className="space-y-2.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs mb-6">
              <div className="flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>
                  <strong>Automated Asset Mapping:</strong> Level 4 Electrical task becomes Room 204 Distribution Board & MEP System.
                </span>
              </div>
              <div className="flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>
                  <strong>Warranty & Spec Preservation:</strong> Daikin VRV condensing units transfer from Supply OS PO records into active equipment registry.
                </span>
              </div>
              <div className="flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>
                  <strong>Digital Twin Activated:</strong> Victoria Heights transitions from Construction Site to Living Digital Twin.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowHandoverModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHandoverModal(false);
                  onTriggerHandover();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50"
              >
                Confirm & Activate BuildTwin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
