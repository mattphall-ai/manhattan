import { Project, CustomPhase, createProductionManagementPhase } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'ai-brand-launch',
    estimateNumber: '100',
    baseEstimateNumber: '100',
    details: {
      projectName: 'Interactive AI Brand Launch',
      client: 'Client A',
      brand: 'Futura Tech',
      jobNumber: 'JOB-2026-001',
      estimatePreparedBy: 'Alex Chen',
      businessManager: 'Sarah Jenkins',
      agency: 'Apex Creative Lab'
    },
    phases: [createProductionManagementPhase(), { id: 'phase-exec-100', name: 'Production Execution', roles: [] }],
    oopCosts: [],
    contingencyPercent: 10,
    notes: 'Primary deliverable includes three AI-augmented 30s broadcast spots, an interactive web showcase, and high-fidelity social assets. Standard agency markup and emergency buffer contingency applied.',
    createdAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z'
  },
  {
    id: 'epic-motion-promo',
    estimateNumber: '101',
    baseEstimateNumber: '101',
    details: {
      projectName: 'Epic CGI Motion Promo',
      client: 'Client B',
      brand: 'Titan Sports',
      jobNumber: 'JOB-2026-042',
      estimatePreparedBy: 'Devon Miller',
      businessManager: 'Marcus Brody',
      agency: 'Oasis Digital'
    },
    phases: [createProductionManagementPhase(), { id: 'phase-exec-101', name: 'Production Execution', roles: [] }],
    oopCosts: [],
    contingencyPercent: 5,
    notes: 'Premium commercial with photo-real CGI products and dynamic transition styling. Client B negotiated rate is active.',
    createdAt: '2026-06-20T09:15:00.000Z',
    updatedAt: '2026-07-01T11:45:00.000Z'
  }
];

export const createNewBlankProject = (name = 'New Project Estimate'): Project => {
  const executionPhase: CustomPhase = {
    id: `phase-exec-${Date.now()}`,
    name: 'Production Execution',
    roles: [],
  };
  return {
    id: `project-${Date.now()}`,
    estimateNumber: '102',
    baseEstimateNumber: '102',
    details: {
      projectName: name,
      client: 'Standard',
      brand: '',
      jobNumber: `JOB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      estimatePreparedBy: '',
      businessManager: '',
      agency: '',
      scopeOfWork: ''
    },
    phases: [createProductionManagementPhase(), executionPhase],
    oopCosts: [],
    contingencyPercent: 0,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};
