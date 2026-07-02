export type Client = 'Standard' | 'Client A' | 'Client B';

export type Department = 'Production Management' | 'Synthetic' | 'Post Production' | 'Animation';

export interface RoleRate {
  id: string;
  name: string;
  department: Department;
  rates: Record<Client, number>;
}

export interface ProjectDetails {
  projectName: string;
  client: Client;
  brand: string;
  jobNumber: string;
  estimatePreparedBy: string;
  businessManager: string;
  agency: string;
  scopeOfWork?: string;
}

export interface PhaseRole {
  roleId: string;
  hours: number;
}

export interface OopCost {
  id: string;
  name: string;
  amount: number;
}

export interface CustomPhase {
  id: string;
  name: string;
  roles: PhaseRole[];
  notes?: string;
}

export interface Project {
  id: string;
  estimateNumber?: string;
  baseEstimateNumber?: string;
  details: ProjectDetails;
  phases: CustomPhase[];
  oopCosts?: OopCost[];
  notes?: string;
  versionNotes?: string;
  contingencyPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export const RATE_CARD: RoleRate[] = [
  // Production Management
  {
    id: 'senior_producer',
    name: 'Senior Producer',
    department: 'Production Management',
    rates: { 'Standard': 103, 'Client A': 203, 'Client B': 303 }
  },
  {
    id: 'associate_producer',
    name: 'Associate Producer',
    department: 'Production Management',
    rates: { 'Standard': 100, 'Client A': 200, 'Client B': 300 }
  },
  {
    id: 'executive_producer',
    name: 'Executive Producer',
    department: 'Production Management',
    rates: { 'Standard': 106, 'Client A': 206, 'Client B': 306 }
  },
  // Synthetic
  {
    id: 'ai_artist',
    name: 'AI Artist',
    department: 'Synthetic',
    rates: { 'Standard': 105, 'Client A': 205, 'Client B': 305 }
  },
  {
    id: 'cg_artist',
    name: 'CG Artist',
    department: 'Synthetic',
    rates: { 'Standard': 104, 'Client A': 204, 'Client B': 304 }
  },
  {
    id: 'developer',
    name: 'Developer',
    department: 'Synthetic',
    rates: { 'Standard': 160, 'Client A': 260, 'Client B': 360 }
  },
  {
    id: 'creative_director',
    name: 'Creative Director',
    department: 'Synthetic',
    rates: { 'Standard': 190, 'Client A': 290, 'Client B': 390 }
  },
  // Post Production
  {
    id: 'video_editor',
    name: 'Video Editor',
    department: 'Post Production',
    rates: { 'Standard': 101, 'Client A': 201, 'Client B': 301 }
  },
  {
    id: 'audio_engineer',
    name: 'Audio Engineer',
    department: 'Post Production',
    rates: { 'Standard': 199, 'Client A': 299, 'Client B': 399 }
  },
  // Animation
  {
    id: 'animator',
    name: 'Animator',
    department: 'Animation',
    rates: { 'Standard': 102, 'Client A': 202, 'Client B': 302 }
  },
  {
    id: 'assistant_animator',
    name: 'Assistant Animator',
    department: 'Animation',
    rates: { 'Standard': 100, 'Client A': 200, 'Client B': 300 }
  }
];

export const DEPARTMENTS: Department[] = [
  'Production Management',
  'Synthetic',
  'Post Production',
  'Animation'
];

