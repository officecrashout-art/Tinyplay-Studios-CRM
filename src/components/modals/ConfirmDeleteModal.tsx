import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  message?: string;
  confirmButtonText?: string;
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  message,
  confirmButtonText = 'Permanently Delete',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0F0F1B]/90 backdrop-blur-2xl border border-white/10 w-full max-w-md rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-6 space-y-4 relative overflow-hidden">
        {/* Subtle top specular glass highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/60 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)] flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">{title}</h3>
              <p className="text-xs text-rose-400/90 font-mono mt-0.5">Admin Privilege Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs text-zinc-300 space-y-2 backdrop-blur-sm">
          {itemName && (
            <p className="text-zinc-200">
              Are you sure you want to delete <strong className="text-white font-semibold">"{itemName}"</strong>?
            </p>
          )}
          <p className="text-zinc-400">
            {message || 'This record will be permanently deleted from the database. This action cannot be reversed.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 text-xs font-semibold transition cursor-pointer backdrop-blur-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/60 border border-rose-500/40 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
