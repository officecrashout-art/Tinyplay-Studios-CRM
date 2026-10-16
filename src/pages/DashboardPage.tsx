import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  DollarSign,
  UserCheck,
  Calendar,
  Sparkles,
  Gamepad2,
  ChevronRight,
  ExternalLink,
  Plus,
  FileSpreadsheet,
  Activity,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiDashboard } from '@/services/api';
import { DashboardMetrics } from '@/types';

export const DashboardPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    loadDashboard();
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
            hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await apiDashboard.getMetrics(user);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white/[0.03] rounded-3xl border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white/[0.03] rounded-3xl border border-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white/[0.03] rounded-3xl border border-white/10" />
          <div className="h-80 bg-white/[0.03] rounded-3xl border border-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Cosmic Glass Studio Pulse Banner with #61C9F6 Accents */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#08101E]/80 border border-white/10 backdrop-blur-2xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#61C9F6]/50 to-transparent pointer-events-none" />
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#61C9F6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-[#0284C7]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#61C9F6]/15 text-[#61C9F6] text-xs font-mono border border-[#61C9F6]/30 shadow-[0_0_12px_rgba(97,201,246,0.25)] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#61C9F6] animate-ping" />
                {isSuperAdmin ? 'EXECUTIVE STUDIO OPS' : 'SALES REP WORKSPACE'}
              </span>

              {currentTime && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] text-zinc-300 text-xs font-mono border border-white/10">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  {currentTime} • Dhaka (GMT+6)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#61C9F6] via-[#7DD3FC] to-[#BAE6FD]">{user?.full_name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              {isSuperAdmin
                ? 'Studio performance is healthy. Real-time pipeline analytics, BDT revenues, and staff activity trails are up to date.'
                : 'Here are your prospective clients, scheduled reminders, and active personalized game production targets.'}
            </p>
          </div>

          {/* Quick Action Dock Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/leads')}
              className="px-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-all backdrop-blur-md flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Users className="w-4 h-4 text-[#61C9F6]" />
              <span>Explore Leads</span>
            </button>

            <button
              onClick={() => navigate('/import')}
              className="px-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-all backdrop-blur-md flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#38BDF8]" />
              <span>Import Sheet</span>
            </button>

            <button
              onClick={() => navigate('/follow-ups')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-extrabold shadow-lg shadow-[#61C9F6]/30 border border-[#61C9F6]/50 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Open Follow-ups</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chromatic Glass KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div
          onClick={() => navigate('/leads')}
          className="p-5 rounded-3xl bg-[#081120]/75 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-[#61C9F6]/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.4)] cursor-pointer"
        >
          {/* Subtle colored accent glow top line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#61C9F6] via-[#0284C7] to-transparent" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Total Inquiries
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#61C9F6]/15 border border-[#61C9F6]/35 shadow-[0_0_15px_rgba(97,201,246,0.3)] flex items-center justify-center text-[#61C9F6] group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-white font-mono tracking-tight">
              {metrics.totalLeads}
            </p>
            <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-[#61C9F6] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-[#61C9F6]/15 text-[#61C9F6] font-mono text-[10px] font-bold border border-[#61C9F6]/30">
              +{metrics.newLeadsThisMonth} this month
            </span>
            <span className="text-zinc-500 text-[11px]">in sales funnel</span>
          </div>
        </div>

        {/* Card 2: Actionable Reminders */}
        <div
          onClick={() => navigate('/follow-ups')}
          className="p-5 rounded-3xl bg-[#081120]/75 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-rose-500/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.4)] cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-transparent" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Action Follow-ups
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-600/20 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-white font-mono tracking-tight">
                {metrics.followUpsDueToday}
              </p>
              <span className="text-xs text-zinc-400">due today</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-rose-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          <div className="mt-2 flex items-center gap-2">
            {metrics.overdueFollowUps > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/35 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                {metrics.overdueFollowUps} overdue
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                All caught up
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Game Projects */}
        <div
          onClick={() => navigate('/projects')}
          className="p-5 rounded-3xl bg-[#081120]/75 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-[#61C9F6]/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.4)] cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#61C9F6] via-blue-500 to-transparent" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Game Deliverables
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#61C9F6]/15 border border-[#61C9F6]/35 shadow-[0_0_15px_rgba(97,201,246,0.3)] flex items-center justify-center text-[#61C9F6] group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-white font-mono tracking-tight">
              {metrics.activeProjects}
            </p>
            <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-[#61C9F6] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-[#61C9F6]/15 text-[#61C9F6] font-mono text-[10px] font-bold border border-[#61C9F6]/30">
              {metrics.completedProjects} delivered
            </span>
            <span className="text-zinc-500 text-[11px]">in production</span>
          </div>
        </div>

        {/* Card 4: Studio Revenue */}
        <div
          onClick={() => navigate(isSuperAdmin ? '/reports' : '/projects')}
          className="p-5 rounded-3xl bg-[#081120]/75 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.4)] cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              {isSuperAdmin ? 'Total Received (BDT)' : 'Assigned Revenue'}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              ৳{metrics.totalRevenueBDT.toLocaleString()}
            </p>
            <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
              ৳{metrics.outstandingBalanceBDT.toLocaleString()} due
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Pipeline Funnel & Monthly Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline Distribution */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-[#08101E]/80 border border-white/10 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#61C9F6]" />
                Game Production Pipeline
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Distribution of orders across personalized development stages
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#61C9F6] bg-[#61C9F6]/10 px-3 py-1.5 rounded-xl border border-[#61C9F6]/30 shadow-[0_0_15px_rgba(97,201,246,0.2)]">
              <TrendingUp className="w-3.5 h-3.5 text-[#61C9F6]" />
              <span>Conversion Rate: <strong className="text-white">{metrics.conversionRate}%</strong></span>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {metrics.pipelineDistribution.map((pipe) => {
              const maxVal = Math.max(...metrics.pipelineDistribution.map((p) => p.count), 1);
              const percentage = Math.round((pipe.count / maxVal) * 100);

              return (
                <div key={pipe.stage} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-semibold group-hover:text-[#61C9F6] transition-colors">
                      {pipe.stage}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-zinc-400 font-medium">
                        {pipe.count} {pipe.count === 1 ? 'project' : 'projects'}
                      </span>
                      <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        ৳{pipe.valueBDT.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* High-tech Glowing Progress Track */}
                  <div className="w-full h-2.5 rounded-full bg-white/[0.05] p-0.5 border border-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0284C7] via-[#38BDF8] to-[#61C9F6] shadow-[0_0_12px_rgba(97,201,246,0.5)] transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Revenue Trend Pod */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#08101E]/80 border border-white/10 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Revenue Trajectory
              </h2>
              <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10">
                2026 BDT
              </span>
            </div>
            <p className="text-xs text-zinc-400">Total delivered revenue trajectory</p>
          </div>

          <div className="space-y-2.5 py-1">
            {metrics.monthlyRevenueTrend.map((item) => (
              <div
                key={item.month}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-[#61C9F6]/40 transition-colors text-xs font-mono"
              >
                <span className="text-zinc-400 font-medium">{item.month}</span>
                <span className="text-white font-bold bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/5">
                  ৳{item.revenueBDT.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#61C9F6]/10 border border-[#61C9F6]/30 text-center shadow-inner">
            <p className="text-xs text-[#61C9F6] font-mono">
              Avg Project Deal: <strong className="text-white font-bold">৳28,500 BDT</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Team Attributions & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance by Staff Member (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="p-6 sm:p-7 rounded-3xl bg-[#08101E]/80 border border-white/10 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#61C9F6]" />
                  Sales Team Attribution
                </h2>
                <p className="text-xs text-zinc-400">Individual workload & confirmed revenue</p>
              </div>
              <button
                onClick={() => navigate('/team')}
                className="text-xs text-[#61C9F6] hover:text-[#93E0FD] font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                Manage Team <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {metrics.salesByStaff.length === 0 ? (
                <div className="py-8 text-center space-y-2 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#61C9F6]/10 border border-[#61C9F6]/20 flex items-center justify-center text-[#61C9F6] mx-auto">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-300">No Sales Team Roster Yet</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Provision sales representatives in Team Management to track individual conversion ratios and revenue attribution.
                  </p>
                </div>
              ) : (
                metrics.salesByStaff.map((staff) => (
                  <div key={staff.staffId} className="py-3.5 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#61C9F6]/15 border border-[#61C9F6]/35 shadow-[0_0_12px_rgba(97,201,246,0.25)] flex items-center justify-center font-mono text-xs font-bold text-[#61C9F6]">
                        {staff.staffId.slice(-2)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-[#61C9F6] transition-colors">
                          {staff.staffName}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">{staff.staffId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 sm:gap-6 font-mono text-xs text-right">
                      <div>
                        <p className="text-white font-bold">{staff.leadsCount}</p>
                        <p className="text-[10px] text-zinc-400">Leads</p>
                      </div>
                      <div>
                        <p className="text-emerald-400 font-bold">{staff.confirmedCount}</p>
                        <p className="text-[10px] text-zinc-400">Deals Won</p>
                      </div>
                      <div>
                        <p className="text-[#61C9F6] font-bold">৳{staff.revenueBDT.toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-400">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Live Activity Stream (Super Admin) or Recent Inquiries (Sales) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#08101E]/80 border border-white/10 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#61C9F6]" />
                {isSuperAdmin ? 'Live Studio Activity Stream' : 'Recently Assigned Inquiries'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isSuperAdmin ? 'Immutable security & transaction audit logs' : 'Your most recent potential game clients'}
              </p>
            </div>
            <button
              onClick={() => navigate(isSuperAdmin ? '/activity' : '/leads')}
              className="text-xs text-[#61C9F6] hover:text-[#93E0FD] font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {isSuperAdmin ? (
              metrics.recentActivities.length === 0 ? (
                <div className="py-8 text-center space-y-2 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#61C9F6]/10 border border-[#61C9F6]/20 flex items-center justify-center text-[#61C9F6] mx-auto">
                    <Activity className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-300">Activity Stream Armed & Active</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    No studio actions recorded yet. Client inquiries, deal conversions, and payment settlements will stream live here.
                  </p>
                </div>
              ) : (
                metrics.recentActivities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-[#61C9F6]/40 transition-colors flex items-start gap-3"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#61C9F6] mt-1.5 shrink-0 shadow-[0_0_8px_#61C9F6]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-200 leading-snug">{act.description}</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-1">
                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )
            ) : (
              metrics.recentLeads.length === 0 ? (
                <div className="py-8 text-center space-y-2 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <p className="text-xs font-semibold text-zinc-300">No Inquiries Assigned</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    All clear! Newly assigned client inquiries will appear here.
                  </p>
                </div>
              ) : (
                metrics.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-[#61C9F6]/50 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{lead.customer_name}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {lead.platform} @{lead.handle} • {lead.game_type}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#61C9F6]/15 text-[#61C9F6] border border-[#61C9F6]/30 font-mono">
                      {lead.status}
                    </span>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
