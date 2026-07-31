import { CustomPhase, RATE_CARD, DEPARTMENTS, Client, Department, ProjectDetails, OopCost } from '../types';
import { Copy, Check, Download, Printer, FileText } from 'lucide-react';
import { useState } from 'react';

interface CostSummaryProps {
  phases: CustomPhase[];
  oopCosts: OopCost[];
  details: ProjectDetails;
  notes: string;
  contingencyPercent: number;
  onNotesChange: (notes: string) => void;
  onContingencyChange: (val: number) => void;
  estimateNumber?: string;
}

export default function CostSummary({
  phases,
  oopCosts,
  details,
  notes,
  contingencyPercent,
  onNotesChange,
  onContingencyChange,
  estimateNumber
}: CostSummaryProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'phases' | 'departments'>('phases');

  const {
    projectName = 'Unnamed Proposal',
    client = 'Standard',
    brand = 'N/A',
    jobNumber = 'N/A',
    estimatePreparedBy = 'N/A',
    businessManager = 'N/A',
    agency = 'N/A',
    scopeOfWork = ''
  } = details;

  // Helper to calculate hours for a single role across all phases
  const getRoleHours = (roleId: string): number => {
    let total = 0;
    phases.forEach(p => {
      const match = p.roles.find(r => r.roleId === roleId);
      if (match) {
        total += match.hours;
      }
    });
    return total;
  };

  // Helper to calculate cost for a single role across all phases
  const getRoleCost = (roleId: string): number => {
    const totalHours = getRoleHours(roleId);
    const roleDef = RATE_CARD.find(r => r.id === roleId);
    const rate = roleDef ? roleDef.rates[client] : 0;
    return totalHours * rate;
  };

  // Calculate stats by department (labor only)
  const deptStats = DEPARTMENTS.map(dept => {
    const roles = RATE_CARD.filter(r => r.department === dept);
    let hours = 0;
    let cost = 0;

    roles.forEach(role => {
      hours += getRoleHours(role.id);
      cost += getRoleCost(role.id);
    });

    return { dept, hours, cost };
  });

  // Calculate stats by phase (labor only in phase.cost, OOP is a separate category)
  const phaseStats = phases.map(phase => {
    let hours = 0;
    let laborCost = 0;
    phase.roles.forEach(pr => {
      const roleDef = RATE_CARD.find(r => r.id === pr.roleId);
      const rate = roleDef ? roleDef.rates[client] : 0;
      hours += pr.hours;
      laborCost += pr.hours * rate;
    });

    return {
      id: phase.id,
      name: phase.name || 'Unnamed Phase',
      hours,
      laborCost,
      cost: laborCost // Phase cost rollup displays labor only!
    };
  });

  const laborSubtotal = phaseStats.reduce((acc, curr) => acc + curr.laborCost, 0);
  const oopSubtotal = oopCosts.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const combinedSubtotal = laborSubtotal + oopSubtotal;

  // Calculate modifiers (Contingency applied to combined subtotal)
  const contingencyCost = (combinedSubtotal * (contingencyPercent || 0)) / 100;
  const grandTotalCost = combinedSubtotal + contingencyCost;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    let csv = 'Phase,Expense Item / Role,Department / Category,Hours,Applied Rate / Price ($),Total Cost ($)\n';
    
    phases.forEach(phase => {
      // Labor
      phase.roles.forEach(pr => {
        if (pr.hours > 0) {
          const roleDef = RATE_CARD.find(r => r.id === pr.roleId);
          if (roleDef) {
            const rate = roleDef.rates[client];
            const cost = pr.hours * rate;
            csv += `"${phase.name}","${roleDef.name}","${roleDef.department}",${pr.hours},${rate},${cost}\n`;
          }
        }
      });
    });
    
    // Out-of-Pocket Expenses
    if (oopCosts && oopCosts.length > 0) {
      oopCosts.forEach(oop => {
        if (oop.amount > 0) {
          csv += `"OOP Costs","${oop.name || 'Custom OOP Fee'}","OOP Expense",,${oop.amount},${oop.amount}\n`;
        }
      });
    }

    csv += `\n`;
    csv += `SUMMARY BY PHASE (Labor Only)\n`;
    phaseStats.forEach(stat => {
      csv += `"${stat.name}",,,,,,${stat.laborCost}\n`;
    });

    if (oopSubtotal > 0) {
      csv += `\n`;
      csv += `OUT-OF-POCKET EXPENSES CATEGORY\n`;
      oopCosts.forEach(oop => {
        if (oop.amount > 0) {
          csv += `"OOP Costs","${oop.name || 'Custom OOP Fee'}",,,${oop.amount},${oop.amount}\n`;
        }
      });
    }

    csv += `\n`;
    csv += `SUMMARY BY LABOR DEPARTMENT\n`;
    deptStats.forEach(stat => {
      csv += `"${stat.dept}",,,,,,${stat.cost}\n`;
    });

    csv += `\n`;
    csv += `Labor Subtotal,,,,,,,${laborSubtotal}\n`;
    csv += `Out-of-Pocket Subtotal,,,,,,,${oopSubtotal}\n`;
    csv += `Combined Subtotal,,,,,,,${combinedSubtotal}\n`;
    csv += `Contingency Buffer (${contingencyPercent}%),,,,,,,${contingencyCost}\n`;
    csv += `GRAND TOTAL,,,,,,,${grandTotalCost}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName.toLowerCase().replace(/\s+/g, '_')}_estimate.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy structured summary to clipboard for emails
  const handleCopyToClipboard = () => {
    let summaryText = `PROJECT ESTIMATE: ${projectName}\n`;
    summaryText += `Client Profile: ${client} Rates\n`;
    summaryText += `Brand: ${brand}\n`;
    summaryText += `Job Number: ${jobNumber}\n`;
    summaryText += `========================================\n\n`;
    
    summaryText += `PHASE LABOR BREAKDOWN:\n`;
    phaseStats.forEach(stat => {
      if (stat.laborCost > 0) {
        summaryText += `- ${stat.name}: ${formatCurrency(stat.laborCost)}\n`;
      }
    });

    if (oopSubtotal > 0) {
      summaryText += `\nOUT-OF-POCKET EXPENSES:\n`;
      oopCosts.forEach(oop => {
        if (oop.amount > 0) {
          summaryText += `- [OOP] ${oop.name || 'Custom OOP Fee'}: ${formatCurrency(oop.amount)}\n`;
        }
      });
    }

    summaryText += `\nDEPARTMENT COST BREAKDOWN:\n`;
    deptStats.forEach(stat => {
      if (stat.cost > 0) {
        summaryText += `- ${stat.dept}: ${formatCurrency(stat.cost)}\n`;
      }
    });
    
    summaryText += `\n----------------------------------------\n`;
    summaryText += `Labor Subtotal:          ${formatCurrency(laborSubtotal)}\n`;
    if (oopSubtotal > 0) {
      summaryText += `Out-of-Pocket Expenses:  ${formatCurrency(oopSubtotal)}\n`;
    }
    summaryText += `Combined Subtotal:       ${formatCurrency(combinedSubtotal)}\n`;
    if (contingencyPercent > 0) {
      summaryText += `Contingency (${contingencyPercent}%):   ${formatCurrency(contingencyCost)}\n`;
    }
    summaryText += `========================================\n`;
    summaryText += `GRAND TOTAL:             ${formatCurrency(grandTotalCost)}\n\n`;
    
    if (notes) {
      summaryText += `Estimate Assumptions & Scope:\n${notes}\n`;
    }

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Export "Client Proposal" PDF Print Window
  const handleExportClientProposal = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups/new windows to view the printable proposal.");
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Collect Out-Of-Pocket Expenses
    const oopList: { name: string; amount: number }[] = [];
    oopCosts.forEach(oop => {
      if (oop.amount > 0) {
        oopList.push({
          name: oop.name || 'Custom OOP Fee',
          amount: oop.amount
        });
      }
    });

    const oopTotalVal = oopList.reduce((sum, item) => sum + item.amount, 0);

    const pdfFilename = `${projectName}_${jobNumber}_${estimateNumber || '100'}`.replace(/\s+/g, '_');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${pdfFilename}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: letter;
            margin: 40px;
          }
        </style>
      </head>
      <body class="bg-white text-slate-900 p-8">
        <div class="max-w-3xl mx-auto space-y-6">
          
          <!-- Title & Brand Header -->
          <div class="flex justify-between items-start border-b-2 border-slate-900 pb-3">
            <div>
              <div class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">PROJECT ESTIMATE & PROPOSAL</div>
              <h1 class="text-lg font-extrabold text-slate-900 tracking-tight">STUDIO RX</h1>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 inline-block uppercase tracking-wider font-mono">
                Client Proposal #${estimateNumber || '100'}
              </span>
              <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Prepared Date: ${todayStr}</p>
            </div>
          </div>

          <!-- Project Information Grid -->
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Project Details</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs">
              <div>
                <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bid / Estimate #</span>
                <span class="font-bold text-indigo-700">#${estimateNumber || '100'}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Project Name</span>
                <span class="font-bold text-slate-900">${projectName}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Brand / Product</span>
                <span class="font-semibold text-slate-800">${brand}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Job Number</span>
                <span class="font-mono font-bold text-blue-600 uppercase">${jobNumber}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rate Profile</span>
                <span class="font-bold text-indigo-600">${client} Profile</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Prepared By</span>
                <span class="font-semibold text-slate-800">${estimatePreparedBy}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Biz Manager</span>
                <span class="font-semibold text-slate-800">${businessManager}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agency</span>
                <span class="font-semibold text-slate-800">${agency}</span>
              </div>
            </div>
          </div>

          <!-- Scope of Work & Deliverables -->
          ${scopeOfWork ? `
            <div class="border border-indigo-100 bg-indigo-50/15 rounded-lg p-4 space-y-1.5">
              <h3 class="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Scope of Work & Deliverables</h3>
              <p class="text-xs text-slate-700 font-semibold whitespace-pre-wrap leading-relaxed">${scopeOfWork}</p>
            </div>
          ` : ''}

          <!-- Phase Summaries (Labor Only) -->
          <div class="space-y-2">
            <h2 class="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">Estimated Phases (Labor)</h2>
            <div class="overflow-hidden border border-slate-200 rounded-lg">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                    <th class="py-2 px-3">Phase Name</th>
                    <th class="py-2 px-3">Scope Notes / Inclusions</th>
                    <th class="py-2 px-3 text-right w-[110px]">Cost</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-150">
                  ${phaseStats.map(stat => {
                    const actualPhase = phases.find(p => p.id === stat.id);
                    return `
                      <tr>
                        <td class="py-2.5 px-3 font-bold text-slate-800">${stat.name}</td>
                        <td class="py-2.5 px-3 text-slate-500 italic leading-normal text-[11px]">${actualPhase?.notes || '<span class="text-slate-300 font-normal">Scope notes standard package</span>'}</td>
                        <td class="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">${formatCurrency(stat.laborCost)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Out of Pocket Expenses (OOP) Category -->
          ${oopList.length > 0 ? `
            <div class="space-y-2">
              <h2 class="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">Out-of-Pocket Expenses</h2>
              <div class="overflow-hidden border border-slate-200 rounded-lg">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                      <th class="py-2 px-3">Expense Item Name</th>
                      <th class="py-2 px-3 text-right w-[110px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-150">
                    ${oopList.map(item => `
                      <tr>
                        <td class="py-2 px-3 font-semibold text-slate-800">${item.name}</td>
                        <td class="py-2 px-3 text-right font-bold text-slate-900 font-mono">${formatCurrency(item.amount)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Rollups Grid -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2">
            <!-- Left Terms Callout -->
            <div class="md:col-span-7 border border-slate-100 rounded-lg p-3 bg-slate-50/50 text-[10px] text-slate-400 space-y-1">
              <span class="block font-bold text-slate-500 uppercase tracking-wider">Proposal Terms & Validity</span>
              <p class="leading-relaxed font-medium">This estimate is confidential, proprietary, and valid for 30 days from prep date. Revisions beyond predefined caps will be charged at applicable profile hourly rates. Final invoice is subject to real out-of-pocket vendor actual receipts.</p>
            </div>
            
            <!-- Right Ledger Card -->
            <div class="md:col-span-5 border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5 text-xs text-slate-600">
              <div class="flex justify-between items-center text-[11px]">
                <span class="font-medium text-slate-500">Labor Subtotal</span>
                <span class="font-bold text-slate-800 font-mono">${formatCurrency(laborSubtotal)}</span>
              </div>
              ${oopTotalVal > 0 ? `
                <div class="flex justify-between items-center text-[11px] border-t border-slate-200 pt-1.5">
                  <span class="font-medium text-slate-500">OOP Expenses</span>
                  <span class="font-bold text-slate-800 font-mono">${formatCurrency(oopTotalVal)}</span>
                </div>
              ` : ''}
              
              <div class="flex justify-between items-center text-[11px] border-t border-slate-200 pt-1.5 font-bold text-slate-700">
                <span>Combined Subtotal</span>
                <span class="font-mono">${formatCurrency(combinedSubtotal)}</span>
              </div>

              ${contingencyPercent > 0 ? `
                <div class="flex justify-between items-center text-[11px] border-t border-slate-200 pt-1.5 border-dashed">
                  <span class="font-medium text-slate-500">Contingency Buffer (${contingencyPercent}%)</span>
                  <span class="font-bold text-slate-800 font-mono">${formatCurrency(contingencyCost)}</span>
                </div>
              ` : ''}

              <div class="flex justify-between items-center border-t-2 border-double border-slate-300 pt-2.5 text-xs font-black text-slate-900">
                <span class="uppercase tracking-widest text-[10px]">Grand Total</span>
                <span class="text-base font-mono">${formatCurrency(grandTotalCost)}</span>
              </div>
            </div>
          </div>

          <!-- Proposal Notes & Inclusions Section -->
          ${notes ? `
            <div class="border border-slate-200 rounded-lg p-4 bg-slate-50/30">
              <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Proposal Notes & Inclusions</h3>
              <p class="text-[11px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">${notes}</p>
            </div>
          ` : ''}

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Export "Full Estimate" PDF Print Window (Detailed with all phases, roles, hours, rates)
  const handleExportFullEstimate = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups/new windows to view the printable detailed estimate.");
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Helper to calculate total hours in all phases
    let totalLaborHours = 0;
    phases.forEach(p => {
      p.roles.forEach(r => {
        totalLaborHours += r.hours;
      });
    });

    const pdfFilename = `${projectName}_${jobNumber}_${estimateNumber || '100'}`.replace(/\s+/g, '_');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${pdfFilename}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: letter;
            margin: 40px;
          }
          .phase-section {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body class="bg-white text-slate-900 p-8">
        <div class="max-w-3xl mx-auto space-y-6">
          
          <!-- Title & Brand Header -->
          <div class="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <div class="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">INTERNAL AUDIT & BACKUP DETAILS</div>
              <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">STUDIO RX</h1>
              <p class="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5 uppercase">FULL ESTIMATE WORKBOOK</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-100 inline-block uppercase tracking-wider font-mono">
                Full Estimate #${estimateNumber || '100'}
              </span>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">Audit Date: ${todayStr}</p>
            </div>
          </div>

          <!-- Project Information Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bid / Estimate #</span>
              <span class="font-bold text-indigo-700">#${estimateNumber || '100'}</span>
            </div>
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Project Name</span>
              <span class="font-bold text-slate-900">${projectName}</span>
            </div>
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Brand</span>
              <span class="font-semibold text-slate-800">${brand}</span>
            </div>
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Job Number</span>
              <span class="font-mono font-bold text-blue-600 uppercase">${jobNumber}</span>
            </div>
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rate Profile</span>
              <span class="font-bold text-indigo-600">${client} Profile</span>
            </div>
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Prepared By</span>
              <span class="font-semibold text-slate-800">${estimatePreparedBy}</span>
            </div>
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Biz Manager</span>
              <span class="font-semibold text-slate-800">${businessManager}</span>
            </div>
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agency Partner</span>
              <span class="font-semibold text-slate-800">${agency}</span>
            </div>
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Est. Hours</span>
              <span class="font-mono font-bold text-emerald-600">${totalLaborHours} Hours</span>
            </div>
          </div>

          <!-- Scope of Work & Deliverables -->
          ${scopeOfWork ? `
            <div class="border border-slate-200 bg-slate-50/50 rounded-lg p-4 space-y-1.5">
              <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-wider">Scope of Work & Deliverables</h3>
              <p class="text-xs text-slate-700 font-semibold whitespace-pre-wrap leading-relaxed">${scopeOfWork}</p>
            </div>
          ` : ''}

          <!-- DETAILED PHASES SECTION -->
          <div class="space-y-6">
            <h2 class="text-xs font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-1">Detailed Breakdown By Phase</h2>
            
            ${phases.map((phase, pIndex) => {
              const assignedRoles = phase.roles.filter(r => r.hours > 0);
              
              // Calculate phase totals
              let phaseLaborHours = 0;
              let phaseLaborCost = 0;
              assignedRoles.forEach(r => {
                const rDef = RATE_CARD.find(rc => rc.id === r.roleId);
                const rRate = rDef ? rDef.rates[client] : 0;
                phaseLaborHours += r.hours;
                phaseLaborCost += r.hours * rRate;
              });
              const phaseTotalCost = phaseLaborCost;

              if (assignedRoles.length === 0) {
                return `
                  <div class="phase-section border border-slate-100 rounded-lg p-3 bg-slate-50/30 text-xs text-slate-400 italic">
                    <span class="font-bold text-slate-500">Phase #${pIndex + 1}: ${phase.name || 'Unnamed Phase'}</span> — No hours assigned.
                  </div>
                `;
              }

              return `
                <div class="phase-section border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <!-- Phase Title Bar -->
                  <div class="bg-slate-800 text-white p-3 flex justify-between items-center">
                    <div>
                      <span class="text-[9px] uppercase tracking-wider text-slate-300 font-bold">Phase #${pIndex + 1}</span>
                      <h3 class="text-sm font-bold text-white leading-tight">${phase.name || 'Unnamed Phase'}</h3>
                    </div>
                    <div class="text-right font-mono text-xs">
                      <span class="text-slate-300 mr-2">${phaseLaborHours} hrs</span>
                      <span class="font-bold text-emerald-400">${formatCurrency(phaseTotalCost)}</span>
                    </div>
                  </div>

                  <!-- Phase Notes -->
                  ${phase.notes ? `
                    <div class="p-3 bg-slate-50/50 border-b border-slate-100 text-xs text-slate-600 italic">
                      <strong class="font-bold text-slate-500 not-italic uppercase text-[9px] tracking-wider block mb-0.5">Phase Scope Notes:</strong>
                      ${phase.notes}
                    </div>
                  ` : ''}

                  <!-- Assigned Labor Table -->
                  ${assignedRoles.length > 0 ? `
                    <div class="overflow-x-auto">
                      <table class="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr class="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 uppercase text-[9px] tracking-wider">
                            <th class="py-1.5 px-3">Labor Role Name</th>
                            <th class="py-1.5 px-3">Department</th>
                            <th class="py-1.5 px-3 text-right">Hours</th>
                            <th class="py-1.5 px-3 text-right">Rate</th>
                            <th class="py-1.5 px-3 text-right w-[100px]">Total</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                          ${assignedRoles.map(r => {
                            const rDef = RATE_CARD.find(rc => rc.id === r.roleId);
                            const rRate = rDef ? rDef.rates[client] : 0;
                            return `
                              <tr>
                                <td class="py-2 px-3 font-semibold text-slate-800">${rDef?.name || r.roleId}</td>
                                <td class="py-2 px-3 text-slate-400 text-[10px] uppercase">${rDef?.department || 'N/A'}</td>
                                <td class="py-2 px-3 text-right font-mono font-bold">${r.hours} hrs</td>
                                <td class="py-2 px-3 text-right font-mono">${formatCurrency(rRate)}/hr</td>
                                <td class="py-2 px-3 text-right font-mono font-bold text-slate-900">${formatCurrency(r.hours * rRate)}</td>
                              </tr>
                            `;
                          }).join('')}
                        </tbody>
                      </table>
                    </div>
                  ` : ''}

                  <!-- Phase Rollup Footer Bar -->
                  <div class="bg-slate-50 p-2.5 px-3 flex justify-between items-center text-[10px] text-slate-500 font-bold border-t border-slate-100">
                    <span>Phase Rollup Summary</span>
                    <div class="space-x-4 font-mono">
                      <span class="text-slate-800 text-xs">Total Labor: ${formatCurrency(phaseTotalCost)}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}

            <!-- STANDALONE OUT-OF-POCKET EXPENSES SECTION -->
            ${oopCosts && oopCosts.length > 0 ? `
              <div class="phase-section border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div class="bg-slate-800 text-white p-3 flex justify-between items-center">
                  <div>
                    <span class="text-[9px] uppercase tracking-wider text-slate-300 font-bold">Standalone Category</span>
                    <h3 class="text-sm font-bold text-white leading-tight">Out-of-Pocket (OOP) Expenses</h3>
                  </div>
                  <div class="text-right font-mono text-xs">
                    <span class="font-bold text-emerald-400">${formatCurrency(oopSubtotal)}</span>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr class="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 uppercase text-[9px] tracking-wider">
                        <th class="py-1.5 px-3">Expense Item / Vendor Description</th>
                        <th class="py-1.5 px-3 text-right w-[150px]">Amount</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${oopCosts.map(o => `
                        <tr>
                          <td class="py-2 px-3 font-semibold text-slate-800">${o.name || 'Custom OOP Fee'}</td>
                          <td class="py-2 px-3 text-right font-mono font-bold text-slate-900">${formatCurrency(o.amount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- ESTIMATE ROLLUP SUMMARY (LEDGER) -->
          <div class="phase-section space-y-3 pt-4">
            <h2 class="text-xs font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-1">Grand Financial Recapitulation</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Department breakdown -->
              <div class="border border-slate-200 rounded-lg p-4 bg-white space-y-2">
                <span class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Labor Cost By Department</span>
                <div class="space-y-1.5 text-xs">
                  ${deptStats.map(dept => `
                    <div class="flex justify-between border-b border-dashed border-slate-100 pb-1 last:border-0 last:pb-0">
                      <span class="text-slate-500">${dept.dept} <span class="text-[10px] font-semibold text-slate-400 font-mono">(${dept.hours} hrs)</span></span>
                      <span class="font-bold text-slate-800 font-mono">${formatCurrency(dept.cost)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Consolidated Calculations Ledger -->
              <div class="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 text-xs text-slate-600">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-500">Total Labor Subtotal</span>
                  <span class="font-bold text-slate-800 font-mono">${formatCurrency(laborSubtotal)}</span>
                </div>
                ${oopSubtotal > 0 ? `
                  <div class="flex justify-between items-center border-t border-slate-200 pt-2">
                    <span class="font-bold text-slate-500">Total OOP Expenses</span>
                    <span class="font-bold text-slate-800 font-mono">${formatCurrency(oopSubtotal)}</span>
                  </div>
                ` : ''}

                <div class="flex justify-between items-center border-t border-slate-200 pt-2 font-black text-slate-700">
                  <span>Combined Operations Subtotal</span>
                  <span class="font-mono">${formatCurrency(combinedSubtotal)}</span>
                </div>

                ${contingencyPercent > 0 ? `
                  <div class="flex justify-between items-center border-t border-slate-200 pt-2 border-dashed">
                    <span class="font-semibold text-slate-500">Contingency Buffer (${contingencyPercent}%)</span>
                    <span class="font-bold text-slate-800 font-mono">${formatCurrency(contingencyCost)}</span>
                  </div>
                ` : ''}

                <div class="flex justify-between items-center border-t-2 border-double border-slate-300 pt-2.5 text-sm font-black text-slate-900">
                  <span class="uppercase tracking-widest text-[10px]">Grand Combined Total</span>
                  <span class="text-lg font-mono">${formatCurrency(grandTotalCost)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Proposal Notes & Inclusions Section -->
          ${notes ? `
            <div class="phase-section border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Workbook Notes & Assumptions Backup</h3>
              <p class="text-[11px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">${notes}</p>
            </div>
          ` : ''}

          <!-- Footer Signature -->
          <div class="pt-6 border-t border-slate-150 text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
            STUDIO RX WORKBOOK ESTIMATING PROTOCOL • AUDITED & STABILIZED
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const dollars = Math.floor(grandTotalCost);
  const cents = Math.round((grandTotalCost - dollars) * 100);
  const formattedDollars = dollars.toLocaleString('en-US');
  const formattedCents = cents.toString().padStart(2, '0');

  return (
    <div className="flex flex-col gap-4" id="cost-summary-container">
      {/* Client-Facing Formal Estimate Sheet */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-md p-6 flex flex-col gap-5 relative overflow-hidden">
        {/* Invoice Top Ribbon Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800"></div>

        {/* Letterhead Header */}
        <div className="flex flex-col gap-1 text-center border-b border-slate-200 pb-4">
          <div className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]" id="proposal-header-title">
            STUDIO RX PROJECT ESTIMATE
          </div>
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider max-w-[220px] mx-auto truncate" title={projectName}>
            {projectName || 'Unnamed Proposal'}
          </h2>
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Rate Profile: {client}
          </div>
        </div>

        {/* Breakdown Tabs Styled Minimalist */}
        <div className="flex justify-center border-b border-slate-100 pb-1 gap-4">
          <button
            onClick={() => setActiveTab('phases')}
            className={`pb-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'phases'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            By Phase
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`pb-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'departments'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            By Department
          </button>
        </div>

        {/* Proposal Document Body */}
        <div className="space-y-3 min-h-[140px] px-1">
          {activeTab === 'phases' ? (
            phaseStats.length === 0 ? (
              <div className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
                No Active Phases Defined
              </div>
            ) : (
              <div className="space-y-3">
                {phaseStats.map(stat => {
                  const actualPhase = phases.find(p => p.id === stat.id);
                  return (
                    <div key={stat.id} className="py-2 border-b border-dashed border-slate-100 last:border-b-0 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-700 font-bold text-xs">{stat.name}</span>
                        <span className="font-bold text-slate-900 text-xs font-mono">{formatCurrency(stat.laborCost)}</span>
                      </div>
                      {actualPhase?.notes && (
                        <div className="text-[10px] text-slate-400 italic font-medium leading-normal pl-2 border-l-2 border-slate-200">
                          {actualPhase.notes}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* OOP Cost Grouping at bottom of Phase Tab as its own rollup block */}
                {oopSubtotal > 0 && (
                  <div className="py-2 border-t border-dashed border-slate-200 space-y-1 mt-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-800 font-black uppercase text-[9px] tracking-wider">Out-of-Pocket Expenses</span>
                      <span className="font-bold text-slate-900 text-xs font-mono">{formatCurrency(oopSubtotal)}</span>
                    </div>
                    <div className="text-[10px] font-medium pl-2.5 space-y-0.5 mt-1 border-l-2 border-slate-150">
                      {oopCosts.map(oop => oop.amount > 0 && (
                        <div key={oop.id} className="flex justify-between text-slate-400 text-[10px]">
                          <span className="truncate max-w-[200px]">◦ {oop.name || 'Custom OOP Fee'}</span>
                          <span className="font-mono text-[9px]">{formatCurrency(oop.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="space-y-2.5">
              {deptStats.map(stat => (
                <div key={stat.dept} className="flex justify-between items-baseline py-1 border-b border-dashed border-slate-100 last:border-b-0">
                  <span className="text-slate-700 font-medium text-xs">{stat.dept}</span>
                  <span className="font-bold text-slate-900 text-xs font-mono">{formatCurrency(stat.cost)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ledger Calculations Block */}
        <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-600">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span>Labor Cost Subtotal</span>
            <span className="font-bold text-slate-800 font-mono">{formatCurrency(laborSubtotal)}</span>
          </div>

          {oopSubtotal > 0 && (
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100 border-dashed">
              <span>Out-of-Pocket Expenses</span>
              <span className="font-bold text-slate-800 font-mono">{formatCurrency(oopSubtotal)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs font-bold text-slate-700 pt-2 border-t border-slate-150">
            <span>Combined Subtotal</span>
            <span className="font-bold text-slate-800 font-mono">{formatCurrency(combinedSubtotal)}</span>
          </div>

          {/* Contingency Buffer static display item */}
          {contingencyPercent > 0 && (
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100 border-dashed">
              <span>Contingency Buffer ({contingencyPercent}%)</span>
              <span className="font-mono text-slate-800 font-bold">{formatCurrency(contingencyCost)}</span>
            </div>
          )}
        </div>

        {/* Invoice Grand Total Callout (Clean double line styling) */}
        <div className="mt-1 pt-4 border-t-2 border-double border-slate-300">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Estimated Cost</div>
              <div className="text-[8px] text-slate-500 italic mt-0.5">Subject to standard terms & specifications</div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight" id="lbl-grand-total">
              <span className="text-base font-bold text-slate-400 align-super mr-0.5">$</span>
              {formattedDollars}
              <sup className="text-xs font-extrabold text-slate-500">{formattedCents}</sup>
            </div>
          </div>
        </div>

        {/* Quick Document Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            id="btn-copy-summary"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                Copy Text
              </>
            )}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            id="btn-export-csv"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* PDF / Printable proposal triggers */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleExportClientProposal}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            id="btn-export-client-proposal"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            Client Proposal
          </button>
          <button
            onClick={handleExportFullEstimate}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            id="btn-export-full-estimate"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-500" />
            Full Estimate
          </button>
        </div>
      </div>

      {/* Assumptions & Notes */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Proposal Notes & Inclusions
        </h3>
        <textarea
          rows={3}
          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-slate-500 focus:bg-white transition-all resize-none font-medium"
          placeholder="Specify conditions, revisions count, or project inclusions here..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
        <p className="text-[9px] text-slate-400 font-semibold uppercase">
          Appends to the bottom of the client proposal copy.
        </p>
      </div>
    </div>
  );
}
