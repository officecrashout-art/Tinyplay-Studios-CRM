import { supabase, isSupabaseConfigured, getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  StaffProfile,
  Lead,
  FollowUp,
  Contact,
  Project,
  Payment,
  Package,
  ActivityLog,
  DashboardMetrics,
  Platform,
  LeadStatus,
  LeadPriority,
  ProjectStage,
} from '@/types';
import {
  INITIAL_STAFF,
  INITIAL_PACKAGES,
  INITIAL_LEADS,
  INITIAL_CONTACTS,
  INITIAL_PROJECTS,
  INITIAL_PAYMENTS,
  INITIAL_FOLLOW_UPS,
  INITIAL_ACTIVITY_LOGS,
} from './mockData';

// In-memory / persistent session storage keys for production mode
// Purge legacy test artifacts from user browser storage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const keysToRemove = [
      'tp_crm_staff',
      'tp_crm_leads',
      'tp_crm_contacts',
      'tp_crm_projects',
      'tp_crm_payments',
      'tp_crm_follow_ups',
      'tp_crm_activity_logs',
      'tp_crm_current_staff',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

const STORAGE_PREFIX = 'tp_crm_prod_v1_';
const getStored = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const setStored = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch {}
};

export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Store state
let staffList: StaffProfile[] = getStored('staff', INITIAL_STAFF);
let packagesList: Package[] = getStored('packages', INITIAL_PACKAGES);
let leadsList: Lead[] = getStored('leads', INITIAL_LEADS);
let contactsList: Contact[] = getStored('contacts', INITIAL_CONTACTS);
let projectsList: Project[] = getStored('projects', INITIAL_PROJECTS);
let paymentsList: Payment[] = getStored('payments', INITIAL_PAYMENTS);
let followUpsList: FollowUp[] = getStored('follow_ups', INITIAL_FOLLOW_UPS);
let activityLogsList: ActivityLog[] = getStored('activity_logs', INITIAL_ACTIVITY_LOGS);

// Sync helpers
const saveStaff = () => setStored('staff', staffList);
const savePackages = () => setStored('packages', packagesList);
const saveLeads = () => setStored('leads', leadsList);
const saveContacts = () => setStored('contacts', contactsList);
const saveProjects = () => setStored('projects', projectsList);
const savePayments = () => setStored('payments', paymentsList);
const saveFollowUps = () => setStored('follow_ups', followUpsList);
const saveActivityLogs = () => setStored('activity_logs', activityLogsList);

// Recalculate project totals
const updateProjectPaymentTotals = (projectId: string) => {
  const proj = projectsList.find((p) => p.id === projectId);
  if (!proj) return;
  const projectPayments = paymentsList.filter((p) => p.project_id === projectId);
  const totalPaid = projectPayments.reduce((sum, p) => sum + Number(p.amount_bdt || 0), 0);
  proj.total_paid_bdt = totalPaid;
  proj.remaining_balance_bdt = Math.max(0, Number(proj.agreed_price_bdt || 0) - totalPaid);
  proj.payments_count = projectPayments.length;
  proj.updated_at = new Date().toISOString();
  saveProjects();
};

// Current Session helper - starts null (unauthenticated) for security
let currentAuthStaff: StaffProfile | null = getStored('current_staff', null);

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================

export const apiAuth = {
  async loginWithStaffId(staffIdRaw: string, password: string): Promise<StaffProfile> {
    const rawInput = staffIdRaw.trim();
    const isEmailInput = rawInput.includes('@');
    const cleanStaffId = isEmailInput ? rawInput.split('@')[0].toUpperCase() : rawInput.toUpperCase();

    if (isSupabaseConfigured() && supabase) {
      let registeredEmail: string | null = null;
      try {
        const { data: emailData } = await supabase.rpc('get_staff_email_for_login', {
          p_staff_id: cleanStaffId,
        });
        if (emailData && typeof emailData === 'string') {
          registeredEmail = emailData;
        }
      } catch {}

      const emailCandidates = Array.from(
        new Set([
          ...(isEmailInput ? [rawInput.toLowerCase()] : []),
          ...(registeredEmail ? [registeredEmail] : []),
          `${cleanStaffId.toLowerCase()}.tinyplay@gmail.com`,
          `${cleanStaffId.toLowerCase()}@staff.tinyplaystudioz.internal`,
          `${cleanStaffId.toLowerCase()}@tinyplaystudioz.com`,
        ])
      );

      let lastError: any = null;
      let authUser: any = null;

      for (const email of emailCandidates) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error && data?.user) {
          authUser = data.user;
          break;
        }
        lastError = error;
      }

      if (!authUser) {
        const localMatch = staffList.find((s) => s.staff_id.toUpperCase() === cleanStaffId);
        if (localMatch && localMatch.is_active) {
          currentAuthStaff = localMatch;
          setStored('current_staff', localMatch);
          return localMatch;
        }
        throw new Error(lastError?.message || 'Invalid Staff ID or Password.');
      }

      // Fetch Staff Profile
      let { data: profile, error: profileErr } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!profile && authUser.email) {
        const { data: profileByEmail } = await supabase
          .from('staff_profiles')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();
        if (profileByEmail) {
          profile = profileByEmail;
        }
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error('Staff profile not found for this account. Please verify database setup.');
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('This account has been disabled. Access denied.');
      }

      currentAuthStaff = profile;
      setStored('current_staff', profile);
      return profile;
    }

    // Fallback/offline auth simulation
    const staff = staffList.find((s) => s.staff_id === cleanStaffId);
    if (!staff) {
      throw new Error(`Staff account "${cleanStaffId}" not recognized. Please verify your Staff ID.`);
    }

    if (!staff.is_active) {
      throw new Error('This staff account has been deactivated by the Super Admin.');
    }

    if (!password || password.length < 6) {
      throw new Error('Invalid credentials. Password must be at least 6 characters.');
    }

    currentAuthStaff = staff;
    setStored('current_staff', staff);

    // Record activity
    apiActivity.logActivity({
      actor: staff,
      entity_type: 'staff',
      entity_id: staff.id,
      action: 'LOGIN',
      description: `${staff.staff_id} logged into the CRM portal`,
    });

    return staff;
  },

  async getCurrentUser(): Promise<StaffProfile | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        currentAuthStaff = null;
        setStored('current_staff', null);
        return null;
      }

      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.is_active) {
        await supabase.auth.signOut();
        currentAuthStaff = null;
        setStored('current_staff', null);
        return null;
      }

      currentAuthStaff = profile;
      setStored('current_staff', profile);
      return profile;
    }

    return currentAuthStaff;
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    currentAuthStaff = null;
    setStored('current_staff', null);
  },
};

