import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Gamepad2,
  Receipt,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  Plus,
  Link as LinkIcon,
  User,
  Sparkles,
  FileText,
  Trash2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiProjects, apiPayments } from '@/services/api';
import { Project, Payment, ProjectStage } from '@/types';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // New Link modal state
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Payment modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Delete modals
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProjectData(id);
    }
  }, [id]);

  const loadProjectData = async (projId: string) => {
    try {
      setLoading(true);
      const [proj, pays] = await Promise.all([
        apiProjects.getProject(projId),
        apiPayments.listPayments(projId),
      ]);
      setProject(proj);
      setPayments(pays);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStage: ProjectStage) => {
    if (!project) return;
    try {
      const updated = await apiProjects.updateProject(project.id, { stage: newStage });
      setProject(updated);
    } catch (err: any) {
      alert(err?.message || 'Failed to update stage');
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !linkTitle.trim() || !linkUrl.trim()) return;

    const newLinks = [...(project.reference_links || []), { label: linkTitle.trim(), url: linkUrl.trim() }];
    try {
      const updated = await apiProjects.updateProject(project.id, { reference_links: newLinks });
      setProject(updated);
      setIsAddLinkOpen(false);
      setLinkTitle('');
      setLinkUrl('');
    } catch (err: any) {
      alert(err?.message || 'Failed to add reference link');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3 rounded-3xl bg-[#0E0E18]/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
        <div className="w-10 h-10 rounded-full border-2 border-[#61C9F6]/20 border-t-[#61C9F6] animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Synchronizing project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-16 text-center space-y-4 rounded-3xl bg-[#0E0E18]/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
        <h3 className="text-base font-bold text-white">Project Not Found</h3>
        <button
          onClick={() => navigate('/projects')}
          className="px-5 py-2.5 bg-[#61C9F6] hover:brightness-110 rounded-2xl text-xs font-extrabold text-slate-950 transition cursor-pointer"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const STAGES: ProjectStage[] = [
    'Requirements Analysis',
    'Awaiting Advance',
    'Confirmed',
    'In Development',
    'Demo/Review',
    'Revisions',
    'Ready for Delivery',
    'Delivered',
  ];

  const currentStageIndex = STAGES.indexOf(project.stage);
  const percentPaid = project.agreed_price_bdt > 0 ? Math.min(100, Math.round((project.total_paid_bdt / project.agreed_price_bdt) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C1527]/90 via-[#09101F]/80 to-[#0A162B]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/projects')}
              className="p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{project.title}</h1>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#61C9F6]/15 text-sky-200 border border-[#61C9F6]/25">
                  {project.package_name_snapshot || 'Custom Spec'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Client: <strong className="text-white">{project.contact_name}</strong> ({project.contact_platform} @{project.contact_handle}) • Ordered {project.order_date}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Record Payment</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Production Stage Milestone Progress Bar */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#61C9F6]" /> Production Lifecycle & Milestones
          </h3>
          <select
            value={project.stage}
            onChange={(e) => handleStageChange(e.target.value as ProjectStage)}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-[#61C9F6] text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Milestone Steps Bar */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[700px] justify-between relative py-2">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/5 z-0 rounded-full" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#0284C7] to-[#61C9F6] z-0 transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(97,201,246,0.5)]"
              style={{
                width: `${currentStageIndex >= 0 ? (currentStageIndex / (STAGES.length - 1)) * 100 : 0}%`,
              }}
            />

            {STAGES.map((stg, idx) => {
              const isPast = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stg} className="flex flex-col items-center relative z-10 space-y-1.5">
                  <button
                    onClick={() => handleStageChange(stg)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[#61C9F6] text-slate-950 font-bold ring-4 ring-[#61C9F6]/30 shadow-[0_0_12px_rgba(97,201,246,0.6)]'
                        : isPast
                        ? 'bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-black/60 text-zinc-500 border border-white/10 hover:border-white/30'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </button>
                  <span
                    className={`text-[10px] font-medium text-center max-w-[85px] leading-tight ${
                      isCurrent ? 'text-[#61C9F6] font-bold' : isPast ? 'text-zinc-200' : 'text-zinc-500'
                    }`}
                  >
                    {stg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Financials & Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Financials & Payments History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Balance Summary */}
          <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Financial Accounting (৳ BDT)
              </h3>
              <span className="text-xs font-mono text-zinc-400">
                {percentPaid}% Cleared
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-zinc-400 uppercase font-mono">Agreed Price</p>
                <p className="text-base font-bold text-white font-mono mt-1">
                  ৳{project.agreed_price_bdt.toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15">
                <p className="text-[10px] text-emerald-400/80 uppercase font-mono">Total Paid</p>
                <p className="text-base font-bold text-emerald-400 font-mono mt-1">
                  ৳{project.total_paid_bdt.toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/15">
                <p className="text-[10px] text-zinc-400 uppercase font-mono">Remaining Balance</p>
                <p
                  className={`text-base font-bold font-mono mt-1 ${
                    project.remaining_balance_bdt > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  ৳{project.remaining_balance_bdt.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress line */}
            <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentPaid >= 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-[#0284C7] via-[#38BDF8] to-[#61C9F6]'
                }`}
                style={{ width: `${percentPaid}%` }}
              />
            </div>
          </div>

          {/* Payments Ledger Table */}
          <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#61C9F6]" /> Individual Payment Records
              </h3>
              <span className="text-xs text-zinc-400 font-mono">
                {payments.length} receipt{payments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono">
                No payment transactions recorded yet. Click "Record Payment" to log an advance or milestone installment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400 font-mono uppercase text-[10px]">
                      <th className="py-3 px-3 font-semibold">Date</th>
                      <th className="py-3 px-3 font-semibold">Type</th>
                      <th className="py-3 px-3 font-semibold">Method</th>
                      <th className="py-3 px-3 font-semibold">Amount (BDT)</th>
                      <th className="py-3 px-3 font-semibold">Trx Reference</th>
                      <th className="py-3 px-3 font-semibold">Staff</th>
                      {isSuperAdmin && <th className="py-3 px-3 text-right font-semibold">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-white/[0.03] transition">
                        <td className="py-3 px-3 font-mono text-zinc-300">{pay.payment_date}</td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#61C9F6]/15 text-sky-200 border border-[#61C9F6]/25 font-mono">
                            {pay.payment_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-200">{pay.payment_method}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          ৳{pay.amount_bdt.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                          {pay.transaction_ref || '—'}
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                          {pay.recorded_by_staff_id || 'Staff'}
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setDeletingPayment(pay)}
                              title="Delete Payment (Admin Only)"
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Details, Reference Links & Notes */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4 text-xs">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <h3 className="text-sm font-bold text-white">Project Meta & Delivery</h3>

            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400">Assigned Developer</span>
                <span className="font-semibold text-white">{project.assigned_developer || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400">Target Delivery</span>
                <span className="font-mono text-zinc-200 font-semibold">{project.target_delivery_date || 'TBD'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400">Sales Representative</span>
                <span className="font-mono text-[#61C9F6] font-semibold">{project.assigned_salesperson_id || 'Staff'}</span>
              </div>
            </div>

            {project.description && (
              <div className="pt-2">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase font-mono block mb-1">
                  Plot & Game Overview
                </span>
                <p className="text-zinc-300 leading-relaxed text-xs">{project.description}</p>
              </div>
            )}

            {project.custom_requirements && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase font-mono block mb-1">
                  Custom Requirements & Assets
                </span>
                <p className="text-zinc-300 leading-relaxed text-xs">{project.custom_requirements}</p>
              </div>
            )}
          </div>

          {/* Reference Links & Deliverables */}
          <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#61C9F6]" /> Reference Links & Files
              </h3>
              <button
                onClick={() => setIsAddLinkOpen(!isAddLinkOpen)}
                className="text-xs text-[#61C9F6] hover:text-sky-300 font-bold"
              >
                + Add Link
              </button>
            </div>

            {isAddLinkOpen && (
              <form onSubmit={handleAddLink} className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Link Title (e.g. Google Drive Assets)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#61C9F6]"
                />
                <input
                  type="url"
                  required
                  placeholder="URL (https://...)"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#61C9F6]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddLinkOpen(false)}
                    className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 rounded-xl bg-[#61C9F6] hover:brightness-110 text-slate-950 text-xs font-extrabold shadow-md shadow-[#61C9F6]/30"
                  >
                    Save Link
                  </button>
                </div>
              </form>
            )}

            {project.reference_links.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-2 font-mono">
                No reference links added yet.
              </p>
            ) : (
              <div className="space-y-2">
                {project.reference_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#61C9F6]/40 transition flex items-center justify-between text-xs group"
                  >
                    <span className="text-zinc-200 font-semibold group-hover:text-[#61C9F6] transition">
                      {link.label}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#61C9F6] transition" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentOpen}
        project={project}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => loadProjectData(project.id)}
      />

      {/* Confirm Delete Project Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Delete Game Project"
        itemName={project?.title}
        message={`Are you sure you want to permanently delete this project for ${project?.contact_name}? All associated payments will also be permanently deleted.`}
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!project) return;
          try {
            setDeleteLoading(true);
            await apiProjects.deleteProject(project.id);
            setIsDeleteOpen(false);
            navigate('/projects');
          } catch (err: any) {
            alert(err?.message || 'Failed to delete project');
          } finally {
            setDeleteLoading(false);
          }
        }}
        onClose={() => setIsDeleteOpen(false)}
      />

      {/* Confirm Delete Payment Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingPayment)}
        title="Delete Payment Transaction"
        itemName={deletingPayment ? `৳${deletingPayment.amount_bdt.toLocaleString()} (${deletingPayment.payment_type})` : ''}
        message="Are you sure you want to delete this payment record? The project total paid amount and remaining balance will be automatically recalculated."
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!deletingPayment || !project) return;
          try {
            setDeleteLoading(true);
            await apiPayments.deletePayment(deletingPayment.id);
            setDeletingPayment(null);
            loadProjectData(project.id);
          } catch (err: any) {
            alert(err?.message || 'Failed to delete payment');
          } finally {
            setDeleteLoading(false);
          }
        }}
        onClose={() => setDeletingPayment(null)}
      />
    </div>
  );
};
