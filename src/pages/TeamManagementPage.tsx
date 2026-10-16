import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Lock,
  UserX,
  UserCheck,
  RefreshCw,
  Key,
  AlertCircle,
  CheckCircle2,
  Phone,
  Shuffle,
  X,
  Trash2,
  ShieldAlert,
  Sparkles,
  Edit3,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiStaff } from '@/services/api';
import { StaffProfile } from '@/types';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';

export const TeamManagementPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStaffId, setNewStaffId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'SALES' | 'SUPER_ADMIN'>('SALES');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Change Password Modal
  const [passwordTarget, setPasswordTarget] = useState<StaffProfile | null>(null);
  const [updatedPass, setUpdatedPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [resetEmailSuccess, setResetEmailSuccess] = useState<string | null>(null);
  const [resetEmailLoading, setResetEmailLoading] = useState(false);

  // Reassignment Modal
  const [reassignFrom, setReassignFrom] = useState<StaffProfile | null>(null);
  const [reassignToId, setReassignToId] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);

  // Delete Staff Modal
  const [deletingStaff, setDeletingStaff] = useState<StaffProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit Staff Modal
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'SALES' | 'SUPER_ADMIN'>('SALES');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = (s: StaffProfile) => {
    setEditingStaff(s);
    setEditFullName(s.full_name);
    setEditEmail(s.email || '');
    setEditRole(s.role);
    setEditPhone(s.phone || '');
    setEditIsActive(s.is_active);
    setEditError(null);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editFullName.trim()) {
      setEditError('Full name is required');
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);
      const updated = await apiStaff.updateStaff(editingStaff.id, {
        full_name: editFullName.trim(),
        email: editEmail.trim() || undefined,
        role: editRole,
        phone: editPhone.trim() || undefined,
        is_active: editIsActive,
      });

      setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditingStaff(null);
      await loadStaff();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update staff member');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSendResetEmail = async (email: string) => {
    try {
      setResetEmailLoading(true);
      setPassError(null);
      setResetEmailSuccess(null);
      await apiStaff.sendPasswordResetEmail(email);
      setResetEmailSuccess(`Password reset email sent to ${email}`);
    } catch (err: any) {
      setPassError(err?.message || 'Failed to send reset email');
    } finally {
      setResetEmailLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await apiStaff.listStaff();
      const sorted = [...data].sort((a, b) => {
        if (a.role === 'SUPER_ADMIN' && b.role !== 'SUPER_ADMIN') return -1;
        if (b.role === 'SUPER_ADMIN' && a.role !== 'SUPER_ADMIN') return 1;
        return a.staff_id.localeCompare(b.staff_id, undefined, { numeric: true });
      });
      setStaff(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffId.trim() || !newFullName.trim() || !newPassword) {
      setCreateError('Please complete all required fields');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      const newMember = await apiStaff.createStaff({
        staff_id: newStaffId.trim().toUpperCase(),
        full_name: newFullName.trim(),
        email: newEmail.trim() || undefined,
        password: newPassword,
        phone: newPhone.trim() || undefined,
        role: newRole,
      });

      // Update UI immediately
      setStaff((prev) => {
        const filtered = prev.filter((s) => s.staff_id.toUpperCase() !== newMember.staff_id.toUpperCase());
        return [...filtered, newMember].sort((a, b) => a.staff_id.localeCompare(b.staff_id));
      });

      setIsCreateOpen(false);
      setNewStaffId('');
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      await loadStaff();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create staff account');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (s: StaffProfile) => {
    if (s.id === user?.id && s.is_active) {
      alert('You cannot deactivate your own Super Admin account.');
      return;
    }
    const confirmMsg = s.is_active
      ? `Disable staff account for ${s.staff_id} (${s.full_name})? They will immediately lose CRM access.`
      : `Re-activate staff account for ${s.staff_id}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await apiStaff.toggleActive(s.id, !s.is_active);
      loadStaff();
    } catch (err: any) {
      alert(err?.message || 'Action failed');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || !updatedPass || updatedPass.length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }

    try {
      setPassLoading(true);
      setPassError(null);
      await apiStaff.changePassword(passwordTarget.id, updatedPass);
      setPasswordTarget(null);
      setUpdatedPass('');
      alert(`Password updated successfully for ${passwordTarget.staff_id}`);
    } catch (err: any) {
      setPassError(err?.message || 'Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleReassignWorkload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignFrom || !reassignToId) return;

    try {
      setReassignLoading(true);
      const res = await apiStaff.reassignAllWorkload(reassignFrom.id, reassignToId);
      setReassignSuccess(
        `Successfully transferred ${res.reassignedLeads} leads and ${res.reassignedProjects} projects.`
      );
      setTimeout(() => {
        setReassignFrom(null);
        setReassignSuccess(null);
      }, 2000);
    } catch (err: any) {
      alert(err?.message || 'Reassignment failed');
    } finally {
      setReassignLoading(false);
    }
  };

  const teamStats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter((s) => s.is_active).length;
    const sales = staff.filter((s) => s.role === 'SALES').length;
    const admins = staff.filter((s) => s.role === 'SUPER_ADMIN').length;
    return { total, active, sales, admins };
  }, [staff]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="apple-panel relative overflow-hidden p-6 sm:p-7">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full pill-sky text-[11px] font-medium tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>Super Admin Authority Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
              Staff & Team Administration
            </h1>
            <p className="text-xs text-[#A3ADBA] max-w-xl">
              Provision internal salesperson credentials, configure roles, reset access passwords, and reallocate client workloads.
            </p>
          </div>

          <button
            onClick={() => {
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            className="apple-btn-primary min-h-[42px] px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-[#0A101D] stroke-[2.5]" />
            <span>Provision Staff Account</span>
          </button>
        </div>

        {/* Team KPI Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-inner p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3ADBA] block">Total Team</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#F5F7FA]">{teamStats.total}</span>
              <span className="text-[11px] text-[#A3ADBA]">accounts</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#34D399]/20 bg-[#34D399]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7F3D0] block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#34D399]" /> Active Roster
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#A7F3D0]">{teamStats.active}</span>
              <span className="text-[11px] text-[#34D399]/70">online</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#7DD3FC]/20 bg-[#7DD3FC]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#BAE6FD] block">Sales Force</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#BAE6FD]">{teamStats.sales}</span>
              <span className="text-[11px] text-[#7DD3FC]/70">representatives</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#FBBF24]/20 bg-[#FBBF24]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FDE68A] block flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-[#FBBF24]" /> Super Admins
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#FDE68A]">{teamStats.admins}</span>
              <span className="text-[11px] text-[#FBBF24]/70">executives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="apple-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="apple-table w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#A3ADBA] font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Staff ID</th>
                <th className="py-3.5 px-4 font-semibold">Full Name</th>
                <th className="py-3.5 px-4 font-semibold">Auth Identifier</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Account Status</th>
                <th className="py-3.5 px-4 font-semibold">Phone</th>
                <th className="py-3.5 px-4 font-semibold text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#A3ADBA] font-mono">
                    Synchronizing team directory...
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.035] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#7DD3FC] flex items-center gap-2">
                      <span className="pill-sky px-2.5 py-0.5 rounded-xl">
                        {s.staff_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#F5F7FA]">{s.full_name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#A3ADBA]">{s.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider ${
                          s.role === 'SUPER_ADMIN'
                            ? 'pill-amber'
                            : 'pill-sky'
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.is_active ? (
                        <span className="pill-emerald inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-[#34D399]" /> Active
                        </span>
                      ) : (
                        <span className="pill-rose inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                          <AlertCircle className="w-3 h-3 text-[#FB7185]" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#A3ADBA]">{s.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Staff Profile */}
                        <button
                          onClick={() => openEditModal(s)}
                          title="Edit Staff Details"
                          className="apple-btn-secondary p-1.5 text-xs transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#7DD3FC]" />
                        </button>

                        {/* Change Password */}
                        <button
                          onClick={() => {
                            setPasswordTarget(s);
                            setUpdatedPass('');
                            setPassError(null);
                          }}
                          title="Reset Password"
                          className="apple-btn-secondary p-1.5 text-xs transition cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5 text-[#7DD3FC]" />
                        </button>

                        {/* Reassign Workload (Sales only) */}
                        {s.role === 'SALES' && (
                          <button
                            onClick={() => {
                              setReassignFrom(s);
                              setReassignToId('');
                              setReassignSuccess(null);
                            }}
                            title="Reassign Customer Workload"
                            className="apple-btn-secondary p-1.5 text-xs transition cursor-pointer"
                          >
                            <Shuffle className="w-3.5 h-3.5 text-[#7DD3FC]" />
                          </button>
                        )}

                        {/* Toggle Active / Disabled */}
                        {s.id !== user?.id && (
                          <button
                            onClick={() => handleToggleActive(s)}
                            title={s.is_active ? 'Deactivate Account' : 'Activate Account'}
                            className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
                              s.is_active
                                ? 'pill-rose'
                                : 'pill-emerald'
                            }`}
                          >
                            {s.is_active ? (
                              <UserX className="w-3.5 h-3.5 text-[#FB7185]" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-[#34D399]" />
                            )}
                          </button>
                        )}

                        {/* Delete Staff Account */}
                        {s.id !== user?.id && (
                          <button
                            onClick={() => setDeletingStaff(s)}
                            title="Delete Staff Account"
                            className="p-1.5 rounded-xl pill-rose text-xs transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#FB7185]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: Provision New Staff */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 apple-backdrop animate-in fade-in">
          <div className="apple-modal w-full max-w-md p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7DD3FC]" />
                <h3 className="text-sm font-semibold text-[#F5F7FA]">Provision Staff Account</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[#A3ADBA] hover:text-[#F5F7FA] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl pill-rose text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Unique Staff ID (e.g. SALES-004) <span className="text-[#7DD3FC]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="SALES-004"
                  value={newStaffId}
                  onChange={(e) => setNewStaffId(e.target.value.toUpperCase())}
                  className="apple-input w-full px-3.5 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Full Name <span className="text-[#7DD3FC]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sales Representative Name"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="apple-input w-full px-3.5 py-2"
                />
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Email Address <span className="text-[#7DD3FC]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="sales.rep@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value.toLowerCase())}
                  className="apple-input w-full px-3.5 py-2 font-mono"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Used by Supabase to send official password reset links and account notifications.
                </p>
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Initial Password <span className="text-[#7DD3FC]">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="apple-input w-full px-3.5 py-2"
                />
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+880 1..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="apple-input w-full px-3.5 py-2"
                />
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="apple-input w-full px-3.5 py-2 cursor-pointer"
                >
                  <option value="SALES">SALES (Salesperson)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Executive)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="apple-btn-secondary px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="apple-btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                >
                  {createLoading ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Change Password */}
      {passwordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 apple-backdrop animate-in fade-in">
          <div className="apple-modal w-full max-w-sm p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#7DD3FC]" />
                <h3 className="text-sm font-semibold text-[#F5F7FA]">
                  Reset Password for {passwordTarget.staff_id}
                </h3>
              </div>
              <button
                onClick={() => {
                  setPasswordTarget(null);
                  setResetEmailSuccess(null);
                  setPassError(null);
                }}
                className="text-[#A3ADBA] hover:text-[#F5F7FA] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passError && (
              <div className="p-3 rounded-xl pill-rose text-xs">
                {passError}
              </div>
            )}

            {resetEmailSuccess && (
              <div className="p-3 rounded-xl pill-emerald text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                <span>{resetEmailSuccess}</span>
              </div>
            )}

            {/* Supabase Password Reset Email Dispatch */}
            <div className="p-3.5 rounded-2xl glass-inner space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#A3ADBA]">Target Email:</span>
                <span className="text-[#F5F7FA] font-mono font-semibold truncate max-w-[180px]">{passwordTarget.email}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSendResetEmail(passwordTarget.email)}
                disabled={resetEmailLoading}
                className="apple-btn-secondary w-full py-2 px-3 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-[#7DD3FC]" />
                <span>{resetEmailLoading ? 'Dispatching Email...' : 'Send Password Reset Email'}</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/[0.08]"></div>
              <span className="flex-shrink mx-2 text-[10px] uppercase font-mono text-[#64748B]">Or Set Directly</span>
              <div className="flex-grow border-t border-white/[0.08]"></div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={updatedPass}
                  onChange={(e) => setUpdatedPass(e.target.value)}
                  className="apple-input w-full px-3.5 py-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setPasswordTarget(null)}
                  className="apple-btn-secondary px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="apple-btn-primary px-5 py-2 font-semibold disabled:opacity-50 transition cursor-pointer"
                >
                  {passLoading ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Reassign Workload */}
      {reassignFrom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 apple-backdrop animate-in fade-in">
          <div className="apple-modal w-full max-w-md p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-[#7DD3FC]" />
                <h3 className="text-sm font-semibold text-[#F5F7FA]">
                  Reassign Workload from {reassignFrom.staff_id}
                </h3>
              </div>
              <button
                onClick={() => setReassignFrom(null)}
                className="text-[#A3ADBA] hover:text-[#F5F7FA] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reassignSuccess ? (
              <div className="p-3.5 rounded-xl pill-emerald text-xs">
                {reassignSuccess}
              </div>
            ) : (
              <form onSubmit={handleReassignWorkload} className="space-y-4 text-xs">
                <p className="text-[#A3ADBA]">
                  Transfer all leads, customers, and active game projects currently assigned to{' '}
                  <strong className="text-[#F5F7FA]">{reassignFrom.full_name} ({reassignFrom.staff_id})</strong> to another salesperson:
                </p>

                <div>
                  <label className="block text-[#A3ADBA] font-medium mb-1">
                    Select Target Salesperson
                  </label>
                  <select
                    required
                    value={reassignToId}
                    onChange={(e) => setReassignToId(e.target.value)}
                    className="apple-input w-full px-3.5 py-2.5 cursor-pointer"
                  >
                    <option value="">Choose salesperson...</option>
                    {staff
                      .filter((s) => s.id !== reassignFrom.id && s.is_active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.staff_id} — {s.full_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setReassignFrom(null)}
                    className="apple-btn-secondary px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reassignLoading || !reassignToId}
                    className="apple-btn-primary px-5 py-2 font-semibold disabled:opacity-50 transition cursor-pointer"
                  >
                    {reassignLoading ? 'Transferring...' : 'Transfer Workload'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. Modal: Edit Staff Member */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 apple-backdrop animate-in fade-in">
          <div className="apple-modal w-full max-w-md p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#7DD3FC]" />
                <h3 className="text-sm font-semibold text-[#F5F7FA]">
                  Edit Staff: <span className="font-mono text-[#7DD3FC]">{editingStaff.staff_id}</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-[#A3ADBA] hover:text-[#F5F7FA] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl pill-rose text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Full Name <span className="text-[#FB7185]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="apple-input w-full px-3.5 py-2"
                  placeholder="e.g. Tanvir Hossain"
                />
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Email Address <span className="text-[#FB7185]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value.toLowerCase())}
                  className="apple-input w-full px-3.5 py-2 font-mono"
                  placeholder="e.g. tanvir@gmail.com"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Password reset links will be sent to this email address.
                </p>
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Assigned Role <span className="text-[#FB7185]">*</span>
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'SALES' | 'SUPER_ADMIN')}
                  className="apple-input w-full px-3.5 py-2 cursor-pointer"
                >
                  <option value="SALES" className="bg-[#121821] text-[#F5F7FA]">Sales Representative (Restricted Access)</option>
                  <option value="SUPER_ADMIN" className="bg-[#121821] text-[#F5F7FA]">Super Admin (Full Administrative Authority)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="apple-input w-full px-3.5 py-2 font-mono"
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[#F5F7FA]">
                    <input
                      type="radio"
                      name="account_status"
                      checked={editIsActive}
                      onChange={() => setEditIsActive(true)}
                      className="accent-[#7DD3FC]"
                    />
                    <span>Active (Allowed to login)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#A3ADBA]">
                    <input
                      type="radio"
                      name="account_status"
                      checked={!editIsActive}
                      onChange={() => setEditIsActive(false)}
                      disabled={editingStaff.id === user?.id}
                      className="accent-[#FB7185]"
                    />
                    <span>Disabled</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="apple-btn-secondary px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="apple-btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Staff Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingStaff)}
        title="Delete Staff Member Account"
        itemName={deletingStaff ? `${deletingStaff.staff_id} - ${deletingStaff.full_name}` : ''}
        message="Are you sure you want to permanently delete this staff member? If they have assigned leads or projects, consider reassigning their workload first."
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!deletingStaff) return;
          try {
            setDeleteLoading(true);
            await apiStaff.deleteStaff(deletingStaff.id);
            setDeletingStaff(null);
            loadStaff();
          } catch (err: any) {
            alert(err?.message || 'Failed to delete staff account');
          } finally {
            setDeleteLoading(false);
          }
        }}
        onClose={() => setDeletingStaff(null)}
      />
    </div>
  );
};
