import { ProjectDetails, Client, Project } from '../types';
import { StickyNote } from 'lucide-react';

interface ProjectInfoFormProps {
  details: ProjectDetails;
  onChange: (details: ProjectDetails) => void;
  activeProject: Project;
  projects: Project[];
  onSelectProject: (id: string) => void;
  onOpenVersionNotes?: () => void;
}

export default function ProjectInfoForm({ 
  details, 
  onChange, 
  activeProject, 
  projects, 
  onSelectProject,
  onOpenVersionNotes
}: ProjectInfoFormProps) {
  const handleFieldChange = (field: keyof ProjectDetails, value: string) => {
    onChange({
      ...details,
      [field]: value
    });
  };

  const inputClass = "w-full py-1.5 bg-transparent border-b border-slate-200 focus:border-indigo-500 focus:ring-0 focus:outline-hidden text-xs font-semibold text-slate-800 transition-all placeholder-slate-400";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block";

  // Find all estimates that share the same baseEstimateNumber (versions)
  const baseNum = activeProject.baseEstimateNumber || '100';
  const versions = projects.filter(p => p.baseEstimateNumber === baseNum);

  // Sort versions by their estimateNumber suffix if decimal (e.g. 100, 100.1, 100.2)
  versions.sort((a, b) => {
    const numA = parseFloat(a.estimateNumber || '0');
    const numB = parseFloat(b.estimateNumber || '0');
    return numA - numB;
  });

  return (
    <section className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs" id="project-info-container">
      {/* Header section with Estimate ID and Version Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Project Details</h2>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wider">
            ESTIMATE #{activeProject.estimateNumber || '100'}
          </span>
        </div>
        
        {/* Version switcher and notes action */}
        <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {versions.length > 1 ? (
              <>
                <label htmlFor="versionSelect" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Estimate Versions:
                </label>
                <select
                  id="versionSelect"
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-bold rounded px-2 py-1 focus:outline-hidden focus:border-indigo-500 focus:ring-0 cursor-pointer min-w-[100px]"
                  value={activeProject.id}
                  onChange={(e) => onSelectProject(e.target.value)}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.estimateNumber}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Version: <strong className="font-mono text-slate-600">v{activeProject.estimateNumber || '100'}</strong>
              </span>
            )}
          </div>
          
          <button
            type="button"
            onClick={onOpenVersionNotes}
            className={`text-[10px] font-bold flex items-center gap-1 transition-all uppercase tracking-wider cursor-pointer bg-transparent border-0 p-0 self-start sm:self-auto mt-0.5 ${
              activeProject.versionNotes 
                ? 'text-indigo-600 hover:text-indigo-800 font-extrabold' 
                : 'text-slate-400 hover:text-indigo-600'
            }`}
            id="btn-version-notes"
            title="Add or view what has changed in this estimate version"
          >
            <StickyNote className={`w-3.5 h-3.5 ${activeProject.versionNotes ? 'text-indigo-600' : 'text-slate-400'}`} />
            {activeProject.versionNotes ? 'Version Notes (Saved)' : '+ Add Version Notes'}
          </button>
        </div>
      </div>

      {/* Modern Multi-row Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Row 1: Project Name (Wide) and Client Selector */}
        <div className="md:col-span-2 flex flex-col">
          <label htmlFor="projectName" className={labelClass}>Project / Estimate Name</label>
          <input
            id="projectName"
            type="text"
            className={`${inputClass} font-bold text-sm text-slate-900 border-b hover:border-slate-300 focus:border-indigo-500`}
            placeholder="Summer Global Launch"
            value={details.projectName}
            onChange={(e) => handleFieldChange('projectName', e.target.value)}
          />
        </div>

        {/* Client Profile */}
        <div className="flex flex-col">
          <label htmlFor="clientSelect" className={labelClass}>Client Profile (Rate Card)</label>
          <select
            id="clientSelect"
            className={`${inputClass} cursor-pointer text-indigo-600 font-bold bg-transparent focus:ring-0`}
            value={details.client}
            onChange={(e) => handleFieldChange('client', e.target.value as Client)}
          >
            <option value="Standard">Standard Rate</option>
            <option value="Client A">Client A Rate</option>
            <option value="Client B">Client B Rate</option>
          </select>
        </div>

        {/* Row 2: Secondary Metadata */}
        <div className="flex flex-col">
          <label htmlFor="brand" className={labelClass}>Brand / Product</label>
          <input
            id="brand"
            type="text"
            className={inputClass}
            placeholder="Zest Sparkle"
            value={details.brand}
            onChange={(e) => handleFieldChange('brand', e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="jobNumber" className={labelClass}>Job Number</label>
          <input
            id="jobNumber"
            type="text"
            className={`${inputClass} font-mono text-indigo-600 uppercase`}
            placeholder="BDI-2026-VFX"
            value={details.jobNumber}
            onChange={(e) => handleFieldChange('jobNumber', e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="agency" className={labelClass}>Agency Name</label>
          <input
            id="agency"
            type="text"
            className={inputClass}
            placeholder="Mirage Creative"
            value={details.agency}
            onChange={(e) => handleFieldChange('agency', e.target.value)}
          />
        </div>

        {/* Row 3: Owners/Stakeholders */}
        <div className="flex flex-col">
          <label htmlFor="estimatePreparedBy" className={labelClass}>Estimate Prepared By</label>
          <input
            id="estimatePreparedBy"
            type="text"
            className={inputClass}
            placeholder="Alex Henderson"
            value={details.estimatePreparedBy}
            onChange={(e) => handleFieldChange('estimatePreparedBy', e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="businessManager" className={labelClass}>Business Manager</label>
          <input
            id="businessManager"
            type="text"
            className={inputClass}
            placeholder="Sarah Jenkins"
            value={details.businessManager}
            onChange={(e) => handleFieldChange('businessManager', e.target.value)}
          />
        </div>

        {/* Full-width Scope of Work / Project Details field */}
        <div className="lg:col-span-3 md:col-span-2 flex flex-col space-y-1">
          <label htmlFor="scopeOfWork" className={labelClass}>Scope of Work & Deliverables Description</label>
          <textarea
            id="scopeOfWork"
            rows={3}
            className="w-full py-2 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-0 focus:outline-hidden text-xs font-semibold text-slate-800 transition-all placeholder-slate-400 rounded-lg resize-y"
            placeholder="Outline the scope of the ask, standard deliverable items, technical guidelines, schedule milestones, and standard assumptions..."
            value={details.scopeOfWork || ''}
            onChange={(e) => handleFieldChange('scopeOfWork', e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
