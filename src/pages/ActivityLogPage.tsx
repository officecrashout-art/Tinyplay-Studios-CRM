import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  Calendar,
  ChevronDown,
  Layers,
  Database,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiActivity } from '@/services/api';
import { ActivityLog } from '@/types';

export const ActivityLogPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await apiActivity.listActivityLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (entityFilter !== 'ALL' && log.entity_type !== entityFilter) return false;
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.description.toLowerCase().includes(q) ||
        (log.actor_staff_id && log.actor_staff_id.toLowerCase().includes(q)) ||
        (log.actor_name && log.actor_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'STATUS_CHANGE':
        return 'bg-[#61C9F6]/15 text-[#61C9F6] border-[#61C9F6]/30';
      case 'CONVERT':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'PAYMENT_RECORDED':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'REASSIGN':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'DISABLE':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'ACTIVATE':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-white/[0.05] text-zinc-300 border-white/10';
    }
  };

  const logStats = useMemo(() => {
    const total = logs.length;
    const leadsCount = logs.filter((l) => l.entity_type === 'lead').length;
    const projectCount = logs.filter((l) => l.entity_type === 'project').length;
    const paymentCount = logs.filter((l) => l.entity_type === 'payment').length;
    return { total, leadsCount, projectCount, paymentCount };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C1527]/90 via-[#09101F]/80 to-[#0A162B]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#61C9F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#61C9F6]/10 border border-[#61C9F6]/25 text-[#61C9F6] text-[11px] font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-[#61C9F6]" />
              <span>Cryptographic Governance Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Studio Activity & Audit Trail
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Server-side recorded immutable timeline of all lead touches, financial payments, stage transitions, and administrative overrides.
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Total Events</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-white">{logStats.total}</span>
              <span className="text-[11px] text-zinc-500">entries</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#61C9F6]/[0.08] border border-[#61C9F6]/20">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#61C9F6] block">Lead Touchpoints</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-sky-200">{logStats.leadsCount}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-sky-500/[0.04] border border-sky-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300/80 block">Project Actions</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-sky-300">{logStats.projectCount}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block">Financial Audits</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-300">{logStats.paymentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl space-y-3">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search descriptions, Staff ID..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#61C9F6] transition shadow-inner"
            />
          </div>

          <div>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-[#61C9F6] transition cursor-pointer"
            >
              <option value="ALL">All Entities</option>
              <option value="lead">Leads</option>
              <option value="project">Projects</option>
              <option value="payment">Payments</option>
              <option value="follow_up">Follow-ups</option>
              <option value="staff">Staff Management</option>
              <option value="package">Packages</option>
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-[#61C9F6] transition cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Record Created</option>
              <option value="STATUS_CHANGE">Status Changed</option>
              <option value="CONVERT">Lead Converted</option>
              <option value="PAYMENT_RECORDED">Payment Recorded</option>
              <option value="REASSIGN">Record Reassigned</option>
              <option value="DISABLE">Account Disabled</option>
              <option value="ACTIVATE">Account Activated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table / Timeline */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#61C9F6]/20 border-t-[#61C9F6] animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Synchronizing audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#61C9F6]/10 text-[#61C9F6] flex items-center justify-center mx-auto border border-[#61C9F6]/20">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-400 font-mono">No activity log entries match your filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasDiff = Boolean(log.old_values || log.new_values);

              return (
                <div key={log.id} className="p-4 hover:bg-white/[0.03] transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-sky-200 px-2.5 py-0.5 rounded-xl bg-[#61C9F6]/10 border border-[#61C9F6]/20">
                        {log.actor_staff_id || 'STAFF'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-mono ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                      <span className="text-zinc-500 font-mono text-[10px] uppercase">
                        [{log.entity_type}]
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                      <Clock className="w-3 h-3 text-[#61C9F6]" />
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-xs text-zinc-200 font-medium pl-1">
                    {log.description}
                  </p>

                  {/* Expand diff / values if present */}
                  {hasDiff && (
                    <div className="pl-1">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-[11px] text-[#61C9F6] hover:text-sky-300 font-mono flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                        <span>{isExpanded ? 'Hide Payload' : 'Inspect Snapshot Data'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3.5 rounded-2xl bg-black/40 border border-white/10 text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300 overflow-x-auto">
                          {log.old_values && (
                            <div>
                              <p className="text-zinc-400 mb-1 font-bold">Previous Snapshot:</p>
                              <pre className="text-rose-300/90 whitespace-pre-wrap">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <p className="text-zinc-400 mb-1 font-bold">Updated Snapshot:</p>
                              <pre className="text-emerald-300/90 whitespace-pre-wrap">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
