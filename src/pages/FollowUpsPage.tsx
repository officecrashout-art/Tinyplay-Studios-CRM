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
      <div className="apple-panel relative overflow-hidden p-6 sm:p-7">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full pill-amber text-[11px] font-medium tracking-wide">
              <BellRing className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Studio Communications Radar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
              Client Follow-up Schedules
            </h1>
            <p className="text-xs text-[#A3ADBA] max-w-xl">
              Strictly monitor callbacks, quote inquiries, demo previews, and project delivery checkpoints.
            </p>
          </div>

          <button
            onClick={() => navigate('/leads')}
            className="apple-btn-primary min-h-[42px] px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-[#0A101D] stroke-[2.5]" />
            <span>Schedule from Leads</span>
          </button>
        </div>

        {/* Status Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-inner p-3.5 border-[#7DD3FC]/20 bg-[#7DD3FC]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#BAE6FD] block flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#7DD3FC]" /> Due Today
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#BAE6FD]">{todayList.length}</span>
              <span className="text-[11px] text-[#7DD3FC]/70">reminders</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#FB7185]/20 bg-[#FB7185]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FECDD3] block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-[#FB7185]" /> Overdue Attention
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#FECDD3]">{overdueList.length}</span>
              <span className="text-[11px] text-[#FB7185]/70">urgent</span>
            </div>
          </div>

          <div className="glass-inner p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3ADBA] block">Upcoming Pipeline</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#F5F7FA]">{tomorrowList.length + upcomingList.length}</span>
              <span className="text-[11px] text-[#A3ADBA]">scheduled</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#34D399]/20 bg-[#34D399]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7F3D0] block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#34D399]" /> Completed
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#A7F3D0]">{completedList.length}</span>
              <span className="text-[11px] text-[#34D399]/70">resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Filter Pills */}
      <div className="apple-panel p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-4 py-2 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'TODAY'
                ? 'pill-sky font-semibold'
                : 'apple-btn-secondary text-[#A3ADBA] hover:text-[#F5F7FA]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Due Today</span>
            {todayList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#7DD3FC]/20 text-[#BAE6FD] font-mono font-semibold">
                {todayList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('OVERDUE')}
            className={`px-4 py-2 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'OVERDUE'
                ? 'pill-rose font-semibold'
                : 'apple-btn-secondary text-[#A3ADBA] hover:text-[#FB7185]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Overdue</span>
            {overdueList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FB7185]/20 text-[#FECDD3] font-mono font-semibold">
                {overdueList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('TOMORROW')}
            className={`px-4 py-2 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'TOMORROW'
                ? 'pill-sky font-semibold'
                : 'apple-btn-secondary text-[#A3ADBA] hover:text-[#F5F7FA]'
            }`}
          >
            <span>Tomorrow</span>
            {tomorrowList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.08] text-[#A3ADBA] font-mono">
                {tomorrowList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-4 py-2 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'UPCOMING'
                ? 'pill-sky font-semibold'
                : 'apple-btn-secondary text-[#A3ADBA] hover:text-[#F5F7FA]'
            }`}
          >
            <span>Upcoming Days</span>
            {upcomingList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.08] text-[#A3ADBA] font-mono">
                {upcomingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'COMPLETED'
                ? 'pill-emerald font-semibold'
                : 'apple-btn-secondary text-[#A3ADBA] hover:text-[#F5F7FA]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Completed</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.08] text-[#A3ADBA] font-mono">
              {completedList.length}
            </span>
          </button>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-16 text-center space-y-3 apple-panel">
            <div className="w-8 h-8 rounded-full border-2 border-[#7DD3FC]/20 border-t-[#7DD3FC] animate-spin mx-auto" />
            <p className="text-xs text-[#A3ADBA] font-mono">Synchronizing scheduled checkpoints...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 apple-panel text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl glass-inner text-[#34D399] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#F5F7FA]">No reminders in this queue</h3>
              <p className="text-xs text-[#A3ADBA] max-w-sm mx-auto">
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
                className={`glass-card p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isOverdue
                    ? 'border-[#FB7185]/30 bg-[#FB7185]/[0.05]'
                    : isToday
                    ? 'border-[#7DD3FC]/30 bg-[#7DD3FC]/[0.05]'
                    : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isOverdue
                          ? 'text-[#FECDD3]'
                          : isToday
                          ? 'text-[#BAE6FD]'
                          : 'text-[#F5F7FA]'
                      }`}
                    >
                      {fu.customer_name}
                    </span>

                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full glass-inner text-[#A3ADBA]">
                      {fu.assigned_staff_id || 'Staff'}
                    </span>

                    {isOverdue && (
                      <span className="pill-rose px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3 text-[#FB7185]" /> Overdue
                      </span>
                    )}

                    {isToday && (
                      <span className="pill-sky px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#7DD3FC]" /> Due Today
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#F5F7FA] font-medium">{fu.reason}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#A3ADBA] font-mono">
                    <span className="flex items-center gap-1.5 text-[#F5F7FA] font-medium">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#7DD3FC]" />
                      {new Date(fu.scheduled_at).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {fu.result_notes && (
                      <span className="text-[#A3ADBA] truncate max-w-md italic">
                        Outcome: "{fu.result_notes}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {fu.lead_id && (
                    <button
                      onClick={() => navigate(`/leads/${fu.lead_id}`)}
                      className="apple-btn-secondary px-3.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-1"
                    >
                      <span>Lead Profile</span>
                      <ChevronRight className="w-3 h-3 text-[#A3ADBA]" />
                    </button>
                  )}

                  {fu.status === 'Pending' && (
                    <button
                      onClick={() => setCompletingFollowUp(fu)}
                      className="apple-btn-primary px-4 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0A101D] stroke-[2.5]" />
                      <span>Complete & Log</span>
                    </button>
                  )}

                  {isSuperAdmin && (
                    <button
                      onClick={() => setDeletingFollowUp(fu)}
                      title="Delete Reminder (Admin Only)"
                      className="p-2 rounded-xl pill-rose transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#FB7185]" />
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
