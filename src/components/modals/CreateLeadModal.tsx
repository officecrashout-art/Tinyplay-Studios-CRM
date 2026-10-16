import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Sparkles,
  Phone,
  Calendar,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { apiLeads, apiPackages, apiStaff } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Platform, LeadStatus, LeadPriority, Package, StaffProfile, Lead } from '@/types';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLead: Lead) => void;
  initialData?: Partial<Lead>;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { user, isSuperAdmin } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [handle, setHandle] = useState('');
  const [phone, setPhone] = useState('');
  const [gameType, setGameType] = useState('2D Platformer');
  const [packageId, setPackageId] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState<number | string>(18000);
  const [leadSource, setLeadSource] = useState('Instagram DM');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [priority, setPriority] = useState<LeadPriority>('Warm');
  const [conversationNotes, setConversationNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      if (initialData) {
        setCustomerName(initialData.customer_name || '');
        setPlatform(initialData.platform || 'Instagram');
        setHandle(initialData.handle || '');
        setPhone(initialData.phone || '');
        setGameType(initialData.game_type || '2D Platformer');
        setPackageId(initialData.package_id || '');
        setEstimatedBudget(initialData.estimated_budget_bdt || 18000);
        setLeadSource(initialData.lead_source || 'Instagram DM');
        setStatus(initialData.status || 'New');
        setPriority(initialData.priority || 'Warm');
        setConversationNotes(initialData.conversation_notes || '');
        setNextFollowUpDate(initialData.next_follow_up_at?.slice(0, 16) || '');
        setFollowUpReason(initialData.follow_up_reason || '');
        setAssignedTo(initialData.assigned_to || user?.id || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const loadDependencies = async () => {
    try {
      const [pkgs, staff] = await Promise.all([
        apiPackages.listPackages(),
        apiStaff.listStaff(),
      ]);
      setPackages(pkgs.filter((p) => p.is_active));
      setStaffMembers(staff.filter((s) => s.is_active));
      if (!initialData) {
        setAssignedTo(user?.id || '');
        if (pkgs.length > 0 && !packageId) {
          setPackageId(pkgs[0].id);
          setEstimatedBudget(pkgs[0].base_price_bdt);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setPlatform('Instagram');
    setHandle('');
    setPhone('');
    setGameType('2D Platformer');
    setLeadSource('Instagram DM');
    setStatus('New');
    setPriority('Warm');
    setConversationNotes('');
    setNextFollowUpDate('');
    setFollowUpReason('');
    setDuplicateWarning(null);
    setError(null);
  };

  // Real-time duplicate check when handle or platform changes
  const checkDuplicate = async (plat: Platform, hndl: string) => {
    if (!hndl || hndl.trim().length < 2) {
      setDuplicateWarning(null);
      return;
    }
    const check = await apiLeads.checkDuplicateLead(plat, hndl, initialData?.id);
    if (check.isDuplicate && check.existingLead) {
      setDuplicateWarning(
        `Possible duplicate: Customer @${check.existingLead.handle} on ${plat} is already registered under ${check.existingLead.customer_name} (${check.existingLead.status}).`
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  const handlePackageChange = (pId: string) => {
    setPackageId(pId);
    const sel = packages.find((p) => p.id === pId);
    if (sel) {
      setEstimatedBudget(sel.base_price_bdt);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!handle.trim()) {
      setError('Social handle / username is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        customer_name: customerName,
        platform,
        handle: handle.replace(/^@/, '').trim(),
        phone: phone.trim() || undefined,
        game_type: gameType,
        package_id: packageId || undefined,
        estimated_budget_bdt: Number(estimatedBudget) || 0,
        lead_source: leadSource,
        status,
        priority,
        conversation_notes: conversationNotes.trim() || undefined,
        next_follow_up_at: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
        follow_up_reason: followUpReason.trim() || undefined,
        assigned_to: assignedTo || user?.id,
      };

      let resultLead: Lead;
      if (initialData?.id) {
        resultLead = await apiLeads.updateLead(initialData.id, payload);
      } else {
        resultLead = await apiLeads.createLead(payload);
      }

      onSuccess(resultLead);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0E0E1A]/90 backdrop-blur-2xl border border-white/10 w-full max-w-2xl rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Subtle top specular glass highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#61C9F6]/20 border border-[#61C9F6]/40 shadow-[0_0_12px_rgba(97,201,246,0.25)] flex items-center justify-center text-[#61C9F6]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {initialData?.id ? 'Edit Lead Details' : 'Add Potential Customer / Lead'}
              </h3>
              <p className="text-xs text-zinc-400">
                Personalized game sales inquiry & follow-up scheduler
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Customer & Social Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Customer Display Name <span className="text-[#61C9F6]">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Farhan Ahmed"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +880 1711-XXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              />
            </div>
          </div>

          {/* Social Platform & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Platform <span className="text-[#61C9F6]">*</span>
              </label>
              <select
                value={platform}
                onChange={(e) => {
                  const newPlat = e.target.value as Platform;
                  setPlatform(newPlat);
                  checkDuplicate(newPlat, handle);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              >
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Handle / Username <span className="text-[#61C9F6]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-400 text-sm">@</span>
                <input
                  type="text"
                  required
                  value={handle}
                  onChange={(e) => {
                    const h = e.target.value;
                    setHandle(h);
                    checkDuplicate(platform, h);
                  }}
                  placeholder="username"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
                />
              </div>
            </div>
          </div>

          {/* Game Interest & Package */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Game Type <span className="text-[#61C9F6]">*</span>
              </label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              >
                <option value="2D Platformer">2D Platformer</option>
                <option value="2D Endless Runner">2D Endless Runner</option>
                <option value="Arcade Tap Game">Arcade Tap Game</option>
                <option value="Custom Story RPG">Custom Story RPG</option>
                <option value="Puzzle / Brain Game">Puzzle / Brain Game</option>
                <option value="Visual Novel">Visual Novel</option>
                <option value="Action Fighter">Action Fighter</option>
                <option value="Other Custom">Other Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Interested Package
              </label>
              <select
                value={packageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              >
                <option value="">Custom Package</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} (৳{pkg.base_price_bdt.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Budget in BDT (৳)
              </label>
              <input
                type="number"
                min="0"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                placeholder="35000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              />
            </div>
          </div>

          {/* Lead Status, Priority, & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up Scheduled">Follow-up Scheduled</option>
                <option value="Contact Later">Contact Later</option>
                <option value="Negotiating">Negotiating</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Interest Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              >
                <option value="Hot">🔥 Hot (High Intent)</option>
                <option value="Warm">⚡ Warm (Considering)</option>
                <option value="Cold">❄️ Cold (Browsing / Passive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Lead Source
              </label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              >
                <option value="Instagram DM">Instagram DM</option>
                <option value="Facebook Ad">Facebook Ad</option>
                <option value="Referral">Client Referral</option>
                <option value="TikTok">TikTok</option>
                <option value="Organic">Organic Search</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Assigned Staff (Super Admin can assign, salesperson defaults to self) */}
          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Assign to Salesperson
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition"
              >
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.staff_id} — {s.full_name} ({s.role === 'SUPER_ADMIN' ? 'Admin' : 'Sales'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Follow-up Scheduling */}
          <div className="p-4 rounded-xl bg-[#0E0E17] border border-[#222235] space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#61C9F6]">
              <Calendar className="w-4 h-4 text-[#61C9F6]" />
              <span>Schedule Next Follow-up (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-xs focus:outline-none focus:border-[#61C9F6]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Reason for Follow-up</label>
                <input
                  type="text"
                  value={followUpReason}
                  onChange={(e) => setFollowUpReason(e.target.value)}
                  placeholder="e.g. Send teaser clip & pricing sheet"
                  className="w-full px-3 py-2 rounded-lg bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-xs focus:outline-none focus:border-[#61C9F6]"
                />
              </div>
            </div>
          </div>

          {/* Conversation Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Conversation Notes & Preferences
            </label>
            <textarea
              rows={3}
              value={conversationNotes}
              onChange={(e) => setConversationNotes(e.target.value)}
              placeholder="What kind of customized game did they ask for? Specific character preferences, music or anniversary date?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B11] border border-[#26263B] text-zinc-100 text-sm focus:outline-none focus:border-[#61C9F6] transition resize-none"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-[#212134] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-medium cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-black shadow-lg shadow-[#61C9F6]/25 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{initialData?.id ? 'Update Lead' : 'Save Lead'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
