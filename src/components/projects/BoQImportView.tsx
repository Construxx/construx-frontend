import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  DollarSign,
  Calendar,
  Layers,
  Building2,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  FileSpreadsheet,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import {
  BoQImportResult,
  BoQMaterialItem,
  BoQTaskItem,
  BoQMilestoneItem,
  BoQImportResponse,
} from '../../lib/ai/schemas';
import { importBoQ, fileOrBlobToBase64 } from '../../lib/ai/live';
import { SAMPLE_NIGERIAN_BOQ_DATA, SAMPLE_NIGERIAN_BOQ_CSV } from '../../lib/ai/sampleBoQ';
import { AIResultBadge } from '../ai/AIResultBadge';
import { Project, Task, Material, Milestone } from '../../types';
import { db } from '../../lib/offline/db';

interface BoQImportViewProps {
  onProjectCreated: (project: Project, tasks: Task[], materials: Material[], milestones: Milestone[]) => void;
  onCancel: () => void;
}

type WizardStep = 1 | 2 | 3;

export const BoQImportView: React.FC<BoQImportViewProps> = ({
  onProjectCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | 'pdf' | 'sample'>('sample');
  const [parsedRows, setParsedRows] = useState<any[] | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  // Staged loading animation state
  const [stagedStageIndex, setStagedStageIndex] = useState(0);
  const [stagedProgress, setStagedProgress] = useState(15);
  const stages = [
    'Parsing document structure & tabular columns...',
    'Extracting materials & Nigerian Naira (₦) unit rates...',
    'Synthesizing critical path task plan & durations...',
    'Linking trade dependencies & handover milestones...',
  ];

  // AI Response & Editable Result
  const [aiResponse, setAiResponse] = useState<BoQImportResponse | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [materials, setMaterials] = useState<BoQMaterialItem[]>([]);
  const [tasks, setTasks] = useState<BoQTaskItem[]>([]);
  const [milestones, setMilestones] = useState<BoQMilestoneItem[]>([]);
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'materials' | 'tasks' | 'milestones'>('materials');
  const [showWhy, setShowWhy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Reject inputs over 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File exceeds 5MB size limit. Please choose a smaller BoQ file.');
      return;
    }

    setUploadedFile(file);
    const name = file.name.toLowerCase();

    if (name.endsWith('.pdf')) {
      setFileType('pdf');
      const { base64 } = await fileOrBlobToBase64(file);
      setPdfBase64(base64);
      setParsedRows(null);
      setCsvContent(null);
    } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
      setFileType('csv');
      const text = await file.text();
      setCsvContent(text);
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedRows(results.data);
        },
      });
    } else {
      // XLSX or generic
      setFileType('xlsx');
      const text = await file.text().catch(() => '');
      setCsvContent(text || null);
    }
  };

  // Handle "Use Sample BoQ"
  const handleUseSample = () => {
    setUploadedFile(null);
    setFileType('sample');
    setCsvContent(SAMPLE_NIGERIAN_BOQ_CSV);
    Papa.parse(SAMPLE_NIGERIAN_BOQ_CSV, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedRows(results.data);
      },
    });
    setErrorMessage(null);
  };

  // Run AI Import Processing
  const handleStartProcessing = async () => {
    setCurrentStep(2);
    setStagedStageIndex(0);
    setStagedProgress(20);

    // Staged progress ticker
    const timer1 = setTimeout(() => {
      setStagedStageIndex(1);
      setStagedProgress(45);
    }, 1200);

    const timer2 = setTimeout(() => {
      setStagedStageIndex(2);
      setStagedProgress(70);
    }, 2400);

    const timer3 = setTimeout(() => {
      setStagedStageIndex(3);
      setStagedProgress(90);
    }, 3600);

    try {
      let response: BoQImportResponse;

      if (fileType === 'pdf' && pdfBase64) {
        response = await importBoQ({
          format: 'pdf_base64',
          pdfBase64,
          fileName: uploadedFile?.name,
        });
      } else if (parsedRows && parsedRows.length > 0) {
        response = await importBoQ({
          format: 'rows',
          rows: parsedRows,
          fileName: uploadedFile?.name || 'sample-nigerian-boq.csv',
        });
      } else {
        response = await importBoQ({
          format: 'csv_text',
          csvText: csvContent || SAMPLE_NIGERIAN_BOQ_CSV,
          fileName: uploadedFile?.name || 'sample-nigerian-boq.csv',
        });
      }

      setStagedProgress(100);

      // Populate review state
      setAiResponse(response);
      setProjectName(response.result.project.suggestedName);
      setProjectType(response.result.project.type);
      setMaterials(response.result.materials);
      setTasks(response.result.tasks);
      setMilestones(response.result.milestones);
      setAssumptions(response.result.assumptions);
      setWarnings(response.result.warnings);

      setTimeout(() => {
        setCurrentStep(3);
      }, 600);
    } catch (err: any) {
      console.error('Import error:', err);
      // Fallback directly
      const fallbackResult = SAMPLE_NIGERIAN_BOQ_DATA;
      setAiResponse({
        source: 'fallback',
        model: 'claude-sonnet-5 (fallback)',
        latencyMs: 1400,
        result: fallbackResult,
        why: { inputsUsed: ['Scripted fallback triggered due to network/parsing exception.'] },
      });
      setProjectName(fallbackResult.project.suggestedName);
      setProjectType(fallbackResult.project.type);
      setMaterials(fallbackResult.materials);
      setTasks(fallbackResult.tasks);
      setMilestones(fallbackResult.milestones);
      setAssumptions(fallbackResult.assumptions);
      setWarnings(fallbackResult.warnings);

      setTimeout(() => {
        setCurrentStep(3);
      }, 600);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    }
  };

  // Calculated Total Budget
  const totalCalculatedBudget = materials.reduce(
    (sum, m) => sum + (Number(m.quantity) || 0) * (Number(m.unitRateNGN) || 0),
    0
  );

  // Material item handlers
  const handleUpdateMaterial = (index: number, field: keyof BoQMaterialItem, value: any) => {
    setMaterials((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      {
        name: 'New Construction Material',
        unit: 'units',
        quantity: 100,
        unitRateNGN: 5000,
        category: 'General',
        suggestedSupplierType: 'Local Wholesale Supplier',
      },
    ]);
  };

  // Task item handlers
  const handleUpdateTask = (index: number, field: keyof BoQTaskItem, value: any) => {
    setTasks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        title: 'New Site Activity Task',
        phase: 'Construction Phase',
        dependsOn: [],
        estimatedDurationDays: 14,
        linkedMaterials: [],
      },
    ]);
  };

  // Milestone item handlers
  const handleUpdateMilestone = (index: number, title: string) => {
    setMilestones((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], title };
      return copy;
    });
  };

  const handleDeleteMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        title: 'New Construction Milestone',
        order: prev.length + 1,
      },
    ]);
  };

  // Final Action: Create Project & write to store
  const handleCreateProject = async () => {
    setIsSubmitting(true);
    try {
      const newProjectId = `proj-imported-${Date.now()}`;
      const code = `PROJ-${Math.floor(100 + Math.random() * 900)}`;

      const newProject: Project = {
        id: newProjectId,
        name: projectName || 'Imported Construction Scheme',
        code,
        type: projectType || 'Commercial & Residential',
        budgetTotal: totalCalculatedBudget || 450000000,
        budgetSpent: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        status: 'on_track',
        progressPercent: 0,
        location: 'Victoria Island / Ikoyi, Lagos',
        contractor: 'Main Contractor (CONSTRUX Managed)',
        floorsTotal: 12,
        description: `Synthesized via BoQ Import AI with ${materials.length} procurement packages and ${tasks.length} tasks.`,
      };

      const newTasks: Task[] = tasks.map((t, idx) => ({
        id: `task-imp-${idx + 1}-${Date.now()}`,
        projectId: newProjectId,
        title: t.title,
        description: `Phase: ${t.phase}. Linked: ${t.linkedMaterials.join(', ') || 'General'}`,
        category: (t.phase.toLowerCase().includes('structural')
          ? 'structural'
          : t.phase.toLowerCase().includes('mep') || t.phase.toLowerCase().includes('electrical')
          ? 'mep'
          : 'civil') as any,
        status: 'pending',
        assignedTo: 'Lead Project Engineer',
        dueDate: new Date(Date.now() + (idx + 1) * t.estimatedDurationDays * 86400000)
          .toISOString()
          .split('T')[0],
        progress: 0,
        floorLevel: `Phase ${idx + 1}`,
        criticalPath: idx === 0 || idx === 1 || idx === tasks.length - 1,
      }));

      const newMaterials: Material[] = materials.map((m, idx) => ({
        id: `mat-imp-${idx + 1}-${Date.now()}`,
        projectId: newProjectId,
        name: m.name,
        category: m.category,
        unit: m.unit,
        quantityRequired: Number(m.quantity),
        quantityDelivered: 0,
        currentStock: 0,
        status: 'critical_shortage',
        unitCost: Number(m.unitRateNGN),
        leadTimeDays: 3,
      }));

      const newMilestones: Milestone[] = milestones.map((ms, idx) => ({
        id: `ms-imp-${idx + 1}-${Date.now()}`,
        projectId: newProjectId,
        title: ms.title,
        stage: `Milestone ${ms.order}`,
        status: 'upcoming',
        dueDate: new Date(Date.now() + (idx + 1) * 35 * 86400000)
          .toISOString()
          .split('T')[0],
        orderIndex: ms.order,
        isHandover: idx === milestones.length - 1,
      }));

      // Cache into local Dexie store immediately for offline-first readiness
      await db.projects.put(newProject);
      for (const t of newTasks) await db.tasks.put(t);
      for (const m of newMaterials) await db.materials.put(m);

      onProjectCreated(newProject, newTasks, newMaterials, newMilestones);
    } catch (err) {
      console.error('Project creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-[#121821] border border-[#232C3B] hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                AI Onboarding Engine
              </span>
              <span className="text-xs font-mono text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">Step {currentStep} of 3</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Create Project via Bill of Quantities (BoQ) Import
            </h1>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#232C3B] hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            currentStep === 1
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : currentStep > 1
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
              : 'bg-[#121821] border-[#232C3B] text-slate-500'
          }`}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-black/40 border border-current">
            {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
          </div>
          <div className="text-xs font-semibold">1. Upload BoQ or Sample</div>
        </div>

        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            currentStep === 2
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : currentStep > 2
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
              : 'bg-[#121821] border-[#232C3B] text-slate-500'
          }`}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-black/40 border border-current">
            {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
          </div>
          <div className="text-xs font-semibold">2. AI Synthesis & Extraction</div>
        </div>

        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            currentStep === 3
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-[#121821] border-[#232C3B] text-slate-500'
          }`}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-black/40 border border-current">
            3
          </div>
          <div className="text-xs font-semibold">3. Review & Create Project</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 1: UPLOAD / SAMPLE SELECTION */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Drag and drop / file upload */}
            <div className="bg-[#121821] border border-[#232C3B] rounded-2xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  <span>Upload Spreadsheet or PDF BoQ</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload an existing Bill of Quantities spreadsheet (.csv, .xlsx) or PDF architectural/structural tender document. Max file size: 5MB.
                </p>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-[#232C3B] hover:border-amber-500/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all bg-[#0B0F14]/50 group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 transition-transform group-hover:scale-105">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white group-hover:text-amber-300">
                    Click to browse or drop file here
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Supports .CSV, .XLSX, and .PDF (Tender Documents)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {uploadedFile && (
                <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-amber-500/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-xs">
                        {uploadedFile.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || 'Document'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                    Ready
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Right: Instant Sample BoQ (12-storey Lagos Tower) */}
            <div className="bg-[#121821] border border-[#232C3B] rounded-2xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-base">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>Instant Sample: 12-Storey Lagos Tower</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Zero Setup
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No file at hand? Use our comprehensive benchmark BoQ containing realistic Nigerian materials, ₦ rates, and contractor sequencing.
                </p>
              </div>

              {/* Sample Card Summary */}
              <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#232C3B] space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Project Type:</span>
                  <span className="text-slate-200 font-bold">12-Floor Luxury Residential Tower</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Currency & Rates:</span>
                  <span className="text-amber-400 font-bold">Nigerian Naira (₦) Q3 2026</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Trade Categories:</span>
                  <span className="text-slate-200">Rebar, Cement, Sandcrete, Cables, MEP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Schedule:</span>
                  <span className="text-emerald-400 font-bold">₦485.5M • 8 Work Packages</span>
                </div>
              </div>

              <button
                onClick={handleUseSample}
                className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs shadow-md transition-all active:scale-95 ${
                  fileType === 'sample' && !uploadedFile
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {fileType === 'sample' && !uploadedFile
                    ? '✓ Sample BoQ Selected'
                    : 'Use Sample BoQ (12-Storey Lagos Tower)'}
                </span>
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end pt-4 border-t border-[#232C3B]">
            <button
              onClick={handleStartProcessing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl transition-all active:scale-95"
            >
              <span>Process BoQ with Claude AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: STAGED PROGRESS ANIMATION */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#121821] border border-[#232C3B] rounded-2xl p-10 shadow-2xl max-w-2xl mx-auto text-center space-y-8"
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto animate-pulse shadow-lg">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white tracking-wide">
              AI is reading your Bill of Quantities...
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Extracting line items, validating trade rates in ₦, and linking sequential critical path dependencies.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 max-w-md mx-auto">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${stagedProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>{stages[stagedStageIndex]}</span>
              <span>{stagedProgress}%</span>
            </div>
          </div>

          {/* Staged Checklist */}
          <div className="space-y-2.5 max-w-md mx-auto text-left">
            {stages.map((stg, idx) => {
              const isDone = idx < stagedStageIndex;
              const isCurrent = idx === stagedStageIndex;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-colors text-xs font-mono ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 animate-pulse'
                      : 'bg-[#0B0F14]/50 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-current">
                    {isDone ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span className="truncate">{stg}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: REVIEW SCREEN WITH EDITABLE TABLES */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Summary Banner */}
          <div className="bg-[#121821] border border-[#232C3B] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232C3B] pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black text-white tracking-wide">
                    Review Extracted Construction Plan
                  </h2>
                  {aiResponse && (
                    <AIResultBadge
                      source={aiResponse.source}
                      model={aiResponse.model}
                      latencyMs={aiResponse.latencyMs}
                    />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  The AI has proposed the following schedule. You may edit, delete, or add line items before creating the project.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Estimated Total Budget
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  ₦{totalCalculatedBudget.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Editable Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F14] border border-[#232C3B] text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Project Classification / Type
                </label>
                <input
                  type="text"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F14] border border-[#232C3B] text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Warnings Callout */}
            {warnings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-1.5 font-mono">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>AI Verification Warnings & Flags ({warnings.length}):</span>
                </div>
                <ul className="space-y-1 list-disc pl-5">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* "Why?" Expander */}
            <div className="pt-1">
              <button
                onClick={() => setShowWhy(!showWhy)}
                className="text-xs font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Why this plan? (Inputs & Methodology)</span>
                {showWhy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {showWhy && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 p-3 rounded-xl bg-[#0B0F14] border border-[#232C3B] text-[11px] font-mono text-slate-400 space-y-1.5 overflow-hidden"
                  >
                    <div className="font-bold text-slate-300">Inputs Used:</div>
                    <ul className="space-y-0.5 pl-3 list-disc">
                      {(aiResponse?.why?.inputsUsed || [
                        'Raw tabular Bill of Quantities',
                        'Lagos market prices (Dangote cement, high-tensile steel, Coleman armoured cable)',
                        'Standard high-rise structural sequencing (Substructure -> Superstructure -> MEP -> Finishes -> Handover)',
                      ]).map((inp, idx) => (
                        <li key={idx}>{inp}</li>
                      ))}
                    </ul>
                    {assumptions.length > 0 && (
                      <div className="pt-1">
                        <div className="font-bold text-slate-300">Underlying Assumptions:</div>
                        <ul className="space-y-0.5 pl-3 list-disc text-slate-500">
                          {assumptions.map((asm, i) => (
                            <li key={i}>{asm}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Review Tables Container */}
          <div className="bg-[#121821] border border-[#232C3B] rounded-2xl overflow-hidden shadow-xl">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-[#232C3B] px-6 py-3 bg-[#0B0F14]/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    activeTab === 'materials'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Materials & Rates ({materials.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    activeTab === 'tasks'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Tasks & Sequencing ({tasks.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('milestones')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    activeTab === 'milestones'
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Milestones ({milestones.length})</span>
                </button>
              </div>

              <div>
                {activeTab === 'materials' && (
                  <button
                    onClick={handleAddMaterial}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                )}
                {activeTab === 'tasks' && (
                  <button
                    onClick={handleAddTask}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                )}
                {activeTab === 'milestones' && (
                  <button
                    onClick={handleAddMilestone}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: MATERIALS TABLE */}
            {activeTab === 'materials' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0F14] text-slate-400 uppercase font-mono text-[10px] border-b border-[#232C3B]">
                    <tr>
                      <th className="px-4 py-3">Material Description</th>
                      <th className="px-4 py-3">Trade Category</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Unit Rate (₦)</th>
                      <th className="px-4 py-3">Total (₦)</th>
                      <th className="px-4 py-3">Supplier Category</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232C3B] text-slate-200">
                    {materials.map((mat, idx) => {
                      const itemTotal = (Number(mat.quantity) || 0) * (Number(mat.unitRateNGN) || 0);

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={mat.name}
                              onChange={(e) => handleUpdateMaterial(idx, 'name', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-amber-500 font-semibold focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={mat.category}
                              onChange={(e) => handleUpdateMaterial(idx, 'category', e.target.value)}
                              className="w-28 bg-transparent border-b border-transparent focus:border-amber-500 text-slate-400 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              value={mat.quantity}
                              onChange={(e) => handleUpdateMaterial(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20 bg-transparent border-b border-transparent focus:border-amber-500 font-mono text-amber-300 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-400">
                            <input
                              type="text"
                              value={mat.unit}
                              onChange={(e) => handleUpdateMaterial(idx, 'unit', e.target.value)}
                              className="w-16 bg-transparent border-b border-transparent focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              value={mat.unitRateNGN}
                              onChange={(e) => handleUpdateMaterial(idx, 'unitRateNGN', parseFloat(e.target.value) || 0)}
                              className="w-24 bg-transparent border-b border-transparent focus:border-amber-500 font-mono text-slate-200 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-emerald-400">
                            ₦{itemTotal.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-slate-400">
                            <input
                              type="text"
                              value={mat.suggestedSupplierType}
                              onChange={(e) => handleUpdateMaterial(idx, 'suggestedSupplierType', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-amber-500 focus:outline-none truncate"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteMaterial(idx)}
                              className="p-1 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: TASKS TABLE */}
            {activeTab === 'tasks' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0F14] text-slate-400 uppercase font-mono text-[10px] border-b border-[#232C3B]">
                    <tr>
                      <th className="px-4 py-3">Task Title</th>
                      <th className="px-4 py-3">Phase</th>
                      <th className="px-4 py-3">Estimated Duration</th>
                      <th className="px-4 py-3">Dependencies</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232C3B] text-slate-200">
                    {tasks.map((task, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => handleUpdateTask(idx, 'title', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent focus:border-amber-500 font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={task.phase}
                            onChange={(e) => handleUpdateTask(idx, 'phase', e.target.value)}
                            className="w-48 bg-transparent border-b border-transparent focus:border-amber-500 text-blue-300 font-mono text-[11px] focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5 font-mono">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={task.estimatedDurationDays}
                              onChange={(e) =>
                                handleUpdateTask(idx, 'estimatedDurationDays', parseInt(e.target.value) || 1)
                              }
                              className="w-16 bg-transparent border-b border-transparent focus:border-amber-500 font-bold focus:outline-none"
                            />
                            <span className="text-slate-500">days</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-slate-400 font-mono">
                          {task.dependsOn.length > 0 ? task.dependsOn.join('; ') : 'None (Initial)'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteTask(idx)}
                            className="p-1 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: MILESTONES TABLE */}
            {activeTab === 'milestones' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0F14] text-slate-400 uppercase font-mono text-[10px] border-b border-[#232C3B]">
                    <tr>
                      <th className="px-4 py-3 w-16">Order</th>
                      <th className="px-4 py-3">Milestone Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232C3B] text-slate-200">
                    {milestones.map((ms, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-mono font-bold text-amber-400">
                          #{ms.order}
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={ms.title}
                            onChange={(e) => handleUpdateMilestone(idx, e.target.value)}
                            className="w-full bg-transparent border-b border-transparent focus:border-amber-500 font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          {idx === milestones.length - 1 ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">
                              Handover (BuildTwin)
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500">
                              Stage Gate
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteMilestone(idx)}
                            className="p-1 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Human Confirm Action Bar */}
          <div className="bg-[#121821] border border-[#232C3B] rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Mandatory human review: Clicking "Create Project" will initialize project records, stock inventory, and task dependencies.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors"
              >
                Back to Upload
              </button>

              <button
                onClick={handleCreateProject}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Project...' : 'Create Project'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
