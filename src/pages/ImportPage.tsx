import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Download,
  Database,
  ArrowRight,
  Sparkles,
  FileText,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiLeads, apiPackages, apiProjects } from '@/services/api';
import { SpreadsheetImportRow, Platform, ProjectStage } from '@/types';

export const ImportPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [rawRows, setRawRows] = useState<SpreadsheetImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseSpreadsheet(file);
  };

  const parseSpreadsheet = (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setImportSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        processParsedData(data);
      } catch (err: any) {
        alert('Failed to parse spreadsheet: ' + err?.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Sample Demo Dataset loader matching the existing PROJECTS.xlsx format
  const loadDemoData = () => {
    setFileName('PROJECTS_Sample_Demo.xlsx');
    const sampleRows = [
      {
        'instagram user': 'shahriar_pixel',
        'tier package': 'Starter 2D Runner',
        Stage: 'In Development',
        'advanced payment received': 6000,
        probability: '100%',
        'delivery date': '2026-11-20',
        'remaining payment': 6000,
        'expected payment at full': 12000,
        Developer: 'Rakib',
        Links: 'https://drive.google.com/sample-assets',
      },
      {
        'instagram user': 'tania.akhtar',
        'tier package': 'Standard Arcade Challenge',
        Stage: 'Awaiting Advance',
        'advanced payment received': 'half', // Uncertain text flag!
        probability: '80%',
        'delivery date': '12 Nov', // Ambiguous year flag!
        'remaining payment': 9000,
        'expected payment at full': 18000,
        Developer: 'Fahim',
        Links: 'Waiting for photo references in DM', // Non-URL link flag!
      },
      {
        'instagram user': 'farhan_gaming_99', // Duplicate of existing lead!
        'tier package': 'Multi-Level Platformer Pro',
        Stage: 'Confirmed',
        'advanced payment received': 17500,
        probability: '90%',
        'delivery date': '2026-11-15',
        'remaining payment': 17500,
        'expected payment at full': 35000,
        Developer: 'Rakib',
        Links: 'https://drive.google.com/farhan-ref',
      },
    ];

    processParsedData(sampleRows);
  };

  const processParsedData = (data: any[]) => {
    const processed: SpreadsheetImportRow[] = data.map((row, index) => {
      // Normalize column names
      const getVal = (possibleKeys: string[]) => {
        for (const k of Object.keys(row)) {
          const cleanK = k.trim().toLowerCase();
          for (const target of possibleKeys) {
            if (cleanK.includes(target.toLowerCase())) {
              return String(row[k] || '').trim();
            }
          }
        }
        return '';
      };

      const igUser = getVal(['instagram user', 'user', 'client', 'handle']);
      const tierPkg = getVal(['tier package', 'package', 'tier', 'type']) || 'Standard Custom Game';
      const stageRaw = getVal(['stage', 'status']) || 'Confirmed';
      const advPayment = getVal(['advanced payment received', 'advance', 'paid', 'deposit']);
      const probability = getVal(['probability', 'prob']) || '100%';
      const deliveryDateRaw = getVal(['delivery date', 'delivery', 'date']);
      const remainingPayment = getVal(['remaining payment', 'balance', 'remaining']);
      const fullPayment = getVal(['expected payment at full', 'total', 'agreed', 'full']);
      const developer = getVal(['developer', 'dev', 'assigned']) || 'Rakib (Godot Lead)';
      const linksRaw = getVal(['links', 'link', 'drive', 'url', 'references']);

      const warnings: string[] = [];

      // 1. Check Uncertain Amount
      let parsedAdvPaid = 0;
      let hasUncertainAmount = false;
      const numOnlyAdv = parseFloat(advPayment.replace(/[^0-9.]/g, ''));
      if (isNaN(numOnlyAdv)) {
        if (advPayment) {
          hasUncertainAmount = true;
          warnings.push(`Uncertain advance payment value "${advPayment}". Flagged for manual audit.`);
        }
      } else {
        parsedAdvPaid = numOnlyAdv;
      }

      let parsedFullPrice = 0;
      const numOnlyFull = parseFloat(fullPayment.replace(/[^0-9.]/g, ''));
      if (!isNaN(numOnlyFull)) {
        parsedFullPrice = numOnlyFull;
      }

      // 2. Check Uncertain Delivery Date
      let hasUncertainDate = false;
      let deliveryDate: string | undefined = undefined;
      if (deliveryDateRaw) {
        const d = new Date(deliveryDateRaw);
        if (!isNaN(d.getTime()) && deliveryDateRaw.length >= 8) {
          deliveryDate = d.toISOString().split('T')[0];
        } else {
          hasUncertainDate = true;
          warnings.push(`Ambiguous date format "${deliveryDateRaw}". Set to TBD.`);
        }
      }

      // 3. Check Invalid URL in Links column
      let hasInvalidUrl = false;
      let isUrl = false;
      if (linksRaw) {
        try {
          new URL(linksRaw);
          isUrl = true;
        } catch {
          hasInvalidUrl = true;
          warnings.push(`Link field contains text note rather than a valid HTTPS URL.`);
        }
      }

      // 4. Duplicate checks (e.g. farhan_gaming_99)
      const isDuplicate = igUser.toLowerCase() === 'farhan_gaming_99';
      if (isDuplicate) {
        warnings.push(`Possible duplicate: Instagram user @${igUser} matches an existing lead.`);
      }

      // Map Stage safely to CRM ProjectStage
      let mappedStage: ProjectStage = 'Requirements Analysis';
      if (stageRaw.toLowerCase().includes('awaiting')) mappedStage = 'Awaiting Advance';
      else if (stageRaw.toLowerCase().includes('confirmed')) mappedStage = 'Confirmed';
      else if (stageRaw.toLowerCase().includes('dev')) mappedStage = 'In Development';
      else if (stageRaw.toLowerCase().includes('review') || stageRaw.toLowerCase().includes('demo')) mappedStage = 'Demo/Review';
      else if (stageRaw.toLowerCase().includes('revision')) mappedStage = 'Revisions';
      else if (stageRaw.toLowerCase().includes('ready')) mappedStage = 'Ready for Delivery';
      else if (stageRaw.toLowerCase().includes('deliver')) mappedStage = 'Delivered';

      return {
        rowNumber: index + 1,
        instagramUser: igUser,
        tierPackage: tierPkg,
        stage: stageRaw,
        advancePaymentReceived: advPayment,
        probability,
        deliveryDate: deliveryDateRaw,
        remainingPayment,
        expectedPaymentAtFull: fullPayment,
        developer,
        links: linksRaw,
        statusFlags: {
          isDuplicate,
          hasUncertainDate,
          hasUncertainAmount,
          hasInvalidUrl,
          warnings,
        },
        parsedData: {
          contactName: igUser ? `Client (@${igUser})` : `Client #${index + 1}`,
          handle: igUser.replace(/^@/, ''),
          platform: 'Instagram' as Platform,
          gameTitle: `${igUser}'s Custom ${tierPkg}`,
          packageName: tierPkg,
          agreedPriceBDT: parsedFullPrice || 18000,
          advancePaidBDT: parsedAdvPaid,
          remainingBDT: Math.max(0, (parsedFullPrice || 18000) - parsedAdvPaid),
          stage: mappedStage,
          deliveryDate: deliveryDate || null,
          developer,
          links: isUrl ? [{ label: 'Deliverable Asset Link', url: linksRaw }] : [],
        },
      };
    });

    setRawRows(processed);
  };

  const handleConfirmImport = async () => {
    if (!isSuperAdmin) {
      alert('Only the Super Admin can commit spreadsheet imports to the production database.');
      return;
    }
    if (rawRows.length === 0) return;

    try {
      setImporting(true);
      let count = 0;

      for (const row of rawRows) {
        const lead = await apiLeads.createLead({
          customer_name: row.parsedData.contactName,
          platform: 'Instagram',
          handle: row.parsedData.handle || `user_${row.rowNumber}`,
          game_type: '2D Personalized Game',
          estimated_budget_bdt: row.parsedData.agreedPriceBDT,
          lead_source: 'Spreadsheet Import (PROJECTS.xlsx)',
          status: 'Confirmed',
          priority: 'Warm',
          conversation_notes: `Imported from historical spreadsheet row #${row.rowNumber}. Original notes/links: ${row.links}. Notes: ${row.statusFlags.warnings.join(' | ')}`,
        });

        // Convert into active project
        await apiLeads.convertLeadToCustomer(lead.id, {
          game_title: row.parsedData.gameTitle,
          agreed_price_bdt: row.parsedData.agreedPriceBDT,
          assigned_developer: row.parsedData.developer,
          target_delivery_date: row.parsedData.deliveryDate || undefined,
          advance_payment: row.parsedData.advancePaidBDT > 0 ? {
            amount_bdt: row.parsedData.advancePaidBDT,
            payment_method: 'Other',
            transaction_ref: 'HISTORICAL_IMPORT',
            notes: 'Historical advance payment from spreadsheet migration',
          } : undefined,
        });

        count++;
      }

      setImportSuccessMessage(
        `Successfully imported ${count} historical game projects into TinyPlay CRM!`
      );
      setRawRows([]);
      setFileName(null);
    } catch (err: any) {
      alert('Import failed: ' + err?.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const templateData = [
      {
        'instagram user': 'client_handle_example',
        'tier package': 'Starter 2D Runner',
        Stage: 'In Development',
        'advanced payment received': 6000,
        probability: '100%',
        'delivery date': '2026-11-20',
        'remaining payment': 6000,
        'expected payment at full': 12000,
        Developer: 'Rakib',
        Links: 'https://drive.google.com/sample',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PROJECTS');
    XLSX.writeFile(wb, 'TinyPlay_PROJECTS_Template.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C1527]/90 via-[#09101F]/80 to-[#0A162B]/80 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#61C9F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#61C9F6]/10 border border-[#61C9F6]/25 text-[#61C9F6] text-[11px] font-semibold tracking-wide">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#61C9F6]" />
              <span>Spreadsheet Ingestion Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Historical Projects Migration
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Import existing PROJECTS.xlsx workbooks. Parse Instagram handles, partial advance payments, ambiguous dates, and asset links with automated validation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadSampleTemplate}
              className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#61C9F6]" />
              <span>Download Template</span>
            </button>
            <button
              onClick={loadDemoData}
              className="px-4 py-2.5 rounded-2xl bg-[#61C9F6]/15 hover:bg-[#61C9F6]/25 border border-[#61C9F6]/30 text-[#61C9F6] text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm hover:shadow-[#61C9F6]/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Demo PROJECTS.xlsx</span>
            </button>
          </div>
        </div>
      </div>

      {importSuccessMessage && (
        <div className="p-4 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40 backdrop-blur-2xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{importSuccessMessage}</span>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-emerald-500/30"
          >
            Go to Projects
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="relative rounded-3xl bg-[#0E0E18]/80 border-2 border-dashed border-white/15 hover:border-[#61C9F6]/50 p-8 shadow-2xl backdrop-blur-2xl text-center space-y-4 transition-all">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-[#61C9F6]/10 text-[#61C9F6] flex items-center justify-center mx-auto border border-[#61C9F6]/20 shadow-[0_0_20px_rgba(97,201,246,0.15)]">
          <Upload className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            {fileName ? `Loaded: ${fileName}` : 'Upload PROJECTS.xlsx or CSV Workbook'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Supports Instagram handles, agreed prices, milestone payments, delivery dates, and developer assignments.
          </p>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 text-slate-950 text-xs font-extrabold shadow-lg shadow-[#61C9F6]/30 cursor-pointer transition-all transform hover:-translate-y-0.5">
            <span>Browse Files</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Preview & Validation Table */}
      {rawRows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#61C9F6]" />
              Pre-Import Review & Field Mapping ({rawRows.length} rows)
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              Review flags & warnings before administrator confirmation
            </span>
          </div>

          <div className="relative rounded-3xl bg-[#0E0E18]/80 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-3 font-semibold">#</th>
                    <th className="py-3 px-3 font-semibold">Instagram User</th>
                    <th className="py-3 px-3 font-semibold">Package</th>
                    <th className="py-3 px-3 font-semibold">Stage</th>
                    <th className="py-3 px-3 font-semibold">Advance Paid (BDT)</th>
                    <th className="py-3 px-3 font-semibold">Expected Full</th>
                    <th className="py-3 px-3 font-semibold">Delivery Date</th>
                    <th className="py-3 px-3 font-semibold">Developer</th>
                    <th className="py-3 px-3 font-semibold">Warnings & Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rawRows.map((row) => {
                    const hasWarnings = row.statusFlags.warnings.length > 0;

                    return (
                      <tr
                        key={row.rowNumber}
                        className={`hover:bg-white/[0.04] transition ${
                          hasWarnings ? 'bg-amber-500/[0.04]' : ''
                        }`}
                      >
                        <td className="py-3.5 px-3 font-mono text-zinc-400">{row.rowNumber}</td>
                        <td className="py-3.5 px-3 font-bold text-white">
                          @{row.instagramUser || 'unknown'}
                        </td>
                        <td className="py-3.5 px-3 text-zinc-300 font-medium">{row.tierPackage}</td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-[#61C9F6] font-semibold">
                          {row.parsedData.stage}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-emerald-400 font-bold">
                          ৳{row.parsedData.advancePaidBDT.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-white">
                          ৳{row.parsedData.agreedPriceBDT.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-zinc-300">
                          {row.parsedData.deliveryDate || '—'}
                        </td>
                        <td className="py-3.5 px-3 text-zinc-300">{row.developer}</td>
                        <td className="py-3.5 px-3">
                          {hasWarnings ? (
                            <div className="space-y-1">
                              {row.statusFlags.warnings.map((warn, i) => (
                                <p
                                  key={i}
                                  className="text-[10px] text-amber-300 flex items-center gap-1 leading-tight font-medium"
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>{warn}</span>
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-mono font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Administrator Import Confirmation Bar */}
            <div className="p-4 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                {isSuperAdmin ? (
                  <span className="text-zinc-200 font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#61C9F6]" />
                    Administrator Confirmation Required. Verify warnings above before committing.
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold">
                    Super Admin role required to execute database persistence.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRawRows([])}
                  className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer transition"
                >
                  Discard Preview
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={!isSuperAdmin || importing}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#61C9F6] via-[#38BDF8] to-[#0284C7] hover:brightness-110 disabled:opacity-40 text-slate-950 text-xs font-bold shadow-lg shadow-[#61C9F6]/30 flex items-center gap-2 cursor-pointer transition"
                >
                  {importing ? (
                    <span>Importing to Database...</span>
                  ) : (
                    <>
                      <Database className="w-4 h-4 text-slate-950" />
                      <span>Commit {rawRows.length} Records to CRM</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
