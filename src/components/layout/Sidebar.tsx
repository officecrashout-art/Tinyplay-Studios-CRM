import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Briefcase,
  Gamepad2,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  LogOut,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  pendingFollowUpsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingFollowUpsCount = 0 }) => {
  const { user, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-[#61C9F6]/20 text-[#61C9F6] border border-[#61C9F6]/40 shadow-[0_0_20px_rgba(97,201,246,0.3)] backdrop-blur-md font-semibold'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08]'
    }`;

  return (
    <aside className="w-64 bg-[#0A0E18]/85 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header with Official Logo */}
      <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-[#61C9F6]/25 border border-[#61C9F6]/40 overflow-hidden shrink-0 p-0.5">
          <img src="/logo.png" alt="TinyPlay" className="w-full h-full object-contain rounded-xl" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-white tracking-tight leading-none truncate">
            TinyPlay<span className="text-[#61C9F6]">Studioz</span>
          </h1>
          <p className="text-[11px] text-zinc-400 font-mono tracking-wider mt-1 uppercase">
            Sales & Project CRM
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Sales CRM */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2 font-mono">
            Sales Operations
          </p>
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={navItemClass}>
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-[#61C9F6]" />
                <span>Dashboard</span>
              </div>
            </NavLink>

            <NavLink to="/leads" className={navItemClass}>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-[#61C9F6]" />
                <span>Leads CRM</span>
              </div>
            </NavLink>

            <NavLink to="/follow-ups" className={navItemClass}>
              <div className="flex items-center gap-3">
                <CalendarClock className="w-4 h-4 text-[#61C9F6]" />
                <span>Follow-ups</span>
              </div>
              {pendingFollowUpsCount > 0 && (
                <span className="bg-[#61C9F6]/20 text-[#61C9F6] text-xs px-2 py-0.5 rounded-full font-mono border border-[#61C9F6]/40 font-bold">
                  {pendingFollowUpsCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/customers" className={navItemClass}>
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-[#61C9F6]" />
                <span>Confirmed Clients</span>
              </div>
            </NavLink>

            <NavLink to="/projects" className={navItemClass}>
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-[#61C9F6]" />
                <span>Game Projects</span>
              </div>
            </NavLink>

            <NavLink to="/import" className={navItemClass}>
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-[#61C9F6]" />
                <span>Spreadsheet Import</span>
              </div>
            </NavLink>
          </nav>
        </div>

        {/* Administration Section (Super Admin Only) */}
        {isSuperAdmin && (
          <div>
            <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2 font-mono">
              Super Admin
            </p>
            <nav className="space-y-1">
              <NavLink to="/team" className={navItemClass}>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#38BDF8]" />
                  <span>Staff & Team</span>
                </div>
              </NavLink>

              <NavLink to="/activity" className={navItemClass}>
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Activity Audit Log</span>
                </div>
              </NavLink>

              <NavLink to="/settings" className={navItemClass}>
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-[#38BDF8]" />
                  <span>Packages & Pricing</span>
                </div>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Staff Identity & Logout Footer */}
      <div className="p-3 border-t border-white/[0.08] bg-[#070B14]/70">
        <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#61C9F6]/20 border border-[#61C9F6]/40 shadow-[0_0_12px_rgba(97,201,246,0.3)] flex items-center justify-center text-xs font-bold text-[#61C9F6] shrink-0">
              {user?.staff_id?.slice(0, 2) || 'TP'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.full_name || 'Staff Member'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-[#61C9F6]/20 text-[#61C9F6] border border-[#61C9F6]/40 font-bold">
                  {user?.staff_id}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Sales'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
