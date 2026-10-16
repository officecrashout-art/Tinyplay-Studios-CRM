import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Clock,
  Menu,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { FollowUp } from '@/types';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenQuickLead?: () => void;
  followUps?: FollowUp[];
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenQuickLead,
  followUps = [],
  onToggleMobileMenu,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const pending = followUps.filter((f) => f.status === 'Pending');
  const overdue = pending.filter((f) => f.scheduled_at < todayStr);
  const dueToday = pending.filter((f) => f.scheduled_at.startsWith(todayStr));
  const totalAlerts = overdue.length + dueToday.length;

  return (
    <header className="h-16 bg-[#121821]/75 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Specular hairline top reflection */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* Left: Mobile Toggle, Mobile Logo & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
          className="lg:hidden min-w-[44px] min-h-[44px] p-2.5 text-[#A3ADBA] hover:text-[#F5F7FA] hover:bg-white/[0.06] rounded-xl cursor-pointer transition border border-transparent hover:border-white/10 flex items-center justify-center shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-0.5 border border-white/20 lg:hidden shadow-sm shrink-0">
          <img src="/logo.png" alt="TinyPlay" className="w-full h-full object-contain rounded-lg" />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-[#F5F7FA] leading-tight truncate">
            {title || 'Dashboard'}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-[#A3ADBA] truncate hidden sm:block mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Backend Connectivity Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.035] border border-white/[0.08] text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseConfigured()
                ? 'bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : 'bg-[#7DD3FC] shadow-[0_0_8px_rgba(125,211,252,0.5)]'
            }`}
          />
          <span className="text-[11px] font-mono text-[#A3ADBA]">
            {isSupabaseConfigured() ? 'Supabase Live' : 'Internal Engine'}
          </span>
        </div>

        {/* Follow-up Reminder Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="min-w-[40px] min-h-[40px] p-2 text-[#A3ADBA] hover:text-[#7DD3FC] hover:bg-white/[0.06] rounded-xl relative transition-all border border-transparent hover:border-white/10 cursor-pointer flex items-center justify-center"
            title="Follow-up Reminders"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FB7185] text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#121821] font-mono shadow-sm">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Notifications Glass Dropdown (Level 3 Floating Glass) */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 glass-floating p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#7DD3FC]" />
                  <span className="text-xs font-semibold text-[#F5F7FA]">Follow-up Alerts</span>
                </div>
                <span className="text-[11px] font-mono text-[#A3ADBA]">
                  {totalAlerts} active
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {totalAlerts === 0 ? (
                  <div className="py-6 text-center text-xs text-[#A3ADBA]">
                    No overdue or pending follow-ups for today.
                  </div>
                ) : (
                  <>
                    {overdue.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/follow-ups');
                        }}
                        className="p-2.5 rounded-xl bg-[#FB7185]/[0.08] border border-[#FB7185]/20 hover:bg-[#FB7185]/[0.14] transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#FECDD3] truncate">
                            {f.customer_name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#FB7185] uppercase">
                            Overdue
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A3ADBA] truncate mt-0.5">
                          {f.reason || 'Scheduled customer follow-up call'}
                        </p>
                      </div>
                    ))}

                    {dueToday.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/follow-ups');
                        }}
                        className="p-2.5 rounded-xl bg-[#FBBF24]/[0.08] border border-[#FBBF24]/20 hover:bg-[#FBBF24]/[0.14] transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#FDE68A] truncate">
                            {f.customer_name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#FBBF24] uppercase">
                            Due Today
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A3ADBA] truncate mt-0.5">
                          {f.reason || 'Scheduled customer check-in'}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-white/[0.08] mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/follow-ups');
                  }}
                  className="text-xs text-[#7DD3FC] hover:text-[#BAE6FD] font-medium flex items-center gap-1 transition"
                >
                  <span>Open Follow-ups</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button: Add Lead */}
        {onOpenQuickLead && (
          <button
            onClick={onOpenQuickLead}
            className="apple-btn-primary min-h-[40px] px-3.5 sm:px-4 py-2 flex items-center gap-2 text-xs font-semibold cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Potential Lead</span>
            <span className="sm:hidden">Add Lead</span>
          </button>
        )}
      </div>
    </header>
  );
};
