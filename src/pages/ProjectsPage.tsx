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
        return 'pill-sky';
      case 'Awaiting Advance':
        return 'pill-amber';
      case 'Confirmed':
        return 'pill-sky';
      case 'In Development':
        return 'pill-sky font-semibold';
      case 'Demo/Review':
        return 'pill-amber';
      case 'Revisions':
        return 'pill-amber';
      case 'Ready for Delivery':
        return 'pill-emerald';
      case 'Delivered':
        return 'pill-emerald font-semibold';
      case 'Cancelled':
        return 'pill-rose';
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
      <div className="apple-panel relative overflow-hidden p-6 sm:p-7">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full pill-sky text-[11px] font-medium tracking-wide">
              <Gamepad2 className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>Production Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
              Game Projects & Deliverables
            </h1>
            <p className="text-xs text-[#A3ADBA] max-w-xl">
              Track custom Roblox & Unity game builds from initial advance payment to final source code handoff.
            </p>
          </div>

          <button
            onClick={() => navigate('/leads')}
            className="apple-btn-primary min-h-[42px] px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-[#0A101D] stroke-[2.5]" />
            <span>Launch from Lead</span>
          </button>
        </div>

        {/* Financial KPI Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-inner p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3ADBA] block">Active Titles</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#F5F7FA]">{metrics.active}</span>
              <span className="text-[11px] text-[#A3ADBA]">of {metrics.total} total</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#7DD3FC]/20 bg-[#7DD3FC]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#BAE6FD] block">Contract Value</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#BAE6FD]">৳{metrics.totalAgreed.toLocaleString()}</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#34D399]/20 bg-[#34D399]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7F3D0] block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#34D399]" /> Total Collected
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#A7F3D0]">৳{metrics.totalPaid.toLocaleString()}</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#FB7185]/20 bg-[#FB7185]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FECDD3] block">Uncollected Balance</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#FECDD3]">৳{metrics.balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="apple-panel p-4 sm:p-5 space-y-4">
        {/* Quick Stage Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {stageTabs.map((tab) => {
            const isActive = stageFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStageFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'pill-sky font-semibold'
                    : 'apple-btn-secondary text-[#A3ADBA] hover:text-[#F5F7FA]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-3 relative">
            <Search className="w-4 h-4 text-[#A3ADBA] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by game title, client name, developer..."
              className="apple-input w-full pl-10 pr-3.5 py-2 text-xs placeholder:text-[#64748B]"
            />
          </div>

          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs cursor-pointer"
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
          <div className="p-16 text-center space-y-3 apple-panel">
            <div className="w-8 h-8 rounded-full border-2 border-[#7DD3FC]/20 border-t-[#7DD3FC] animate-spin mx-auto" />
            <p className="text-xs text-[#A3ADBA] font-mono">Synchronizing studio game projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 apple-panel text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl glass-inner text-[#7DD3FC] flex items-center justify-center mx-auto">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#F5F7FA]">No game projects found</h3>
              <p className="text-xs text-[#A3ADBA] max-w-sm mx-auto">
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
                className="glass-card p-6 space-y-5 group"
              >
                {/* Row 1: Title, Client, Stage Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3
                        onClick={() => navigate(`/projects/${proj.id}`)}
                        className="text-base font-semibold text-[#F5F7FA] hover:text-[#7DD3FC] transition cursor-pointer flex items-center gap-2"
                      >
                        {proj.title}
                        <ArrowUpRight className="w-4 h-4 text-[#64748B] group-hover:text-[#7DD3FC] transition" />
                      </h3>
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full pill-sky">
                        {proj.package_name_snapshot || 'Custom Spec'}
                      </span>
                    </div>
                    <p className="text-xs text-[#A3ADBA] flex flex-wrap items-center gap-2">
                      <span>Client: <strong className="text-[#F5F7FA]">{proj.contact_name}</strong></span>
                      <span className="text-white/20">•</span>
                      <span>{proj.contact_platform} @{proj.contact_handle}</span>
                      <span className="text-white/20">•</span>
                      <span className="text-[#7DD3FC] font-mono">Dev: {proj.assigned_developer || 'Unassigned'}</span>
                    </p>
                  </div>

                  {/* Stage selector */}
                  <div className="flex items-center gap-3">
                    <select
                      value={proj.stage}
                      onChange={(e) =>
                        handleStageChange(proj.id, e.target.value as ProjectStage)
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${getStageBadgeColor(
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
                <div className="p-4 rounded-2xl glass-inner space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-[#A3ADBA] uppercase font-mono block">Agreed Price</span>
                      <span className="font-semibold text-[#F5F7FA] font-mono tabular-nums text-sm mt-0.5 block">
                        ৳{proj.agreed_price_bdt.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#34D399] uppercase font-mono block">Paid ({percentPaid}%)</span>
                      <span className="font-semibold text-[#34D399] font-mono tabular-nums text-sm mt-0.5 block">
                        ৳{proj.total_paid_bdt.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#A3ADBA] uppercase font-mono block">Remaining Balance</span>
                      <span
                        className={`font-semibold font-mono tabular-nums text-sm mt-0.5 block ${
                          proj.remaining_balance_bdt > 0 ? 'text-[#FB7185]' : 'text-[#34D399]'
                        }`}
                      >
                        ৳{proj.remaining_balance_bdt.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#A3ADBA] uppercase font-mono block">Target Delivery</span>
                      <span className="font-medium text-[#F5F7FA] mt-0.5 block font-mono text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#7DD3FC]" />
                        {proj.target_delivery_date || 'TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentPaid >= 100
                          ? 'bg-[#34D399]'
                          : 'bg-[#7DD3FC]'
                      }`}
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                </div>

                {/* Row 3: Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                  <span className="text-[#64748B] font-mono text-[11px]">
                    Ordered {proj.order_date} • Sales: {proj.assigned_salesperson_id || 'Staff'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRecordingPaymentProject(proj)}
                      className="pill-emerald px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>

                    <button
                      onClick={() => navigate(`/projects/${proj.id}`)}
                      className="apple-btn-secondary px-4 py-1.5 font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Details & Files</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => setDeletingProject(proj)}
                        title="Delete Project (Admin Only)"
                        className="p-2 rounded-xl pill-rose transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#FB7185]" />
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