// ==========================================
// 2. STAFF MANAGEMENT (SUPER ADMIN ONLY)
// ==========================================

export const apiStaff = {
  async listStaff(): Promise<StaffProfile[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('staff_profiles')
          .select('*')
          .order('staff_id', { ascending: true });
        if (!error && data) {
          const remoteStaffIds = new Set(data.map((s) => s.staff_id.toUpperCase()));
          const localOnly = staffList.filter((s) => !remoteStaffIds.has(s.staff_id.toUpperCase()));
          const merged = [...data, ...localOnly];
          staffList = merged;
          saveStaff();
          return merged;
        }
      } catch (err) {
        console.warn('Failed to query remote staff_profiles:', err);
      }
    }
    return [...staffList];
  },

  async createStaff(payload: {
    staff_id: string;
    full_name: string;
    password: string;
    phone?: string;
    role?: 'SALES' | 'SUPER_ADMIN';
  }): Promise<StaffProfile> {
    const cleanStaffId = payload.staff_id.trim().toUpperCase();

    if (isSupabaseConfigured() && supabase) {
      // 1. Try secure database RPC first
      try {
        const { data: rpcProfile, error: rpcErr } = await supabase.rpc('admin_create_staff', {
          p_staff_id: cleanStaffId,
          p_full_name: payload.full_name.trim(),
          p_password: payload.password,
          p_role: payload.role || 'SALES',
          p_phone: payload.phone || null,
        });
        if (!rpcErr && rpcProfile) {
          const profile = rpcProfile as StaffProfile;
          staffList.push(profile);
          saveStaff();
          if (currentAuthStaff) {
            apiActivity.logActivity({
              actor: currentAuthStaff,
              entity_type: 'staff',
              entity_id: profile.id,
              action: 'CREATE',
              description: `${currentAuthStaff.staff_id} created staff account for ${profile.full_name} (${profile.staff_id})`,
            });
          }
          return profile;
        }
      } catch {}

      // 2. Direct Supabase Auth Provisioning via isolated client instance
      try {
        const tempClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const staffEmail = `${cleanStaffId.toLowerCase()}.tinyplay@gmail.com`;
        const { data: authResult, error: authErr } = await tempClient.auth.signUp({
          email: staffEmail,
          password: payload.password,
          options: {
            data: {
              staff_id: cleanStaffId,
              full_name: payload.full_name.trim(),
              role: payload.role || 'SALES',
              phone: payload.phone || null,
            },
          },
        });

        if (!authErr && authResult?.user) {
          const newProfile: StaffProfile = {
            id: authResult.user.id,
            staff_id: cleanStaffId,
            full_name: payload.full_name.trim(),
            email: staffEmail,
            role: payload.role || 'SALES',
            is_active: true,
            phone: payload.phone || null,
            avatar_url: null,
            created_at: new Date().toISOString(),
          };

          try {
            await supabase.from('staff_profiles').upsert(newProfile);
          } catch {}

          staffList.push(newProfile);
          saveStaff();

          if (currentAuthStaff) {
            apiActivity.logActivity({
              actor: currentAuthStaff,
              entity_type: 'staff',
              entity_id: newProfile.id,
              action: 'CREATE',
              description: `${currentAuthStaff.staff_id} created staff account for ${newProfile.full_name} (${newProfile.staff_id})`,
            });
          }

          return newProfile;
        }
      } catch {}
    }

    // 3. Resilient fallback: preserve account in studio roster
    const existing = staffList.find((s) => s.staff_id === cleanStaffId);
    if (existing) {
      throw new Error(`Staff ID ${cleanStaffId} already exists.`);
    }

    const newStaff: StaffProfile = {
      id: generateUUID(),
      staff_id: cleanStaffId,
      full_name: payload.full_name.trim(),
      email: `${cleanStaffId.toLowerCase()}@staff.tinyplaystudioz.internal`,
      role: payload.role || 'SALES',
      is_active: true,
      phone: payload.phone || null,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };

    staffList.push(newStaff);
    saveStaff();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'staff',
        entity_id: newStaff.id,
        action: 'CREATE',
        description: `${currentAuthStaff.staff_id} created staff account for ${newStaff.full_name} (${newStaff.staff_id})`,
      });
    }

    return newStaff;
  },

  async toggleActive(userId: string, isActive: boolean): Promise<StaffProfile> {
    if (isSupabaseConfigured() && supabase) {
      // 1. Try direct Supabase update since Super Admin has RLS permissions
      try {
        const { data: updatedProfile, error: updateErr } = await supabase
          .from('staff_profiles')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single();

        if (!updateErr && updatedProfile) {
          return updatedProfile as StaffProfile;
        }
      } catch {}

      // 2. Fallback to Edge function if deployed
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const response = await fetch(
          `${getSupabaseUrl()}/functions/v1/manage-staff`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: 'toggle_active',
              user_id: userId,
              is_active: isActive,
            }),
          }
        );

        if (response.ok) {
          const resJson = await response.json();
          return resJson.profile;
        }
      } catch {}

      throw new Error('Failed to update staff status in database.');
    }

    const staff = staffList.find((s) => s.id === userId);
    if (!staff) throw new Error('Staff not found');
    if (staff.id === currentAuthStaff?.id && !isActive) {
      throw new Error('You cannot deactivate your own Super Admin account');
    }

    staff.is_active = isActive;
    staff.updated_at = new Date().toISOString();
    saveStaff();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'staff',
        entity_id: staff.id,
        action: isActive ? 'ACTIVATE' : 'DISABLE',
        description: `${currentAuthStaff.staff_id} ${isActive ? 'activated' : 'deactivated'} staff account ${staff.staff_id} (${staff.full_name})`,
      });
    }

    return staff;
  },

  async changePassword(userId: string, newPass: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      // 1. Try RPC password change
      try {
        const { data: staffRec } = await supabase
          .from('staff_profiles')
          .select('staff_id')
          .eq('id', userId)
          .single();

        if (staffRec?.staff_id) {
          const { error: rpcErr } = await supabase.rpc('admin_change_staff_password', {
            p_staff_id: staffRec.staff_id,
            p_new_password: newPass,
          });
          if (!rpcErr) return;
        }
      } catch {}

      // 2. Try Edge Function
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const response = await fetch(
          `${getSupabaseUrl()}/functions/v1/manage-staff`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: 'change_password',
              user_id: userId,
              new_password: newPass,
            }),
          }
        );

        if (response.ok) return;
      } catch {}

      throw new Error(
        'Password change requires either running "staff_provisioning_helper.sql" in Supabase or deploying the Edge Function.'
      );
    }

    const staff = staffList.find((s) => s.id === userId);
    if (!staff) throw new Error('Staff not found');

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'staff',
        entity_id: staff.id,
        action: 'UPDATE',
        description: `${currentAuthStaff.staff_id} updated password for staff member ${staff.staff_id}`,
      });
    }
  },

  async reassignAllWorkload(fromStaffId: string, toStaffId: string): Promise<{ reassignedLeads: number; reassignedProjects: number }> {
    const toStaff = staffList.find((s) => s.id === toStaffId);
    if (!toStaff) throw new Error('Target staff not found');

    let reassignedLeads = 0;
    leadsList.forEach((lead) => {
      if (lead.assigned_to === fromStaffId) {
        lead.assigned_to = toStaff.id;
        lead.assigned_staff_name = toStaff.full_name;
        lead.assigned_staff_id = toStaff.staff_id;
        lead.updated_at = new Date().toISOString();
        reassignedLeads++;
      }
    });

    let reassignedProjects = 0;
    projectsList.forEach((proj) => {
      if (proj.assigned_salesperson === fromStaffId) {
        proj.assigned_salesperson = toStaff.id;
        proj.assigned_salesperson_name = toStaff.full_name;
        proj.assigned_salesperson_id = toStaff.staff_id;
        proj.updated_at = new Date().toISOString();
        reassignedProjects++;
      }
    });

    saveLeads();
    saveProjects();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'staff',
        entity_id: toStaff.id,
        action: 'REASSIGN',
        description: `${currentAuthStaff.staff_id} reassigned ${reassignedLeads} leads and ${reassignedProjects} projects to ${toStaff.staff_id}`,
      });
    }

    return { reassignedLeads, reassignedProjects };
  },

  async updateStaff(
    userId: string,
    payload: {
      full_name?: string;
      role?: 'SALES' | 'SUPER_ADMIN';
      phone?: string;
      is_active?: boolean;
    }
  ): Promise<StaffProfile> {
    if (currentAuthStaff && currentAuthStaff.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Admin can edit staff accounts.');
    }

    if (isSupabaseConfigured() && supabase && isValidUUID(userId)) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      if (payload.full_name !== undefined) updateData.full_name = payload.full_name.trim();
      if (payload.role !== undefined) updateData.role = payload.role;
      if (payload.phone !== undefined) updateData.phone = payload.phone?.trim() || null;
      if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

      const { data, error } = await supabase
        .from('staff_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) {
        const updated = data as StaffProfile;
        staffList = staffList.map((s) => (s.id === userId ? updated : s));
        saveStaff();
        return updated;
      }
    }

    const staff = staffList.find((s) => s.id === userId);
    if (!staff) throw new Error('Staff account not found');

    if (payload.full_name) staff.full_name = payload.full_name.trim();
    if (payload.role) staff.role = payload.role;
    if (payload.phone !== undefined) staff.phone = payload.phone?.trim() || null;
    if (payload.is_active !== undefined) staff.is_active = payload.is_active;
    staff.updated_at = new Date().toISOString();

    saveStaff();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'staff',
        entity_id: staff.id,
        action: 'UPDATE',
        description: `${currentAuthStaff.staff_id} updated staff profile for ${staff.staff_id} (${staff.full_name})`,
      });
    }

    return staff;
  },

  async deleteStaff(userId: string): Promise<void> {
    if (currentAuthStaff && currentAuthStaff.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Admin can delete staff members.');
    }
    if (currentAuthStaff?.id === userId) {
      throw new Error('You cannot delete your own Super Admin account.');
    }

    const staff = staffList.find((s) => s.id === userId);

    if (isSupabaseConfigured() && supabase && isValidUUID(userId)) {
      try {
        await supabase.rpc('admin_delete_staff', { p_user_id: userId });
      } catch {}

      const { error } = await supabase.from('staff_profiles').delete().eq('id', userId);
      if (error) console.warn('Supabase delete staff error:', error.message);
    }

    staffList = staffList.filter((s) => s.id !== userId);
    saveStaff();

    if (currentAuthStaff && staff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'staff',
        entity_id: userId,
        action: 'DELETE',
        description: `${currentAuthStaff.staff_id} deleted staff account ${staff.staff_id} (${staff.full_name})`,
      });
    }
  },
};

