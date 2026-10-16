import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { apiPayments } from '@/services/api';
import { Project, Payment, PaymentType, PaymentMethod } from '@/types';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess: (payment: Payment) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number | string>('');
  const [paymentType, setPaymentType] = useState<PaymentType>('Partial');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && project) {
      setPaymentDate(new Date().toISOString().split('T')[0]);
      if (project.total_paid_bdt === 0) {
        setPaymentType('Advance');
        setAmount(Math.round(project.agreed_price_bdt * 0.5));
      } else {
        setPaymentType(project.remaining_balance_bdt > 0 ? 'Partial' : 'Final');
        setAmount(project.remaining_balance_bdt);
      }
      setTransactionRef('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Payment amount must be greater than ৳0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payment = await apiPayments.recordPayment({
        project_id: project.id,
        amount_bdt: numAmount,
        payment_type: paymentType,
        payment_method: paymentMethod,
        transaction_ref: transactionRef.trim() || undefined,
        payment_date: paymentDate,
        notes: notes.trim() || undefined,
      });

      onSuccess(payment);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  const currentPaid = project.total_paid_bdt || 0;
  const agreedPrice = project.agreed_price_bdt || 0;
  const numEntered = Number(amount) || 0;
  const projectedRemaining = Math.max(0, agreedPrice - (currentPaid + numEntered));

  return (
    <div className="apple-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="apple-modal w-full max-w-lg flex flex-col relative">
        <div className="apple-specular" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Record Project Payment</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{project.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-lg cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Snapshot Card */}
        <div className="p-4 border-b border-white/[0.06] grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 rounded-xl glass-inner">
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Agreed</p>
            <p className="text-xs font-semibold text-slate-200 font-mono tabular-nums mt-0.5">
              ৳{agreedPrice.toLocaleString()}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
            <p className="text-[10px] text-emerald-400/80 uppercase font-mono tracking-wider">Paid</p>
            <p className="text-xs font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
              ৳{currentPaid.toLocaleString()}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/[0.06] border border-rose-500/20">
            <p className="text-[10px] text-rose-400/80 uppercase font-mono tracking-wider">Balance</p>
            <p className="text-xs font-semibold text-rose-400 font-mono tabular-nums mt-0.5">
              ৳{project.remaining_balance_bdt.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Payment Amount (৳) <span className="text-sky-400">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                className="apple-input w-full font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Payment Stage / Type
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="apple-input w-full cursor-pointer"
              >
                <option value="Advance">Advance Deposit</option>
                <option value="Partial">Partial Milestone</option>
                <option value="Final">Final Delivery Payment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Payment Method <span className="text-sky-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="apple-input w-full cursor-pointer"
              >
                <option value="bKash">bKash (Merchant / Personal)</option>
                <option value="Nagad">Nagad</option>
                <option value="Bank Transfer">Bank Transfer (EFT/NPSB)</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Other">Other Gateway</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="apple-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Transaction ID / Slip Reference
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. BK7729910"
              className="apple-input w-full font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Notes & Verification
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified by accountant on personal bKash"
              className="apple-input w-full"
            />
          </div>

          {/* Balance Preview */}
          <div className="p-3.5 rounded-xl bg-sky-500/[0.08] border border-sky-400/20 flex items-center justify-between">
            <span className="text-xs text-sky-300 font-medium">New Remaining Balance:</span>
            <span className="text-sm font-semibold font-mono tabular-nums text-slate-100">
              ৳{projectedRemaining.toLocaleString()}
            </span>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="apple-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
