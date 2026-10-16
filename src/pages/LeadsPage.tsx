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
          <span className="pill-rose inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase">
            <Flame className="w-3 h-3 text-[#FB7185]" /> Hot
          </span>
        );
      case 'Warm':
        return (
          <span className="pill-amber inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase">
            <Zap className="w-3 h-3 text-[#FBBF24]" /> Warm
          </span>
        );
      case 'Cold':
        return (
          <span className="pill-sky inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase">
            <Snowflake className="w-3 h-3 text-[#7DD3FC]" /> Cold
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
      <div className="apple-panel relative overflow-hidden p-6 sm:p-7">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full pill-sky text-[11px] font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>Studio Inquiries Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
              Leads & Inquiries Directory
            </h1>
            <p className="text-xs text-[#A3ADBA] max-w-xl">
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
              className="apple-btn-primary min-h-[42px] px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#0A101D] stroke-[2.5]" />
              <span>Add Potential Customer</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-inner p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3ADBA] block">Total Pipeline</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#F5F7FA]">{stats.total}</span>
              <span className="text-[11px] text-[#A3ADBA]">inquiries</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#FB7185]/20 bg-[#FB7185]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FECDD3] block flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#FB7185]" /> Hot Inquiries
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#FECDD3]">{stats.hotCount}</span>
              <span className="text-[11px] text-[#FB7185]/70">priority</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#7DD3FC]/20 bg-[#7DD3FC]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#BAE6FD] block">Estimated Pipeline</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#BAE6FD]">৳{stats.pipelineBdt.toLocaleString()}</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#34D399]/20 bg-[#34D399]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7F3D0] block flex items-center gap-1">
              <Trophy className="w-3 h-3 text-[#34D399]" /> Won Orders
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#A7F3D0]">{stats.convertedCount}</span>
              <span className="text-[11px] text-[#34D399]/70">converted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with Glass Capsule Styling */}
      <div className="apple-panel p-4 sm:p-5 space-y-4">
        {/* Platform quick toggle pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {platformTabs.map((tab) => {
            const isActive = platformFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPlatformFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'pill-sky font-semibold'
                    : 'apple-btn-secondary text-[#A3ADBA] hover:text-[#F5F7FA]'
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
            <Search className="w-4 h-4 text-[#A3ADBA] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, handle, phone..."
              className="apple-input w-full pl-10 pr-3.5 py-2 text-xs placeholder:text-[#64748B]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs cursor-pointer"
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
              className="apple-input w-full px-3 py-2 text-xs cursor-pointer"
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
          <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[#A3ADBA] text-[11px] font-mono uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#7DD3FC]" />
              Staff:
            </span>
            <button
              onClick={() => setStaffFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition cursor-pointer ${
                staffFilter === 'ALL'
                  ? 'pill-sky font-bold'
                  : 'apple-btn-secondary text-[#A3ADBA] hover:text-[#F5F7FA]'
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
                    ? 'pill-sky font-bold'
                    : 'apple-btn-secondary text-[#A3ADBA] hover:text-[#F5F7FA]'
                }`}
              >
                {st.staff_id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leads Table / Card Container */}
      <div className="apple-panel overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#7DD3FC]/20 border-t-[#7DD3FC] animate-spin mx-auto" />
            <p className="text-xs text-[#A3ADBA] font-mono">Synchronizing studio leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl glass-inner text-[#7DD3FC] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#F5F7FA]">No inquiries found</h3>
              <p className="text-xs text-[#A3ADBA] max-w-sm mx-auto">
                No inquiries match your current filter criteria. Try clearing search filters or add a new prospective lead.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="apple-table w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#A3ADBA] font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Game Interest</th>
                  <th className="py-3.5 px-4 font-semibold">Budget (BDT)</th>
                  <th className="py-3.5 px-4 font-semibold">Priority</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Next Follow-Up</th>
                  <th className="py-3.5 px-4 font-semibold">Assigned</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-white/[0.035] transition-colors group"
                  >
                    {/* Customer & Handle */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl glass-inner shrink-0">
                          {getPlatformIcon(lead.platform)}
                        </div>
                        <div>
                          <p
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="font-semibold text-[#F5F7FA] hover:text-[#7DD3FC] transition cursor-pointer"
                          >
                            {lead.customer_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#A3ADBA] mt-0.5">
                            <span className="font-mono text-[#A3ADBA]">@{lead.handle}</span>
                            {lead.profile_url && (
                              <a
                                href={lead.profile_url}
                                target="_blank"
                                rel="noreferrer"
                                title={`Open ${lead.platform} profile`}
                                className="text-[#7DD3FC] hover:text-[#BAE6FD] transition"
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
                      <p className="font-medium text-[#F5F7FA]">{lead.game_type}</p>
                      <p className="text-[11px] text-[#A3ADBA]">{lead.package_name || 'Custom Spec'}</p>
                    </td>

                    {/* Budget */}
                    <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-[#F5F7FA]">
                      ৳{lead.estimated_budget_bdt.toLocaleString()}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">{getPriorityBadge(lead.priority)}</td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      {lead.is_converted ? (
                        <span className="pill-emerald inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider font-mono">
                          <CheckCircle2 className="w-3 h-3 text-[#34D399]" /> Won / Ordered
                        </span>
                      ) : (
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value as LeadStatus)
                          }
                          className="apple-input px-2.5 py-1 text-xs font-medium cursor-pointer"
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
                          <p className="font-mono tabular-nums text-[#F5F7FA] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#7DD3FC]" />
                            {lead.next_follow_up_at.split('T')[0]}
                          </p>
                          <p className="text-[#A3ADBA] truncate max-w-[130px]" title={lead.follow_up_reason || ''}>
                            {lead.follow_up_reason || 'Scheduled checkpoint'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[#64748B] text-[11px] font-mono">—</span>
                      )}
                    </td>

                    {/* Assigned Salesperson */}
                    <td className="py-3.5 px-4">
                      <span className="pill-sky px-2.5 py-1 rounded-xl font-mono text-[10px] font-semibold">
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
                            className="pill-emerald px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Trophy className="w-3.5 h-3.5 text-[#FBBF24]" />
                            <span className="hidden sm:inline">Convert</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setIsCreateOpen(true);
                          }}
                          className="apple-btn-secondary px-2.5 py-1 text-xs cursor-pointer"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="pill-sky px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          View
                        </button>

                        {isSuperAdmin && (
                          <button
                            onClick={() => setDeletingLead(lead)}
                            title="Delete Lead (Admin Only)"
                            className="p-1.5 rounded-xl pill-rose text-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#FB7185]" />
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
