import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Calendar,
  Sparkles,
  Phone,
  Flame,
  Zap,
  Snowflake,
  Trophy,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  Clock,
  MessageCircle,
  Trash2,
  TrendingUp,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { SocialPlatformIcon } from '@/components/icons/SocialIcons';
import { useAuth } from '@/context/AuthContext';
import { apiLeads, apiStaff } from '@/services/api';
import { Lead, Platform, LeadStatus, LeadPriority, StaffProfile } from '@/types';
import { CreateLeadModal } from '@/components/modals/CreateLeadModal';
import { ConvertLeadModal } from '@/components/modals/ConvertLeadModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';

export const LeadsPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadLeads();
    loadStaff();
  }, [user]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await apiLeads.listLeads({
        search: searchQuery,
        status: statusFilter,
        priority: priorityFilter,
        platform: platformFilter,
        assigned_to: staffFilter,
      });
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await apiStaff.listStaff();
      setStaffList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, priorityFilter, platformFilter, staffFilter]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await apiLeads.updateLead(leadId, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    }
  };

  // Quick stats computed from current leads list
  const stats = useMemo(() => {
    const total = leads.length;
    const hotCount = leads.filter((l) => l.priority === 'Hot').length;
    const pipelineBdt = leads.reduce((sum, l) => sum + (l.estimated_budget_bdt || 0), 0);
    const convertedCount = leads.filter((l) => l.is_converted).length;
    return { total, hotCount, pipelineBdt, convertedCount };
  }, [leads]);

  const getPriorityBadge = (p: LeadPriority) => {
    switch (p) {
      case 'Hot':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
            <Flame className="w-3 h-3 text-rose-400 animate-pulse" /> Hot
          </span>
        );
      case 'Warm':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <Zap className="w-3 h-3 text-amber-400" /> Warm
          </span>
        );
      case 'Cold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Snowflake className="w-3 h-3 text-blue-400" /> Cold
          </span>
        );
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    return <SocialPlatformIcon platform={platform} className="w-3.5 h-3.5" />;
  };

  const platformTabs: Array<{ id: string; label: string; platform?: Platform }> = [
    { id: 'ALL', label: 'All Channels' },
    { id: 'Instagram', label: 'Instagram', platform: 'Instagram' },
    { id: 'Facebook', label: 'Facebook', platform: 'Facebook' },
    { id: 'WhatsApp', label: 'WhatsApp', platform: 'WhatsApp' },
    { id: 'Other', label: 'Other', platform: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick KPI Strip */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C1527]/90 via-[#09101F]/80 to-[#0A162B]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#61C9F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#61C9F6]/10 border border-[#61C9F6]/25 text-[#61C9F6] text-[11px] font-semibold tracking-wide">
              <Sparkles className="w-3 h-3 text-[#61C9F6]" />
              <span>Studio Inquiries Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Leads & Inquiries Directory
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Real-time pipeline of prospective gaming clients across Instagram, Facebook, and WhatsApp.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingLead(null);
                setIsCreateOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-extrabold tracking-wide shadow-lg shadow-[#61C9F6]/25 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>Add Potential Customer</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Total Pipeline</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
              <span className="text-[11px] text-zinc-500">inquiries</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/[0.04] border border-rose-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80 block flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" /> Hot Inquiries
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-rose-300">{stats.hotCount}</span>
              <span className="text-[11px] text-rose-400/60">priority</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#61C9F6]/[0.08] border border-[#61C9F6]/20">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#61C9F6] block">Estimated Pipeline</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-sky-200">৳{stats.pipelineBdt.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block flex items-center gap-1">
              <Trophy className="w-3 h-3 text-emerald-400" /> Won Orders
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-300">{stats.convertedCount}</span>
              <span className="text-[11px] text-emerald-400/60">converted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with Glass Capsule Styling */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl space-y-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        {/* Platform quick toggle pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {platformTabs.map((tab) => {
            const isActive = platformFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPlatformFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#61C9F6] text-slate-950 font-bold shadow-md shadow-[#61C9F6]/30'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {tab.platform && <SocialPlatformIcon platform={tab.platform} className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Select Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, handle, phone..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#61C9F6] transition shadow-inner"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-[#61C9F6] transition cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Follow-up Scheduled">Follow-up Scheduled</option>
              <option value="Contact Later">Contact Later</option>
              <option value="Negotiating">Negotiating</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-[#61C9F6] transition cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="Hot">🔥 Hot</option>
              <option value="Warm">⚡ Warm</option>
              <option value="Cold">❄️ Cold</option>
            </select>
          </div>
        </div>

        {/* Salesperson filter for Super Admin */}
        {isSuperAdmin && staffList.length > 0 && (
          <div className="pt-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-zinc-400 text-[11px] font-mono uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#61C9F6]" />
              Staff:
            </span>
            <button
              onClick={() => setStaffFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition cursor-pointer ${
                staffFilter === 'ALL'
                  ? 'bg-[#61C9F6] text-slate-950 font-bold shadow-sm shadow-[#61C9F6]/40'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              All Staff
            </button>
            {staffList.map((st) => (
              <button
                key={st.id}
                onClick={() => setStaffFilter(st.id)}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition cursor-pointer ${
                  staffFilter === st.id
                    ? 'bg-[#61C9F6] text-slate-950 font-bold shadow-sm shadow-[#61C9F6]/40'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {st.staff_id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leads Table / Card Container */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#61C9F6]/20 border-t-[#61C9F6] animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Synchronizing studio leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#61C9F6]/10 text-[#61C9F6] flex items-center justify-center mx-auto border border-[#61C9F6]/20 shadow-[0_0_20px_rgba(97,201,246,0.15)]">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No inquiries found</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No inquiries match your current filter criteria. Try clearing search filters or add a new prospective lead.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-4 font-semibold">Customer</th>
                  <th className="py-4 px-4 font-semibold">Game Interest</th>
                  <th className="py-4 px-4 font-semibold">Budget (BDT)</th>
                  <th className="py-4 px-4 font-semibold">Priority</th>
                  <th className="py-4 px-4 font-semibold">Status</th>
                  <th className="py-4 px-4 font-semibold">Next Follow-Up</th>
                  <th className="py-4 px-4 font-semibold">Assigned</th>
                  <th className="py-4 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-white/[0.04] transition-colors group"
                  >
                    {/* Customer & Handle */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 shadow-sm shrink-0">
                          {getPlatformIcon(lead.platform)}
                        </div>
                        <div>
                          <p
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="font-bold text-white hover:text-[#61C9F6] transition cursor-pointer"
                          >
                            {lead.customer_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                            <span className="font-mono text-zinc-400">@{lead.handle}</span>
                            {lead.profile_url && (
                              <a
                                href={lead.profile_url}
                                target="_blank"
                                rel="noreferrer"
                                title={`Open ${lead.platform} profile`}
                                className="text-[#61C9F6] hover:text-sky-300 transition"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Game Type & Package */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-zinc-200">{lead.game_type}</p>
                      <p className="text-[11px] text-zinc-400">{lead.package_name || 'Custom Spec'}</p>
                    </td>

                    {/* Budget */}
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      ৳{lead.estimated_budget_bdt.toLocaleString()}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">{getPriorityBadge(lead.priority)}</td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      {lead.is_converted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Won / Ordered
                        </span>
                      ) : (
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value as LeadStatus)
                          }
                          className="px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-200 text-xs font-medium focus:outline-none focus:border-[#61C9F6] transition cursor-pointer"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Interested">Interested</option>
                          <option value="Follow-up Scheduled">Follow-up Scheduled</option>
                          <option value="Contact Later">Contact Later</option>
                          <option value="Negotiating">Negotiating</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Lost">Lost</option>
                        </select>
                      )}
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-3.5 px-4">
                      {lead.next_follow_up_at ? (
                        <div className="text-[11px]">
                          <p className="font-mono text-zinc-200 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#61C9F6]" />
                            {lead.next_follow_up_at.split('T')[0]}
                          </p>
                          <p className="text-zinc-400 truncate max-w-[130px]" title={lead.follow_up_reason || ''}>
                            {lead.follow_up_reason || 'Scheduled checkpoint'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-mono">—</span>
                      )}
                    </td>

                    {/* Assigned Salesperson */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-xl bg-[#61C9F6]/10 text-sky-200 font-mono text-[10px] font-bold border border-[#61C9F6]/25">
                        {lead.assigned_staff_id || 'Unassigned'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!lead.is_converted && (
                          <button
                            onClick={() => setConvertingLead(lead)}
                            title="Convert to Confirmed Customer"
                            className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-sm hover:shadow-emerald-500/20"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Convert</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setIsCreateOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/10 text-xs font-medium cursor-pointer transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="px-2.5 py-1 rounded-xl bg-[#61C9F6]/15 hover:bg-[#61C9F6]/25 text-[#61C9F6] border border-[#61C9F6]/30 text-xs font-semibold cursor-pointer transition shadow-sm hover:shadow-[#61C9F6]/20"
                        >
                          View
                        </button>

                        {isSuperAdmin && (
                          <button
                            onClick={() => setDeletingLead(lead)}
                            title="Delete Lead (Admin Only)"
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <CreateLeadModal
        isOpen={isCreateOpen}
        initialData={editingLead || undefined}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingLead(null);
        }}
        onSuccess={() => loadLeads()}
      />

      {/* Convert Lead to Customer Modal */}
      <ConvertLeadModal
        isOpen={Boolean(convertingLead)}
        lead={convertingLead}
        onClose={() => setConvertingLead(null)}
        onSuccess={(_res) => {
          loadLeads();
        }}
      />

      {/* Confirm Delete Lead Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingLead)}
        title="Delete Potential Customer Lead"
        itemName={deletingLead?.customer_name}
        message={`This will permanently delete the lead for ${deletingLead?.customer_name} (${deletingLead?.platform} @${deletingLead?.handle}) and all its scheduled follow-up reminders.`}
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!deletingLead) return;
          try {
            setDeleteLoading(true);
            await apiLeads.deleteLead(deletingLead.id);
            setDeletingLead(null);
            loadLeads();
          } catch (err: any) {
            alert(err?.message || 'Failed to delete lead');
          } finally {
            setDeleteLoading(false);
          }
        }}
        onClose={() => setDeletingLead(null)}
      />
    </div>
  );
};
