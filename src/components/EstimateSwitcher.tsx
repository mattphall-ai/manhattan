import { useEffect, useMemo, useRef, useState } from 'react';
import { Project } from '../types';
import { Search, ChevronDown, Check } from 'lucide-react';

interface EstimateSwitcherProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
}

export default function EstimateSwitcher({ projects, activeProjectId, onSelectProject }: EstimateSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    searchInputRef.current?.focus();
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p => {
      const d = p.details;
      const haystack = [
        d.projectName, d.brand, d.jobNumber, d.estimatePreparedBy,
        d.businessManager, d.agency, d.scopeOfWork, d.client,
        p.estimateNumber, p.baseEstimateNumber, p.notes,
      ];
      return haystack.some(field => field && field.toLowerCase().includes(q));
    });
  }, [projects, query]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if (isOpen) setQuery('');
  };

  const handleSelect = (id: string) => {
    onSelectProject(id);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full sm:w-[280px]" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded px-2.5 py-1.5 focus:outline-hidden focus:border-blue-500 cursor-pointer"
        id="btn-estimate-switcher"
      >
        <span className="truncate">
          {activeProject
            ? `${activeProject.details.projectName || 'Untitled Estimate'} (${activeProject.details.jobNumber || 'No Job #'})`
            : 'Select an estimate...'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full sm:w-[380px] bg-white border border-slate-200 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col max-h-96">
          {/* Search bar */}
          <div className="p-2 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, brand, job #, bid #, agency..."
                className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-0 transition-colors"
              />
            </div>
          </div>

          {/* Results list */}
          <div className="overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="px-3 py-6 text-center text-[11px] text-slate-400 font-medium">
                No estimates match "{query}"
              </div>
            ) : (
              filteredProjects.map(p => {
                const isActive = p.id === activeProjectId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-3 py-2 border-b border-slate-100 last:border-0 transition-colors cursor-pointer ${
                      isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {p.details.projectName || 'Untitled Estimate'}
                      </span>
                      {isActive && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium">
                      <span className="font-mono">#{p.estimateNumber || '—'}</span>
                      <span>{p.details.jobNumber || 'No Job #'}</span>
                      {p.details.agency && <span className="truncate">{p.details.agency}</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
