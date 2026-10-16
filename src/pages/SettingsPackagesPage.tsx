import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Plus,
  Edit,
  DollarSign,
  Gamepad2,
  CheckCircle2,
  Sparkles,
  Layers,
  X,
  AlertCircle,
  Trash2,
  Package as PackageIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiPackages } from '@/services/api';
import { Package } from '@/types';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';

export const SettingsPackagesPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [priceBDT, setPriceBDT] = useState<number | string>(15000);
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete modal state
  const [deletingPkg, setDeletingPkg] = useState<Package | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await apiPackages.listPackages();
      setPackages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setCode(pkg.code);
    setPriceBDT(pkg.base_price_bdt);
    setDescription(pkg.description || '');
    setFeaturesText((pkg.features || []).join('\n'));
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingPkg(null);
    setName('');
    setCode('');
    setPriceBDT(20000);
    setDescription('');
    setFeaturesText('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Package name is required');
      return;
    }

    const price = Number(priceBDT);
    if (isNaN(price) || price <= 0) {
      setModalError('Valid price in BDT is required');
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);

      const features = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      if (editingPkg) {
        await apiPackages.updatePackage(editingPkg.id, {
          name: name.trim(),
          base_price_bdt: price,
          description: description.trim() || undefined,
          features,
        });
      } else {
        await apiPackages.createPackage({
          name: name.trim(),
          code: code.trim().toUpperCase() || `PK-${Date.now().toString().slice(-4)}`,
          base_price_bdt: price,
          description: description.trim() || undefined,
          features,
        });
      }

      setIsModalOpen(false);
      loadPackages();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save package');
    } finally {
      setModalLoading(false);
    }
  };

  const packageStats = useMemo(() => {
    const total = packages.length;
    const avg = total > 0 ? Math.round(packages.reduce((s, p) => s + p.base_price_bdt, 0) / total) : 0;
    const minPrice = total > 0 ? Math.min(...packages.map((p) => p.base_price_bdt)) : 0;
    const maxPrice = total > 0 ? Math.max(...packages.map((p) => p.base_price_bdt)) : 0;
    return { total, avg, minPrice, maxPrice };
  }, [packages]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C1527]/90 via-[#09101F]/80 to-[#0A162B]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#61C9F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#61C9F6]/10 border border-[#61C9F6]/25 text-[#61C9F6] text-[11px] font-semibold tracking-wide">
              <PackageIcon className="w-3.5 h-3.5 text-[#61C9F6]" />
              <span>Studio Tier Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Game Packages & Pricing Engine
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Configure standardized studio game tiers and deliverables in Bangladeshi Taka (৳). Active deals retain immutable price locks.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-extrabold tracking-wide shadow-lg shadow-[#61C9F6]/25 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Add New Package</span>
          </button>
        </div>

        {/* Pricing Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Total Tiers</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-white">{packageStats.total}</span>
              <span className="text-[11px] text-zinc-500">cataloged</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#61C9F6]/[0.08] border border-[#61C9F6]/20">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#61C9F6] block">Average Tier</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-sky-200">৳{packageStats.avg.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block">Starter Tier</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-300">৳{packageStats.minPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80 block">Flagship Tier</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-amber-300">৳{packageStats.maxPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full p-16 text-center space-y-3 rounded-3xl bg-[#0E0E18]/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
            <div className="w-10 h-10 rounded-full border-2 border-[#61C9F6]/20 border-t-[#61C9F6] animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Synchronizing studio packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="col-span-full p-16 rounded-3xl bg-[#0E0E18]/80 border border-white/10 text-center space-y-4 shadow-2xl backdrop-blur-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#61C9F6]/10 text-[#61C9F6] flex items-center justify-center mx-auto border border-[#61C9F6]/20 shadow-[0_0_20px_rgba(97,201,246,0.15)]">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No game packages defined</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Add standard Roblox & Unity package tiers to accelerate deal quoting.
              </p>
            </div>
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl hover:border-[#61C9F6]/40 transition-all flex flex-col justify-between space-y-5 group"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#61C9F6] transition">{pkg.name}</h3>
                    <span className="font-mono text-[10px] font-bold text-sky-200 bg-[#61C9F6]/15 px-2.5 py-0.5 rounded-full border border-[#61C9F6]/25 mt-1 inline-block">
                      {pkg.code}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Base Price</p>
                    <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                      ৳{pkg.base_price_bdt.toLocaleString()}
                    </p>
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-xs text-zinc-300 leading-relaxed">{pkg.description}</p>
                )}

                {/* Features List */}
                {pkg.features && pkg.features.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                    <p className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider font-semibold">
                      Package Deliverables & Specs
                    </p>
                    <div className="space-y-1.5">
                      {pkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#61C9F6] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">
                  Created {new Date(pkg.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(pkg)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#61C9F6] border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Tier</span>
                  </button>

                  <button
                    onClick={() => setDeletingPkg(pkg)}
                    title="Delete Package"
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative rounded-3xl bg-[#0E0E18]/95 border border-white/15 w-full max-w-lg shadow-2xl p-6 space-y-4 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-[#61C9F6]" />
                <h3 className="text-base font-bold text-white">
                  {editingPkg ? `Edit ${editingPkg.name}` : 'Create New Game Package'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2D Starter Runner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-[#61C9F6] transition"
                />
              </div>

              {!editingPkg && (
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Package Code (e.g. PK-2D-RUNNER)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PK-CUSTOM-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono focus:outline-none focus:border-[#61C9F6] transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Base Price in BDT (৳)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={priceBDT}
                  onChange={(e) => setPriceBDT(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono focus:outline-none focus:border-[#61C9F6] transition"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of game package style and tech specs"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-[#61C9F6] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Features / Deliverables (One per line)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="1 Custom Character Sprite&#10;Custom Endless Backdrop&#10;Theme Music & SFX"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-[#61C9F6] transition font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-lg shadow-[#61C9F6]/30"
                >
                  {modalLoading ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Package Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingPkg)}
        title="Delete Game Package"
        itemName={deletingPkg?.name}
        message={`Are you sure you want to permanently delete "${deletingPkg?.name}" (${deletingPkg?.code})? Existing historical projects referencing this package will preserve their agreed price.`}
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!deletingPkg) return;
          try {
            setDeleteLoading(true);
            await apiPackages.deletePackage(deletingPkg.id);
            setDeletingPkg(null);
            loadPackages();
          } catch (err: any) {
            alert(err?.message || 'Failed to delete package');
          } finally {
            setDeleteLoading(false);
          }
        }}
        onClose={() => setDeletingPkg(null)}
      />
    </div>
  );
};
