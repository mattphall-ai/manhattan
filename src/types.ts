export type Client = 'Standard' | 'Client A' | 'Client B';

// Departments and RATE_CARD below are derived from the August 2025 SRX benchmark
// data set, aggregated to role/title level (no individual staff identified). The
// source only provided a single "Standard Rate" per role; Client A/B rates are a
// flat 10% / 20% markup over Standard until real negotiated client rates replace them.
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
  { id: 'animation_director_off_shore_brazil', name: 'Animation Director - OFF SHORE BRAZIL', department: 'Animation', rates: { 'Standard': 126, 'Client A': 139, 'Client B': 151 } },
  { id: 'assistant_motion_gfx_designer', name: 'Assistant Motion GFx designer', department: 'Animation', rates: { 'Standard': 102, 'Client A': 112, 'Client B': 122 } },
  { id: 'associate_director_motion_graphics', name: 'Associate Director, Motion Graphics', department: 'Animation', rates: { 'Standard': 207, 'Client A': 228, 'Client B': 248 } },
  { id: 'director_motion_graphics', name: 'Director, Motion Graphics', department: 'Animation', rates: { 'Standard': 255, 'Client A': 280, 'Client B': 306 } },
  { id: 'junior_motion_gfx_designer', name: 'Junior Motion GFx Designer', department: 'Animation', rates: { 'Standard': 102, 'Client A': 112, 'Client B': 122 } },
  { id: 'motion_graphics_designer', name: 'Motion Graphics Designer', department: 'Animation', rates: { 'Standard': 123, 'Client A': 135, 'Client B': 148 } },
  { id: 'motion_graphics_designer_off_shore_brazil', name: 'Motion Graphics Designer - OFF SHORE BRAZIL', department: 'Animation', rates: { 'Standard': 56, 'Client A': 62, 'Client B': 67 } },
  { id: 'senior_motion_graphics_designer', name: 'Senior Motion Graphics Designer', department: 'Animation', rates: { 'Standard': 135, 'Client A': 148, 'Client B': 162 } },
  { id: 'supervising_animation_director', name: 'Supervising Animation Director', department: 'Animation', rates: { 'Standard': 203, 'Client A': 223, 'Client B': 244 } },
  // CGI
  { id: 'director_computer_graphics', name: 'Director, Computer Graphics', department: 'CGI', rates: { 'Standard': 255, 'Client A': 280, 'Client B': 306 } },
  { id: 'senior_3d_artist', name: 'Senior 3D Artist', department: 'CGI', rates: { 'Standard': 155, 'Client A': 170, 'Client B': 186 } },
  // Creative
  { id: 'associate_creative_director', name: 'Associate Creative Director', department: 'Creative', rates: { 'Standard': 252, 'Client A': 277, 'Client B': 302 } },
  { id: 'group_copy_supervisor', name: 'Group Copy Supervisor', department: 'Creative', rates: { 'Standard': 209, 'Client A': 230, 'Client B': 251 } },
  // Development
  { id: 'assoc_director_digital_studio_operations', name: 'Assoc Director, Digital Studio Operations', department: 'Development', rates: { 'Standard': 232, 'Client A': 255, 'Client B': 278 } },
  { id: 'developer', name: 'Developer', department: 'Development', rates: { 'Standard': 92, 'Client A': 101, 'Client B': 110 } },
  { id: 'dir_digital_studio_operations', name: 'Dir, Digital Studio Operations', department: 'Development', rates: { 'Standard': 245, 'Client A': 270, 'Client B': 294 } },
  { id: 'qa', name: 'QA', department: 'Development', rates: { 'Standard': 106, 'Client A': 117, 'Client B': 127 } },
  { id: 'svp_director_of_technology', name: 'SVP, Director of Technology', department: 'Development', rates: { 'Standard': 371, 'Client A': 408, 'Client B': 445 } },
  { id: 'sr_developer', name: 'Sr Developer', department: 'Development', rates: { 'Standard': 180, 'Client A': 198, 'Client B': 216 } },
  { id: 'sr_product_manager', name: 'Sr Product Manager', department: 'Development', rates: { 'Standard': 185, 'Client A': 204, 'Client B': 222 } },
  { id: 'tech_lead', name: 'Tech Lead', department: 'Development', rates: { 'Standard': 187, 'Client A': 206, 'Client B': 224 } },
  // Digital Art
  { id: 'digital_artist', name: 'Digital Artist', department: 'Digital Art', rates: { 'Standard': 128, 'Client A': 141, 'Client B': 154 } },
  { id: 'director_digital_art', name: 'Director, Digital Art', department: 'Digital Art', rates: { 'Standard': 245, 'Client A': 270, 'Client B': 294 } },
  { id: 'senior_digital_artist', name: 'Senior Digital Artist', department: 'Digital Art', rates: { 'Standard': 149, 'Client A': 164, 'Client B': 179 } },
  { id: 'supervising_digital_artist', name: 'Supervising Digital Artist', department: 'Digital Art', rates: { 'Standard': 215, 'Client A': 237, 'Client B': 258 } },
  { id: 'supervising_medical_illustrator', name: 'Supervising Medical Illustrator', department: 'Digital Art', rates: { 'Standard': 207, 'Client A': 228, 'Client B': 248 } },
  // Executive
  { id: 'evp_director', name: 'EVP, Director', department: 'Executive', rates: { 'Standard': 435, 'Client A': 479, 'Client B': 522 } },
  // Integrated Production
  { id: 'project_manager_offshore_brazil', name: 'Project Manager - OFFSHORE BRAZIL', department: 'Integrated Production', rates: { 'Standard': 126, 'Client A': 139, 'Client B': 151 } },
  // Live Events
  { id: 'executive_producer', name: 'Executive Producer', department: 'Live Events', rates: { 'Standard': 250, 'Client A': 275, 'Client B': 300 } },
  { id: 'producer', name: 'Producer', department: 'Live Events', rates: { 'Standard': 161, 'Client A': 177, 'Client B': 193 } },
  { id: 'project_coordinator', name: 'Project Coordinator', department: 'Live Events', rates: { 'Standard': 0, 'Client A': 0, 'Client B': 0 } },  // rate not provided in source; needs manual entry
  { id: 'videographer', name: 'Videographer', department: 'Live Events', rates: { 'Standard': 0, 'Client A': 0, 'Client B': 0 } },  // rate not provided in source; needs manual entry
  // Production
  { id: 'associate_producer', name: 'Associate Producer', department: 'Production', rates: { 'Standard': 97, 'Client A': 107, 'Client B': 116 } },
  { id: 'business_manager', name: 'Business Manager', department: 'Production', rates: { 'Standard': 173, 'Client A': 190, 'Client B': 208 } },
  { id: 'producer_offshore_brazil', name: 'Producer - OFFSHORE BRAZIL', department: 'Production', rates: { 'Standard': 67, 'Client A': 74, 'Client B': 80 } },
  { id: 'svp_director_virtual_events', name: 'SVP, Director Virtual Events', department: 'Production', rates: { 'Standard': 329, 'Client A': 362, 'Client B': 395 } },
  { id: 'svp_director_of_production', name: 'SVP, Director of Production', department: 'Production', rates: { 'Standard': 329, 'Client A': 362, 'Client B': 395 } },
  { id: 'svp_executive_producer', name: 'SVP, Executive Producer', department: 'Production', rates: { 'Standard': 329, 'Client A': 362, 'Client B': 395 } },
  { id: 'senior_producer', name: 'Senior Producer', department: 'Production', rates: { 'Standard': 185, 'Client A': 204, 'Client B': 222 } },
  { id: 'vp_director', name: 'VP, Director', department: 'Production', rates: { 'Standard': 258, 'Client A': 284, 'Client B': 310 } },
  { id: 'vp_executive_producer', name: 'VP, Executive Producer', department: 'Production', rates: { 'Standard': 232, 'Client A': 255, 'Client B': 278 } },
  // Video Editing
  { id: 'audio_engineer', name: 'Audio Engineer', department: 'Video Editing', rates: { 'Standard': 174, 'Client A': 191, 'Client B': 209 } },  // avg across staff at different levels
  { id: 'color_correct', name: 'Color Correct', department: 'Video Editing', rates: { 'Standard': 210, 'Client A': 231, 'Client B': 252 } },
  { id: 'colorist', name: 'Colorist', department: 'Video Editing', rates: { 'Standard': 143, 'Client A': 157, 'Client B': 172 } },  // avg across staff at different levels
  { id: 'dir_video_services_vp', name: 'Dir, Video Services - VP', department: 'Video Editing', rates: { 'Standard': 268, 'Client A': 295, 'Client B': 322 } },
  { id: 'junior_video_editor', name: 'Junior Video Editor', department: 'Video Editing', rates: { 'Standard': 111, 'Client A': 122, 'Client B': 133 } },
  { id: 'senior_video_editor', name: 'Senior Video Editor', department: 'Video Editing', rates: { 'Standard': 173, 'Client A': 190, 'Client B': 208 } },
  { id: 'vp_assoc_dir', name: 'VP, Assoc Dir', department: 'Video Editing', rates: { 'Standard': 210, 'Client A': 231, 'Client B': 252 } },
  { id: 'video_editing_off_shore_brazil', name: 'Video Editing - OFF SHORE BRAZIL', department: 'Video Editing', rates: { 'Standard': 67, 'Client A': 74, 'Client B': 80 } },
  { id: 'video_editor', name: 'Video Editor', department: 'Video Editing', rates: { 'Standard': 164, 'Client A': 180, 'Client B': 197 } },
  // XR
  { id: 'assoc_director_xr', name: 'Assoc Director XR', department: 'XR', rates: { 'Standard': 275, 'Client A': 302, 'Client B': 330 } },
  { id: 'svp_director_experiential_development', name: 'SVP, Director Experiential Development', department: 'XR', rates: { 'Standard': 306, 'Client A': 337, 'Client B': 367 } },
  { id: 'senior_xr_developer', name: 'Senior XR Developer', department: 'XR', rates: { 'Standard': 275, 'Client A': 302, 'Client B': 330 } },
  { id: 'xr_developer', name: 'XR Developer', department: 'XR', rates: { 'Standard': 165, 'Client A': 182, 'Client B': 198 } },
];

export const DEPARTMENTS: Department[] = [
  'Animation', 'CGI', 'Creative', 'Development', 'Digital Art', 'Executive', 'Integrated Production', 'Live Events', 'Production', 'Video Editing', 'XR'
];

