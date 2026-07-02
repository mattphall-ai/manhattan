import { CustomPhase, RATE_CARD, Client } from '../types';
import { Users, Clock } from 'lucide-react';

interface RoleHoursRollupProps {
  phases: CustomPhase[];
  client: Client;
}

export default function RoleHoursRollup({ phases, client }: RoleHoursRollupProps) {
  // 1. Calculate aggregated hours and costs per role ID
  const roleBreakdown = RATE_CARD.map(role => {
    let totalHours = 0;
    phases.forEach(p => {
      const match = p.roles.find(r => r.roleId === role.id);
      if (match) {
        totalHours += match.hours;
      }
    });

    const rate = role.rates[client];
    const totalCost = totalHours * rate;

    return {
      role,
      totalHours,
      rate,
      totalCost
    };
  }).filter(item => item.totalHours > 0); // Only show roles with allocated hours for clean presentation

  const totalProjectHours = roleBreakdown.reduce((sum, item) => sum + item.totalHours, 0);
  const totalProjectCost = roleBreakdown.reduce((sum, item) => sum + item.totalCost, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden" id="role-hours-rollup-card">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-200">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          Labor Staffing & Role Totals
        </h3>
        <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded font-mono font-bold uppercase">
          {roleBreakdown.length} Roles Active
        </span>
      </div>

      {roleBreakdown.length === 0 ? (
        <div className="p-8 text-center bg-white text-slate-400">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider">No hours allocated yet</p>
          <p className="text-[10px] font-medium mt-1">Add phases, include roles, and allocate hours to generate the staffing roll-up summary.</p>
        </div>
      ) : (
        <div>
          {/* Table of active roles */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Staffing Role</th>
                  <th className="py-2.5 px-2">Department</th>
                  <th className="py-2.5 px-2 text-right">Hourly Rate</th>
                  <th className="py-2.5 px-4 text-center w-[140px]">Total Hours</th>
                  <th className="py-2.5 px-4 text-right">Subtotal Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roleBreakdown.map(({ role, totalHours, rate, totalCost }) => (
                  <tr key={role.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-800 text-xs">{role.name}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200/50 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {role.department}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-500">
                      {formatCurrency(rate)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {totalHours} hrs
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800 text-xs font-mono">
                      {formatCurrency(totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal Aggregate Footer */}
          <div className="bg-slate-50 p-3 px-4 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider border-t border-slate-200">
            <span>Aggregated Project Labor</span>
            <div className="flex gap-4">
              <span>Total Work: <strong className="text-slate-700 font-mono">{totalProjectHours} hrs</strong></span>
              <span className="opacity-40">|</span>
              <span>Total Cost: <strong className="text-slate-900 font-mono">{formatCurrency(totalProjectCost)}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
