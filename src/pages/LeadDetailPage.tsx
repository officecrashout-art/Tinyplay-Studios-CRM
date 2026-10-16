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
      <div className="apple-panel p-16 text-center space-y-3 relative">
        <div className="apple-specular" />
        <div className="w-8 h-8 rounded-full border-2 border-sky-400/20 border-t-sky-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Synchronizing lead intelligence...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="apple-panel p-16 text-center space-y-4 relative">
        <div className="apple-specular" />
        <h3 className="text-sm font-semibold text-slate-200">Lead Record Not Found</h3>
        <button
          onClick={() => navigate('/leads')}
          className="apple-btn-primary"
        >
          Return to Leads Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="apple-panel p-6 relative">
        <div className="apple-specular" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/leads')}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">{lead.customer_name}</h1>
                <span className="pill-sky">
                  {lead.platform} @{lead.handle}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Channel: <strong className="text-slate-200">{lead.lead_source}</strong> • Logged {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lead.profile_url && (
              <a
                href={lead.profile_url}
                target="_blank"
                rel="noreferrer"
                className="apple-btn-secondary flex items-center gap-1.5"
              >
                <span>Profile</span>
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              </a>
            )}

            <button
              onClick={() => setIsEditOpen(true)}
              className="apple-btn-secondary flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {!lead.is_converted && (
              <button
                onClick={() => setIsConvertOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Convert to Client</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Details & Conversation Notes */}
        <div className="lg:col-span-2 space-y-5">
          {/* Key Facts Card */}
          <div className="apple-panel p-6 space-y-4 relative">
            <div className="apple-specular" />

            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Game Project Interest & Target Specs
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl glass-inner">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Genre</span>
                <span className="font-semibold text-slate-100 mt-1 block truncate">{lead.game_type}</span>
              </div>

              <div className="p-3 rounded-xl glass-inner">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Package</span>
                <span className="font-semibold text-sky-300 mt-1 block truncate">{lead.package_name || 'Custom Spec'}</span>
              </div>

              <div className="p-3 rounded-xl glass-inner">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Budget (BDT)</span>
                <span className="font-semibold text-emerald-400 font-mono tabular-nums mt-1 block text-sm">
                  ৳{lead.estimated_budget_bdt.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl glass-inner">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Priority</span>
                <span className="font-semibold text-slate-100 mt-1 block">{lead.priority}</span>
              </div>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-300 pt-3 border-t border-white/[0.06] font-mono">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>Contact Phone: <strong className="text-slate-100">{lead.phone}</strong></span>
              </div>
            )}
          </div>

          {/* Conversation Notes Log */}
          <div className="apple-panel p-6 space-y-4 relative">
            <div className="apple-specular" />

            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Conversation History & Intel
            </h3>

            <div className="p-4 rounded-xl glass-inner text-xs text-slate-300 whitespace-pre-line max-h-60 overflow-y-auto leading-relaxed">
              {lead.conversation_notes || 'No conversation notes recorded yet.'}
            </div>

            {/* Append Note Input */}
            <div className="pt-2 space-y-2">
              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Append new conversation note, quote update, or client inquiry details..."
                className="apple-input w-full resize-none text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAppendNote}
                  disabled={!newNote.trim()}
                  className="apple-btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Append Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Status, Assignment & Follow-ups */}
        <div className="space-y-5">
          {/* Status & Reassignment Card */}
          <div className="apple-panel p-6 space-y-4 relative">
            <div className="apple-specular" />

            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Status & Staff Assignment</h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Lead Status
                </label>
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                  className="apple-input w-full cursor-pointer text-xs"
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
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Assigned Salesperson {isSuperAdmin ? '(Reassignable)' : ''}
                </label>
                {isSuperAdmin ? (
                  <select
                    value={lead.assigned_to || ''}
                    onChange={(e) => handleReassign(e.target.value)}
                    className="apple-input w-full cursor-pointer text-xs"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.staff_id} — {s.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="px-3.5 py-2 rounded-xl glass-inner text-slate-200 text-xs font-mono">
                    {lead.assigned_staff_id || 'Unassigned'} ({lead.assigned_staff_name || 'Staff'})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Follow-up Reminders on this Lead */}
          <div className="apple-panel p-6 space-y-4 relative">
            <div className="apple-specular" />

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> Reminders
              </h3>
              <button
                onClick={() => navigate('/follow-ups')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                + Schedule
              </button>
            </div>

            {followUps.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center font-mono">
                No follow-ups recorded for this lead yet.
              </p>
            ) : (
              <div className="space-y-2">
                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                      fu.status === 'Completed'
                        ? 'bg-white/[0.02] border-white/[0.04] opacity-60'
                        : 'glass-card border-sky-400/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">
                        {fu.scheduled_at.split('T')[0]}
                      </span>
                      <span
                        className={fu.status === 'Completed' ? 'pill-emerald' : 'pill-sky'}
                      >
                        {fu.status}
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium">{fu.reason}</p>
                    {fu.result_notes && (
                      <p className="text-[11px] text-slate-400 italic">"{fu.result_notes}"</p>
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
