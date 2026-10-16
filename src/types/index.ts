// TypeScript Definitions for TinyPlayStudioz Sales CRM & Project Manager

export type StaffRole = 'SUPER_ADMIN' | 'SALES';

export interface StaffProfile {
  id: string;
  staff_id: string; // e.g., 'ADMIN-001', 'SALES-001'
  full_name: string;
  email: string;
  role: StaffRole;
  is_active: boolean;
  phone?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export type Platform = 'Instagram' | 'Facebook' | 'WhatsApp' | 'Other';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up Scheduled'
  | 'Contact Later'
  | 'Negotiating'
  | 'Confirmed'
  | 'Lost';

export type LeadPriority = 'Hot' | 'Warm' | 'Cold';

export type LeadSource =
  | 'Instagram DM'
  | 'Facebook Ad'
  | 'Referral'
  | 'TikTok'
  | 'Organic'
  | 'Other';

export interface Package {
  id: string;
  name: string;
  code: string;
  base_price_bdt: number;
  description?: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  customer_name: string;
  platform: Platform;
  handle: string;
  profile_url?: string | null;
  phone?: string | null;
  game_type: string;
  package_id?: string | null;
  package_name?: string | null;
  estimated_budget_bdt: number;
  lead_source: LeadSource | string;
  status: LeadStatus;
  priority: LeadPriority;
  conversation_notes?: string | null;
  next_follow_up_at?: string | null;
  follow_up_reason?: string | null;
  assigned_to?: string | null;
  assigned_staff_name?: string | null;
  assigned_staff_id?: string | null;
  created_by?: string | null;
  creator_staff_id?: string | null;
  is_converted: boolean;
  converted_at?: string | null;
  converted_customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type FollowUpStatus = 'Pending' | 'Completed' | 'Rescheduled' | 'Cancelled';

export interface FollowUp {
  id: string;
  lead_id?: string | null;
  contact_id?: string | null;
  customer_name: string;
  scheduled_at: string;
  reason: string;
  status: FollowUpStatus;
  result_notes?: string | null;
  completed_at?: string | null;
  assigned_to?: string | null;
  assigned_staff_name?: string | null;
  assigned_staff_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CustomerNote {
  id: string;
  lead_id?: string | null;
  contact_id?: string | null;
  project_id?: string | null;
  content: string;
  author_id?: string | null;
  author_name?: string | null;
  author_staff_id?: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  display_name: string;
  platform: Platform;
  handle: string;
  profile_url?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  lead_id?: string | null;
  created_by?: string | null;
  assigned_to?: string | null;
  assigned_staff_name?: string | null;
  assigned_staff_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectStage =
  | 'Requirements Analysis'
  | 'Awaiting Advance'
  | 'Confirmed'
  | 'In Development'
  | 'Demo/Review'
  | 'Revisions'
  | 'Ready for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface ProjectReferenceLink {
  label: string;
  url: string;
}

export interface Project {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_platform: Platform;
  contact_handle: string;
  contact_phone?: string | null;
  lead_id?: string | null;
  title: string;
  description?: string | null;
  package_id?: string | null;
  package_name_snapshot?: string | null;
  agreed_price_bdt: number;
  custom_requirements?: string | null;
  assigned_developer?: string | null;
  stage: ProjectStage;
  target_delivery_date?: string | null;
  order_date: string;
  reference_links: ProjectReferenceLink[];
  project_notes?: string | null;
  assigned_salesperson?: string | null;
  assigned_salesperson_name?: string | null;
  assigned_salesperson_id?: string | null;
  created_by?: string | null;
  total_paid_bdt: number;
  remaining_balance_bdt: number;
  payments_count?: number;
  created_at: string;
  updated_at: string;
}

export type PaymentType = 'Advance' | 'Partial' | 'Final';
export type PaymentMethod = 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash' | 'Other';

export interface Payment {
  id: string;
  project_id: string;
  project_title?: string;
  amount_bdt: number;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  transaction_ref?: string | null;
  payment_date: string;
  notes?: string | null;
  recorded_by?: string | null;
  recorded_by_name?: string | null;
  recorded_by_staff_id?: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id?: string | null;
  actor_staff_id?: string | null;
  actor_name: string;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  description: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeadsThisMonth: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
  confirmedCustomers: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenueBDT: number;
  outstandingBalanceBDT: number;
  conversionRate: number; // percentage e.g. 24.5
  pipelineDistribution: { stage: string; count: number; valueBDT: number }[];
  salesByStaff: { staffId: string; staffName: string; leadsCount: number; confirmedCount: number; revenueBDT: number }[];
  monthlyRevenueTrend: { month: string; revenueBDT: number; projectsCount: number }[];
  recentActivities: ActivityLog[];
  recentLeads: Lead[];
}

export interface SpreadsheetImportRow {
  rowNumber: number;
  instagramUser: string;
  tierPackage: string;
  stage: string;
  advancePaymentReceived: string | number;
  probability: string | number;
  deliveryDate: string;
  remainingPayment: string | number;
  expectedPaymentAtFull: string | number;
  developer: string;
  links: string;
  statusFlags: {
    isDuplicate: boolean;
    hasUncertainDate: boolean;
    hasUncertainAmount: boolean;
    hasInvalidUrl: boolean;
    warnings: string[];
  };
  parsedData: {
    contactName: string;
    handle: string;
    platform: Platform;
    gameTitle: string;
    packageName: string;
    agreedPriceBDT: number;
    advancePaidBDT: number;
    remainingBDT: number;
    stage: ProjectStage;
    deliveryDate: string | null;
    developer: string;
    links: ProjectReferenceLink[];
  };
}
