import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  Trophy,
  Edit,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Plus,
  Trash2,
  Gamepad2,
  Send,
} from 'lucide-react';
import { SocialPlatformIcon } from '@/components/icons/SocialIcons';
import { apiLeads, apiFollowUps, apiStaff } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Lead, FollowUp, StaffProfile, LeadStatus, LeadPriority } from '@/types';
import { ConvertLeadModal } from '@/components/modals/ConvertLeadModal';
import { CreateLeadModal } from '@/components/modals/CreateLeadModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  // Modals
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadLeadDetails(id);
    }
  }, [id]);

  const loadLeadDetails = async (leadId: string) => {
    try {
      setLoading(true);
      const [l, allFu, staff] = await Promise.all([
        apiLeads.getLead(leadId),
        apiFollowUps.listFollowUps(),
        apiStaff.listStaff(),
      ]);
      setLead(l);
      setFollowUps(allFu.filter((f) => f.lead_id === leadId));
      setStaffList(staff);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppendNote = async () => {
    if (!lead || !newNote.trim()) return;
    const authorTag = user ? `[${user.staff_id} - ${new Date().toLocaleDateString()}]: ` : '';
    const updatedNotes = lead.conversation_notes
      ? `${lead.conversation_notes}\n\n${authorTag}${newNote.trim()}`
      : `${authorTag}${newNote.trim()}`;

    try {
      const updated = await apiLeads.updateLead(lead.id, { conversation_notes: updatedNotes });
      setLead(updated);
      setNewNote('');
    } catch (err: any) {
      alert(err?.message || 'Failed to update notes');
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    try {
      const updated = await apiLeads.updateLead(lead.id, { status: newStatus });
      setLead(updated);
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    }
  };

  const handleReassign = async (newStaffId: string) => {
    if (!lead) return;
    try {
      const updated = await apiLeads.updateLead(lead.id, { assigned_to: newStaffId });
      setLead(updated);
    } catch (err: any) {
      alert(err?.message || 'Failed to reassign lead');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3 rounded-3xl bg-[#0E0E18]/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
        <div className="w-10 h-10 rounded-full border-2 border-[#61C9F6]/20 border-t-[#61C9F6] animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Synchronizing lead intelligence...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-16 text-center space-y-4 rounded-3xl bg-[#0E0E18]/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
        <h3 className="text-base font-bold text-white">Lead Record Not Found</h3>
        <button
          onClick={() => navigate('/leads')}
          className="px-5 py-2.5 bg-[#61C9F6] hover:brightness-110 rounded-2xl text-xs font-extrabold text-slate-950 transition cursor-pointer"
        >
          Return to Leads Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C1527]/90 via-[#09101F]/80 to-[#0A162B]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/leads')}
              className="p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{lead.customer_name}</h1>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#61C9F6]/15 text-sky-200 border border-[#61C9F6]/25">
                  {lead.platform} @{lead.handle}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Channel: <strong className="text-zinc-200">{lead.lead_source}</strong> • Logged {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {lead.profile_url && (
              <a
                href={lead.profile_url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>Profile</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#61C9F6]" />
              </a>
            )}

            <button
              onClick={() => setIsEditOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {!lead.is_converted && (
              <button
                onClick={() => setIsConvertOpen(true)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Convert to Client</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Conversation Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Facts Card */}
          <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#61C9F6]" /> Game Project Interest & Target Specs
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-zinc-400 text-[10px] uppercase font-mono block">Game Genre</span>
                <span className="font-bold text-white mt-1 block">{lead.game_type}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-zinc-400 text-[10px] uppercase font-mono block">Package</span>
                <span className="font-bold text-[#61C9F6] mt-1 block">{lead.package_name || 'Custom Spec'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-zinc-400 text-[10px] uppercase font-mono block">Budget (BDT)</span>
                <span className="font-bold text-emerald-400 font-mono mt-1 block text-sm">
                  ৳{lead.estimated_budget_bdt.toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-zinc-400 text-[10px] uppercase font-mono block">Priority</span>
                <span className="font-bold text-white mt-1 block">{lead.priority}</span>
              </div>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-2 text-xs text-zinc-300 pt-3 border-t border-white/5 font-mono">
                <Phone className="w-3.5 h-3.5 text-[#61C9F6]" />
                <span>Contact Phone: <strong className="text-white">{lead.phone}</strong></span>
              </div>
            )}
          </div>

          {/* Conversation Notes Log */}
          <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#61C9F6]" /> Conversation History & Intel
            </h3>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-300 whitespace-pre-line max-h-60 overflow-y-auto leading-relaxed font-sans">
              {lead.conversation_notes || 'No conversation notes recorded yet.'}
            </div>

            {/* Append Note Input */}
            <div className="pt-2 space-y-2">
              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Append new conversation note, quote update, or client inquiry details..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#61C9F6] transition resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAppendNote}
                  disabled={!newNote.trim()}
                  className="px-4 py-2 rounded-xl bg-[#61C9F6] hover:brightness-110 disabled:opacity-40 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#61C9F6]/30"
                >
                  <Send className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>Append Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Status, Assignment & Follow-ups */}
        <div className="space-y-6">
          {/* Status & Reassignment Card */}
          <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <h3 className="text-sm font-bold text-white">Status & Staff Assignment</h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Lead Status
                </label>
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#61C9F6] transition cursor-pointer"
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
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Assigned Salesperson {isSuperAdmin ? '(Reassignable)' : ''}
                </label>
                {isSuperAdmin ? (
                  <select
                    value={lead.assigned_to || ''}
                    onChange={(e) => handleReassign(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#61C9F6] transition cursor-pointer"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.staff_id} — {s.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 text-xs font-mono">
                    {lead.assigned_staff_id || 'Unassigned'} ({lead.assigned_staff_name || 'Staff'})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Follow-up Reminders on this Lead */}
          <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#61C9F6]" /> Reminders
              </h3>
              <button
                onClick={() => navigate('/follow-ups')}
                className="text-xs text-[#61C9F6] hover:text-sky-300 font-mono font-bold"
              >
                + Schedule
              </button>
            </div>

            {followUps.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center font-mono">
                No follow-ups recorded for this lead yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition ${
                      fu.status === 'Completed'
                        ? 'bg-white/[0.02] border-white/5 opacity-60'
                        : 'bg-[#61C9F6]/10 border-[#61C9F6]/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-400">
                        {fu.scheduled_at.split('T')[0]}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                          fu.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-[#61C9F6]/20 text-[#61C9F6]'
                        }`}
                      >
                        {fu.status}
                      </span>
                    </div>
                    <p className="text-white font-medium">{fu.reason}</p>
                    {fu.result_notes && (
                      <p className="text-[11px] text-zinc-400 italic">"{fu.result_notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convert Modal */}
      <ConvertLeadModal
        isOpen={isConvertOpen}
        lead={lead}
        onClose={() => setIsConvertOpen(false)}
        onSuccess={() => {
          loadLeadDetails(lead.id);
          navigate('/projects');
        }}
      />

      {/* Edit Modal */}
      <CreateLeadModal
        isOpen={isEditOpen}
        initialData={lead}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(updated) => setLead(updated)}
      />

      {/* Confirm Delete Lead Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Delete Potential Customer Lead"
        itemName={lead?.customer_name}
        message={`Are you sure you want to delete the lead for ${lead?.customer_name} (${lead?.platform} @${lead?.handle})? All associated reminders and notes will be permanently removed.`}
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!lead) return;
          try {
            setDeleteLoading(true);
            await apiLeads.deleteLead(lead.id);
            setIsDeleteOpen(false);
            navigate('/leads');
          } catch (err: any) {
            alert(err?.message || 'Failed to delete lead');
          } finally {
            setDeleteLoading(false);
          }
        }}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
