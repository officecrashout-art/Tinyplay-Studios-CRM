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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  pendingFollowUpsCount?: number;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingFollowUpsCount = 0,
  onNavigate,
}) => {
  const { user, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-180 select-none ${
      isActive
        ? 'bg-white/[0.09] text-[#F5F7FA] border border-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.18)] font-semibold'
        : 'text-[#A3ADBA] hover:text-[#F5F7FA] hover:bg-white/[0.045] border border-transparent'
    }`;

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className="w-64 bg-[#121821]/80 backdrop-blur-2xl border-r border-white/[0.09] flex flex-col h-screen sticky top-0 select-none z-30 shadow-[10px_0_30px_rgba(0,0,0,0.28)]">
      {/* Specular hairline top reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Brand Header with Official Logo */}
      <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shadow-black/40 border border-white/20 overflow-hidden shrink-0 p-0.5">
          <img src="/logo.png" alt="TinyPlay" className="w-full h-full object-contain rounded-xl" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-[#F5F7FA] tracking-tight leading-none truncate">
            TinyPlay<span className="text-[#7DD3FC]">Studioz</span>
          </h1>
          <p className="text-[10px] text-[#A3ADBA] font-mono tracking-wider mt-1 uppercase">
            Sales & Project CRM
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Sales CRM */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-2 font-mono">
            Sales Operations
          </p>
          <nav className="space-y-1">
            <NavLink to="/dashboard" onClick={handleLinkClick} className={navItemClass}>
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7DD3FC]' : 'text-[#A3ADBA] group-hover:text-[#F5F7FA]'}`} />
                    <span>Dashboard</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />}
                </>
              )}
            </NavLink>

            <NavLink to="/leads" onClick={handleLinkClick} className={navItemClass}>
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Users className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7DD3FC]' : 'text-[#A3ADBA] group-hover:text-[#F5F7FA]'}`} />
                    <span>Leads CRM</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />}
                </>
              )}
            </NavLink>

            <NavLink to="/follow-ups" onClick={handleLinkClick} className={navItemClass}>
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <CalendarClock className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7DD3FC]' : 'text-[#A3ADBA] group-hover:text-[#F5F7FA]'}`} />
                    <span>Follow-ups</span>
                  </div>
                  {pendingFollowUpsCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold pill-sky">
                      {pendingFollowUpsCount}
                    </span>
                  ) : (
                    isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />
                  )}
                </>
              )}
            </NavLink>

            <NavLink to="/customers" onClick={handleLinkClick} className={navItemClass}>
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <UserCheck className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7DD3FC]' : 'text-[#A3ADBA] group-hover:text-[#F5F7FA]'}`} />
                    <span>Confirmed Clients</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />}
                </>
              )}
            </NavLink>

            <NavLink to="/projects" onClick={handleLinkClick} className={navItemClass}>
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Briefcase className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7DD3FC]' : 'text-[#A3ADBA] group-hover:text-[#F5F7FA]'}`} />
                    <span>Game Projects</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />}
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Administration & Systems */}
        {isSuperAdmin && (
          <div>
            <p className="px-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-2 font-mono">
              Administration
            </p>
            <nav className="space-y-1">
              <NavLink to="/import" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7DD3FC]' : 'text-[#A3ADBA] group-hover:text-[#F5F7FA]'}`} />
                      <span>Spreadsheet Import</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />}
                  </>
                )}
              </NavLink>

              <NavLink to="/team" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Users className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7DD3FC]' : 'text-[#A3ADBA] group-hover:text-[#F5F7FA]'}`} />
                      <span>Staff & Team</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />}
                  </>
                )}
              </NavLink>

              <NavLink to="/activity" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <ShieldAlert className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-400' : 'text-[#A3ADBA] group-hover:text-[#F5F7FA]'}`} />
                      <span>Activity Audit Log</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />}
                  </>
                )}
              </NavLink>

              <NavLink to="/settings" onClick={handleLinkClick} className={navItemClass}>
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Settings className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7DD3FC]' : 'text-[#A3ADBA] group-hover:text-[#F5F7FA]'}`} />
                      <span>Packages & Pricing</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC]" />}
                  </>
                )}
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Staff Identity & Logout Footer */}
      <div className="p-3 border-t border-white/[0.08] bg-[#0E141D]/60 backdrop-blur-md">
        <div className="p-2.5 rounded-2xl bg-white/[0.035] border border-white/[0.08] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#7DD3FC]/15 border border-[#7DD3FC]/30 flex items-center justify-center text-xs font-bold text-[#7DD3FC] shrink-0 font-mono">
              {user?.staff_id?.slice(0, 2) || 'TP'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#F5F7FA] truncate">
                {user?.full_name || 'Staff Member'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-white/[0.06] text-[#A3ADBA] border border-white/[0.08]">
                  {user?.staff_id}
                </span>
                <span className="text-[10px] text-[#64748B] font-medium">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Sales'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-[#A3ADBA] hover:text-[#FB7185] hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
