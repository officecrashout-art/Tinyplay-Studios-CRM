import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  DollarSign,
  Gamepad2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Plus,
  Receipt,
  User,
  Trash2,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiProjects } from '@/services/api';
import { Project, ProjectStage } from '@/types';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';

export const ProjectsPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment & Delete Modals
  const [recordingPaymentProject, setRecordingPaymentProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await apiProjects.listProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (projectId: string, newStage: ProjectStage) => {
    try {
      await apiProjects.updateProject(projectId, { stage: newStage });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, stage: newStage } : p))
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update project stage');
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (stageFilter !== 'ALL' && p.stage !== stageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.contact_name.toLowerCase().includes(q) ||
        p.contact_handle.toLowerCase().includes(q) ||
        (p.assigned_developer && p.assigned_developer.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Project Metrics
  const metrics = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.stage !== 'Delivered' && p.stage !== 'Cancelled').length;
    const totalAgreed = projects.reduce((s, p) => s + (p.agreed_price_bdt || 0), 0);
    const totalPaid = projects.reduce((s, p) => s + (p.total_paid_bdt || 0), 0);
    const balance = projects.reduce((s, p) => s + (p.remaining_balance_bdt || 0), 0);
    return { total, active, totalAgreed, totalPaid, balance };
  }, [projects]);

  const getStageBadgeColor = (stage: ProjectStage) => {
    switch (stage) {
      case 'Requirements Analysis':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Awaiting Advance':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Confirmed':
        return 'bg-[#61C9F6]/15 text-[#61C9F6] border-[#61C9F6]/30';
      case 'In Development':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'Demo/Review':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Revisions':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'Ready for Delivery':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Delivered':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Cancelled':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
    }
  };

  const stageTabs: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Projects' },
    { id: 'In Development', label: 'In Dev' },
    { id: 'Awaiting Advance', label: 'Advance Due' },
    { id: 'Demo/Review', label: 'Review' },
    { id: 'Ready for Delivery', label: 'Ready' },
    { id: 'Delivered', label: 'Delivered' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Financial Strip */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C1527]/90 via-[#09101F]/80 to-[#0A162B]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#61C9F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#61C9F6]/10 border border-[#61C9F6]/25 text-[#61C9F6] text-[11px] font-semibold tracking-wide">
              <Gamepad2 className="w-3.5 h-3.5 text-[#61C9F6]" />
              <span>Production Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Game Projects & Deliverables
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Track custom Roblox & Unity game builds from initial advance payment to final source code handoff.
            </p>
          </div>

          <button
            onClick={() => navigate('/leads')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-extrabold tracking-wide shadow-lg shadow-[#61C9F6]/25 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Launch from Lead</span>
          </button>
        </div>

        {/* Financial KPI Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Active Titles</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-white">{metrics.active}</span>
              <span className="text-[11px] text-zinc-500">of {metrics.total} total</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#61C9F6]/[0.08] border border-[#61C9F6]/20">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#61C9F6] block">Contract Value</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-sky-200">৳{metrics.totalAgreed.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Total Collected
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-300">৳{metrics.totalPaid.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/[0.04] border border-rose-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80 block">Uncollected Balance</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-rose-300">৳{metrics.balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl space-y-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        {/* Quick Stage Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {stageTabs.map((tab) => {
            const isActive = stageFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStageFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#61C9F6] text-slate-950 font-bold shadow-md shadow-[#61C9F6]/30'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-3 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by game title, client name, developer..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#61C9F6] transition shadow-inner"
            />
          </div>

          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-[#61C9F6] transition cursor-pointer"
            >
              <option value="ALL">All Production Stages</option>
              <option value="Requirements Analysis">Requirements Analysis</option>
              <option value="Awaiting Advance">Awaiting Advance</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Development">In Development</option>
              <option value="Demo/Review">Demo/Review</option>
              <option value="Revisions">Revisions</option>
              <option value="Ready for Delivery">Ready for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center space-y-3 rounded-3xl bg-[#0E0E18]/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
            <div className="w-10 h-10 rounded-full border-2 border-[#61C9F6]/20 border-t-[#61C9F6] animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Synchronizing studio game projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[#0E0E18]/80 border border-white/10 text-center space-y-4 shadow-2xl backdrop-blur-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#61C9F6]/10 text-[#61C9F6] flex items-center justify-center mx-auto border border-[#61C9F6]/20 shadow-[0_0_20px_rgba(97,201,246,0.15)]">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No game projects found</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No active builds match your filter criteria. Convert a prospective lead to kickstart production.
              </p>
            </div>
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const percentPaid = proj.agreed_price_bdt > 0 ? Math.min(100, Math.round((proj.total_paid_bdt / proj.agreed_price_bdt) * 100)) : 0;
            return (
              <div
                key={proj.id}
                className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl hover:border-[#61C9F6]/40 transition-all space-y-5 group"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                {/* Row 1: Title, Client, Stage Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3
                        onClick={() => navigate(`/projects/${proj.id}`)}
                        className="text-lg font-bold text-white hover:text-[#61C9F6] transition cursor-pointer flex items-center gap-2"
                      >
                        {proj.title}
                        <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-[#61C9F6] transition opacity-0 group-hover:opacity-100" />
                      </h3>
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#61C9F6]/15 text-sky-200 border border-[#61C9F6]/25">
                        {proj.package_name_snapshot || 'Custom Spec'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                      <span>Client: <strong className="text-zinc-200">{proj.contact_name}</strong></span>
                      <span className="text-zinc-600">•</span>
                      <span>{proj.contact_platform} @{proj.contact_handle}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[#61C9F6] font-mono">Dev: {proj.assigned_developer || 'Unassigned'}</span>
                    </p>
                  </div>

                  {/* Stage selector */}
                  <div className="flex items-center gap-3">
                    <select
                      value={proj.stage}
                      onChange={(e) =>
                        handleStageChange(proj.id, e.target.value as ProjectStage)
                      }
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#61C9F6] transition cursor-pointer shadow-sm ${getStageBadgeColor(
                        proj.stage
                      )}`}
                    >
                      <option value="Requirements Analysis">Requirements Analysis</option>
                      <option value="Awaiting Advance">Awaiting Advance</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="In Development">In Development</option>
                      <option value="Demo/Review">Demo/Review</option>
                      <option value="Revisions">Revisions</option>
                      <option value="Ready for Delivery">Ready for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Financial Stats Bar & Progress Line */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">Agreed Price</span>
                      <span className="font-bold text-white font-mono text-sm mt-0.5 block">
                        ৳{proj.agreed_price_bdt.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-400/80 uppercase font-mono block">Paid ({percentPaid}%)</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm mt-0.5 block">
                        ৳{proj.total_paid_bdt.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">Remaining Balance</span>
                      <span
                        className={`font-bold font-mono text-sm mt-0.5 block ${
                          proj.remaining_balance_bdt > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        ৳{proj.remaining_balance_bdt.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">Target Delivery</span>
                      <span className="font-semibold text-zinc-200 mt-0.5 block font-mono text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#61C9F6]" />
                        {proj.target_delivery_date || 'TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentPaid >= 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                          : 'bg-gradient-to-r from-[#0284C7] via-[#38BDF8] to-[#61C9F6] shadow-[0_0_10px_rgba(97,201,246,0.4)]'
                      }`}
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                </div>

                {/* Row 3: Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Ordered {proj.order_date} • Sales: {proj.assigned_salesperson_id || 'Staff'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRecordingPaymentProject(proj)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:shadow-emerald-500/20"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>

                    <button
                      onClick={() => navigate(`/projects/${proj.id}`)}
                      className="px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#61C9F6] border border-white/10 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Details & Files</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => setDeletingProject(proj)}
                        title="Delete Project (Admin Only)"
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      <RecordPaymentModal
        isOpen={Boolean(recordingPaymentProject)}
        project={recordingPaymentProject}
        onClose={() => setRecordingPaymentProject(null)}
        onSuccess={() => loadProjects()}
      />

      {/* Confirm Delete Project Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingProject)}
        title="Delete Game Project"
        itemName={deletingProject?.title}
        message={`Are you sure you want to permanently delete project "${deletingProject?.title}" for client ${deletingProject?.contact_name}? All associated payment records will also be removed.`}
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!deletingProject) return;
          try {
            setDeleteLoading(true);
            await apiProjects.deleteProject(deletingProject.id);
            setDeletingProject(null);
            loadProjects();
          } catch (err: any) {
            alert(err?.message || 'Failed to delete project');
          } finally {
            setDeleteLoading(false);
          }
        }}
        onClose={() => setDeletingProject(null)}
      />
    </div>
  );
};
