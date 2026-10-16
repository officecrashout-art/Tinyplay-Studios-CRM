import React, { useState } from 'react';
import {
  Bell,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Menu,
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
    <header className="h-16 bg-[#080D18]/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Subtle top specular glass highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* Left: Mobile Toggle, Mobile Logo & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl cursor-pointer transition border border-transparent hover:border-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-0.5 border border-[#61C9F6]/40 lg:hidden shadow-md shadow-[#61C9F6]/20 shrink-0">
          <img src="/logo.png" alt="TinyPlay" className="w-full h-full object-contain rounded-lg" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-white leading-tight">
            {title || 'Dashboard'}
          </h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Backend Connectivity Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-xs shadow-inner">
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseConfigured() ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-[#61C9F6] shadow-[0_0_8px_#61C9F6]'
            }`}
          />
          <span className="text-[11px] font-mono text-zinc-300">
            {isSupabaseConfigured() ? 'Supabase Live' : 'Internal Secure Engine'}
          </span>
        </div>

        {/* Follow-up Reminder Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-zinc-400 hover:text-[#61C9F6] hover:bg-white/[0.06] rounded-xl relative transition-all border border-transparent hover:border-white/10 cursor-pointer"
            title="Follow-up Reminders"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#080D18] animate-pulse shadow-md shadow-rose-900/50">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Notifications Glass Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0A1020]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-3.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#61C9F6]" /> Reminders & Follow-ups
                </span>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/follow-ups');
                  }}
                  className="text-[11px] text-[#61C9F6] hover:text-[#93E0FD] flex items-center gap-1 cursor-pointer font-semibold"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {totalAlerts === 0 ? (
                <div className="py-6 text-center text-zinc-400 text-xs">
                  All scheduled follow-ups are up to date! 🎉
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {overdue.map((fu) => (
                    <div
                      key={fu.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/follow-ups');
                      }}
                      className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:border-rose-400/50 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {fu.scheduled_at.split('T')[0]}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white mt-1 truncate">
                        {fu.customer_name}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{fu.reason}</p>
                    </div>
                  ))}

                  {dueToday.map((fu) => (
                    <div
                      key={fu.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/follow-ups');
                      }}
                      className="p-2.5 rounded-xl bg-[#61C9F6]/10 border border-[#61C9F6]/30 hover:border-[#61C9F6]/50 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#61C9F6] flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3" /> Due Today
                        </span>
                        <span className="text-[10px] text-[#61C9F6] font-mono font-bold">Today</span>
                      </div>
                      <p className="text-xs font-semibold text-white mt-1 truncate">
                        {fu.customer_name}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{fu.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Add Lead Button */}
        {onOpenQuickLead && (
          <button
            onClick={onOpenQuickLead}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-extrabold shadow-md shadow-[#61C9F6]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
            <span>Add Lead</span>
          </button>
        )}
      </div>
    </header>
  );
};
