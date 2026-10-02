import React, { useState, useEffect } from 'react';
import { Navbar, AppModule } from './components/layout/Navbar';
import { CommandCenterView } from './components/command-center/CommandCenterView';
import { ProjectDashboard } from './components/projects/ProjectDashboard';
import { ProcurementView } from './components/procurement/ProcurementView';
import { BuildTwinView } from './components/buildings/BuildTwinView';
import { PortfolioMapView } from './components/portfolio/PortfolioMapView';
import { CommandPalette } from './components/ai/CommandPalette';
import { BusinessModelModal } from './components/business/BusinessModelModal';
import { HandoverCertificateModal } from './components/operate/HandoverCertificateModal';
import { AskAIDialog } from './components/ai/AskAIDialog';
import { SiteView } from './components/site/SiteView';
import { SyncCenterDrawer } from './components/offline/SyncCenterDrawer';
import { DevOfflinePill } from './components/offline/DevOfflinePill';
import { seedLocalDataIfEmpty } from './lib/offline/db';
import { registerServiceWorker } from './lib/offline/swRegistration';
import { flushOutbox } from './lib/offline/sync';
import { api, ProjectDetailResponse, ProcurementResponse, BuildingDetailResponse } from './lib/api';
import { Project, Building, User } from './types';
import { Loader2 } from 'lucide-react';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  const [currentModule, setCurrentModule] = useState<AppModule>('command_center');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Pillar Data States
  const [projectDetail, setProjectDetail] = useState<ProjectDetailResponse | null>(null);
  const [procurementData, setProcurementData] = useState<ProcurementResponse | null>(null);
  const [buildingDetail, setBuildingDetail] = useState<BuildingDetailResponse | null>(null);

  // AI & Interactive Modals States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isHandoverCertOpen, setIsHandoverCertOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSyncCenterOpen, setIsSyncCenterOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // Initial Load & PWA Service Worker Registration
  useEffect(() => {
    // Register Service Worker for offline PWA capabilities
    registerServiceWorker(() => {
      flushOutbox();
    });

    async function init() {
      try {
        setIsLoading(true);
        if (!(await api.restoreSession())) return;
        const [projRes, bldgRes, userRes] = await Promise.all([
          api.getProjects(),
          api.getBuildings(),
          api.getCurrentUser(),
        ]);

        setProjects(projRes);
        setBuildings(bldgRes);
        setCurrentUser(userRes);

        const vh = projRes[0];
        setActiveProject(vh);

        const bldg = bldgRes[0];
        setActiveBuilding(bldg);

        if (vh) {
          await loadProjectPillars(vh.id, projRes);
        }
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Unable to load account data.');
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    const logoutOnExpiry = () => { setCurrentUser(null); setProjects([]); setActiveProject(null); setAuthError('Your session expired. Please sign in again.'); };
    window.addEventListener('construx:unauthorized', logoutOnExpiry);
    return () => window.removeEventListener('construx:unauthorized', logoutOnExpiry);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    const { user } = await api.login(email, password);
    setCurrentUser(user);
    const [projectList, buildingList] = await Promise.all([api.getProjects(), api.getBuildings()]);
    setProjects(projectList);
    setBuildings(buildingList);
    const project = projectList[0];
    setActiveProject(project ?? null);
    setActiveBuilding(buildingList[0] ?? null);
    if (project) await loadProjectPillars(project.id, projectList);
  };

  const loadProjectPillars = async (projId: string, currentProjects?: Project[]) => {
    try {
      const [projDetail, procData] = await Promise.all([
        api.getProject(projId),
        api.getProcurement(projId),
      ]);
      setProjectDetail(projDetail);
      setProcurementData(procData);

      // Seed local Dexie IndexedDB cache so all views are offline-first
      seedLocalDataIfEmpty(
        currentProjects || projects,
        projDetail.tasks,
        procData.materials,
        procData.purchaseOrders,
        projDetail.siteUpdates
      );

      // If project has handed over building, load building
      if (projDetail.project.activeBuildingId) {
        const bldgRes = await api.getBuilding(projDetail.project.activeBuildingId);
        setBuildingDetail(bldgRes);
        setActiveBuilding(bldgRes.building);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to load project data.');
    }
  };

  const handleSelectModule = (mod: AppModule) => {
    setCurrentModule(mod);
  };

  const handleSelectProject = async (proj: Project) => {
    setActiveProject(proj);
    await loadProjectPillars(proj.id);
  };

  const handleSelectBuilding = async (bldg: Building) => {
    setActiveBuilding(bldg);
    try {
      const res = await api.getBuilding(bldg.id);
      setBuildingDetail(res);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to load building data.');
    }
  };

  // Handover Execution
  const handleTriggerHandover = async () => {
    if (!activeProject) return;
    try {
      const res = await api.triggerHandover(activeProject.id);

      // Refresh project and buildings
      await loadProjectPillars(activeProject.id);
      const bldgs = await api.getBuildings();
      setBuildings(bldgs);
      setActiveBuilding(res.building);

      const bDetail = await api.getBuilding(res.building.id);
      setBuildingDetail(bDetail);

      setCurrentModule('operate');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Handover failed.');
    }
  };

  // Post Site Update
  const handlePostSiteUpdate = async (data: {
    note: string;
    photoUrl?: string;
    tags?: string[];
    completionReported?: number;
  }) => {
    if (!activeProject) return;
    try {
      await api.postSiteUpdate(activeProject.id, data);
      await loadProjectPillars(activeProject.id);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Site update failed.');
    }
  };

  // Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, status: any, progress?: number) => {
    if (!activeProject) return;
    try {
      await api.updateTask(activeProject.id, taskId, { status, progress });
      await loadProjectPillars(activeProject.id);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Task update failed.');
    }
  };

  // Add Task
  const handleAddTask = async (taskData: Partial<any>) => {
    if (!activeProject) return;
    try {
      await api.createTask(activeProject.id, taskData);
      await loadProjectPillars(activeProject.id);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Task creation failed.');
    }
  };

  // Create Purchase Order
  const handleCreatePO = async (data: {
    materialId: string;
    supplierId: string;
    quantity: number;
    unitCost?: number;
    notes?: string;
  }) => {
    if (!activeProject) return;
    try {
      await api.createPurchaseOrder(activeProject.id, data);
      await loadProjectPillars(activeProject.id);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Purchase order creation failed.');
    }
  };

  // Record Delivery
  const handleRecordDelivery = async (data: {
    materialId: string;
    quantityReceived: number;
    poId?: string;
    notes?: string;
  }) => {
    if (!activeProject) return;
    try {
      await api.recordDelivery(activeProject.id, data);
      await loadProjectPillars(activeProject.id);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Delivery recording failed.');
    }
  };

  // Create Maintenance
  const handleCreateMaintenance = async (data: any) => {
    if (!activeBuilding) return;
    try {
      await api.createMaintenanceTask(activeBuilding.id, data);
      const bDetail = await api.getBuilding(activeBuilding.id);
      setBuildingDetail(bDetail);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Maintenance task creation failed.');
    }
  };

  // Update Maintenance
  const handleUpdateMaintenance = async (taskId: string, status: any) => {
    if (!activeBuilding) return;
    try {
      await api.updateMaintenanceTask(activeBuilding.id, taskId, { status });
      const bDetail = await api.getBuilding(activeBuilding.id);
      setBuildingDetail(bDetail);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Maintenance update failed.');
    }
  };

  // Refresh AI Analysis
  const handleRefreshAI = async () => {
    if (!activeProject) return;
    setIsAiLoading(true);
    try {
      await api.checkScheduleRisk(activeProject.id);
      await loadProjectPillars(activeProject.id);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'AI analysis failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f14] flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse border border-amber-500/30">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">
          CONSTRUX OPERATING SYSTEM
        </div>
        <p className="text-xs text-slate-500 font-mono">Synchronizing Build, Supply, and Operate telemetry...</p>
      </div>
    );
  }

  if (!currentUser) return <LoginView onLogin={handleLogin} error={authError} />;
  if (!activeProject || !projectDetail || !procurementData) {
    return <div role="status" className="min-h-screen bg-[#0b0f14] text-slate-200 flex flex-col items-center justify-center gap-3">
      <p>{projects.length ? 'No project data is available yet.' : 'No projects available yet.'}</p>
      {authError && <p role="alert" className="text-rose-300">{authError}</p>}
      <button className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-slate-950" onClick={() => { void api.logout(); setCurrentUser(null); }}>Sign out</button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-slate-100 flex flex-col selection:bg-amber-500/30">
      {/* Top Operating System Navbar */}
      <Navbar
        currentModule={currentModule}
        onSelectModule={handleSelectModule}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        buildings={buildings}
        activeBuilding={activeBuilding}
        onSelectBuilding={handleSelectBuilding}
        currentUser={currentUser}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenSyncCenter={() => setIsSyncCenterOpen(true)}
        onLogout={() => { void api.logout().finally(() => { setCurrentUser(null); setProjects([]); setActiveProject(null); setProjectDetail(null); setProcurementData(null); }); }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {authError && <div role="alert" className="mb-5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">{authError}<button className="ml-3 underline" onClick={() => setAuthError(null)}>Dismiss</button></div>}
        {/* 1. COMMAND CENTER (Home) */}
        {currentModule === 'command_center' && (
          <CommandCenterView
            projects={projects}
            activeProject={activeProject}
            buildings={buildings}
            alerts={projectDetail.alerts}
            materials={procurementData.materials}
            onNavigate={(mod) => setCurrentModule(mod)}
            onOpenSimulator={() => {
              setCurrentModule('build');
            }}
            onOpenHandoverCert={() => setIsHandoverCertOpen(true)}
            onOpenPricing={() => setIsPricingModalOpen(true)}
          />
        )}

        {/* 2. BUILD MODULE (Projects, Tasks, WhatsApp Field Updates, Gantt, Simulator) */}
        {currentModule === 'build' && (
          <ProjectDashboard
            project={projectDetail.project}
            tasks={projectDetail.tasks}
            milestones={projectDetail.milestones}
            materials={projectDetail.materials}
            siteUpdates={projectDetail.siteUpdates}
            documents={projectDetail.documents}
            alerts={projectDetail.alerts}
            onTriggerHandover={handleTriggerHandover}
            onPostSiteUpdate={handlePostSiteUpdate}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onAddTask={handleAddTask}
            onNavigateToTwin={() => setCurrentModule('operate')}
            onNavigateToProcurement={() => setCurrentModule('supply')}
            onRefreshAI={handleRefreshAI}
            isAiLoading={isAiLoading}
          />
        )}

        {/* 3. SUPPLY MODULE (Materials, Naira Price Desk, Delivery Receiving Wow #1, POs) */}
        {currentModule === 'supply' && (
          <ProcurementView
            project={projectDetail.project}
            materials={procurementData.materials}
            purchaseOrders={procurementData.purchaseOrders}
            inventoryLogs={procurementData.inventoryLogs}
            suppliers={procurementData.suppliers}
            alerts={procurementData.alerts}
            onCreatePO={handleCreatePO}
            onRecordDelivery={handleRecordDelivery}
            onAiSuggest={async (matId) => {
              try {
                const result = await api.suggestProcurement(activeProject.id) as { recommendations?: Array<{ materialId: string; supplierId?: string; quantity: number }> };
                const suggestion = result.recommendations?.find((item) => item.materialId === matId);
                if (!suggestion?.supplierId || suggestion.quantity <= 0) throw new Error('The backend returned no actionable supplier and quantity for this material.');
                await handleCreatePO({ materialId: matId, supplierId: suggestion.supplierId, quantity: suggestion.quantity });
              } catch (err) { setAuthError(err instanceof Error ? err.message : 'Procurement suggestion failed.'); }
            }}
          />
        )}

        {/* 4. OPERATE MODULE (BuildTwin Digital Operating Layer, Isometric 12-Floor Tower, Room 204) */}
        {currentModule === 'operate' && (
          buildingDetail ? (
            <BuildTwinView
              building={buildingDetail.building}
              floors={buildingDetail.floors}
              rooms={buildingDetail.rooms}
              equipment={buildingDetail.equipment}
              systems={buildingDetail.systems}
              maintenance={buildingDetail.maintenance}
              alerts={buildingDetail.alerts}
              onCreateMaintenance={handleCreateMaintenance}
              onUpdateMaintenance={handleUpdateMaintenance}
            />
          ) : (
            <div className="bg-[#121821] border border-[#232C3B] rounded-3xl p-12 text-center space-y-4 shadow-xl">
              <h2 className="text-xl font-bold text-white">No Active Digital Twin for Selected Project</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Trigger the Handover Milestone in the Build module to transition Victoria Heights into a living BuildTwin Digital Twin.
              </p>
              <button
                onClick={() => setCurrentModule('build')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95"
              >
                Go to Build Module
              </button>
            </div>
          )
        )}

        {/* 5. PORTFOLIO MODULE (Lagos Projects & Towers Map) */}
        {currentModule === 'portfolio' && (
          <PortfolioMapView
            projects={projects}
            buildings={buildings}
            onSelectProject={handleSelectProject}
            onSelectBuilding={handleSelectBuilding}
            onNavigateToModule={(mod) => setCurrentModule(mod)}
          />
        )}

        {/* 6. SITE VIEW (Mobile-First Thumb-Friendly Offline PWA) */}
        {currentModule === 'site' && (
          <SiteView
            project={projectDetail.project}
            tasks={projectDetail.tasks}
            materials={procurementData.materials}
            purchaseOrders={procurementData.purchaseOrders}
            siteUpdates={projectDetail.siteUpdates}
            currentUser={currentUser}
            onOpenSyncCenter={() => setIsSyncCenterOpen(true)}
          />
        )}
      </main>

      {/* Global Sync Center Drawer */}
      <SyncCenterDrawer
        isOpen={isSyncCenterOpen}
        onClose={() => setIsSyncCenterOpen(false)}
      />

      {/* Floating Demo Switch Pill */}
      <DevOfflinePill onOpenSyncCenter={() => setIsSyncCenterOpen(true)} />

      {/* Global Command Palette (⌘K) "Ask CONSTRUX" */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(mod) => setCurrentModule(mod)}
        onOpenSimulator={() => setCurrentModule('build')}
        onOpenHandoverCert={() => setIsHandoverCertOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        projects={projects}
        activeProject={activeProject}
        buildings={buildings}
        activeBuilding={activeBuilding}
      />

      {/* Global Business Model / Market Size & SaaS Pricing Slide Modal */}
      <BusinessModelModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* Global Handover Certificate & QR Badges Modal */}
      {activeBuilding && (
        <HandoverCertificateModal
          isOpen={isHandoverCertOpen}
          onClose={() => setIsHandoverCertOpen(false)}
          building={activeBuilding}
          project={activeProject || undefined}
        />
      )}

      {/* Global Hackathon Demo Script Walkthrough Modal */}

      {/* Global Ask CONSTRUX AI Dialog */}
      <AskAIDialog
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        projectId={activeProject?.id}
        buildingId={activeBuilding?.id}
        projectName={currentModule === 'operate' ? activeBuilding?.name : activeProject?.name}
      />

      {/* System Footer Bar */}
      <footer className="border-t border-[#232C3B]/80 bg-[#0B0F14]/90 py-4 text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400 font-semibold">CONSTRUX Construction OS</span>
            <span>•</span>
            <span className="text-slate-500">Single Data Backbone Across Build, Supply, and Operate</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Market Size & SaaS Pricing
            </button>
            <span>•</span>
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              ⌘K Quick Actions
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
