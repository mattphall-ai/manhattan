import React, { useRef } from 'react';
import { Project } from '../types';
import { Layers, Plus, Copy, Trash2, RotateCcw, Upload, FileJson, Library } from 'lucide-react';

interface ProjectSelectorProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onResetToDefaults: () => void;
  onImportProject: (imported: Project) => void;
  onOpenBenchmarkLibrary: () => void;
}

export default function ProjectSelector({
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onDuplicateProject,
  onDeleteProject,
  onResetToDefaults,
  onImportProject,
  onOpenBenchmarkLibrary
}: ProjectSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Basic schema validation
        if (parsed.id && parsed.details && parsed.estimates) {
          // Adjust id to prevent conflicts
          const validated: Project = {
            ...parsed,
            id: `imported-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onImportProject(validated);
          alert(`Successfully imported "${validated.details.projectName}"!`);
        } else {
          alert("Invalid estimate file format. Please upload a valid exported estimate JSON.");
        }
      } catch (err) {
        alert("Error reading JSON file. Please make sure the file is not corrupted.");
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be imported again
    if (e.target) e.target.value = '';
  };

  return (
    <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3" id="project-selector-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider text-slate-400">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          Estimate File:
        </div>
        <select
          className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded px-2.5 py-1.5 w-full sm:w-[280px] focus:outline-hidden focus:border-blue-500 focus:ring-0 cursor-pointer"
          value={activeProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          id="select-project"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.details.projectName || 'Untitled Estimate'} ({project.details.jobNumber || 'No Job #'})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* Create New Project */}
        <button
          onClick={onNewProject}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          title="Create blank new estimate"
          id="btn-new-project"
        >
          <Plus className="w-3 h-3" />
          <span>New Estimate</span>
        </button>

        {/* Load from Benchmark Library */}
        <button
          onClick={onOpenBenchmarkLibrary}
          className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          title="Browse benchmark tactics and load one as a new estimate"
          id="btn-open-benchmark-library"
        >
          <Library className="w-3 h-3" />
          <span>Load Benchmark</span>
        </button>

        {/* Duplicate Estimate */}
        <button
          onClick={() => onDuplicateProject(activeProjectId)}
          className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          title="Clone current estimate settings and hours"
          id="btn-duplicate-project"
        >
          <Copy className="w-3 h-3" />
          <span>Clone</span>
        </button>

        {/* Import JSON file */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".json" 
          className="hidden" 
          id="import-file-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          title="Upload estimate backup JSON file"
          id="btn-import-project"
        >
          <Upload className="w-3 h-3" />
          <span>Import</span>
        </button>

        {/* Export raw JSON */}
        <a
          href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(activeProject, null, 2))}`}
          download={`${activeProject.details.projectName.toLowerCase().replace(/\s+/g, '_')}_data.json`}
          className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          title="Save raw estimate data file to local drive"
          id="lnk-export-json"
        >
          <FileJson className="w-3 h-3" />
          <span>Backup JSON</span>
        </a>

        {/* Delete current Estimate */}
        <button
          onClick={() => onDeleteProject(activeProjectId)}
          disabled={projects.length <= 1}
          className={`flex items-center gap-1 border font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
            projects.length <= 1
              ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
              : 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
          }`}
          title="Delete this estimate forever"
          id="btn-delete-project"
        >
          <Trash2 className="w-3 h-3" />
          <span>Delete</span>
        </button>

        {/* Reset system to defaults */}
        <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden sm:block"></div>
        <button
          onClick={onResetToDefaults}
          className="flex items-center gap-1 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/20 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          title="Re-load initial showcase templates"
          id="btn-reset-defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset App</span>
        </button>
      </div>
    </div>
  );
}
