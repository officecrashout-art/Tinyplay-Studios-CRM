import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Search,
  ExternalLink,
  Gamepad2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Users,
  Briefcase,
} from 'lucide-react';
import { SocialPlatformIcon } from '@/components/icons/SocialIcons';
import { useAuth } from '@/context/AuthContext';
import { apiCustomers, apiProjects } from '@/services/api';
import { Contact, Project } from '@/types';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';

export const CustomersPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingCustomer, setDeletingCustomer] = useState<Contact | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [c, p] = await Promise.all([
        apiCustomers.listCustomers(),
        apiProjects.listProjects(),
      ]);
      setCustomers(c);
      setProjects(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.display_name.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const clientStats = useMemo(() => {
    const total = customers.length;
    const totalOrders = projects.length;
    const lifetimeRevenue = projects.reduce((s, p) => s + (p.total_paid_bdt || 0), 0);
    return { total, totalOrders, lifetimeRevenue };
  }, [customers, projects]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12121E]/90 via-[#0E0E18]/80 to-[#161228]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-semibold tracking-wide">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Verified Client Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Confirmed Studio Clients
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Directory of high-value patrons with active Roblox/Unity development agreements and order histories.
            </p>
          </div>

          <button
            onClick={() => navigate('/leads')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-extrabold tracking-wide shadow-lg shadow-[#61C9F6]/25 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Convert New Lead</span>
          </button>
        </div>

        {/* Financial KPI Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Total Clients</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-white">{clientStats.total}</span>
              <span className="text-[11px] text-zinc-500">accounts</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#61C9F6]/[0.08] border border-[#61C9F6]/20">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#61C9F6] block">Commissioned Games</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-sky-200">{clientStats.totalOrders}</span>
              <span className="text-[11px] text-sky-300/60 ml-1.5">projects</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block">Lifetime Realized</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-300">৳{clientStats.lifetimeRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-4 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by display name, handle, phone..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#61C9F6] transition shadow-inner"
          />
        </div>
      </div>

      {/* Customers Cards Grid */}
      {loading ? (
        <div className="p-16 text-center space-y-3 rounded-3xl bg-[#0E0E18]/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="w-10 h-10 rounded-full border-2 border-[#61C9F6]/20 border-t-[#61C9F6] animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Loading client database...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#0E0E18]/80 border border-white/10 text-center space-y-4 shadow-2xl backdrop-blur-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#61C9F6]/10 text-[#61C9F6] flex items-center justify-center mx-auto border border-[#61C9F6]/20 shadow-[0_0_20px_rgba(97,201,246,0.15)]">
            <UserCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No confirmed clients found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              When a lead confirms an order and makes a deposit, they will automatically appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((c) => {
            const customerProjects = projects.filter((p) => p.contact_id === c.id);
            const totalSpent = customerProjects.reduce(
              (sum, p) => sum + (p.total_paid_bdt || 0),
              0
            );

            return (
              <div
                key={c.id}
                className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl hover:border-[#61C9F6]/40 transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 shadow-sm shrink-0">
                        <SocialPlatformIcon platform={c.platform} className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-[#61C9F6] transition">{c.display_name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                          <span className="font-mono text-zinc-400">@{c.handle}</span>
                          {c.profile_url && (
                            <a
                              href={c.profile_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#61C9F6] hover:text-sky-300 transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#61C9F6]/15 text-sky-200 border border-[#61C9F6]/25">
                      {c.assigned_staff_id || 'Staff'}
                    </span>
                  </div>

                  {c.phone && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <Phone className="w-3.5 h-3.5 text-[#61C9F6]" />
                      <span>{c.phone}</span>
                    </div>
                  )}

                  {/* Customer Financial / Order Summary */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 grid grid-cols-2 gap-3 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                        Games Built
                      </span>
                      <span className="font-bold text-white mt-1 block font-mono text-sm">
                        {customerProjects.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400/80 uppercase font-mono block">
                        Paid to Date
                      </span>
                      <span className="font-bold text-emerald-400 mt-1 block font-mono text-sm">
                        ৳{totalSpent.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Client since {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/projects')}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#61C9F6] font-semibold flex items-center gap-1 transition cursor-pointer border border-white/10"
                    >
                      <span>Projects</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => setDeletingCustomer(c)}
                        title="Delete Client Record (Admin Only)"
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Customer Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingCustomer)}
        title="Delete Customer Profile"
        itemName={deletingCustomer?.display_name}
        message={`Are you sure you want to permanently delete the client record for ${deletingCustomer?.display_name} (${deletingCustomer?.platform} @${deletingCustomer?.handle})? Note: Associated project records should be managed from the Projects section.`}
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!deletingCustomer) return;
          try {
            setDeleteLoading(true);
            await apiCustomers.deleteCustomer(deletingCustomer.id);
            setDeletingCustomer(null);
            loadData();
          } catch (err: any) {
            alert(err?.message || 'Failed to delete customer');
          } finally {
            setDeleteLoading(false);
          }
        }}
        onClose={() => setDeletingCustomer(null)}
      />
    </div>
  );
};