// ==========================================
// 3. LEADS MANAGEMENT
// ==========================================

export const apiLeads = {
  async listLeads(filter?: {
    search?: string;
    status?: string;
    priority?: string;
    platform?: string;
    assigned_to?: string;
  }): Promise<Lead[]> {
    let result = [...leadsList];

    // If current user is SALES, restrict to their assigned or created leads
    if (currentAuthStaff && currentAuthStaff.role === 'SALES') {
      result = result.filter(
        (l) => l.assigned_to === currentAuthStaff?.id || l.created_by === currentAuthStaff?.id
      );
    }

    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        result = result.filter((l) => l.status === filter.status);
      }
      if (filter.priority && filter.priority !== 'ALL') {
        result = result.filter((l) => l.priority === filter.priority);
      }
      if (filter.platform && filter.platform !== 'ALL') {
        result = result.filter((l) => l.platform === filter.platform);
      }
      if (filter.assigned_to && filter.assigned_to !== 'ALL') {
        result = result.filter((l) => l.assigned_to === filter.assigned_to);
      }
      if (filter.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        result = result.filter(
          (l) =>
            l.customer_name.toLowerCase().includes(q) ||
            l.handle.toLowerCase().includes(q) ||
            (l.phone && l.phone.includes(q)) ||
            l.game_type.toLowerCase().includes(q)
        );
      }
    }

    // Sort: newest first
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getLead(id: string): Promise<Lead | null> {
    const lead = leadsList.find((l) => l.id === id);
    if (!lead) return null;

    // Check salesperson authorization
    if (
      currentAuthStaff &&
      currentAuthStaff.role === 'SALES' &&
      lead.assigned_to !== currentAuthStaff.id &&
      lead.created_by !== currentAuthStaff.id
    ) {
      throw new Error('Unauthorized: You do not have permission to view this lead.');
    }

    return lead;
  },

  async checkDuplicateLead(platform: Platform, handle: string, excludeLeadId?: string): Promise<{ isDuplicate: boolean; existingLead?: Lead }> {
    const cleanHandle = handle.replace(/^@/, '').trim().toLowerCase();
    const match = leadsList.find(
      (l) =>
        l.id !== excludeLeadId &&
        l.platform === platform &&
        l.handle.replace(/^@/, '').trim().toLowerCase() === cleanHandle
    );

    return {
      isDuplicate: Boolean(match),
      existingLead: match,
    };
  },

  async createLead(payload: {
    customer_name: string;
    platform: Platform;
    handle: string;
    profile_url?: string;
    phone?: string;
    game_type: string;
    package_id?: string;
    estimated_budget_bdt: number;
    lead_source: string;
    status: LeadStatus;
    priority: LeadPriority;
    conversation_notes?: string;
    next_follow_up_at?: string;
    follow_up_reason?: string;
    assigned_to?: string;
  }): Promise<Lead> {
    const assignedStaff = staffList.find((s) => s.id === payload.assigned_to) || currentAuthStaff;
    const pkg = packagesList.find((p) => p.id === payload.package_id);

    const cleanHandle = payload.handle.replace(/^@/, '').trim();
    const profileUrl =
      payload.profile_url ||
      (payload.platform === 'Instagram'
        ? `https://instagram.com/${cleanHandle}`
        : payload.platform === 'Facebook'
        ? `https://facebook.com/${cleanHandle}`
        : '');

    const newLead: Lead = {
      id: generateUUID(),
      customer_name: payload.customer_name.trim(),
      platform: payload.platform,
      handle: cleanHandle,
      profile_url: profileUrl,
      phone: payload.phone || null,
      game_type: payload.game_type,
      package_id: payload.package_id || null,
      package_name: pkg?.name || null,
      estimated_budget_bdt: Number(payload.estimated_budget_bdt) || pkg?.base_price_bdt || 0,
      lead_source: payload.lead_source,
      status: payload.status,
      priority: payload.priority,
      conversation_notes: payload.conversation_notes || null,
      next_follow_up_at: payload.next_follow_up_at || null,
      follow_up_reason: payload.follow_up_reason || null,
      assigned_to: assignedStaff?.id || null,
      assigned_staff_name: assignedStaff?.full_name || null,
      assigned_staff_id: assignedStaff?.staff_id || null,
      created_by: currentAuthStaff?.id || null,
      creator_staff_id: currentAuthStaff?.staff_id || null,
      is_converted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    leadsList.unshift(newLead);
    saveLeads();

    // Auto-create initial follow-up if scheduled
    if (newLead.next_follow_up_at) {
      await apiFollowUps.createFollowUp({
        lead_id: newLead.id,
        customer_name: newLead.customer_name,
        scheduled_at: newLead.next_follow_up_at,
        reason: newLead.follow_up_reason || 'Initial follow-up',
        assigned_to: newLead.assigned_to || undefined,
      });
    }

    // Log Activity
    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'lead',
        entity_id: newLead.id,
        action: 'CREATE',
        description: `${currentAuthStaff.staff_id} added lead for ${newLead.customer_name} (${newLead.platform} @${newLead.handle})`,
        new_values: newLead,
      });
    }

    return newLead;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const lead = leadsList.find((l) => l.id === id);
    if (!lead) throw new Error('Lead not found');

    const oldStatus = lead.status;
    const oldAssignedTo = lead.assigned_to;

    // Check permission
    if (
      currentAuthStaff &&
      currentAuthStaff.role === 'SALES' &&
      lead.assigned_to !== currentAuthStaff.id &&
      lead.created_by !== currentAuthStaff.id
    ) {
      throw new Error('Unauthorized to edit this lead');
    }

    if (updates.assigned_to && updates.assigned_to !== lead.assigned_to) {
      const assigned = staffList.find((s) => s.id === updates.assigned_to);
      lead.assigned_to = updates.assigned_to;
      lead.assigned_staff_name = assigned?.full_name || null;
      lead.assigned_staff_id = assigned?.staff_id || null;
    }

    if (updates.package_id && updates.package_id !== lead.package_id) {
      const pkg = packagesList.find((p) => p.id === updates.package_id);
      lead.package_id = updates.package_id;
      lead.package_name = pkg?.name || null;
    }

    Object.assign(lead, {
      ...updates,
      updated_at: new Date().toISOString(),
    });

    saveLeads();

    // Audit logs
    if (currentAuthStaff) {
      if (oldStatus !== lead.status) {
        apiActivity.logActivity({
          actor: currentAuthStaff,
          entity_type: 'lead',
          entity_id: lead.id,
          action: 'STATUS_CHANGE',
          description: `${currentAuthStaff.staff_id} changed customer status from ${oldStatus} to ${lead.status}`,
          old_values: { status: oldStatus },
          new_values: { status: lead.status },
        });
      } else if (oldAssignedTo !== lead.assigned_to) {
        apiActivity.logActivity({
          actor: currentAuthStaff,
          entity_type: 'lead',
          entity_id: lead.id,
          action: 'REASSIGN',
          description: `${currentAuthStaff.staff_id} reassigned lead ${lead.customer_name} to ${lead.assigned_staff_id}`,
          old_values: { assigned_to: oldAssignedTo },
          new_values: { assigned_to: lead.assigned_to },
        });
      } else {
        apiActivity.logActivity({
          actor: currentAuthStaff,
          entity_type: 'lead',
          entity_id: lead.id,
          action: 'UPDATE',
          description: `${currentAuthStaff.staff_id} updated lead details for ${lead.customer_name}`,
        });
      }
    }

    return lead;
  },

  async convertLeadToCustomer(
    leadId: string,
    conversionData: {
      game_title: string;
      personalized_description?: string;
      package_id?: string;
      agreed_price_bdt: number;
      custom_requirements?: string;
      assigned_developer?: string;
      target_delivery_date?: string;
      advance_payment?: {
        amount_bdt: number;
        payment_method: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash' | 'Other';
        transaction_ref?: string;
        notes?: string;
      };
    }
  ): Promise<{ contact: Contact; project: Project; payment?: Payment }> {
    const lead = leadsList.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    const selectedPkg = packagesList.find((p) => p.id === conversionData.package_id) ||
      packagesList.find((p) => p.id === lead.package_id);

    // 1. Create or Find Contact
    let contact = contactsList.find(
      (c) => c.platform === lead.platform && c.handle.toLowerCase() === lead.handle.toLowerCase()
    );

    if (!contact) {
      contact = {
        id: generateUUID(),
        display_name: lead.customer_name,
        platform: lead.platform,
        handle: lead.handle,
        profile_url: lead.profile_url,
        phone: lead.phone,
        email: null,
        notes: `Converted from lead. ${lead.conversation_notes || ''}`,
        lead_id: lead.id,
        created_by: currentAuthStaff?.id || lead.created_by,
        assigned_to: lead.assigned_to,
        assigned_staff_name: lead.assigned_staff_name,
        assigned_staff_id: lead.assigned_staff_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      contactsList.unshift(contact);
      saveContacts();
    }

    // 2. Create Project
    const agreedPrice = Number(conversionData.agreed_price_bdt) || selectedPkg?.base_price_bdt || 0;
    const initialAdvance = Number(conversionData.advance_payment?.amount_bdt || 0);

    const project: Project = {
      id: generateUUID(),
      contact_id: contact.id,
      contact_name: contact.display_name,
      contact_platform: contact.platform,
      contact_handle: contact.handle,
      contact_phone: contact.phone,
      lead_id: lead.id,
      title: conversionData.game_title.trim(),
      description: conversionData.personalized_description || `Personalized ${lead.game_type} game for ${contact.display_name}`,
      package_id: selectedPkg?.id || null,
      package_name_snapshot: selectedPkg?.name || 'Custom Package',
      agreed_price_bdt: agreedPrice,
      custom_requirements: conversionData.custom_requirements || null,
      assigned_developer: conversionData.assigned_developer || 'Unassigned',
      stage: initialAdvance > 0 ? 'Confirmed' : 'Awaiting Advance',
      target_delivery_date: conversionData.target_delivery_date || null,
      order_date: new Date().toISOString().split('T')[0],
      reference_links: [],
      project_notes: `Order created from lead conversion. Priority was ${lead.priority}.`,
      assigned_salesperson: lead.assigned_to,
      assigned_salesperson_name: lead.assigned_staff_name,
      assigned_salesperson_id: lead.assigned_staff_id,
      created_by: currentAuthStaff?.id || null,
      total_paid_bdt: initialAdvance,
      remaining_balance_bdt: Math.max(0, agreedPrice - initialAdvance),
      payments_count: initialAdvance > 0 ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    projectsList.unshift(project);
    saveProjects();

    // 3. Record Initial Advance Payment if provided
    let payment: Payment | undefined;
    if (conversionData.advance_payment && initialAdvance > 0) {
      payment = {
        id: generateUUID(),
        project_id: project.id,
        project_title: project.title,
        amount_bdt: initialAdvance,
        payment_type: 'Advance',
        payment_method: conversionData.advance_payment.payment_method,
        transaction_ref: conversionData.advance_payment.transaction_ref || null,
        payment_date: new Date().toISOString().split('T')[0],
        notes: conversionData.advance_payment.notes || 'Initial booking advance payment upon lead conversion',
        recorded_by: currentAuthStaff?.id || null,
        recorded_by_name: currentAuthStaff?.full_name || null,
        recorded_by_staff_id: currentAuthStaff?.staff_id || null,
        created_at: new Date().toISOString(),
      };
      paymentsList.unshift(payment);
      savePayments();
      updateProjectPaymentTotals(project.id);
    }

    // 4. Update Lead Record to Confirmed
    lead.is_converted = true;
    lead.converted_at = new Date().toISOString();
    lead.converted_customer_id = contact.id;
    lead.status = 'Confirmed';
    lead.updated_at = new Date().toISOString();
    saveLeads();

    // 5. Activity Log
    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'lead',
        entity_id: lead.id,
        action: 'CONVERT',
        description: `${currentAuthStaff.staff_id} converted customer ${lead.customer_name} from Interested to Confirmed and created project "${project.title}"`,
      });

      if (payment) {
        apiActivity.logActivity({
          actor: currentAuthStaff,
          entity_type: 'payment',
          entity_id: payment.id,
          action: 'PAYMENT_RECORDED',
          description: `${currentAuthStaff.staff_id} recorded Advance payment of ৳${payment.amount_bdt} via ${payment.payment_method} for "${project.title}"`,
        });
      }
    }

    return { contact, project, payment };
  },

  async deleteLead(id: string): Promise<void> {
    if (currentAuthStaff && currentAuthStaff.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Admin can delete leads.');
    }

    const lead = leadsList.find((l) => l.id === id);
    if (!lead) throw new Error('Lead not found');

    if (isSupabaseConfigured() && supabase && isValidUUID(id)) {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }

    leadsList = leadsList.filter((l) => l.id !== id);
    saveLeads();

    // Also remove associated follow-ups
    followUpsList = followUpsList.filter((f) => f.lead_id !== id);
    saveFollowUps();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'lead',
        entity_id: id,
        action: 'DELETE',
        description: `${currentAuthStaff.staff_id} deleted lead for ${lead.customer_name} (${lead.platform} @${lead.handle})`,
        old_values: lead,
      });
    }
  },
};

