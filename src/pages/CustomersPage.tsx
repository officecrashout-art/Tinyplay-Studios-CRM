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
      <div className="apple-panel relative overflow-hidden p-6 sm:p-7">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full pill-emerald text-[11px] font-medium tracking-wide">
              <UserCheck className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Verified Client Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
              Confirmed Studio Clients
            </h1>
            <p className="text-xs text-[#A3ADBA] max-w-xl">
              Directory of high-value patrons with active Roblox/Unity development agreements and order histories.
            </p>
          </div>

          <button
            onClick={() => navigate('/leads')}
            className="apple-btn-primary min-h-[42px] px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-[#0A101D] stroke-[2.5]" />
            <span>Convert New Lead</span>
          </button>
        </div>

        {/* Financial KPI Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-inner p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3ADBA] block">Total Clients</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#F5F7FA]">{clientStats.total}</span>
              <span className="text-[11px] text-[#A3ADBA]">accounts</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#7DD3FC]/20 bg-[#7DD3FC]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#BAE6FD] block">Commissioned Games</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#BAE6FD]">{clientStats.totalOrders}</span>
              <span className="text-[11px] text-[#7DD3FC]/70 ml-1.5">projects</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#34D399]/20 bg-[#34D399]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7F3D0] block">Lifetime Realized</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#A7F3D0]">৳{clientStats.lifetimeRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="apple-panel p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A3ADBA] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by display name, handle, phone..."
            className="apple-input w-full pl-10 pr-3.5 py-2.5 text-xs placeholder:text-[#64748B]"
          />
        </div>
      </div>

      {/* Customers Cards Grid */}
      {loading ? (
        <div className="p-16 text-center space-y-3 apple-panel">
          <div className="w-8 h-8 rounded-full border-2 border-[#7DD3FC]/20 border-t-[#7DD3FC] animate-spin mx-auto" />
          <p className="text-xs text-[#A3ADBA] font-mono">Loading client database...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-16 apple-panel text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl glass-inner text-[#34D399] flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#F5F7FA]">No confirmed clients found</h3>
            <p className="text-xs text-[#A3ADBA] max-w-sm mx-auto">
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
                className="glass-card p-6 flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl glass-inner shrink-0">
                        <SocialPlatformIcon platform={c.platform} className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#F5F7FA] group-hover:text-[#7DD3FC] transition">{c.display_name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-[#A3ADBA] mt-0.5">
                          <span className="font-mono text-[#A3ADBA]">@{c.handle}</span>
                          {c.profile_url && (
                            <a
                              href={c.profile_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#7DD3FC] hover:text-[#BAE6FD] transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="pill-sky px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                      {c.assigned_staff_id || 'Staff'}
                    </span>
                  </div>

                  {c.phone && (
                    <div className="flex items-center gap-2 text-xs text-[#A3ADBA] font-mono px-3 py-1.5 rounded-xl glass-inner">
                      <Phone className="w-3.5 h-3.5 text-[#7DD3FC]" />
                      <span>{c.phone}</span>
                    </div>
                  )}

                  {/* Customer Financial / Order Summary */}
                  <div className="p-3.5 rounded-2xl glass-inner grid grid-cols-2 gap-3 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#A3ADBA] uppercase font-mono block">
                        Games Built
                      </span>
                      <span className="font-bold text-[#F5F7FA] mt-1 block font-mono tabular-nums text-sm">
                        {customerProjects.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#34D399] uppercase font-mono block">
                        Paid to Date
                      </span>
                      <span className="font-bold text-[#34D399] mt-1 block font-mono tabular-nums text-sm">
                        ৳{totalSpent.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B] font-mono">
                    Client since {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/projects')}
                      className="apple-btn-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Projects</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#A3ADBA]" />
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => setDeletingCustomer(c)}
                        title="Delete Client Record (Admin Only)"
                        className="p-1.5 rounded-xl pill-rose transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#FB7185]" />
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
