import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security: Brute-Force Client Protection (Locks after 5 failed attempts for 45s)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (lockoutSeconds > 0) {
      timer = setTimeout(() => {
        setLockoutSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [lockoutSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const cleanStaffId = staffId.trim();
    if (!cleanStaffId || !password) {
      setErrorMessage('Please enter both your Staff ID and Password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await login(cleanStaffId, password);
      setFailedAttempts(0);
      navigate('/dashboard');
    } catch (err: any) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        setLockoutSeconds(45);
        setErrorMessage('Too many failed sign-in attempts. Portal locked for 45 seconds to protect account security.');
      } else {
        setErrorMessage(err?.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Cosmic Glass Glow Orbs with #61C9F6 Sky Blue */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#61C9F6]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#0284C7]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-12 left-10 w-80 h-80 bg-[#38BDF8]/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header with Real TinyPlay Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl shadow-[#61C9F6]/25 border border-[#61C9F6]/40 mb-2 overflow-hidden p-1">
            <img src="/logo.png" alt="TinyPlay Studioz" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            TinyPlay<span className="text-[#61C9F6]">Studioz</span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono tracking-wide uppercase">
            Internal Sales CRM & Project Management
          </p>
        </div>

        {/* Login Card with Frosted Glassmorphism */}
        <div className="bg-[#0A1020]/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-5 relative overflow-hidden">
          {/* Subtle top specular glass highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Staff Portal Access</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Authorized studio team personnel only.
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#61C9F6]">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-mono">
                Staff ID or Registered Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  disabled={lockoutSeconds > 0}
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. ADMIN-001 or staff@tinyplaystudioz.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-mono placeholder:font-sans focus:outline-none focus:border-[#61C9F6] focus:ring-2 focus:ring-[#61C9F6]/30 backdrop-blur-md transition disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={lockoutSeconds > 0}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-[#61C9F6] focus:ring-2 focus:ring-[#61C9F6]/30 backdrop-blur-md transition disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 transition cursor-pointer p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutSeconds > 0}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-sm font-extrabold shadow-lg shadow-[#61C9F6]/35 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying Security Token...</span>
              ) : lockoutSeconds > 0 ? (
                <span>Portal Locked ({lockoutSeconds}s)</span>
              ) : (
                <>
                  <span>Sign In to Studio Portal</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security badge */}
        <div className="flex flex-col items-center justify-center gap-1 text-[11px] text-zinc-500 font-mono text-center">
          <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Supabase Session & Audit Guard Active</span>
          </div>
          <p className="text-[10px] text-zinc-600">
            Session tokens cryptographically hashed • Brute force detection active
          </p>
        </div>
      </div>
    </div>
  );
};