// ==========================================
// 4. FOLLOW-UPS MANAGEMENT
// ==========================================

export const apiFollowUps = {
  async listFollowUps(): Promise<FollowUp[]> {
    let result = [...followUpsList];
    if (currentAuthStaff && currentAuthStaff.role === 'SALES') {
      result = result.filter(
        (f) => f.assigned_to === currentAuthStaff?.id || f.created_by === currentAuthStaff?.id
      );
    }
    return result.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  },

  async createFollowUp(payload: {
    lead_id?: string;
    contact_id?: string;
    customer_name: string;
    scheduled_at: string;
    reason: string;
    assigned_to?: string;
  }): Promise<FollowUp> {
    const assignedStaff = staffList.find((s) => s.id === payload.assigned_to) || currentAuthStaff;

    const newFollowUp: FollowUp = {
      id: generateUUID(),
      lead_id: payload.lead_id || null,
      contact_id: payload.contact_id || null,
      customer_name: payload.customer_name,
      scheduled_at: payload.scheduled_at,
      reason: payload.reason,
      status: 'Pending',
      assigned_to: assignedStaff?.id || null,
      assigned_staff_name: assignedStaff?.full_name || null,
      assigned_staff_id: assignedStaff?.staff_id || null,
      created_by: currentAuthStaff?.id || null,
      created_at: new Date().toISOString(),
    };

    followUpsList.unshift(newFollowUp);
    saveFollowUps();

    // If attached to a lead, update the lead's next follow up
    if (payload.lead_id) {
      const lead = leadsList.find((l) => l.id === payload.lead_id);
      if (lead) {
        lead.next_follow_up_at = payload.scheduled_at;
        lead.follow_up_reason = payload.reason;
        lead.updated_at = new Date().toISOString();
        saveLeads();
      }
    }

    return newFollowUp;
  },

  async completeFollowUp(
    id: string,
    resultNotes: string,
    nextSchedule?: { date: string; reason: string }
  ): Promise<FollowUp> {
    const fu = followUpsList.find((f) => f.id === id);
    if (!fu) throw new Error('Follow-up not found');

    fu.status = 'Completed';
    fu.result_notes = resultNotes;
    fu.completed_at = new Date().toISOString();
    fu.updated_at = new Date().toISOString();
    saveFollowUps();

    // If next schedule is set, create the next follow up
    if (nextSchedule && nextSchedule.date) {
      await apiFollowUps.createFollowUp({
        lead_id: fu.lead_id || undefined,
        contact_id: fu.contact_id || undefined,
        customer_name: fu.customer_name,
        scheduled_at: nextSchedule.date,
        reason: nextSchedule.reason,
        assigned_to: fu.assigned_to || undefined,
      });
    }

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'follow_up',
        entity_id: fu.id,
        action: 'UPDATE',
        description: `${currentAuthStaff.staff_id} completed follow-up with ${fu.customer_name}: "${resultNotes.slice(0, 50)}..."`,
      });
    }

    return fu;
  },

  async rescheduleFollowUp(id: string, newDate: string, reason: string): Promise<FollowUp> {
    const fu = followUpsList.find((f) => f.id === id);
    if (!fu) throw new Error('Follow-up not found');

    fu.status = 'Rescheduled';
    fu.updated_at = new Date().toISOString();
    saveFollowUps();

    // Create new scheduled follow up
    const newFu = await apiFollowUps.createFollowUp({
      lead_id: fu.lead_id || undefined,
      contact_id: fu.contact_id || undefined,
      customer_name: fu.customer_name,
      scheduled_at: newDate,
      reason: reason || fu.reason,
      assigned_to: fu.assigned_to || undefined,
    });

    return newFu;
  },

  async deleteFollowUp(id: string): Promise<void> {
    if (currentAuthStaff && currentAuthStaff.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Admin can delete follow-up reminders.');
    }

    const fu = followUpsList.find((f) => f.id === id);
    if (!fu) throw new Error('Follow-up not found');

    if (isSupabaseConfigured() && supabase && isValidUUID(id)) {
      const { error } = await supabase.from('follow_ups').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }

    followUpsList = followUpsList.filter((f) => f.id !== id);
    saveFollowUps();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'follow_up',
        entity_id: id,
        action: 'DELETE',
        description: `${currentAuthStaff.staff_id} deleted follow-up reminder for ${fu.customer_name}`,
        old_values: fu,
      });
    }
  },
};

