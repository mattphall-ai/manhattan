import React, { useState } from 'react';
import { CustomPhase, RATE_CARD, Client, OopCost } from '../types';
import { Trash2, Plus, UserPlus, Minus, Receipt, GripVertical } from 'lucide-react';
import LaborRoleDropdown from './LaborRoleDropdown';

interface EstimatingGridProps {
  phases: CustomPhase[];
  oopCosts: OopCost[];
  client: Client;
  contingencyPercent: number;
  onContingencyChange: (val: number) => void;
  onAddPhase: () => void;
  onDeletePhase: (phaseId: string) => void;
  onRenamePhase: (phaseId: string, name: string) => void;
  onUpdatePhaseNotes?: (phaseId: string, notes: string) => void;
  onAddOopCost: (name: string) => void;
  onRemoveOopCost: (oopCostId: string) => void;
  onUpdateOopCostAmount: (oopCostId: string, amount: number) => void;
  onUpdateOopCostName: (oopCostId: string, name: string) => void;
  onAddRoleToPhase: (phaseId: string, roleId: string) => void;
  onRemoveRoleFromPhase: (phaseId: string, roleId: string) => void;
  onHoursChange: (phaseId: string, roleId: string, hours: number) => void;
  onReorderPhases?: (newPhases: CustomPhase[]) => void;
}

