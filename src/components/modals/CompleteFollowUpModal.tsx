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
    <div className="apple-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="apple-modal w-full max-w-lg flex flex-col relative">
        <div className="apple-specular" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Complete Follow-up</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{followUp.customer_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-lg cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl glass-inner">
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Original Scheduled Purpose</p>
            <p className="text-xs text-slate-200 font-medium mt-1">{followUp.reason}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Call / Conversation Outcome Notes <span className="text-sky-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              placeholder="What did the customer decide? Are they ready to place an advance or asked for an updated gameplay demo?"
              className="apple-input w-full resize-none"
            />
          </div>

          {/* Schedule Next Follow-up Option */}
          <div className="p-4 rounded-xl glass-inner space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                className="w-4 h-4 rounded text-sky-400 focus:ring-sky-400 bg-black/40 border-white/20"
              />
              <span className="text-xs font-semibold text-slate-200">
                Schedule Consecutive Follow-up
              </span>
            </label>

            {scheduleNext && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Next Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required={scheduleNext}
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="apple-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Reason / Agenda
                  </label>
                  <input
                    type="text"
                    required={scheduleNext}
                    value={nextReason}
                    onChange={(e) => setNextReason(e.target.value)}
                    placeholder="e.g. Check if advance deposit has been sent"
                    className="apple-input w-full text-xs"
                  />
                </div>
              </div>
            )}
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
              className="apple-btn-primary flex items-center gap-2"
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
