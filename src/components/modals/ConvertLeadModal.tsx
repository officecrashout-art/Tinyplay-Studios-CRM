import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  CheckCircle2,
  Gamepad2,
  DollarSign,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiLeads, apiPackages } from '@/services/api';
import { Lead, Package, Contact, Project, Payment } from '@/types';

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSuccess: (result: { contact: Contact; project: Project; payment?: Payment }) => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSuccess,
}) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [gameTitle, setGameTitle] = useState('');
  const [personalizedDescription, setPersonalizedDescription] = useState('');
  const [packageId, setPackageId] = useState('');
  const [agreedPriceBDT, setAgreedPriceBDT] = useState<number | string>(0);
  const [customRequirements, setCustomRequirements] = useState('');
  const [assignedDeveloper, setAssignedDeveloper] = useState('Rakib (Lead Godot Dev)');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');

  // Advance Payment
  const [hasAdvancePayment, setHasAdvancePayment] = useState(true);
  const [advanceAmountBDT, setAdvanceAmountBDT] = useState<number | string>(10000);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash' | 'Other'>('bKash');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('Booking advance payment upon confirmation');

  useEffect(() => {
    if (isOpen && lead) {
      loadPackages();
      setGameTitle(`${lead.customer_name}'s Personalized ${lead.game_type}`);
      setPersonalizedDescription(
        `Personalized ${lead.game_type} designed for ${lead.customer_name}. ${lead.conversation_notes || ''}`
      );
      setPackageId(lead.package_id || '');
      setAgreedPriceBDT(lead.estimated_budget_bdt || 20000);
      setAdvanceAmountBDT(Math.round((Number(lead.estimated_budget_bdt) || 20000) * 0.5));
      setError(null);
    }
  }, [isOpen, lead]);

  const loadPackages = async () => {
    try {
      const pkgs = await apiPackages.listPackages();
      setPackages(pkgs);
      if (lead?.package_id) {
        const found = pkgs.find((p) => p.id === lead.package_id);
        if (found) {
          setAgreedPriceBDT(found.base_price_bdt);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePackageChange = (pId: string) => {
    setPackageId(pId);
    const sel = packages.find((p) => p.id === pId);
    if (sel) {
      setAgreedPriceBDT(sel.base_price_bdt);
      setAdvanceAmountBDT(Math.round(sel.base_price_bdt * 0.5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (!gameTitle.trim()) {
      setError('Game title is required');
      return;
    }

    const price = Number(agreedPriceBDT);
    if (isNaN(price) || price <= 0) {
      setError('Please specify a valid agreed price');
      return;
    }

    const advance = hasAdvancePayment ? Number(advanceAmountBDT) : 0;
    if (hasAdvancePayment && (isNaN(advance) || advance < 0 || advance > price)) {
      setError('Advance payment cannot exceed the total agreed price');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiLeads.convertLeadToCustomer(lead.id, {
        game_title: gameTitle.trim(),
        personalized_description: personalizedDescription.trim() || undefined,
        package_id: packageId || undefined,
        agreed_price_bdt: price,
        custom_requirements: customRequirements.trim() || undefined,
        assigned_developer: assignedDeveloper.trim() || undefined,
        target_delivery_date: targetDeliveryDate || undefined,
        advance_payment: hasAdvancePayment && advance > 0
          ? {
              amount_bdt: advance,
              payment_method: paymentMethod,
              transaction_ref: transactionRef.trim() || undefined,
              notes: paymentNotes.trim() || undefined,
            }
          : undefined,
      });

      // Celebration burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#6366f1', '#10b981', '#f59e0b'],
        });
      } catch {}

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to convert lead');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative rounded-3xl bg-[#0E0E18]/95 border border-white/15 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#61C9F6]/15 border border-[#61C9F6]/30 flex items-center justify-center text-[#61C9F6] shadow-[0_0_15px_rgba(97,201,246,0.2)]">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Convert Lead to Confirmed Project
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Deal Won
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Converting {lead.customer_name} ({lead.platform} @{lead.handle})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Game Project Title <span className="text-[#61C9F6]">*</span>
              </label>
              <div className="relative">
                <Gamepad2 className="w-4 h-4 text-[#61C9F6] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="e.g. Farhan's Dhaka Rush"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#61C9F6] transition shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Package
                </label>
                <select
                  value={packageId}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#61C9F6] transition cursor-pointer"
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
                  Agreed Project Price in BDT (৳) <span className="text-[#61C9F6]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={agreedPriceBDT}
                  onChange={(e) => setAgreedPriceBDT(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#61C9F6] transition font-mono"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  This price is permanently frozen for this project.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Assigned Game Developer
                </label>
                <input
                  type="text"
                  value={assignedDeveloper}
                  onChange={(e) => setAssignedDeveloper(e.target.value)}
                  placeholder="Developer name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#61C9F6] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Target Delivery Date
                </label>
                <input
                  type="date"
                  value={targetDeliveryDate}
                  onChange={(e) => setTargetDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#61C9F6] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Personalized Game Description & Plot
              </label>
              <textarea
                rows={2}
                value={personalizedDescription}
                onChange={(e) => setPersonalizedDescription(e.target.value)}
                placeholder="Game backstory, player goals, theme..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#61C9F6] transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Custom Requirements & Art Details
              </label>
              <textarea
                rows={2}
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                placeholder="Specific sprite reference photos, Bengali audio snippets, special stage layout..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#61C9F6] transition resize-none"
              />
            </div>
          </div>

          {/* Advance Payment Section */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAdvancePayment}
                  onChange={(e) => setHasAdvancePayment(e.target.checked)}
                  className="w-4 h-4 rounded text-[#61C9F6] focus:ring-[#61C9F6] bg-black/40 border-white/20"
                />
                <span className="text-xs font-semibold text-white">
                  Record Advance Deposit Payment Now
                </span>
              </label>
              <span className="text-[11px] text-zinc-400 font-mono">bKash / Nagad / Bank</span>
            </div>

            {hasAdvancePayment && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Advance Amount (৳)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={advanceAmountBDT}
                    onChange={(e) => setAdvanceAmountBDT(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#61C9F6] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#61C9F6] cursor-pointer"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    TrxID / Reference Ref
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. BK9X88210"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#61C9F6] font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-medium cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-black shadow-lg shadow-[#61C9F6]/25 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {loading ? (
                <span>Converting...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Order & Launch Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