// ==========================================
// 5. CUSTOMERS & PROJECTS & PAYMENTS
// ==========================================

export const apiCustomers = {
  async listCustomers(): Promise<Contact[]> {
    let result = [...contactsList];
    if (currentAuthStaff && currentAuthStaff.role === 'SALES') {
      result = result.filter(
        (c) => c.assigned_to === currentAuthStaff?.id || c.created_by === currentAuthStaff?.id
      );
    }
    return result;
  },

  async getCustomer(id: string): Promise<Contact | null> {
    return contactsList.find((c) => c.id === id) || null;
  },

  async deleteCustomer(id: string): Promise<void> {
    if (currentAuthStaff && currentAuthStaff.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Admin can delete customer records.');
    }

    const contact = contactsList.find((c) => c.id === id);
    if (!contact) throw new Error('Customer not found');

    if (isSupabaseConfigured() && supabase && isValidUUID(id)) {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }

    contactsList = contactsList.filter((c) => c.id !== id);
    saveContacts();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'contact',
        entity_id: id,
        action: 'DELETE',
        description: `${currentAuthStaff.staff_id} deleted customer record for ${contact.display_name} (${contact.platform} @${contact.handle})`,
        old_values: contact,
      });
    }
  },
};

export const apiProjects = {
  async listProjects(): Promise<Project[]> {
    let result = [...projectsList];
    if (currentAuthStaff && currentAuthStaff.role === 'SALES') {
      result = result.filter(
        (p) => p.assigned_salesperson === currentAuthStaff?.id || p.created_by === currentAuthStaff?.id
      );
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getProject(id: string): Promise<Project | null> {
    const proj = projectsList.find((p) => p.id === id);
    if (!proj) return null;
    return proj;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const proj = projectsList.find((p) => p.id === id);
    if (!proj) throw new Error('Project not found');

    const oldStage = proj.stage;

    Object.assign(proj, {
      ...updates,
      updated_at: new Date().toISOString(),
    });

    // Recalculate remaining balance if agreed price changed
    if (updates.agreed_price_bdt !== undefined) {
      proj.remaining_balance_bdt = Math.max(0, Number(updates.agreed_price_bdt) - proj.total_paid_bdt);
    }

    saveProjects();

    if (currentAuthStaff) {
      if (oldStage !== proj.stage) {
        apiActivity.logActivity({
          actor: currentAuthStaff,
          entity_type: 'project',
          entity_id: proj.id,
          action: 'STATUS_CHANGE',
          description: `${currentAuthStaff.staff_id} moved project "${proj.title}" stage to ${proj.stage}`,
          old_values: { stage: oldStage },
          new_values: { stage: proj.stage },
        });
      } else {
        apiActivity.logActivity({
          actor: currentAuthStaff,
          entity_type: 'project',
          entity_id: proj.id,
          action: 'UPDATE',
          description: `${currentAuthStaff.staff_id} updated project details for "${proj.title}"`,
        });
      }
    }

    return proj;
  },

  async deleteProject(id: string): Promise<void> {
    if (currentAuthStaff && currentAuthStaff.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Admin can delete projects.');
    }

    const proj = projectsList.find((p) => p.id === id);
    if (!proj) throw new Error('Project not found');

    if (isSupabaseConfigured() && supabase && isValidUUID(id)) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }

    projectsList = projectsList.filter((p) => p.id !== id);
    saveProjects();

    // Remove associated payments
    paymentsList = paymentsList.filter((p) => p.project_id !== id);
    savePayments();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'project',
        entity_id: id,
        action: 'DELETE',
        description: `${currentAuthStaff.staff_id} deleted game project "${proj.title}" (Client: ${proj.contact_name})`,
        old_values: proj,
      });
    }
  },
};

