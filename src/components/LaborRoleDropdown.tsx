import { useEffect, useMemo, useRef, useState } from 'react';
import { RATE_CARD, DEPARTMENTS, PhaseRole } from '../types';
import { Plus, Search, Check } from 'lucide-react';

interface LaborRoleDropdownProps {
  phaseRoles: PhaseRole[];
  onSelect: (roleId: string) => void;
}

export default function LaborRoleDropdown({ phaseRoles, onSelect }: LaborRoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const groupedRoles = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = DEPARTMENTS.map(dept => ({
      department: dept,
      roles: RATE_CARD.filter(r =>
        r.department === dept &&
        (q === '' || r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q))
      ),
    })).filter(g => g.roles.length > 0);
    return groups;
  }, [query]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if (isOpen) setQuery('');
  };

  const handleSelect = (roleId: string, isAlreadyAdded: boolean) => {
    if (isAlreadyAdded) return;
    onSelect(roleId);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1 bg-white border border-slate-200 hover:border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 rounded px-2 py-1 focus:outline-hidden focus:border-blue-500 cursor-pointer max-w-[170px]"
        id="btn-add-labor-role"
      >
        <Plus className="w-3 h-3 shrink-0" />
        <span className="truncate">Add Labor Role...</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col max-h-80">
          {/* Search bar */}
          <div className="p-2 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles or departments..."
                className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-0 transition-colors"
              />
            </div>
          </div>

          {/* Grouped role list */}
          <div className="overflow-y-auto">
            {groupedRoles.length === 0 ? (
              <div className="px-3 py-6 text-center text-[11px] text-slate-400 font-medium">
                No roles match "{query}"
              </div>
            ) : (
              groupedRoles.map((group, groupIdx) => (
                <div key={group.department}>
                  {groupIdx > 0 && <div className="border-t border-slate-200" />}
                  <div className="px-3 pt-2 pb-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80">
                    {group.department}
                  </div>
                  {group.roles.map(role => {
                    const isAlreadyAdded = phaseRoles.some(r => r.roleId === role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => handleSelect(role.id, isAlreadyAdded)}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 transition-colors ${
                          isAlreadyAdded
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer'
                        }`}
                      >
                        <span className="truncate">{role.name}</span>
                        {isAlreadyAdded && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
