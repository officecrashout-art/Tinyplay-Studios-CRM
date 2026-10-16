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
      <div className="apple-panel relative overflow-hidden p-6 sm:p-7">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full pill-sky text-[11px] font-medium tracking-wide">
              <PackageIcon className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>Studio Tier Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
              Game Packages & Pricing Engine
            </h1>
            <p className="text-xs text-[#A3ADBA] max-w-xl">
              Configure standardized studio game tiers and deliverables in Bangladeshi Taka (৳). Active deals retain immutable price locks.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="apple-btn-primary min-h-[42px] px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 text-[#0A101D] stroke-[2.5]" />
            <span>Add New Package</span>
          </button>
        </div>

        {/* Pricing Strip */}
        <div className="relative mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-inner p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3ADBA] block">Total Tiers</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#F5F7FA]">{packageStats.total}</span>
              <span className="text-[11px] text-[#A3ADBA]">cataloged</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#7DD3FC]/20 bg-[#7DD3FC]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#BAE6FD] block">Average Tier</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#BAE6FD]">৳{packageStats.avg.toLocaleString()}</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#34D399]/20 bg-[#34D399]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7F3D0] block">Starter Tier</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#A7F3D0]">৳{packageStats.minPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="glass-inner p-3.5 border-[#FBBF24]/20 bg-[#FBBF24]/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FDE68A] block">Flagship Tier</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#FDE68A]">৳{packageStats.maxPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full p-16 text-center space-y-3 apple-panel">
            <div className="w-8 h-8 rounded-full border-2 border-[#7DD3FC]/20 border-t-[#7DD3FC] animate-spin mx-auto" />
            <p className="text-xs text-[#A3ADBA] font-mono">Synchronizing studio packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="col-span-full p-16 apple-panel text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl glass-inner text-[#7DD3FC] flex items-center justify-center mx-auto">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#F5F7FA]">No game packages defined</h3>
              <p className="text-xs text-[#A3ADBA] max-w-sm mx-auto">
                Add standard Roblox & Unity package tiers to accelerate deal quoting.
              </p>
            </div>
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="glass-card p-6 flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#F5F7FA] group-hover:text-[#7DD3FC] transition">{pkg.name}</h3>
                    <span className="font-mono text-[10px] font-semibold pill-sky px-2.5 py-0.5 rounded-full mt-1 inline-block">
                      {pkg.code}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#A3ADBA] uppercase font-mono tracking-wider">Base Price</p>
                    <p className="text-lg font-bold text-[#34D399] font-mono tabular-nums mt-0.5">
                      ৳{pkg.base_price_bdt.toLocaleString()}
                    </p>
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-xs text-[#A3ADBA] leading-relaxed">{pkg.description}</p>
                )}

                {/* Features List */}
                {pkg.features && pkg.features.length > 0 && (
                  <div className="p-4 rounded-2xl glass-inner space-y-2">
                    <p className="text-[10px] text-[#A3ADBA] uppercase font-mono tracking-wider font-semibold">
                      Package Deliverables & Specs
                    </p>
                    <div className="space-y-1.5">
                      {pkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#F5F7FA]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#7DD3FC] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-[11px] text-[#64748B] font-mono">
                  Created {new Date(pkg.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(pkg)}
                    className="apple-btn-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#7DD3FC]" />
                    <span>Edit Tier</span>
                  </button>

                  <button
                    onClick={() => setDeletingPkg(pkg)}
                    title="Delete Package"
                    className="p-1.5 rounded-xl pill-rose transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#FB7185]" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 apple-backdrop animate-in fade-in">
          <div className="apple-modal w-full max-w-lg p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-[#7DD3FC]" />
                <h3 className="text-sm font-semibold text-[#F5F7FA]">
                  {editingPkg ? `Edit ${editingPkg.name}` : 'Create New Game Package'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A3ADBA] hover:text-[#F5F7FA] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl pill-rose text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2D Starter Runner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="apple-input w-full px-3.5 py-2"
                />
              </div>

              {!editingPkg && (
                <div>
                  <label className="block text-[#A3ADBA] font-medium mb-1">
                    Package Code (e.g. PK-2D-RUNNER)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PK-CUSTOM-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="apple-input w-full px-3.5 py-2 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Base Price in BDT (৳)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={priceBDT}
                  onChange={(e) => setPriceBDT(e.target.value)}
                  className="apple-input w-full px-3.5 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of game package style and tech specs"
                  className="apple-input w-full px-3.5 py-2 resize-none"
                />
              </div>

              <div>
                <label className="block text-[#A3ADBA] font-medium mb-1">
                  Features / Deliverables (One per line)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="1 Custom Character Sprite&#10;Custom Endless Backdrop&#10;Theme Music & SFX"
                  className="apple-input w-full px-3.5 py-2 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="apple-btn-secondary px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="apple-btn-primary px-5 py-2 font-semibold disabled:opacity-50 transition cursor-pointer"
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
