import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Plus,
  ArrowRight,
  User,
  ChevronRight,
  Filter,
  Trash2,
  Sparkles,
  BellRing,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFollowUps } from '@/services/api';
import { FollowUp } from '@/types';
import { CompleteFollowUpModal } from '@/components/modals/CompleteFollowUpModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';

export const FollowUpsPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [activeTab, setActiveTab] = useState<'TODAY' | 'TOMORROW' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED' | 'ALL'>('TODAY');
  const [loading, setLoading] = useState(true);

  // Complete / Reschedule Modal
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
  const [deletingFollowUp, setDeletingFollowUp] = useState<FollowUp | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadFollowUps();
  }, [user]);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const data = await apiFollowUps.listFollowUps();
      setFollowUps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const pending = followUps.filter((f) => f.status === 'Pending');
  const overdueList = pending.filter((f) => f.scheduled_at < todayStr);
  const todayList = pending.filter((f) => f.scheduled_at.startsWith(todayStr));
  const tomorrowList = pending.filter((f) => f.scheduled_at.startsWith(tomorrowStr));
  const upcomingList = pending.filter((f) => f.scheduled_at > tomorrowStr);
  const completedList = followUps.filter((f) => f.status === 'Completed');

  const getFilteredList = () => {
    switch (activeTab) {
      case 'OVERDUE':
        return overdueList;
      case 'TODAY':
        return todayList;
      case 'TOMORROW':
        return tomorrowList;
      case 'UPCOMING':
        return upcomingList;
      case 'COMPLETED':
        return completedList;
      case 'ALL':
      default:
        return followUps;
    }
  };

  const filteredList = getFilteredList();

  return (
    <div className="space-y-6">
      {/* Top Banner & Reminders Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12121E]/90 via-[#0E0E18]/80 to-[#161228]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold tracking-wide">
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Studio Communications Radar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Client Follow-up Schedules
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Strictly monitor callbacks, quote inquiries, demo previews, and project delivery checkpoints.
            </p>
          </div>

          <button
            onClick={() => navigate('/leads')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-extrabold tracking-wide shadow-lg shadow-[#61C9F6]/25 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Schedule from Leads</span>
          </button>
        </div>

        {/* Status Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-[#61C9F6]/[0.08] border border-[#61C9F6]/20">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#61C9F6] block flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#61C9F6]" /> Due Today
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-sky-200">{todayList.length}</span>
              <span className="text-[11px] text-sky-300/60">reminders</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/[0.04] border border-rose-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80 block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> Overdue Attention
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-rose-300">{overdueList.length}</span>
              <span className="text-[11px] text-rose-400/60">urgent</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Upcoming Pipeline</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-white">{tomorrowList.length + upcomingList.length}</span>
              <span className="text-[11px] text-zinc-500">scheduled</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-300">{completedList.length}</span>
              <span className="text-[11px] text-emerald-400/60">resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Filter Pills */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-3 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'TODAY'
                ? 'bg-[#61C9F6] text-slate-950 font-bold shadow-md shadow-[#61C9F6]/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Due Today</span>
            {todayList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/20 text-slate-950 font-mono font-bold">
                {todayList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('OVERDUE')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'OVERDUE'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-rose-300 border border-white/5'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Overdue</span>
            {overdueList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono font-bold border border-rose-500/40">
                {overdueList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('TOMORROW')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'TOMORROW'
                ? 'bg-[#61C9F6] text-slate-950 font-bold shadow-md shadow-[#61C9F6]/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5'
            }`}
          >
            <span>Tomorrow</span>
            {tomorrowList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-zinc-300 font-mono">
                {tomorrowList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'UPCOMING'
                ? 'bg-[#61C9F6] text-slate-950 font-bold shadow-md shadow-[#61C9F6]/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5'
            }`}
          >
            <span>Upcoming Days</span>
            {upcomingList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-zinc-300 font-mono">
                {upcomingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'COMPLETED'
                ? 'bg-[#61C9F6] text-slate-950 font-bold shadow-md shadow-[#61C9F6]/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-zinc-300 font-mono">
              {completedList.length}
            </span>
          </button>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-16 text-center space-y-3 rounded-3xl bg-[#0E0E18]/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
            <div className="w-10 h-10 rounded-full border-2 border-[#61C9F6]/20 border-t-[#61C9F6] animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Synchronizing scheduled checkpoints...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[#0E0E18]/80 border border-white/10 text-center space-y-4 shadow-2xl backdrop-blur-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#61C9F6]/10 text-[#61C9F6] flex items-center justify-center mx-auto border border-[#61C9F6]/20 shadow-[0_0_20px_rgba(97,201,246,0.15)]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No reminders in this queue</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {activeTab === 'OVERDUE'
                  ? 'All client communications are completely up to date! Outstanding work.'
                  : 'No scheduled follow-up alerts in this timeframe.'}
              </p>
            </div>
          </div>
        ) : (
          filteredList.map((fu) => {
            const isOverdue = fu.status === 'Pending' && fu.scheduled_at < todayStr;
            const isToday = fu.status === 'Pending' && fu.scheduled_at.startsWith(todayStr);

            return (
              <div
                key={fu.id}
                className={`relative rounded-3xl border p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-2xl ${
                  isOverdue
                    ? 'bg-rose-500/[0.06] border-rose-500/30 hover:border-rose-400/50'
                    : isToday
                    ? 'bg-[#61C9F6]/[0.06] border-[#61C9F6]/30 hover:border-[#61C9F6]/50'
                    : 'bg-[#0E0E18]/80 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        isOverdue
                          ? 'text-rose-300'
                          : isToday
                          ? 'text-[#61C9F6]'
                          : 'text-white'
                      }`}
                    >
                      {fu.customer_name}
                    </span>

                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/10">
                      {fu.assigned_staff_id || 'Staff'}
                    </span>

                    {isOverdue && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-mono shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                        <AlertTriangle className="w-3 h-3 text-rose-400" /> Overdue
                      </span>
                    )}

                    {isToday && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#61C9F6]/20 text-sky-200 border border-[#61C9F6]/30 flex items-center gap-1 font-mono shadow-[0_0_10px_rgba(97,201,246,0.2)]">
                        <Clock className="w-3 h-3 text-[#61C9F6]" /> Due Today
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-200 font-medium">{fu.reason}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#61C9F6]" />
                      {new Date(fu.scheduled_at).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {fu.result_notes && (
                      <span className="text-zinc-400 truncate max-w-md italic">
                        Outcome: "{fu.result_notes}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {fu.lead_id && (
                    <button
                      onClick={() => navigate(`/leads/${fu.lead_id}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                    >
                      <span>Lead Profile</span>
                      <ChevronRight className="w-3 h-3 text-zinc-400" />
                    </button>
                  )}

                  {fu.status === 'Pending' && (
                    <button
                      onClick={() => setCompletingFollowUp(fu)}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-bold shadow-md shadow-[#61C9F6]/30 cursor-pointer transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                      <span>Complete & Log</span>
                    </button>
                  )}

                  {isSuperAdmin && (
                    <button
                      onClick={() => setDeletingFollowUp(fu)}
                      title="Delete Reminder (Admin Only)"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completion Modal */}
      <CompleteFollowUpModal
        isOpen={Boolean(completingFollowUp)}
        followUp={completingFollowUp}
        onClose={() => setCompletingFollowUp(null)}
        onSuccess={() => loadFollowUps()}
      />

      {/* Confirm Delete Follow-Up Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingFollowUp)}
        title="Delete Follow-up Reminder"
        itemName={deletingFollowUp?.customer_name}
        message={`Are you sure you want to permanently delete this follow-up reminder ("${deletingFollowUp?.reason}") for ${deletingFollowUp?.customer_name}?`}
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!deletingFollowUp) return;
          try {
            setDeleteLoading(true);
            await apiFollowUps.deleteFollowUp(deletingFollowUp.id);
            setDeletingFollowUp(null);
            loadFollowUps();
          } catch (err: any) {
            alert(err?.message || 'Failed to delete reminder');
          } finally {
            setDeleteLoading(false);
          }
        }}
        onClose={() => setDeletingFollowUp(null)}
      />
    </div>
  );
};