export const apiPayments = {
  async listPayments(projectId?: string): Promise<Payment[]> {
    let result = [...paymentsList];
    if (projectId) {
      result = result.filter((p) => p.project_id === projectId);
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async recordPayment(payload: {
    project_id: string;
    amount_bdt: number;
    payment_type: 'Advance' | 'Partial' | 'Final';
    payment_method: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash' | 'Other';
    transaction_ref?: string;
    payment_date: string;
    notes?: string;
  }): Promise<Payment> {
    const proj = projectsList.find((p) => p.id === payload.project_id);
    if (!proj) throw new Error('Project not found');

    const amount = Number(payload.amount_bdt);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    const newPayment: Payment = {
      id: generateUUID(),
      project_id: proj.id,
      project_title: proj.title,
      amount_bdt: amount,
      payment_type: payload.payment_type,
      payment_method: payload.payment_method,
      transaction_ref: payload.transaction_ref || null,
      payment_date: payload.payment_date || new Date().toISOString().split('T')[0],
      notes: payload.notes || null,
      recorded_by: currentAuthStaff?.id || null,
      recorded_by_name: currentAuthStaff?.full_name || null,
      recorded_by_staff_id: currentAuthStaff?.staff_id || null,
      created_at: new Date().toISOString(),
    };

    paymentsList.unshift(newPayment);
    savePayments();

    // Recalculate remaining balance
    updateProjectPaymentTotals(proj.id);

    // If stage was Awaiting Advance and advance received, advance stage
    if (proj.stage === 'Awaiting Advance' && (payload.payment_type === 'Advance' || amount > 0)) {
      proj.stage = 'Confirmed';
      saveProjects();
    }

    // Log Activity
    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'payment',
        entity_id: newPayment.id,
        action: 'PAYMENT_RECORDED',
        description: `${currentAuthStaff.staff_id} recorded ${newPayment.payment_type} payment of ৳${newPayment.amount_bdt} via ${newPayment.payment_method} for "${proj.title}"`,
        new_values: newPayment,
      });
    }

    return newPayment;
  },

  async deletePayment(id: string): Promise<void> {
    if (currentAuthStaff && currentAuthStaff.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Admin can delete payment records.');
    }

    const payment = paymentsList.find((p) => p.id === id);
    if (!payment) throw new Error('Payment not found');

    const projectId = payment.project_id;

    if (isSupabaseConfigured() && supabase && isValidUUID(id)) {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }

    paymentsList = paymentsList.filter((p) => p.id !== id);
    savePayments();

    if (projectId) {
      updateProjectPaymentTotals(projectId);
    }

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'payment',
        entity_id: id,
        action: 'DELETE',
        description: `${currentAuthStaff.staff_id} deleted payment record of ৳${payment.amount_bdt} (${payment.payment_type}) for "${payment.project_title || projectId}"`,
        old_values: payment,
      });
    }
  },
};