export default function EstimatingGrid({
  phases,
  oopCosts,
  client,
  contingencyPercent,
  onContingencyChange,
  onAddPhase,
  onDeletePhase,
  onRenamePhase,
  onUpdatePhaseNotes,
  onAddOopCost,
  onRemoveOopCost,
  onUpdateOopCostAmount,
  onUpdateOopCostName,
  onAddRoleToPhase,
  onRemoveRoleFromPhase,
  onHoursChange,
  onReorderPhases
}: EstimatingGridProps) {

  // Drag and drop state for sorting phases manually
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updatedPhases = [...phases];
    const [draggedItem] = updatedPhases.splice(draggedIndex, 1);
    updatedPhases.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    if (onReorderPhases) {
      onReorderPhases(updatedPhases);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate stats for a single phase (Labor only)
  const getPhaseStats = (phase: CustomPhase) => {
    let totalHours = 0;
    let laborCost = 0;

    phase.roles.forEach((pr) => {
      const roleDef = RATE_CARD.find(r => r.id === pr.roleId);
      const rate = roleDef ? roleDef.rates[client] : 0;
      totalHours += pr.hours;
      laborCost += pr.hours * rate;
    });

    return { totalHours, laborCost };
  };

  return (
    <div className="space-y-4" id="estimating-grid-container">
      {/* Zero Phases Empty State */}
      {phases.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center shadow-xs">
          <Trash2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">No Estimation Phases Active</h3>
          <p className="text-[11px] text-slate-400 font-medium max-w-[320px] mx-auto mb-4 leading-relaxed">
            Get started by adding estimation phases like Pre-Production, Production, and Post-Production to outline your statement of work.
          </p>
          <button
            onClick={onAddPhase}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded shadow-xs transition-colors cursor-pointer"
            id="btn-empty-add-phase"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Phase
          </button>
        </div>
      )}

      {/* List of Custom Phases */}
      {phases.map((phase, index) => {
        const { totalHours, laborCost } = getPhaseStats(phase);

        return (
          <div 
            key={phase.id} 
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden transition-all duration-150 ${
              draggedIndex === index ? 'opacity-40 scale-[0.99] border-dashed border-indigo-300 ring-2 ring-indigo-100' : ''
            }`}
          >
            {/* Phase Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3.5 px-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-col md:flex-row md:items-center gap-4 grow">
                <div className="flex items-center gap-2 shrink-0">
                  <div 
                    className="p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-200/50 rounded transition-colors"
                    title="Drag to Reorder Phase"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-200/50 px-1.5 py-0.5 rounded uppercase">
                    Phase #{index + 1}
                  </span>
                  <input
                    type="text"
                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-0 focus:outline-hidden text-xs font-bold text-slate-800 py-0.5 w-[200px] transition-all"
                    placeholder="e.g. Rough Cut"
                    value={phase.name}
                    onChange={(e) => onRenamePhase(phase.id, e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2 grow">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Notes / Scope:</span>
                  <input
                    type="text"
                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-0 focus:outline-hidden text-xs text-slate-600 py-0.5 grow transition-all"
                    placeholder="e.g. Two weeks of editing, includes 10 assets..."
                    value={phase.notes || ''}
                    onChange={(e) => onUpdatePhaseNotes?.(phase.id, e.target.value)}
                  />
                </div>
              </div>

              {/* Phase Action Toolbar */}
              <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                {/* Role selection dropdown */}
                <LaborRoleDropdown
                  phaseRoles={phase.roles}
                  onSelect={(roleId) => onAddRoleToPhase(phase.id, roleId)}
                />

                {/* Delete phase button */}
                <button
                  onClick={() => onDeletePhase(phase.id)}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                  title="Delete Phase"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Roles Table */}
            <div className="overflow-x-auto">
              {phase.roles.length === 0 ? (
                <div className="p-8 text-center bg-white">
                  <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No labor roles in this phase</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Select a role from the dropdown above to begin estimating hours.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                      <th className="py-2 px-4 w-[320px]">Labor Role</th>
                      <th className="py-2 px-2 text-right w-[100px]">Rate / Hr</th>
                      <th className="py-2 px-2 text-center w-[130px]">Allocated Hours</th>
                      <th className="py-2 px-4 text-right w-[140px]">Cost</th>
                      <th className="py-2 px-2 text-center w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const sortedRoles = [...phase.roles].sort((a, b) => {
                        const idxA = RATE_CARD.findIndex(rc => rc.id === a.roleId);
                        const idxB = RATE_CARD.findIndex(rc => rc.id === b.roleId);
                        return idxA - idxB;
                      });
                      let lastDept: string | null = null;

                      return sortedRoles.map((pr) => {
                        const roleDef = RATE_CARD.find(r => r.id === pr.roleId);
                        if (!roleDef) return null;

                        const rate = roleDef.rates[client];
                        const cost = pr.hours * rate;
                        const showDeptDivider = roleDef.department !== lastDept;
                        lastDept = roleDef.department;

                        return (
                          <React.Fragment key={pr.roleId}>
                            {showDeptDivider && (
                              <tr className="bg-slate-50/80">
                                <td colSpan={5} className="pt-2.5 pb-1 px-4 border-t border-slate-200">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    {roleDef.department}
                                  </span>
                                </td>
                              </tr>
                            )}
                            <tr className="hover:bg-blue-50/10 transition-colors group">
                              {/* Role Name */}
                              <td className="py-2 px-4">
                                <span className="font-semibold text-slate-800 text-xs">{roleDef.name}</span>
                              </td>

                              {/* Rate */}
                              <td className="py-2 px-2 text-right font-mono text-xs text-slate-500">
                                {formatCurrency(rate)}
                              </td>

                              {/* Hours Input with stepper controls */}
                              <td className="py-2 px-2 text-center">
                                <div className="flex items-center justify-center gap-1 w-[110px] mx-auto bg-slate-100 border border-slate-200 rounded px-1 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() => onHoursChange(phase.id, pr.roleId, Math.max(0, pr.hours - 1))}
                                    className="w-4 h-4 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-600 rounded cursor-pointer transition-colors text-[10px] font-bold shadow-xs select-none"
                                    title="Decrease Hours"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="w-10 text-center bg-transparent border-0 focus:ring-0 outline-hidden py-0 text-xs font-semibold text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={pr.hours || ''}
                                    onChange={(e) => onHoursChange(phase.id, pr.roleId, Math.max(0, parseFloat(e.target.value) || 0))}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => onHoursChange(phase.id, pr.roleId, pr.hours + 1)}
                                    className="w-4 h-4 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-600 rounded cursor-pointer transition-colors text-[10px] font-bold shadow-xs select-none"
                                    title="Increase Hours"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </td>

                              {/* Cost */}
                              <td className="py-2 px-4 text-right font-bold text-slate-800 text-xs">
                                {cost > 0 ? formatCurrency(cost) : '—'}
                              </td>

                              {/* Remove Role */}
                              <td className="py-2 px-2 text-center">
                                <button
                                  onClick={() => onRemoveRoleFromPhase(phase.id, pr.roleId)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-all cursor-pointer"
                                  title="Remove Role"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>

            {/* Phase Subtotal Strip */}
            <div className="bg-slate-50/80 border-t border-slate-200 p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Phase Labor Rollup</span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Labor Hours: <strong className="text-slate-700 font-mono">{totalHours} hrs</strong></span>
                <span className="opacity-40 font-normal">|</span>
                <span>Labor Cost: <strong className="text-emerald-600 font-mono text-xs">{formatCurrency(laborCost)}</strong></span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add New Phase Button (Always Above OOP Component) */}
      {phases.length > 0 && (
        <button
          onClick={onAddPhase}
          className="w-full py-3.5 border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/10 text-slate-500 hover:text-indigo-600 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs bg-white mb-4"
          id="btn-add-phase"
        >
          <Plus className="w-4 h-4" />
          Add New Phase
        </button>
      )}

      {/* Standalone Out-of-Pocket Expenses Category */}
      <div 
        className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden animate-fade-in"
        id="oop-expenses-category-card"
      >
        {/* Card Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3.5 px-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4 grow">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-200/50 px-1.5 py-0.5 rounded uppercase">
                Expense Category
              </span>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-400" />
                Out-of-Pocket (OOP) Expenses
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Direct project-wide non-labor costs, equipment, licensing, or talent fees.</p>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  onAddOopCost('');
                } else if (e.target.value) {
                  onAddOopCost(e.target.value);
                }
                e.target.value = ''; // reset dropdown
              }}
              className="bg-white border border-slate-200 hover:border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 rounded px-2.5 py-1.5 focus:outline-hidden focus:border-blue-500 focus:ring-0 cursor-pointer"
            >
              <option value="">+ Add OOP Expense...</option>
              <option value="custom">Blank (Custom)...</option>
              <option value="Talent Fee">Talent Fee</option>
              <option value="Stock Licensing">Stock Licensing</option>
              <option value="Insurance">Insurance</option>
              <option value="Hard Drive">Hard Drive</option>
            </select>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 bg-slate-50/10">
          {oopCosts.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg bg-white/50">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No OOP expenses active in this project</p>
              <p className="text-[9px] text-slate-400/80 font-medium mt-0.5">Add third-party licensing, hardware, insurance, or general expenses using the selector above.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                    <th className="py-2 px-3">Expense Item / Vendor description</th>
                    <th className="py-2 px-3 text-right w-[150px]">Amount</th>
                    <th className="py-2 px-3 text-center w-[60px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {oopCosts.map((oop) => (
                    <tr key={oop.id} className="hover:bg-slate-50/20 transition-colors group">
                      {/* Expense Name */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          className="bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 focus:outline-hidden text-xs text-slate-700 font-semibold py-0.5 w-full transition-all"
                          placeholder="e.g. Blank / Custom expense description..."
                          value={oop.name}
                          onChange={(e) => onUpdateOopCostName(oop.id, e.target.value)}
                        />
                      </td>

                      {/* Expense Amount */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 max-w-[120px] ml-auto">
                          <span className="text-slate-400 text-xs font-semibold">$</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-20 text-right bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 focus:outline-hidden py-0.5 text-xs font-bold text-slate-800"
                            value={oop.amount || ''}
                            onChange={(e) => onUpdateOopCostAmount(oop.id, Math.max(0, parseFloat(e.target.value) || 0))}
                          />
                        </div>
                      </td>

                      {/* Remove Button */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onRemoveOopCost(oop.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-all cursor-pointer"
                          title="Delete OOP expense"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Card Footer Subtotal Strip */}
        <div className="bg-slate-50/80 border-t border-slate-200 p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">
          <span>OOP Expenses Summary</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Expenses Count: <strong className="text-slate-700 font-mono">{oopCosts.length} Items</strong></span>
            <span className="opacity-40 font-normal">|</span>
            <span>Total OOP Expenses: <strong className="text-emerald-600 font-mono text-xs">{formatCurrency(oopCosts.reduce((sum, o) => sum + (o.amount || 0), 0))}</strong></span>
          </div>
        </div>
      </div>

      {/* Contingency Buffer Setting below the phases list */}
      {phases.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2" id="grid-contingency-container">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span className="uppercase tracking-wider">Project Contingency Buffer</span>
            <span className="font-mono text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded text-[11px] font-bold">
              {contingencyPercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-normal">
            Apply an emergency buffer or standard contingency percentage to safeguard against scope creep and unanticipated hours.
          </p>
          <div className="flex items-center gap-4 pt-1">
            <input 
              type="range" 
              min="0" 
              max="25" 
              step="5"
              className="grow accent-slate-800 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              value={contingencyPercent}
              onChange={(e) => onContingencyChange(parseInt(e.target.value) || 0)}
              id="input-grid-contingency-slider"
            />
            <div className="flex gap-1.5 text-[9px] text-slate-500 font-bold font-mono">
              <span>0%</span>
              <span>•</span>
              <span>5%</span>
              <span>•</span>
              <span>10%</span>
              <span>•</span>
              <span>15%</span>
              <span>•</span>
              <span>20%</span>
              <span>•</span>
              <span>25%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
