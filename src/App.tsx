import { useState, useEffect, useMemo } from 'react';
import { Project, Client, RATE_CARD, CustomPhase } from './types';
import { INITIAL_PROJECTS, createNewBlankProject } from './initialProjects';
import { BenchmarkTactic, BenchmarkCategory, BENCHMARK_TACTICS, BENCHMARK_CATEGORIES, createProjectFromBenchmark, createBenchmarkFromProject } from './benchmarkLibrary';
import ProjectInfoForm from './components/ProjectInfoForm';
import EstimatingGrid from './components/EstimatingGrid';
import CostSummary from './components/CostSummary';
import ProjectSelector from './components/ProjectSelector';
import RoleHoursRollup from './components/RoleHoursRollup';
import BenchmarkLibrary from './components/BenchmarkLibrary';
import { 
  Sparkles,
  Trash2,
  Plus,
  AlertTriangle,
  RotateCcw,
  FileText,
  X,
  Layers,
  StickyNote
} from 'lucide-react';

const STORAGE_KEY = 'production-project-estimates-v5';
const CUSTOM_BENCHMARKS_KEY = 'production-project-custom-benchmarks-v1';
const DELETED_BENCHMARKS_KEY = 'production-project-deleted-benchmark-ids-v1';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [customBenchmarks, setCustomBenchmarks] = useState<BenchmarkTactic[]>([]);
  const [deletedBenchmarkIds, setDeletedBenchmarkIds] = useState<string[]>([]);

  // Custom Interactive Dialog Modal States
  const [phaseToDelete, setPhaseToDelete] = useState<{ id: string; name: string } | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isClearGridModalOpen, setIsClearGridModalOpen] = useState(false);
  const [isResetAppModalOpen, setIsResetAppModalOpen] = useState(false);
  const [isVersionNotesModalOpen, setIsVersionNotesModalOpen] = useState(false);
  const [tempVersionNotes, setTempVersionNotes] = useState('');
  const [isBenchmarkLibraryOpen, setIsBenchmarkLibraryOpen] = useState(false);
  const [isSaveBenchmarkModalOpen, setIsSaveBenchmarkModalOpen] = useState(false);
  const [saveBenchmarkName, setSaveBenchmarkName] = useState('');
  const [saveBenchmarkCategory, setSaveBenchmarkCategory] = useState<BenchmarkCategory>('Animation');

  // 1. Initial Load of projects from LocalStorage
  useEffect(() => {
    let loaded: Project[] = [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Project[];
        if (parsed.length > 0 && parsed[0].phases) {
          loaded = parsed;
        }
      } catch (err) {
        console.error("Failed to restore estimates from LocalStorage", err);
      }
    }
    
    if (loaded.length === 0) {
      loaded = INITIAL_PROJECTS;
    }

    // Migrate/backfill missing estimateNumber and baseEstimateNumber
    const migrated = loaded.map((p, idx) => {
      const updated = { ...p };
      if (!updated.baseEstimateNumber || !updated.estimateNumber) {
        const assignedBase = (100 + idx).toString();
        updated.baseEstimateNumber = updated.baseEstimateNumber || assignedBase;
        updated.estimateNumber = updated.estimateNumber || assignedBase;
      }
      // Ensure phase roles are ordered as they are ordered in RATE_CARD list
      if (updated.phases) {
        updated.phases = updated.phases.map(phase => {
          if (!phase.roles) return phase;
          const sortedRoles = [...phase.roles].sort((a, b) => {
            const idxA = RATE_CARD.findIndex(rc => rc.id === a.roleId);
            const idxB = RATE_CARD.findIndex(rc => rc.id === b.roleId);
            return idxA - idxB;
          });
          return { ...phase, roles: sortedRoles };
        });
      }
      return updated;
    });

    setProjects(migrated);
    setActiveProjectId(migrated[0].id);
  }, []);

  // 1b. Initial load of user-saved/deleted benchmarks from LocalStorage
  useEffect(() => {
    try {
      const storedCustom = localStorage.getItem(CUSTOM_BENCHMARKS_KEY);
      if (storedCustom) setCustomBenchmarks(JSON.parse(storedCustom));
    } catch (err) {
      console.error("Failed to restore custom benchmarks from LocalStorage", err);
    }
    try {
      const storedDeleted = localStorage.getItem(DELETED_BENCHMARKS_KEY);
      if (storedDeleted) setDeletedBenchmarkIds(JSON.parse(storedDeleted));
    } catch (err) {
      console.error("Failed to restore deleted benchmark ids from LocalStorage", err);
    }
  }, []);

  // Combined benchmark library: seed tactics + user-saved, minus user-deleted
  const allBenchmarkTactics = useMemo(() => {
    return [...BENCHMARK_TACTICS, ...customBenchmarks].filter(t => !deletedBenchmarkIds.includes(t.id));
  }, [customBenchmarks, deletedBenchmarkIds]);

  // Save a new custom benchmark and persist it
  const handleSaveNewBenchmark = (tactic: BenchmarkTactic) => {
    const updated = [...customBenchmarks, tactic];
    setCustomBenchmarks(updated);
    localStorage.setItem(CUSTOM_BENCHMARKS_KEY, JSON.stringify(updated));
  };

  // Remove a benchmark (custom or seed) from the library
  const handleDeleteBenchmark = (id: string) => {
    if (customBenchmarks.some(t => t.id === id)) {
      const updated = customBenchmarks.filter(t => t.id !== id);
      setCustomBenchmarks(updated);
      localStorage.setItem(CUSTOM_BENCHMARKS_KEY, JSON.stringify(updated));
    } else {
      const updated = [...deletedBenchmarkIds, id];
      setDeletedBenchmarkIds(updated);
      localStorage.setItem(DELETED_BENCHMARKS_KEY, JSON.stringify(updated));
    }
  };

  // 2. Persist to LocalStorage whenever projects change
  const saveProjects = (updatedProjects: Project[]) => {
    // Sort roles in each phase before saving
    const sorted = updatedProjects.map(proj => {
      if (!proj.phases) return proj;
      const sortedPhases = proj.phases.map(phase => {
        if (!phase.roles) return phase;
        const sortedRoles = [...phase.roles].sort((a, b) => {
          const idxA = RATE_CARD.findIndex(rc => rc.id === a.roleId);
          const idxB = RATE_CARD.findIndex(rc => rc.id === b.roleId);
          return idxA - idxB;
        });
        return { ...phase, roles: sortedRoles };
      });
      return { ...proj, phases: sortedPhases };
    });

    setProjects(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  };

  // Find currently active project
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  // If we haven't loaded projects yet, show a loading placeholder
  if (!activeProject || !projects.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-medium">Initializing rate cards and loading workspaces...</p>
        </div>
      </div>
    );
  }

  // Update details (Project specifications)
  const handleDetailsChange = (updatedDetails: Project['details']) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          details: updatedDetails,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Add custom phase to active project
  const handleAddPhase = () => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const newPhase: CustomPhase = {
          id: `phase-${Date.now()}`,
          name: 'New Custom Phase',
          roles: []
        };
        return {
          ...p,
          phases: [...p.phases, newPhase],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Delete phase from active project (Triggers Custom Modal Confirmation)
  const handleDeletePhase = (phaseId: string) => {
    const phase = activeProject.phases.find(p => p.id === phaseId);
    if (!phase) return;
    setPhaseToDelete({ id: phaseId, name: phase.name || 'Unnamed Phase' });
  };

  const confirmDeletePhase = () => {
    if (!phaseToDelete) return;
    const { id } = phaseToDelete;
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          phases: p.phases.filter(phase => phase.id !== id),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
    setPhaseToDelete(null);
  };

  // Create new blank estimate file
  const handleNewProject = () => {
    setNewProjectName('New Campaign Bid');
    setIsNewProjectModalOpen(true);
  };

  const confirmNewProject = () => {
    const cleanName = newProjectName.trim() || 'Untitled Estimate';
    
    // Find max base estimate number
    let maxBaseNum = 99;
    projects.forEach(p => {
      const num = parseInt(p.baseEstimateNumber || '0', 10);
      if (!isNaN(num) && num > maxBaseNum) {
        maxBaseNum = num;
      }
    });
    const newBaseNum = (maxBaseNum + 1).toString();

    const newProj = createNewBlankProject(cleanName);
    newProj.baseEstimateNumber = newBaseNum;
    newProj.estimateNumber = newBaseNum;
    
    const updated = [newProj, ...projects];
    saveProjects(updated);
    setActiveProjectId(newProj.id);
    setIsNewProjectModalOpen(false);
  };

  // Load a benchmark tactic from the library as a new active estimate
  const handleLoadBenchmark = (tactic: BenchmarkTactic) => {
    let maxBaseNum = 99;
    projects.forEach(p => {
      const num = parseInt(p.baseEstimateNumber || '0', 10);
      if (!isNaN(num) && num > maxBaseNum) {
        maxBaseNum = num;
      }
    });
    const newBaseNum = (maxBaseNum + 1).toString();

    const newProj = createProjectFromBenchmark(tactic, newBaseNum);
    const updated = [newProj, ...projects];
    saveProjects(updated);
    setActiveProjectId(newProj.id);
  };

  // Open the "Save as Benchmark" modal, pre-filled from the active project
  const handleOpenSaveBenchmark = () => {
    setSaveBenchmarkName(activeProject.details.projectName || 'Untitled Benchmark');
    setSaveBenchmarkCategory('Animation');
    setIsSaveBenchmarkModalOpen(true);
  };

  // Save the active project as a new benchmark tactic in the library
  const confirmSaveBenchmark = () => {
    const cleanName = saveBenchmarkName.trim() || 'Untitled Benchmark';
    let tactic = createBenchmarkFromProject(activeProject, cleanName, saveBenchmarkCategory);

    // Ensure a unique id in case of a name collision with an existing tactic
    if (allBenchmarkTactics.some(t => t.id === tactic.id)) {
      let suffix = 2;
      let uniqueId = `${tactic.id}_${suffix}`;
      while (allBenchmarkTactics.some(t => t.id === uniqueId)) {
        suffix += 1;
        uniqueId = `${tactic.id}_${suffix}`;
      }
      tactic = { ...tactic, id: uniqueId };
    }

    handleSaveNewBenchmark(tactic);
    setIsSaveBenchmarkModalOpen(false);
  };

  // Duplicate project estimate (cloning with version number increments)
  const handleDuplicateProject = (id: string) => {
    const source = projects.find(p => p.id === id);
    if (!source) return;

    const baseNum = source.baseEstimateNumber || '100';
    
    // Find all versions of this project
    const existingVersions = projects.filter(p => p.baseEstimateNumber === baseNum);
    
    // Find the next version suffix (e.g. 100.1, 100.2, etc)
    let maxSuffix = 0;
    existingVersions.forEach(p => {
      const estNum = p.estimateNumber || '';
      if (estNum.includes('.')) {
        const parts = estNum.split('.');
        const suffix = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(suffix) && suffix > maxSuffix) {
          maxSuffix = suffix;
        }
      }
    });
    
    const nextSuffix = maxSuffix + 1;
    const nextEstNum = `${baseNum}.${nextSuffix}`;

    const cloned: Project = {
      ...structuredClone(source),
      id: `project-clone-${Date.now()}`,
      estimateNumber: nextEstNum,
      baseEstimateNumber: baseNum,
      details: {
        ...source.details,
        projectName: source.details.projectName,
        jobNumber: source.details.jobNumber
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [cloned, ...projects];
    saveProjects(updated);
    setActiveProjectId(cloned.id);
  };

  // Delete project estimate file
  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;
    const source = projects.find(p => p.id === id);
    if (!source) return;
    setProjectToDelete({ id, name: source.details.projectName || 'this estimate' });
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    const { id } = projectToDelete;
    const filtered = projects.filter(p => p.id !== id);
    saveProjects(filtered);
    setActiveProjectId(filtered[0].id);
    setProjectToDelete(null);
  };

  // Clear all phase hours to zero
  const handleClearGrid = () => {
    setIsClearGridModalOpen(true);
  };

  const confirmClearGrid = () => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const clearedPhases = p.phases.map(phase => {
          const resetRoles = phase.roles.map(r => ({ ...r, hours: 0 }));
          return { ...phase, roles: resetRoles };
        });
        return {
          ...p,
          phases: clearedPhases,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
    setIsClearGridModalOpen(false);
  };

  // Append imported estimate from file selector
  const handleImportProject = (imported: Project) => {
    const updated = [imported, ...projects];
    saveProjects(updated);
    setActiveProjectId(imported.id);
  };

  // Reset local state to original template values
  const handleResetToDefaults = () => {
    setIsResetAppModalOpen(true);
  };

  const confirmResetToDefaults = () => {
    // Re-migrate original templates on reset
    const migrated = INITIAL_PROJECTS.map((p, idx) => {
      const updated = { ...p };
      const assignedBase = (100 + idx).toString();
      updated.baseEstimateNumber = assignedBase;
      updated.estimateNumber = assignedBase;
      return updated;
    });
    saveProjects(migrated);
    setActiveProjectId(migrated[0].id);
    setIsResetAppModalOpen(false);
  };

  // Reorder custom phases manually
  const handleReorderPhases = (newPhases: CustomPhase[]) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          phases: newPhases,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Open version notes editor
  const handleOpenVersionNotes = () => {
    setTempVersionNotes(activeProject.versionNotes || '');
    setIsVersionNotesModalOpen(true);
  };

  // Save version notes
  const handleSaveVersionNotes = () => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          versionNotes: tempVersionNotes,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
    setIsVersionNotesModalOpen(false);
  };

  // Rename custom phase
  const handleRenamePhase = (phaseId: string, name: string) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const updatedPhases = p.phases.map(phase => {
          if (phase.id === phaseId) {
            return { ...phase, name };
          }
          return phase;
        });
        return {
          ...p,
          phases: updatedPhases,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Update notes for a phase
  const handleUpdatePhaseNotes = (phaseId: string, notes: string) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const updatedPhases = p.phases.map(phase => {
          if (phase.id === phaseId) {
            return { ...phase, notes };
          }
          return phase;
        });
        return {
          ...p,
          phases: updatedPhases,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Add a specific labor role to a custom phase
  const handleAddRoleToPhase = (phaseId: string, roleId: string) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const updatedPhases = p.phases.map(phase => {
          if (phase.id === phaseId) {
            // Prevent duplicate additions
            if (phase.roles.some(r => r.roleId === roleId)) {
              return phase;
            }
            return {
              ...phase,
              roles: [...phase.roles, { roleId, hours: 0 }]
            };
          }
          return phase;
        });
        return {
          ...p,
          phases: updatedPhases,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Remove a specific labor role from a custom phase
  const handleRemoveRoleFromPhase = (phaseId: string, roleId: string) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const updatedPhases = p.phases.map(phase => {
          if (phase.id === phaseId) {
            return {
              ...phase,
              roles: phase.roles.filter(r => r.roleId !== roleId)
            };
          }
          return phase;
        });
        return {
          ...p,
          phases: updatedPhases,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Update hours for a specific role inside a phase
  const handleHoursChange = (phaseId: string, roleId: string, hours: number) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const updatedPhases = p.phases.map(phase => {
          if (phase.id === phaseId) {
            const updatedRoles = phase.roles.map(r => {
              if (r.roleId === roleId) {
                return { ...r, hours };
              }
              return r;
            });
            return { ...phase, roles: updatedRoles };
          }
          return phase;
        });
        return {
          ...p,
          phases: updatedPhases,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Add Out-of-Pocket cost
  const handleAddOopCost = (name: string) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const currentOop = p.oopCosts || [];
        const newOop = {
          id: `oop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          amount: 0
        };
        return {
          ...p,
          oopCosts: [...currentOop, newOop],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Remove Out-of-Pocket cost
  const handleRemoveOopCost = (oopCostId: string) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          oopCosts: (p.oopCosts || []).filter(o => o.id !== oopCostId),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Update Out-of-Pocket cost amount
  const handleUpdateOopCostAmount = (oopCostId: string, amount: number) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const updatedOop = (p.oopCosts || []).map(o => {
          if (o.id === oopCostId) {
            return { ...o, amount };
          }
          return o;
        });
        return {
          ...p,
          oopCosts: updatedOop,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Update Out-of-Pocket cost name
  const handleUpdateOopCostName = (oopCostId: string, name: string) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        const updatedOop = (p.oopCosts || []).map(o => {
          if (o.id === oopCostId) {
            return { ...o, name };
          }
          return o;
        });
        return {
          ...p,
          oopCosts: updatedOop,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Notes updates
  const handleNotesChange = (notes: string) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, notes, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Contingency updates
  const handleContingencyChange = (contingencyPercent: number) => {
    const updated = projects.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, contingencyPercent, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    saveProjects(updated);
  };



  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-16 antialiased flex flex-col">
      {/* Top Professional App Banner Bar (High Density Dark Theme) */}
      <header className="h-12 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">∑</span>
          </div>
          <h1 className="text-sm font-semibold uppercase tracking-wider">Production Estimator Pro</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="opacity-70">
            Rate Basis: <strong className="text-blue-400">{activeProject.details.client} Profile</strong>
          </span>
          <span className="opacity-40">|</span>
          <span className="opacity-70 font-mono text-[10px]">Prepared: 2026-07-01</span>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-4 space-y-4 grow">
        
        {/* Project Estimator Management Toolbar (Import, Export, Clone, New) */}
        <ProjectSelector 
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onNewProject={handleNewProject}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onResetToDefaults={handleResetToDefaults}
          onImportProject={handleImportProject}
          onOpenBenchmarkLibrary={() => setIsBenchmarkLibraryOpen(true)}
          onOpenSaveBenchmark={handleOpenSaveBenchmark}
        />

        {/* Master Estimator Grid Layout (Main Area vs Summary Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2 COLUMNS: Specs & Matrix Grid */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Specs Component */}
            <ProjectInfoForm 
              details={activeProject.details}
              onChange={handleDetailsChange}
              activeProject={activeProject}
              projects={projects}
              onSelectProject={setActiveProjectId}
              onOpenVersionNotes={handleOpenVersionNotes}
            />

            {/* Core Phase Estimating Sheet */}
            <EstimatingGrid 
              phases={activeProject.phases || []}
              oopCosts={activeProject.oopCosts || []}
              client={activeProject.details.client}
              contingencyPercent={activeProject.contingencyPercent || 0}
              onContingencyChange={handleContingencyChange}
              onAddPhase={handleAddPhase}
              onDeletePhase={handleDeletePhase}
              onRenamePhase={handleRenamePhase}
              onUpdatePhaseNotes={handleUpdatePhaseNotes}
              onAddOopCost={handleAddOopCost}
              onRemoveOopCost={handleRemoveOopCost}
              onUpdateOopCostAmount={handleUpdateOopCostAmount}
              onUpdateOopCostName={handleUpdateOopCostName}
              onAddRoleToPhase={handleAddRoleToPhase}
              onRemoveRoleFromPhase={handleRemoveRoleFromPhase}
              onHoursChange={handleHoursChange}
              onReorderPhases={handleReorderPhases}
            />

            {/* Aggregated Labor STAFFING Rollup Component (Active View Module) */}
            <RoleHoursRollup 
              phases={activeProject.phases || []}
              client={activeProject.details.client}
            />

          </div>

          {/* RIGHT COLUMN: Costs & Calculations Sidebar */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            
            {/* Financial Summary & modifiers Panel */}
            <CostSummary 
              phases={activeProject.phases || []}
              oopCosts={activeProject.oopCosts || []}
              details={activeProject.details}
              notes={activeProject.notes || ''}
              contingencyPercent={activeProject.contingencyPercent || 0}
              onNotesChange={handleNotesChange}
              onContingencyChange={handleContingencyChange}
              estimateNumber={activeProject.estimateNumber}
            />



          </div>

        </div>

      </main>
      
      {/* Footer Bar */}
      <footer className="h-8 bg-slate-100 border-t border-slate-200 flex items-center px-6 justify-between text-[10px] text-slate-400 font-medium mt-12 shrink-0">
        <div>Last saved just now by {activeProject.details.estimatePreparedBy || 'Estimator'}</div>
        <div className="flex gap-4">
          <span>Revision: #{activeProject.estimateNumber || '100'}</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Cloud Sync: Active
          </span>
        </div>
      </footer>

      {/* ==================== BEAUTIFUL INTERACTIVE MODALS ==================== */}
      
      {/* 1. Custom Confirmation Modal: Delete Phase */}
      {phaseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-delete-phase">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-50 p-4 border-b border-red-150 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Trash Phase</h3>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Warning: Permanent Action</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to trash <strong className="text-slate-800">"{phaseToDelete.name}"</strong>? This will permanently delete this phase and wipe out all labor hours estimated within it.
              </p>
            </div>
            <div className="bg-slate-50 p-3 px-5 flex justify-end gap-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setPhaseToDelete(null)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePhase}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
              >
                Trash Phase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Custom Confirmation Modal: Delete Estimate Project */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-delete-project">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-50 p-4 border-b border-red-150 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Delete Estimate File</h3>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Warning: Permanent Action</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">"{projectToDelete.name}"</strong>? All phases, custom labor roles, and out-of-pocket expenses inside this estimate will be lost forever.
              </p>
            </div>
            <div className="bg-slate-50 p-3 px-5 flex justify-end gap-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
              >
                Delete Estimate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Custom Input Modal: Create New Estimate */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-new-project">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              confirmNewProject();
            }}
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="bg-blue-50 p-4 border-b border-blue-150 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Create New Estimate</h3>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Initialize Workspace</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col space-y-1">
                <label htmlFor="newProjectName" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimate / Campaign Name</label>
                <input
                  id="newProjectName"
                  type="text"
                  required
                  className="w-full py-2 px-3 border border-slate-200 rounded text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-colors"
                  placeholder="e.g. Q3 Social Videos"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                This will create a brand new blank estimate workspace. It will be assigned a unique sequential Estimate Number (e.g. #102) and will be ready to be filled out immediately.
              </p>
            </div>
            <div className="bg-slate-50 p-3 px-5 flex justify-end gap-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
              >
                Create Estimate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Custom Confirmation Modal: Clear Grid Hours */}
      {isClearGridModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-clear-grid">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-50 p-4 border-b border-amber-150 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Reset Allocated Hours</h3>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Verify Reset</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to reset all estimated hours in this workspace to zero? The custom phases and roles will be retained, but all hours will be cleared.
              </p>
            </div>
            <div className="bg-slate-50 p-3 px-5 flex justify-end gap-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setIsClearGridModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearGrid}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
              >
                Clear Hours
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Custom Confirmation Modal: Reset App */}
      {isResetAppModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-reset-app">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-50 p-4 border-b border-amber-150 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Reset Application State</h3>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Destructive Operation</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you absolutely sure you want to reset the application? This will permanently wipe all current custom estimates from LocalStorage and reload the default showcases.
              </p>
            </div>
            <div className="bg-slate-50 p-3 px-5 flex justify-end gap-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setIsResetAppModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetToDefaults}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
              >
                Reset App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Custom Interactive Dialog: Edit Version Change Notes */}
      {isVersionNotesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-version-notes">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-indigo-50 p-4 border-b border-indigo-150 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Version Notes & Change History</h3>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Estimate Version v{activeProject.estimateNumber || '100'}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsVersionNotesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="tempVersionNotes" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  What changed in this version?
                </label>
                <textarea
                  id="tempVersionNotes"
                  rows={6}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-0 transition-all placeholder-slate-400 resize-y"
                  placeholder="e.g. Added 2 more custom phases for postproduction reviews. Standardized developer day rates. Updated total contingency buffer to 10% to accommodate new deliverables..."
                  value={tempVersionNotes}
                  onChange={(e) => setTempVersionNotes(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Version change notes are associated with version <strong className="font-semibold text-indigo-600">v{activeProject.estimateNumber || '100'}</strong> of this campaign estimate. These notes are preserved in this specific snapshot so you can keep a clean change register.
              </p>
            </div>
            
            <div className="bg-slate-50 p-3 px-5 flex justify-end gap-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setIsVersionNotesModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVersionNotes}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Benchmark Library: browse and load a tactic as a new estimate */}
      <BenchmarkLibrary
        isOpen={isBenchmarkLibraryOpen}
        onClose={() => setIsBenchmarkLibraryOpen(false)}
        onLoad={handleLoadBenchmark}
        tactics={allBenchmarkTactics}
        onDelete={handleDeleteBenchmark}
      />

      {/* 8. Save Current Estimate as a Benchmark */}
      {isSaveBenchmarkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-save-benchmark">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              confirmSaveBenchmark();
            }}
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="bg-indigo-50 p-4 border-b border-indigo-150 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Save as Benchmark</h3>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Add to Benchmark Library</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col space-y-1">
                <label htmlFor="saveBenchmarkName" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Benchmark Name</label>
                <input
                  id="saveBenchmarkName"
                  type="text"
                  required
                  className="w-full py-2 px-3 border border-slate-200 rounded text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-colors"
                  placeholder="e.g. Animated Product Demo - Level 1"
                  value={saveBenchmarkName}
                  onChange={(e) => setSaveBenchmarkName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label htmlFor="saveBenchmarkCategory" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  id="saveBenchmarkCategory"
                  className="w-full py-2 px-3 border border-slate-200 rounded text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-colors cursor-pointer"
                  value={saveBenchmarkCategory}
                  onChange={(e) => setSaveBenchmarkCategory(e.target.value as BenchmarkCategory)}
                >
                  {BENCHMARK_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Saves the current estimate's labor roles and hours (excluding the Production Management phase) as a reusable benchmark tactic. Scope of Work becomes the benchmark description.
              </p>
            </div>
            <div className="bg-slate-50 p-3 px-5 flex justify-end gap-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setIsSaveBenchmarkModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
              >
                Save Benchmark
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