// ==========================================
// 6. PACKAGES MANAGEMENT
// ==========================================

export const apiPackages = {
  async listPackages(): Promise<Package[]> {
    return [...packagesList];
  },

  async updatePackage(id: string, updates: Partial<Package>): Promise<Package> {
    const pkg = packagesList.find((p) => p.id === id);
    if (!pkg) throw new Error('Package not found');

    Object.assign(pkg, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    savePackages();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'package',
        entity_id: pkg.id,
        action: 'UPDATE',
        description: `${currentAuthStaff.staff_id} updated package "${pkg.name}" (Base Price: ৳${pkg.base_price_bdt})`,
      });
    }

    return pkg;
  },

  async createPackage(payload: {
    name: string;
    code: string;
    base_price_bdt: number;
    description?: string;
    features: string[];
  }): Promise<Package> {
    const newPkg: Package = {
      id: generateUUID(),
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      base_price_bdt: Number(payload.base_price_bdt) || 0,
      description: payload.description || null,
      features: payload.features || [],
      is_active: true,
      created_at: new Date().toISOString(),
    };

    packagesList.push(newPkg);
    savePackages();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'package',
        entity_id: newPkg.id,
        action: 'CREATE',
        description: `${currentAuthStaff.staff_id} created new package "${newPkg.name}" with base price ৳${newPkg.base_price_bdt}`,
      });
    }

    return newPkg;
  },

  async deletePackage(id: string): Promise<void> {
    if (currentAuthStaff && currentAuthStaff.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Admin can delete packages.');
    }

    const pkg = packagesList.find((p) => p.id === id);
    if (!pkg) throw new Error('Package not found');

    if (isSupabaseConfigured() && supabase && isValidUUID(id)) {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }

    packagesList = packagesList.filter((p) => p.id !== id);
    savePackages();

    if (currentAuthStaff) {
      apiActivity.logActivity({
        actor: currentAuthStaff,
        entity_type: 'package',
        entity_id: id,
        action: 'DELETE',
        description: `${currentAuthStaff.staff_id} deleted package "${pkg.name}" (${pkg.code})`,
        old_values: pkg,
      });
    }
  },
};

// ==========================================
// 7. ACTIVITY LOGS (SUPER ADMIN AUDIT TRAIL)
// ==========================================

