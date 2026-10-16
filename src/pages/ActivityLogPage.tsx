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
        return 'pill-emerald';
      case 'STATUS_CHANGE':
        return 'pill-sky';
      case 'CONVERT':
        return 'pill-amber';
      case 'PAYMENT_RECORDED':
        return 'pill-emerald font-semibold';
      case 'REASSIGN':
        return 'pill-sky';
      case 'DISABLE':
        return 'pill-rose';
      case 'ACTIVATE':
        return 'pill-sky';
      default:
        return 'apple-btn-secondary text-[#A3ADBA]';
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
      <div className="apple-panel relative overflow-hidden p-6 sm:p-7">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full pill-sky text-[11px] font-medium tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>Cryptographic Governance Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
              Studio Activity & Audit Trail
            </h1>
            <p className="text-xs text-[#A3ADBA] max-w-xl">
              Server-side recorded immutable timeline of all lead touches, financial payments, stage transitions, and administrative overrides.
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-inner p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3ADBA] block">Total Events</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#F5F7FA]">{logStats.total}</span>
              <span className="text-[11px] text-[#A3ADBA]">entries</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#7DD3FC]/20 bg-[#7DD3FC]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#BAE6FD] block">Lead Touchpoints</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#BAE6FD]">{logStats.leadsCount}</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#7DD3FC]/20 bg-[#7DD3FC]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#BAE6FD] block">Project Actions</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#BAE6FD]">{logStats.projectCount}</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#34D399]/20 bg-[#34D399]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7F3D0] block">Financial Audits</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#A7F3D0]">{logStats.paymentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="apple-panel p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#A3ADBA] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search descriptions, Staff ID..."
              className="apple-input w-full pl-10 pr-3.5 py-2 text-xs placeholder:text-[#64748B]"
            />
          </div>

          <div>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="apple-input w-full px-3 py-2 text-xs cursor-pointer"
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
              className="apple-input w-full px-3 py-2 text-xs cursor-pointer"
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
      <div className="apple-panel overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#7DD3FC]/20 border-t-[#7DD3FC] animate-spin mx-auto" />
            <p className="text-xs text-[#A3ADBA] font-mono">Synchronizing audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl glass-inner text-[#7DD3FC] flex items-center justify-center mx-auto">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#A3ADBA] font-mono">No activity log entries match your filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasDiff = Boolean(log.old_values || log.new_values);

              return (
                <div key={log.id} className="p-4 hover:bg-white/[0.035] transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-[#BAE6FD] px-2.5 py-0.5 rounded-xl pill-sky">
                        {log.actor_staff_id || 'STAFF'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                      <span className="text-[#64748B] font-mono text-[10px] uppercase">
                        [{log.entity_type}]
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#A3ADBA] font-mono">
                      <Clock className="w-3 h-3 text-[#7DD3FC]" />
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-xs text-[#F5F7FA] font-medium pl-1">
                    {log.description}
                  </p>

                  {/* Expand diff / values if present */}
                  {hasDiff && (
                    <div className="pl-1">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-[11px] text-[#7DD3FC] hover:text-[#BAE6FD] font-mono flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                        <span>{isExpanded ? 'Hide Payload' : 'Inspect Snapshot Data'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3.5 rounded-2xl glass-inner text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#A3ADBA] overflow-x-auto">
                          {log.old_values && (
                            <div>
                              <p className="text-[#A3ADBA] mb-1 font-semibold">Previous Snapshot:</p>
                              <pre className="text-[#FECDD3] whitespace-pre-wrap">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <p className="text-[#A3ADBA] mb-1 font-semibold">Updated Snapshot:</p>
                              <pre className="text-[#A7F3D0] whitespace-pre-wrap">
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
