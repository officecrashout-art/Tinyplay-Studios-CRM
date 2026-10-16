import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  Calendar,
  CreditCard,
  Download,
  Sparkles,
  Layers,
  ShieldCheck,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiDashboard, apiPayments, apiProjects } from '@/services/api';
import { DashboardMetrics, Payment, Project } from '@/types';

export const ReportsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [m, pays, projs] = await Promise.all([
        apiDashboard.getMetrics(),
        apiPayments.listPayments(),
        apiProjects.listProjects(),
      ]);
      setMetrics(m);
      setPayments(pays);
      setProjects(projs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="p-16 text-center space-y-3 rounded-3xl bg-[#0E0E18]/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
        <div className="w-10 h-10 rounded-full border-2 border-[#61C9F6]/20 border-t-[#61C9F6] animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Synthesizing executive financial reports...</p>
      </div>
    );
  }

  // Payment method distribution
  const methodTotals: Record<string, number> = {};
  payments.forEach((p) => {
    methodTotals[p.payment_method] = (methodTotals[p.payment_method] || 0) + Number(p.amount_bdt || 0);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12121E]/90 via-[#0E0E18]/80 to-[#0e1e28]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#61C9F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#61C9F6]/10 border border-[#61C9F6]/20 text-[#61C9F6] text-[11px] font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-[#61C9F6]" />
              <span>Super Admin Executive Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Financial & Performance Analytics
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Real-time audit on studio cashflow, pipeline conversion ratios, salesperson win rates, and gateway settlement breakdowns.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 block">Total Collected Cash</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1.5">
            ৳{metrics.totalRevenueBDT.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1.5 font-mono">
            {payments.length} verified transactions
          </p>
        </div>

        <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400/80 block">Uncollected Balance</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-400 font-mono mt-1.5">
            ৳{metrics.outstandingBalanceBDT.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1.5 font-mono">
            Pending game milestones
          </p>
        </div>

        <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#61C9F6]/80 block">Pipeline Win Rate</span>
          <p className="text-2xl sm:text-3xl font-black text-[#61C9F6] font-mono mt-1.5">
            {metrics.conversionRate}%
          </p>
          <p className="text-[11px] text-zinc-400 mt-1.5 font-mono">
            {metrics.confirmedCustomers} of {metrics.totalLeads} won
          </p>
        </div>

        <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Total Contract Book</span>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-1.5">
            ৳{(metrics.totalRevenueBDT + metrics.outstandingBalanceBDT).toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1.5 font-mono">
            Lifetime deal volume
          </p>
        </div>
      </div>

      {/* Salesperson Matrix */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-[#61C9F6]" /> Sales Representative Win Rate Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-3 font-semibold">Salesperson</th>
                <th className="py-3 px-3 font-semibold">Inquiries Managed</th>
                <th className="py-3 px-3 font-semibold">Orders Confirmed</th>
                <th className="py-3 px-3 font-semibold">Win Rate</th>
                <th className="py-3 px-3 font-semibold">Revenue Realized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {metrics.salesByStaff.map((s) => {
                const winRate = s.leadsCount > 0 ? Math.round((s.confirmedCount / s.leadsCount) * 100) : 0;

                return (
                  <tr key={s.staffId} className="hover:bg-white/[0.03] transition">
                    <td className="py-3.5 px-3 font-bold text-white">
                      <span className="text-[#61C9F6] font-mono px-2 py-0.5 rounded-lg bg-[#61C9F6]/10 border border-[#61C9F6]/20 mr-2">
                        {s.staffId}
                      </span>
                      {s.staffName}
                    </td>
                    <td className="py-3.5 px-3 text-zinc-300">{s.leadsCount}</td>
                    <td className="py-3.5 px-3 text-emerald-400 font-bold">{s.confirmedCount}</td>
                    <td className="py-3.5 px-3 text-[#61C9F6] font-bold">{winRate}%</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-400">
                      ৳{s.revenueBDT.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Gateway Breakdown & Monthly Cadence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" /> Payment Methods Breakdown
          </h3>

          <div className="space-y-2.5">
            {Object.entries(methodTotals).map(([method, total]) => (
              <div
                key={method}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs font-mono"
              >
                <span className="text-zinc-200 font-semibold">{method}</span>
                <span className="text-emerald-400 font-bold">৳{total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#61C9F6]" /> Revenue Growth Cadence
          </h3>

          <div className="space-y-2">
            {metrics.monthlyRevenueTrend.map((m) => (
              <div
                key={m.month}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-xs font-mono"
              >
                <span className="text-zinc-400">{m.month}</span>
                <span className="text-white font-bold">৳{m.revenueBDT.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
