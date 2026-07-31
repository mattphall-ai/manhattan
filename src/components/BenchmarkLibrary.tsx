import { useMemo, useState } from 'react';
import { BENCHMARK_CATEGORIES, BENCHMARK_TACTICS, BenchmarkCategory, BenchmarkTactic } from '../benchmarkLibrary';
import { RATE_CARD } from '../types';
import { Library, X, Clock, DollarSign, ArrowRight } from 'lucide-react';

interface BenchmarkLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (tactic: BenchmarkTactic) => void;
}

const roleName = (roleId: string) => RATE_CARD.find(r => r.id === roleId)?.name || roleId;

export default function BenchmarkLibrary({ isOpen, onClose, onLoad }: BenchmarkLibraryProps) {
  const [category, setCategory] = useState<BenchmarkCategory>('Animation');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tacticsInCategory = useMemo(
    () => BENCHMARK_TACTICS.filter(t => t.category === category),
    [category]
  );

  const selected = useMemo(
    () => BENCHMARK_TACTICS.find(t => t.id === selectedId) || null,
    [selectedId]
  );

  if (!isOpen) return null;

  const totalHours = (t: BenchmarkTactic) => t.roleHours.reduce((sum, rh) => sum + rh.hours, 0);

  const handleSelectCategory = (c: BenchmarkCategory) => {
    setCategory(c);
    setSelectedId(null);
  };

  const handleLoad = () => {
    if (!selected) return;
    onLoad(selected);
    onClose();
    setSelectedId(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-benchmark-library">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-4xl w-full h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-indigo-50 p-4 border-b border-indigo-150 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
              <Library className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Benchmark Library</h3>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Load a Tactic as a New Estimate</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: category rail + tactic list + detail pane */}
        <div className="flex flex-1 min-h-0">
          {/* Category rail */}
          <div className="w-40 shrink-0 border-r border-slate-100 bg-slate-50 overflow-y-auto py-2">
            {BENCHMARK_CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => handleSelectCategory(c)}
                className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  c === category
                    ? 'bg-white text-indigo-600 border-l-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-l-2 border-transparent'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Tactic list */}
          <div className="w-72 shrink-0 border-r border-slate-100 overflow-y-auto">
            {tacticsInCategory.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors cursor-pointer ${
                  t.id === selectedId ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 leading-snug">{t.name}</div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{totalHours(t)}h</span>
                  <span>{t.roleHours.length} roles</span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail pane */}
          <div className="flex-1 overflow-y-auto p-5">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-xs text-slate-400 font-medium max-w-xs">
                  Select a tactic from the list to preview its scope, out-of-pocket costs, and role hours before loading it as a new estimate.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900">{selected.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5 whitespace-pre-wrap">{selected.description}</p>
                </div>

                {selected.oopDescription && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assumptions / OOP Description</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.oopDescription}</p>
                  </div>
                )}

                {selected.oopItemName && (
                  <div className="bg-amber-50 border border-amber-150 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700">
                      <DollarSign className="w-3.5 h-3.5" />
                      {selected.oopItemName}
                    </div>
                    <div className="text-xs font-black text-amber-700">
                      ${(selected.oopItemAmount || 0).toLocaleString()}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Role Hours ({totalHours(selected)}h total)
                  </div>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                    {selected.roleHours.map(rh => (
                      <div key={rh.roleId} className="flex items-center justify-between px-3 py-1.5 text-xs">
                        <span className="text-slate-700 font-medium">{roleName(rh.roleId)}</span>
                        <span className="font-mono font-bold text-slate-800">{rh.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 px-5 flex justify-end gap-2 border-t border-slate-150 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLoad}
            disabled={!selected}
            className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-xs ${
              selected
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Load as Active Estimate
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
