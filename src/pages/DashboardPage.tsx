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
  Gamepad2,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  Activity,
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
        <div className="h-36 apple-panel rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 apple-panel rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 apple-panel rounded-3xl" />
          <div className="h-80 apple-panel rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Apple Hero Welcome Panel */}
      <div className="apple-panel p-6 sm:p-7 relative overflow-hidden">
        {/* Specular hairline top reflection */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill-sky px-3 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />
                {isSuperAdmin ? 'EXECUTIVE STUDIO OPS' : 'SALES REP WORKSPACE'}
              </span>

              {currentTime && (
                <span className="glass-inner px-3 py-1 rounded-full text-xs font-mono text-[#A3ADBA] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#A3ADBA]" />
                  <span>{currentTime} • Dhaka (GMT+6)</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] tracking-tight">
              Welcome back, <span className="text-[#7DD3FC]">{user?.full_name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#A3ADBA] max-w-2xl leading-relaxed">
              {isSuperAdmin
                ? 'Studio performance is healthy. Real-time pipeline analytics, BDT revenues, and staff activity trails are up to date.'
                : 'Here are your prospective clients, scheduled reminders, and active personalized game production targets.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/leads')}
              className="apple-btn-secondary min-h-[40px] px-3.5 sm:px-4 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#7DD3FC]" />
              <span>Explore Leads</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => navigate('/import')}
                className="apple-btn-secondary min-h-[40px] px-3.5 sm:px-4 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#7DD3FC]" />
                <span>Import Sheet</span>
              </button>
            )}

            <button
              onClick={() => navigate('/follow-ups')}
              className="apple-btn-primary min-h-[40px] px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 stroke-[2.5]" />
              <span>Open Follow-ups</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Unified Apple Glass KPI Cards (The 4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inquiries */}
        <div
          onClick={() => navigate('/leads')}
          className="apple-panel p-5 cursor-pointer flex flex-col justify-between group h-full"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-[#A3ADBA] uppercase tracking-wider">
                Total Inquiries
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#7DD3FC] group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] font-mono tabular-nums tracking-tight">
                {metrics.totalLeads}
              </p>
              <ArrowUpRight className="w-4 h-4 text-[#64748B] group-hover:text-[#7DD3FC] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="pill-sky px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold">
              +{metrics.newLeadsThisMonth} this month
            </span>
            <span className="text-[#64748B] text-[11px]">in sales funnel</span>
          </div>
        </div>

        {/* Card 2: Action Follow-ups */}
        <div
          onClick={() => navigate('/follow-ups')}
          className="apple-panel p-5 cursor-pointer flex flex-col justify-between group h-full"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-[#A3ADBA] uppercase tracking-wider">
                Action Follow-ups
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#FB7185] group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] font-mono tabular-nums tracking-tight">
                  {metrics.followUpsDueToday}
                </p>
                <span className="text-xs text-[#A3ADBA]">due today</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#64748B] group-hover:text-[#FB7185] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {metrics.overdueFollowUps > 0 ? (
              <span className="pill-rose px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#FB7185]" />
                {metrics.overdueFollowUps} overdue
              </span>
            ) : (
              <span className="pill-emerald px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
                All caught up
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Game Projects */}
        <div
          onClick={() => navigate('/projects')}
          className="apple-panel p-5 cursor-pointer flex flex-col justify-between group h-full"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-[#A3ADBA] uppercase tracking-wider">
                Game Deliverables
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#7DD3FC] group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] font-mono tabular-nums tracking-tight">
                {metrics.activeProjects}
              </p>
              <ArrowUpRight className="w-4 h-4 text-[#64748B] group-hover:text-[#7DD3FC] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="pill-sky px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold">
              {metrics.completedProjects} delivered
            </span>
            <span className="text-[#64748B] text-[11px]">in active production</span>
          </div>
        </div>

        {/* Card 4: Studio Revenue */}
        <div
          onClick={() => navigate(isSuperAdmin ? '/reports' : '/projects')}
          className="apple-panel p-5 cursor-pointer flex flex-col justify-between group h-full"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-[#A3ADBA] uppercase tracking-wider">
                {isSuperAdmin ? 'Total Received (BDT)' : 'Assigned Revenue'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#34D399] group-hover:scale-105 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-bold text-[#34D399] font-mono tabular-nums tracking-tight">
                ৳{metrics.totalRevenueBDT.toLocaleString()}
              </p>
              <ArrowUpRight className="w-4 h-4 text-[#64748B] group-hover:text-[#34D399] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="pill-amber px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold">
              ৳{metrics.outstandingBalanceBDT.toLocaleString()} due
            </span>
            <span className="text-[#64748B] text-[11px]">remaining balance</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Grid: Production Pipeline & Revenue Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline Distribution */}
        <div className="lg:col-span-2 apple-panel p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#F5F7FA] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7DD3FC]" />
                <span>Game Production Pipeline</span>
              </h2>
              <p className="text-xs text-[#A3ADBA] mt-0.5">
                Distribution of orders across personalized development stages
              </p>
            </div>

            <div className="pill-sky px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-2 self-start sm:self-auto">
              <TrendingUp className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>Conversion Rate: <strong className="text-[#F5F7FA]">{metrics.conversionRate}%</strong></span>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {metrics.pipelineDistribution.map((pipe) => {
              const maxVal = Math.max(...metrics.pipelineDistribution.map((p) => p.count), 1);
              const percentage = Math.round((pipe.count / maxVal) * 100);

              return (
                <div key={pipe.stage} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F5F7FA] font-medium group-hover:text-[#7DD3FC] transition-colors">
                      {pipe.stage}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-[#A3ADBA]">
                        {pipe.count} {pipe.count === 1 ? 'project' : 'projects'}
                      </span>
                      <span className="text-[#34D399] font-bold tabular-nums">
                        ৳{pipe.valueBDT.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Refined Apple Progress Track */}
                  <div className="w-full h-2 rounded-full bg-white/[0.05] p-0.5 border border-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC] transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="apple-panel p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm sm:text-base font-semibold text-[#F5F7FA] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#34D399]" />
                <span>Revenue Trajectory</span>
              </h2>
              <span className="text-[11px] font-mono text-[#A3ADBA] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                2026 BDT
              </span>
            </div>
            <p className="text-xs text-[#A3ADBA]">Total delivered revenue trajectory</p>
          </div>

          <div className="space-y-2 py-1">
            {metrics.monthlyRevenueTrend.map((item) => (
              <div
                key={item.month}
                className="glass-inner p-2.5 flex items-center justify-between text-xs font-mono"
              >
                <span className="text-[#A3ADBA] font-medium">{item.month}</span>
                <span className="text-[#F5F7FA] font-bold tabular-nums">
                  ৳{item.revenueBDT.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="glass-inner p-3 text-center">
            <p className="text-xs text-[#7DD3FC] font-mono">
              Avg Project Deal: <strong className="text-[#F5F7FA] font-bold tabular-nums">৳28,500 BDT</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Team Attribution & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance by Staff Member (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="apple-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[#F5F7FA] flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#7DD3FC]" />
                  <span>Sales Team Attribution</span>
                </h2>
                <p className="text-xs text-[#A3ADBA]">Individual workload & confirmed revenue</p>
              </div>
              <button
                onClick={() => navigate('/team')}
                className="text-xs text-[#7DD3FC] hover:text-[#BAE6FD] font-medium flex items-center gap-1 cursor-pointer transition"
              >
                <span>Manage Team</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {metrics.salesByStaff.length === 0 ? (
                <div className="py-8 text-center space-y-2 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#7DD3FC] mx-auto">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#F5F7FA]">No Sales Team Roster Yet</p>
                  <p className="text-[11px] text-[#A3ADBA] max-w-xs mx-auto">
                    Provision sales representatives in Team Management to track individual conversion ratios and revenue attribution.
                  </p>
                </div>
              ) : (
                metrics.salesByStaff.map((staff) => (
                  <div key={staff.staffId} className="py-3 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#7DD3FC]/15 border border-[#7DD3FC]/30 flex items-center justify-center font-mono text-xs font-bold text-[#7DD3FC]">
                        {staff.staffId.slice(-2)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#F5F7FA] group-hover:text-[#7DD3FC] transition-colors">
                          {staff.staffName}
                        </p>
                        <p className="text-[10px] text-[#A3ADBA] font-mono">{staff.staffId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 sm:gap-6 font-mono text-xs text-right">
                      <div>
                        <p className="text-[#F5F7FA] font-bold tabular-nums">{staff.leadsCount}</p>
                        <p className="text-[10px] text-[#64748B]">Leads</p>
                      </div>
                      <div>
                        <p className="text-[#34D399] font-bold tabular-nums">{staff.confirmedCount}</p>
                        <p className="text-[10px] text-[#64748B]">Won</p>
                      </div>
                      <div>
                        <p className="text-[#7DD3FC] font-bold tabular-nums">৳{staff.revenueBDT.toLocaleString()}</p>
                        <p className="text-[10px] text-[#64748B]">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Live Activity Stream (Super Admin) or Recent Inquiries (Sales) */}
        <div className="apple-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#F5F7FA] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#7DD3FC]" />
                <span>{isSuperAdmin ? 'Live Studio Activity Stream' : 'Recently Assigned Inquiries'}</span>
              </h2>
              <p className="text-xs text-[#A3ADBA]">
                {isSuperAdmin ? 'Immutable security & transaction audit logs' : 'Your most recent potential game clients'}
              </p>
            </div>
            <button
              onClick={() => navigate(isSuperAdmin ? '/activity' : '/leads')}
              className="text-xs text-[#7DD3FC] hover:text-[#BAE6FD] font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <span>See all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {isSuperAdmin ? (
              metrics.recentActivities.length === 0 ? (
                <div className="py-8 text-center space-y-2 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#7DD3FC] mx-auto">
                    <Activity className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#F5F7FA]">Activity Stream Armed & Active</p>
                  <p className="text-[11px] text-[#A3ADBA] max-w-xs mx-auto">
                    No studio actions recorded yet. Client inquiries, deal conversions, and payment settlements will stream live here.
                  </p>
                </div>
              ) : (
                metrics.recentActivities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="glass-inner p-3 flex items-start gap-3 hover:border-white/15 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#7DD3FC] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#F5F7FA] leading-snug">{act.description}</p>
                      <p className="text-[10px] text-[#A3ADBA] font-mono mt-1">
                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )
            ) : (
              metrics.recentLeads.length === 0 ? (
                <div className="py-8 text-center space-y-2 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <p className="text-xs font-semibold text-[#F5F7FA]">No Inquiries Assigned</p>
                  <p className="text-[11px] text-[#A3ADBA] max-w-xs mx-auto">
                    All clear! Newly assigned client inquiries will appear here.
                  </p>
                </div>
              ) : (
                metrics.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="glass-inner p-3 hover:border-white/20 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#F5F7FA]">{lead.customer_name}</p>
                      <p className="text-[11px] text-[#A3ADBA] mt-0.5">
                        {lead.platform} @{lead.handle} • {lead.game_type}
                      </p>
                    </div>
                    <span className="pill-sky px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono">
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
