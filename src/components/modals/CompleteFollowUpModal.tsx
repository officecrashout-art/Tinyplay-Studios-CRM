import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { apiFollowUps } from '@/services/api';
import { FollowUp } from '@/types';

interface CompleteFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUp | null;
  onSuccess: (updated: FollowUp) => void;
}

export const CompleteFollowUpModal: React.FC<CompleteFollowUpModalProps> = ({
  isOpen,
  onClose,
  followUp,
  onSuccess,
}) => {
  const [resultNotes, setResultNotes] = useState('');
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDate, setNextDate] = useState('');
  const [nextReason, setNextReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !followUp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultNotes.trim()) {
      setError('Please provide conversation outcome notes');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nextPayload = scheduleNext && nextDate
        ? { date: new Date(nextDate).toISOString(), reason: nextReason || 'Next follow-up' }
        : undefined;

      const updated = await apiFollowUps.completeFollowUp(
        followUp.id,
        resultNotes.trim(),
        nextPayload
      );

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete follow-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative rounded-3xl bg-[#0E0E18]/95 border border-white/15 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#61C9F6]/15 border border-[#61C9F6]/30 flex items-center justify-center text-[#61C9F6] shadow-[0_0_15px_rgba(97,201,246,0.2)]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Complete Follow-up</h3>
              <p className="text-xs text-zinc-400 truncate max-w-xs">{followUp.customer_name}</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <p className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Original Scheduled Purpose</p>
            <p className="text-xs text-zinc-200 font-semibold mt-1">{followUp.reason}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Call / Conversation Outcome Notes <span className="text-[#61C9F6]">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              placeholder="What did the customer decide? Are they ready to place an advance or asked for an updated gameplay demo?"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#61C9F6] transition resize-none"
            />
          </div>

          {/* Schedule Next Follow-up Option */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                className="w-4 h-4 rounded text-[#61C9F6] focus:ring-[#61C9F6] bg-black/40 border-white/20"
              />
              <span className="text-xs font-semibold text-white">
                Schedule Consecutive Follow-up
              </span>
            </label>

            {scheduleNext && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Next Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required={scheduleNext}
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#61C9F6]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Reason / Agenda
                  </label>
                  <input
                    type="text"
                    required={scheduleNext}
                    value={nextReason}
                    onChange={(e) => setNextReason(e.target.value)}
                    placeholder="e.g. Check if advance deposit has been sent"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#61C9F6]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
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
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Completed & Log</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
