export type Client = 'Standard' | 'Client A' | 'Client B';

// Departments and RATE_CARD below are derived from the August 2025 SRX benchmark
// data set, aggregated to role/title level (no individual staff identified).
export type Department =
  | 'Animation' | 'CGI' | 'Creative' | 'Development' | 'Digital Art' | 'Executive'
  | 'Integrated Production' | 'Live Events' | 'Production' | 'Video Editing' | 'XR';

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
  // Animation
  { id: 'animation_director_off_shore_brazil', name: 'Animation Director - OFF SHORE BRAZIL', department: 'Animation', rates: { 'Standard': 126, 'Client A': 126, 'Client B': 126 } },
  { id: 'assistant_motion_gfx_designer', name: 'Assistant Motion GFx designer', department: 'Animation', rates: { 'Standard': 102, 'Client A': 102, 'Client B': 102 } },
  { id: 'associate_director_motion_graphics', name: 'Associate Director, Motion Graphics', department: 'Animation', rates: { 'Standard': 207, 'Client A': 207, 'Client B': 207 } },
  { id: 'director_motion_graphics', name: 'Director, Motion Graphics', department: 'Animation', rates: { 'Standard': 255, 'Client A': 255, 'Client B': 255 } },
  { id: 'junior_motion_gfx_designer', name: 'Junior Motion GFx Designer', department: 'Animation', rates: { 'Standard': 102, 'Client A': 102, 'Client B': 102 } },
  { id: 'motion_graphics_designer', name: 'Motion Graphics Designer', department: 'Animation', rates: { 'Standard': 123, 'Client A': 123, 'Client B': 123 } },
  { id: 'motion_graphics_designer_off_shore_brazil', name: 'Motion Graphics Designer - OFF SHORE BRAZIL', department: 'Animation', rates: { 'Standard': 56, 'Client A': 56, 'Client B': 56 } },
  { id: 'senior_motion_graphics_designer', name: 'Senior Motion Graphics Designer', department: 'Animation', rates: { 'Standard': 135, 'Client A': 135, 'Client B': 135 } },
  { id: 'supervising_animation_director', name: 'Supervising Animation Director', department: 'Animation', rates: { 'Standard': 203, 'Client A': 203, 'Client B': 203 } },
  // CGI
  { id: 'director_computer_graphics', name: 'Director, Computer Graphics', department: 'CGI', rates: { 'Standard': 255, 'Client A': 255, 'Client B': 255 } },
  { id: 'senior_3d_artist', name: 'Senior 3D Artist', department: 'CGI', rates: { 'Standard': 155, 'Client A': 155, 'Client B': 155 } },
  // Creative
  { id: 'associate_creative_director', name: 'Associate Creative Director', department: 'Creative', rates: { 'Standard': 252, 'Client A': 252, 'Client B': 252 } },
  { id: 'group_copy_supervisor', name: 'Group Copy Supervisor', department: 'Creative', rates: { 'Standard': 209, 'Client A': 209, 'Client B': 209 } },
  // Development
  { id: 'assoc_director_digital_studio_operations', name: 'Assoc Director, Digital Studio Operations', department: 'Development', rates: { 'Standard': 232, 'Client A': 232, 'Client B': 232 } },
  { id: 'developer', name: 'Developer', department: 'Development', rates: { 'Standard': 92, 'Client A': 92, 'Client B': 92 } },
  { id: 'dir_digital_studio_operations', name: 'Dir, Digital Studio Operations', department: 'Development', rates: { 'Standard': 245, 'Client A': 245, 'Client B': 245 } },
  { id: 'qa', name: 'QA', department: 'Development', rates: { 'Standard': 106, 'Client A': 106, 'Client B': 106 } },
  { id: 'svp_director_of_technology', name: 'SVP, Director of Technology', department: 'Development', rates: { 'Standard': 371, 'Client A': 371, 'Client B': 371 } },
  { id: 'sr_developer', name: 'Sr Developer', department: 'Development', rates: { 'Standard': 180, 'Client A': 180, 'Client B': 180 } },
  { id: 'sr_product_manager', name: 'Sr Product Manager', department: 'Development', rates: { 'Standard': 185, 'Client A': 185, 'Client B': 185 } },
  { id: 'tech_lead', name: 'Tech Lead', department: 'Development', rates: { 'Standard': 187, 'Client A': 187, 'Client B': 187 } },
  // Digital Art
  { id: 'digital_artist', name: 'Digital Artist', department: 'Digital Art', rates: { 'Standard': 128, 'Client A': 128, 'Client B': 128 } },
  { id: 'director_digital_art', name: 'Director, Digital Art', department: 'Digital Art', rates: { 'Standard': 245, 'Client A': 245, 'Client B': 245 } },
  { id: 'senior_digital_artist', name: 'Senior Digital Artist', department: 'Digital Art', rates: { 'Standard': 149, 'Client A': 149, 'Client B': 149 } },
  { id: 'supervising_digital_artist', name: 'Supervising Digital Artist', department: 'Digital Art', rates: { 'Standard': 215, 'Client A': 215, 'Client B': 215 } },
  { id: 'supervising_medical_illustrator', name: 'Supervising Medical Illustrator', department: 'Digital Art', rates: { 'Standard': 207, 'Client A': 207, 'Client B': 207 } },
  // Executive
  { id: 'evp_director', name: 'EVP, Director', department: 'Executive', rates: { 'Standard': 435, 'Client A': 435, 'Client B': 435 } },
  // Integrated Production
  { id: 'project_manager_offshore_brazil', name: 'Project Manager - OFFSHORE BRAZIL', department: 'Integrated Production', rates: { 'Standard': 126, 'Client A': 126, 'Client B': 126 } },
  // Live Events
  { id: 'executive_producer', name: 'Executive Producer', department: 'Live Events', rates: { 'Standard': 250, 'Client A': 250, 'Client B': 250 } },
  { id: 'producer', name: 'Producer', department: 'Live Events', rates: { 'Standard': 161, 'Client A': 161, 'Client B': 161 } },
  { id: 'project_coordinator', name: 'Project Coordinator', department: 'Live Events', rates: { 'Standard': 0, 'Client A': 0, 'Client B': 0 } },  // rate not provided in source; needs manual entry
  { id: 'videographer', name: 'Videographer', department: 'Live Events', rates: { 'Standard': 0, 'Client A': 0, 'Client B': 0 } },  // rate not provided in source; needs manual entry
  // Production
  { id: 'associate_producer', name: 'Associate Producer', department: 'Production', rates: { 'Standard': 97, 'Client A': 97, 'Client B': 97 } },
  { id: 'business_manager', name: 'Business Manager', department: 'Production', rates: { 'Standard': 173, 'Client A': 173, 'Client B': 173 } },
  { id: 'producer_offshore_brazil', name: 'Producer - OFFSHORE BRAZIL', department: 'Production', rates: { 'Standard': 67, 'Client A': 67, 'Client B': 67 } },
  { id: 'svp_director_virtual_events', name: 'SVP, Director Virtual Events', department: 'Production', rates: { 'Standard': 329, 'Client A': 329, 'Client B': 329 } },
  { id: 'svp_director_of_production', name: 'SVP, Director of Production', department: 'Production', rates: { 'Standard': 329, 'Client A': 329, 'Client B': 329 } },
  { id: 'svp_executive_producer', name: 'SVP, Executive Producer', department: 'Production', rates: { 'Standard': 329, 'Client A': 329, 'Client B': 329 } },
  { id: 'senior_producer', name: 'Senior Producer', department: 'Production', rates: { 'Standard': 185, 'Client A': 185, 'Client B': 185 } },
  { id: 'vp_director', name: 'VP, Director', department: 'Production', rates: { 'Standard': 258, 'Client A': 258, 'Client B': 258 } },
  { id: 'vp_executive_producer', name: 'VP, Executive Producer', department: 'Production', rates: { 'Standard': 232, 'Client A': 232, 'Client B': 232 } },
  // Video Editing
  { id: 'audio_engineer', name: 'Audio Engineer', department: 'Video Editing', rates: { 'Standard': 174, 'Client A': 174, 'Client B': 174 } },  // avg across staff at different levels
  { id: 'color_correct', name: 'Color Correct', department: 'Video Editing', rates: { 'Standard': 210, 'Client A': 210, 'Client B': 210 } },
  { id: 'colorist', name: 'Colorist', department: 'Video Editing', rates: { 'Standard': 143, 'Client A': 143, 'Client B': 143 } },  // avg across staff at different levels
  { id: 'dir_video_services_vp', name: 'Dir, Video Services - VP', department: 'Video Editing', rates: { 'Standard': 268, 'Client A': 268, 'Client B': 268 } },
  { id: 'junior_video_editor', name: 'Junior Video Editor', department: 'Video Editing', rates: { 'Standard': 111, 'Client A': 111, 'Client B': 111 } },
  { id: 'senior_video_editor', name: 'Senior Video Editor', department: 'Video Editing', rates: { 'Standard': 173, 'Client A': 173, 'Client B': 173 } },
  { id: 'vp_assoc_dir', name: 'VP, Assoc Dir', department: 'Video Editing', rates: { 'Standard': 210, 'Client A': 210, 'Client B': 210 } },
  { id: 'video_editing_off_shore_brazil', name: 'Video Editing - OFF SHORE BRAZIL', department: 'Video Editing', rates: { 'Standard': 67, 'Client A': 67, 'Client B': 67 } },
  { id: 'video_editor', name: 'Video Editor', department: 'Video Editing', rates: { 'Standard': 164, 'Client A': 164, 'Client B': 164 } },
  // XR
  { id: 'assoc_director_xr', name: 'Assoc Director XR', department: 'XR', rates: { 'Standard': 275, 'Client A': 275, 'Client B': 275 } },
  { id: 'svp_director_experiential_development', name: 'SVP, Director Experiential Development', department: 'XR', rates: { 'Standard': 306, 'Client A': 306, 'Client B': 306 } },
  { id: 'senior_xr_developer', name: 'Senior XR Developer', department: 'XR', rates: { 'Standard': 275, 'Client A': 275, 'Client B': 275 } },
  { id: 'xr_developer', name: 'XR Developer', department: 'XR', rates: { 'Standard': 165, 'Client A': 165, 'Client B': 165 } },
];

export const DEPARTMENTS: Department[] = [
  'Animation', 'CGI', 'Creative', 'Development', 'Digital Art', 'Executive', 'Integrated Production', 'Live Events', 'Production', 'Video Editing', 'XR'
];

