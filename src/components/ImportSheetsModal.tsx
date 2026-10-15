import React, { useState, useRef } from 'react';
import { DomainItem, PortfolioTag } from '../types/domain';
import { fetchGoogleSheetCsv, parseDomainsFromCsv } from '../lib/domainService';
import {
  FileText,
  Download,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Upload,
  Info,
  Copy,
  Check,
  FileSpreadsheet,
} from 'lucide-react';

interface ImportSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDomains: (newDomains: DomainItem[]) => void;
  defaultEmployee: string;
}

export const ImportSheetsModal: React.FC<ImportSheetsModalProps> = ({
  isOpen,
  onClose,
  onImportDomains,
  defaultEmployee,
}) => {
  const [csvText, setCsvText] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Array<Partial<DomainItem>>>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'sheet'>('upload');
  const [copiedSample, setCopiedSample] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const sampleCsvContent = `Domain,Expiration Date,Registrar,Company,Portfolio
api.cloudpayments.io,2027-04-15,Cloudflare,PayCloud Payments,Core Infrastructure
auth.vault-sso.com,2026-11-20,GoDaddy,Enterprise Security,Core Infrastructure
marketing-summit2027.org,2027-01-30,Namecheap,Global Brand Marketing,Marketing Campaigns
app.saasplatform.dev,2028-06-12,Google Domains,SaaS Platform,SaaS Apps`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'domainguard_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleCsvContent);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        const parsed = parseDomainsFromCsv(content);
        if (parsed.length === 0) {
          setErrorMsg('No valid domain rows found in the uploaded CSV. Ensure your CSV has a "Domain" column header.');
        } else {
          setParsedPreview(parsed);
        }
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleParseCsvText = () => {
    if (!csvText.trim()) return;
    setErrorMsg(null);
    const parsed = parseDomainsFromCsv(csvText);
    if (parsed.length === 0) {
      setErrorMsg('No valid domain records found. Please check your columns or date formats.');
    } else {
      setParsedPreview(parsed);
    }
  };

  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) return;
    setIsFetching(true);
    setErrorMsg(null);
    setParsedPreview([]);

    try {
      const csv = await fetchGoogleSheetCsv(sheetUrl.trim());
      const parsed = parseDomainsFromCsv(csv);
      if (parsed.length === 0) {
        setErrorMsg('No domains detected in the sheet. Ensure the sheet has a "Domain" column header.');
      } else {
        setParsedPreview(parsed);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch spreadsheet. Ensure public view link is active.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleCommitImport = () => {
    if (parsedPreview.length === 0) return;

    const newItems: DomainItem[] = parsedPreview.map((item, idx) => {
      const expDate = item.expirationDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      const daysUntilExpiration = Math.ceil((new Date(expDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const cleanDom = (item.domain || `domain-${idx}.com`).toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];

      let workingStatus: DomainItem['workingStatus'] = 'active';
      if (daysUntilExpiration <= 0) workingStatus = 'expired';
      else if (daysUntilExpiration <= 30) workingStatus = 'expiring_soon';

      return {
        id: `import_${Date.now()}_${idx}`,
        domain: cleanDom,
        company: item.company || `${cleanDom.split('.')[0].toUpperCase()} Organization`,
        workingStatus,
        registrar: item.registrar || 'ICANN Registrar',
        registrarPortalUrl: `https://www.google.com/search?q=${encodeURIComponent((item.registrar || cleanDom) + ' renewal portal')}`,
        expirationDate: expDate,
        daysUntilExpiration,
        isResolving: true,
        nameservers: item.nameservers && item.nameservers.length > 0 ? item.nameservers : ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        portfolio: (item.portfolio as PortfolioTag) || ('Core Infrastructure' as PortfolioTag),
        assignedEmployees: item.assignedEmployees?.length ? item.assignedEmployees : [defaultEmployee],
        lastCheckedAt: new Date().toISOString(),
        renewalAlerts: {
          warn30Days: true,
          warn15Days: true,
          warn7Days: true,
          continuousReminderEvery2Days: true,
        },
        notes: item.notes || `Imported via CSV on ${new Date().toLocaleDateString()}`,
        whoisSource: 'Imported CSV Portfolio',
        httpStatusCode: 200,
        httpStatusText: '200 OK',
        httpLatencyMs: 42,
      };
    });

    onImportDomains(newItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-lg shadow-2xl p-4 sm:p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Import Domains via CSV
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Bulk upload your registered domain portfolio with automated expiration date detection.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-Step Instructions on How to Import CSV */}
        <div className="p-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              How to Import Your CSV
            </h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-2xs"
              >
                <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Download Sample CSV</span>
              </button>
              <button
                type="button"
                onClick={handleCopySample}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-2xs"
              >
                {copiedSample ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSample ? 'Copied' : 'Copy Format'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="space-y-1">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">1. Supported Column Headers:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li><strong className="text-neutral-900 dark:text-white">Domain</strong> (Required, e.g. <code>example.com</code>)</li>
                <li><strong>Expiration Date</strong> (e.g. <code>2027-04-15</code>)</li>
                <li><strong>Registrar</strong> (e.g. GoDaddy, Cloudflare)</li>
                <li><strong>Company</strong> (e.g. Acme Corp)</li>
              </ul>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">2. Formatting Guidelines:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Dates format: <code>YYYY-MM-DD</code> or <code>MM/DD/YYYY</code></li>
                <li>Headers can be in any order, case-insensitive</li>
                <li>Duplicate domains already in your portfolio will be merged</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload .CSV File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Raw CSV Text</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`pb-2.5 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sheet'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets Link</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv,text/plain"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-lg p-6 sm:p-8 text-center cursor-pointer bg-neutral-50/50 dark:bg-neutral-950/40 transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto text-neutral-400 dark:text-neutral-500 mb-2" />
              <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                {fileName ? fileName : 'Click to browse or drop your .CSV file here'}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Standard comma-separated format (.csv)
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Paste Raw CSV Text */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Paste CSV Domain Records
              </label>
              <textarea
                rows={6}
                placeholder={sampleCsvContent}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white"
              />
            </div>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setCsvText(sampleCsvContent);
                  const parsed = parseDomainsFromCsv(sampleCsvContent);
                  setParsedPreview(parsed);
                }}
                className="text-xs text-neutral-500 hover:underline"
              >
                Insert sample records
              </button>
              <button
                type="button"
                onClick={handleParseCsvText}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-md"
              >
                Parse CSV Text
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Google Sheets URL */}
        {activeTab === 'sheet' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Google Sheets Public Link
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA.../edit?usp=sharing"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Ensure spreadsheet permissions are set to "Anyone with the link can view".
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFetchSheet}
                disabled={isFetching || !sheetUrl.trim()}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Fetch and Parse</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedPreview.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Parsed {parsedPreview.length} Domains Ready to Import
              </span>
              <span className="text-neutral-500 font-mono text-[11px]">
                Default employee: {defaultEmployee}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  <tr>
                    <th className="px-3 py-2">Domain</th>
                    <th className="px-3 py-2">Expiration Date</th>
                    <th className="px-3 py-2">Registrar</th>
                    <th className="px-3 py-2">Company</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                  {parsedPreview.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 py-1.5 font-bold text-neutral-900 dark:text-white">
                        {item.domain}
                      </td>
                      <td className="px-3 py-1.5 text-neutral-600 dark:text-neutral-400">
                        {item.expirationDate || 'Calculated 90d'}
                      </td>
                      <td className="px-3 py-1.5 text-neutral-600 dark:text-neutral-400">
                        {item.registrar || 'ICANN Registrar'}
                      </td>
                      <td className="px-3 py-1.5 text-neutral-600 dark:text-neutral-400">
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
                className="px-3 py-2 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition-colors"
              >
                Import {parsedPreview.length} Domains to Portfolio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