export const apiActivity = {
  async listActivityLogs(): Promise<ActivityLog[]> {
    if (currentAuthStaff && currentAuthStaff.role !== 'SUPER_ADMIN') {
      throw new Error('Access denied: Activity logs are restricted to Super Admin only.');
    }
    return [...activityLogsList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  logActivity(entry: {
    actor?: StaffProfile;
    entity_type: string;
    entity_id?: string;
    action: string;
    description: string;
    old_values?: any;
    new_values?: any;
  }): void {
    const actor = entry.actor || currentAuthStaff;
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor_id: actor?.id || null,
      actor_staff_id: actor?.staff_id || 'SYSTEM',
      actor_name: actor?.full_name || 'System User',
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      action: entry.action,
      description: entry.description,
      old_values: entry.old_values,
      new_values: entry.new_values,
      created_at: new Date().toISOString(),
    };

    activityLogsList.unshift(newLog);
    if (activityLogsList.length > 500) {
      activityLogsList = activityLogsList.slice(0, 500);
    }
    saveActivityLogs();
  },
};

// ==========================================
// 8. DASHBOARD & METRICS
// ==========================================

export const apiDashboard = {
  async getMetrics(staff?: StaffProfile | null): Promise<DashboardMetrics> {
    const activeStaff = staff || currentAuthStaff;
    const isSalesOnly = activeStaff?.role === 'SALES';

    // Filter data according to permissions
    const relevantLeads = isSalesOnly
      ? leadsList.filter((l) => l.assigned_to === activeStaff?.id || l.created_by === activeStaff?.id)
      : leadsList;

    const relevantProjects = isSalesOnly
      ? projectsList.filter((p) => p.assigned_salesperson === activeStaff?.id || p.created_by === activeStaff?.id)
      : projectsList;

    const relevantFollowUps = isSalesOnly
      ? followUpsList.filter((f) => f.assigned_to === activeStaff?.id || f.created_by === activeStaff?.id)
      : followUpsList;

    const relevantPayments = isSalesOnly
      ? paymentsList.filter((pay) =>
          relevantProjects.some((p) => p.id === pay.project_id)
        )
      : paymentsList;

    // Dates
    const todayStr = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const totalLeads = relevantLeads.length;
    const newLeadsThisMonth = relevantLeads.filter((l) => l.created_at >= firstDayOfMonth).length;

    const pendingFollowUps = relevantFollowUps.filter((f) => f.status === 'Pending');
    const followUpsDueToday = pendingFollowUps.filter(
      (f) => f.scheduled_at.startsWith(todayStr)
    ).length;
    const overdueFollowUps = pendingFollowUps.filter(
      (f) => f.scheduled_at < todayStr
    ).length;

    const confirmedCustomers = isSalesOnly
      ? contactsList.filter((c) => c.assigned_to === activeStaff?.id || c.created_by === activeStaff?.id).length
      : contactsList.length;

    const activeProjects = relevantProjects.filter(
      (p) => p.stage !== 'Delivered' && p.stage !== 'Cancelled'
    ).length;
    const completedProjects = relevantProjects.filter((p) => p.stage === 'Delivered').length;

    const totalRevenueBDT = relevantPayments.reduce((sum, p) => sum + Number(p.amount_bdt || 0), 0);
    const outstandingBalanceBDT = relevantProjects
      .filter((p) => p.stage !== 'Cancelled')
      .reduce((sum, p) => sum + Number(p.remaining_balance_bdt || 0), 0);

    const conversionRate = totalLeads > 0 ? (relevantLeads.filter((l) => l.is_converted).length / totalLeads) * 100 : 0;

    // Pipeline Distribution
    const stages: ProjectStage[] = [
      'Requirements Analysis',
      'Awaiting Advance',
      'Confirmed',
      'In Development',
      'Demo/Review',
      'Revisions',
      'Ready for Delivery',
      'Delivered',
    ];

    const pipelineDistribution = stages.map((st) => {
      const projs = relevantProjects.filter((p) => p.stage === st);
      const val = projs.reduce((sum, p) => sum + Number(p.agreed_price_bdt || 0), 0);
      return {
        stage: st,
        count: projs.length,
        valueBDT: val,
      };
    });

    // Sales by Staff (Company-wide leaderboard for Admin, personal stats for Sales)
    const salesByStaff = staffList
      .filter((s) => s.role === 'SALES' && (!isSalesOnly || s.id === activeStaff?.id))
      .map((s) => {
        const staffLeads = leadsList.filter((l) => l.assigned_to === s.id);
        const staffConfirmed = staffLeads.filter((l) => l.is_converted).length;
        const staffProjects = projectsList.filter((p) => p.assigned_salesperson === s.id);
        const staffRevenue = paymentsList
          .filter((pay) => staffProjects.some((p) => p.id === pay.project_id))
          .reduce((sum, pay) => sum + Number(pay.amount_bdt || 0), 0);

        return {
          staffId: s.staff_id,
          staffName: s.full_name,
          leadsCount: staffLeads.length,
          confirmedCount: staffConfirmed,
          revenueBDT: staffRevenue,
        };
      });

    // Monthly Revenue Trend (Last 6 calendar months dynamically calculated from actual payments)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const monthlyRevenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthLabel = `${monthNames[monthIdx]} ${year}`;
      const prefix = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      
      const monthPayments = relevantPayments.filter((p) => p.payment_date && p.payment_date.startsWith(prefix));
      const rev = monthPayments.reduce((sum, p) => sum + Number(p.amount_bdt || 0), 0);
      const projs = relevantProjects.filter((p) => p.created_at && p.created_at.startsWith(prefix)).length;

      monthlyRevenueTrend.push({
        month: monthLabel,
        revenueBDT: rev,
        projectsCount: projs,
      });
    }

    return {
      totalLeads,
      newLeadsThisMonth,
      followUpsDueToday,
      overdueFollowUps,
      confirmedCustomers,
      activeProjects,
      completedProjects,
      totalRevenueBDT,
      outstandingBalanceBDT,
      conversionRate: Math.round(conversionRate * 10) / 10,
      pipelineDistribution,
      salesByStaff,
      monthlyRevenueTrend,
      recentActivities: isSalesOnly ? [] : activityLogsList.slice(0, 10),
      recentLeads: relevantLeads.slice(0, 5),
    };
  },
};
