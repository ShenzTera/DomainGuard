import React, { useState, useRef } from 'react';
import { DomainItem, PortfolioTag } from '../types/domain';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Info,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface ImportSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDomains: (domains: DomainItem[]) => void;
  defaultEmployee: string;
}

export const ImportSheetsModal: React.FC<ImportSheetsModalProps> = ({
  isOpen,
  onClose,
  onImportDomains,
  defaultEmployee,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'sheet'>('upload');
  const [csvText, setCsvText] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Partial<DomainItem>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copiedSample, setCopiedSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const sampleCsvContent = `Domain,Expiration Date,Registrar,Company,Portfolio
alpha-payments.com,2026-11-14,GoDaddy,Alpha Fintech Inc.,Core Infrastructure
brand-portal-2026.net,2026-12-01,Namecheap,Global Marketing,Brand & Trademarks
nexus-cloud-api.io,2027-01-20,Cloudflare,Infrastructure Ops,Core Infrastructure
saas-metrics-dash.co,2026-10-31,Google Domains,SaaS Products,SaaS Apps`;

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleCsvContent);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'domainguard_sample_portfolio.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvLines = (text: string) => {
    setErrorMsg(null);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setErrorMsg('Provided CSV content is empty.');
      return;
    }

    const firstLine = lines[0].toLowerCase();
    const startIndex = firstLine.includes('domain') ? 1 : 0;
    const items: Partial<DomainItem>[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i].split(',').map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
      if (!row[0]) continue;

      const domain = row[0].toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
      if (!domain || !domain.includes('.')) continue;

      const expirationDate = row[1] || '';
      const registrar = row[2] || 'ICANN Accredited Registrar';
      const company = row[3] || `${domain.split('.')[0].toUpperCase()} Organization`;
      const portfolio = (row[4] as PortfolioTag) || 'Core Infrastructure';

      let daysUntilExpiration = 90;
      if (expirationDate) {
        const expTime = new Date(expirationDate).getTime();
        if (!isNaN(expTime)) {
          daysUntilExpiration = Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
        }
      }

      items.push({
        id: `dom_${Date.now()}_${i}`,
        domain,
        company,
        registrar,
        expirationDate: expirationDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        daysUntilExpiration,
        portfolio,
        workingStatus: daysUntilExpiration <= 0 ? 'expired' : daysUntilExpiration <= 30 ? 'expiring_soon' : 'active',
        isResolving: true,
        assignedEmployees: [defaultEmployee],
        lastCheckedAt: new Date().toISOString(),
        renewalAlerts: {
          warn30Days: true,
          warn15Days: true,
          warn7Days: true,
          continuousReminderEvery2Days: true,
        },
        registrarPortalUrl: `https://www.google.com/search?q=${encodeURIComponent(registrar + ' domain renewal')}`,
        nameservers: ['ns1.portfolio-dns.net', 'ns2.portfolio-dns.net'],
        dnsIps: ['104.21.45.19'],
        whoisSource: 'Bulk CSV Ledger Import',
      });
    }

    if (items.length === 0) {
      setErrorMsg('No valid domain entries could be parsed from the provided data.');
      return;
    }

    setParsedPreview(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCsvLines(content);
      }
    };
    reader.readAsText(file);
  };

  const handleParseCsvText = () => {
    parseCsvLines(csvText);
  };

  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) return;
    setIsFetching(true);
    setErrorMsg(null);

    try {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('Invalid Google Sheets URL. Please copy the complete public sharing link.');
      }
      const sheetId = match[1];
      const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const res = await fetch(csvExportUrl);
      if (!res.ok) {
        throw new Error('Failed to fetch spreadsheet. Ensure link sharing is enabled.');
      }
      const csvData = await res.text();
      parseCsvLines(csvData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error importing from Google Sheets URL.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleCommitImport = () => {
    if (parsedPreview.length === 0) return;
    onImportDomains(parsedPreview as DomainItem[]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101432] border border-[#E2E4EE] dark:border-[#1F2756] max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-[14px] shadow-lg p-6 sm:p-7 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E4EE] dark:border-[#1F2756]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-[#E6E8FF] text-[#2A3AF0]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="eyebrow-label text-[#5B6178]">BULK INGESTION</div>
              <h3 className="text-lg font-semibold text-[#101432] dark:text-white mt-0.5">
                Import Domains via CSV
              </h3>
              <p className="text-xs text-[#5B6178]">
                Bulk upload registered domain portfolios with automated expiration detection.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#5B6178] hover:text-[#101432] dark:hover:text-white p-1 rounded-[8px] hover:bg-[#F3F4F8] dark:hover:bg-[#1B2050] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="p-4 rounded-[10px] border border-[#E2E4EE] dark:border-[#1F2756] bg-[#F3F4F8] dark:bg-[#0E122B] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="eyebrow-label text-[#101432] dark:text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#2A3AF0]" />
              CSV Format Specifications
            </h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="btn-neutral-surface text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#2A3AF0]" />
                <span>Sample CSV</span>
              </button>
              <button
                type="button"
                onClick={handleCopySample}
                className="btn-neutral-surface text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSample ? <Check className="w-3.5 h-3.5 text-[#0B7A57]" /> : <Copy className="w-3.5 h-3.5 text-[#5B6178]" />}
                <span>{copiedSample ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="text-[12px] text-[#5B6178] space-y-1 font-mono">
            <p>• Header: <code className="text-[#2A3AF0] font-bold">Domain, Expiration Date, Registrar, Company, Portfolio</code></p>
            <p>• Dates support standard ISO <code className="font-bold">YYYY-MM-DD</code> format or registry text timestamps.</p>
          </div>
        </div>

        {/* Tab selection (Pill buttons) */}
        <div className="flex items-center p-1 bg-[#F3F4F8] dark:bg-[#0E122B] rounded-full text-xs font-medium border border-[#E2E4EE] dark:border-[#1F2756]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#101432] text-white dark:bg-white dark:text-[#101432] shadow-xs'
                : 'text-[#5B6178] hover:text-[#101432] dark:hover:text-white'
            }`}
          >
            Upload File (.csv)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-[#101432] text-white dark:bg-white dark:text-[#101432] shadow-xs'
                : 'text-[#5B6178] hover:text-[#101432] dark:hover:text-white'
            }`}
          >
            Paste CSV Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-[#101432] text-white dark:bg-white dark:text-[#101432] shadow-xs'
                : 'text-[#5B6178] hover:text-[#101432] dark:hover:text-white'
            }`}
          >
            Google Sheets Link
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E2E4EE] dark:border-[#1F2756] hover:border-[#2A3AF0] dark:hover:border-[#2A3AF0] bg-[#F3F4F8]/60 dark:bg-[#0E122B]/60 rounded-[10px] p-8 text-center cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 rounded-[10px] bg-[#E6E8FF] text-[#2A3AF0] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-[#101432] dark:text-white">
                {fileName ? fileName : 'Click to choose a CSV file from your computer'}
              </h4>
              <p className="text-xs text-[#5B6178] mt-1">
                Supports .csv files exported from Excel, Sheets, GoDaddy, Namecheap, Cloudflare
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Paste CSV */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <textarea
              rows={5}
              placeholder={sampleCsvContent}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3.5 text-xs font-mono bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParseCsvText}
                disabled={!csvText.trim()}
                className="btn-ultramarine disabled:opacity-50 cursor-pointer"
              >
                Parse Domain Lines
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Google Sheets */}
        {activeTab === 'sheet' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
                Google Sheets Public Link
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA.../edit?usp=sharing"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
              />
              <p className="text-[11px] text-[#5B6178] mt-1.5">
                Ensure spreadsheet permissions are set to "Anyone with the link can view".
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFetchSheet}
                disabled={isFetching || !sheetUrl.trim()}
                className="btn-ultramarine flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Fetch and Parse</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 bg-[#FFF4F2] text-[#D63A2C] border border-[#FCDAD7] text-xs rounded-[10px] flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedPreview.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-[#E2E4EE] dark:border-[#1F2756]">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#0B7A57] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Parsed {parsedPreview.length} Domains Ready to Import
              </span>
              <span className="text-[#5B6178] font-mono text-[11px]">
                Default Lead: {defaultEmployee}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#101432] text-white sticky top-0 text-[11px] font-mono uppercase tracking-[0.05em]">
                  <tr>
                    <th className="px-4 py-2.5">Domain</th>
                    <th className="px-4 py-2.5">Expiration Date</th>
                    <th className="px-4 py-2.5">Registrar</th>
                    <th className="px-4 py-2.5">Company</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E4EE] dark:divide-[#1F2756] font-mono">
                  {parsedPreview.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F3F4F8]/70 dark:hover:bg-[#1B2050]/40">
                      <td className="px-4 py-2 font-bold text-[#101432] dark:text-white">
                        {item.domain}
                      </td>
                      <td className="px-4 py-2 text-[#5B6178]">
                        {item.expirationDate || 'Calculated 90d'}
                      </td>
                      <td className="px-4 py-2 text-[#5B6178]">
                        {item.registrar || 'ICANN Registrar'}
                      </td>
                      <td className="px-4 py-2 text-[#5B6178]">
                        {item.company || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setParsedPreview([])}
                className="btn-neutral-surface text-xs cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                className="btn-ultramarine text-xs cursor-pointer"
              >
                Import {parsedPreview.length} Domains to Ledger
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
