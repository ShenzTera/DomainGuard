import React, { useState } from 'react';
import { DomainItem, PortfolioTag } from '../types/domain';
import { fetchGoogleSheetCsv, parseDomainsFromCsv } from '../lib/domainService';
import { FileSpreadsheet, Download, Loader2, X, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

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
  const [sheetUrl, setSheetUrl] = useState('');
  const [csvText, setCsvText] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Array<Partial<DomainItem>>>([]);
  const [activeTab, setActiveTab] = useState<'sheetUrl' | 'csvPaste'>('sheetUrl');

  if (!isOpen) return null;

  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) return;
    setIsFetching(true);
    setErrorMsg(null);
    setParsedPreview([]);

    try {
      const csv = await fetchGoogleSheetCsv(sheetUrl.trim());
      const parsed = parseDomainsFromCsv(csv);
      if (parsed.length === 0) {
        setErrorMsg('No domains detected in the sheet. Please ensure columns include Domain and Expiration Date.');
      } else {
        setParsedPreview(parsed);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch Google Sheet. Check permissions and link format.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleParseCsvText = () => {
    if (!csvText.trim()) return;
    setErrorMsg(null);
    const parsed = parseDomainsFromCsv(csvText);
    if (parsed.length === 0) {
      setErrorMsg('No valid domains found in pasted data.');
    } else {
      setParsedPreview(parsed);
    }
  };

  const handleCommitImport = () => {
    if (parsedPreview.length === 0) return;

    const newItems: DomainItem[] = parsedPreview.map((item, idx) => {
      const expDate = item.expirationDate || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
      const daysUntilExpiration = Math.ceil((new Date(expDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const cleanDom = (item.domain || `domain-${idx}.com`).toLowerCase();

      let workingStatus: DomainItem['workingStatus'] = 'active';
      if (daysUntilExpiration <= 0) workingStatus = 'expired';
      else if (daysUntilExpiration <= 30) workingStatus = 'expiring_soon';

      return {
        id: `import_${Date.now()}_${idx}`,
        domain: cleanDom,
        company: item.company || `${cleanDom.split('.')[0].toUpperCase()} Holdings`,
        workingStatus,
        registrar: item.registrar || 'Imported Registrar',
        registrarPortalUrl: `https://www.google.com/search?q=${encodeURIComponent((item.registrar || 'domain') + ' renewal')}`,
        expirationDate: expDate,
        daysUntilExpiration,
        isResolving: true,
        nameservers: ['ns1.dns-hosting.com', 'ns2.dns-hosting.com'],
        portfolio: 'Core Infrastructure' as PortfolioTag,
        assignedEmployees: [defaultEmployee],
        lastCheckedAt: new Date().toISOString(),
        renewalAlerts: {
          warn30Days: true,
          warn15Days: true,
          warn7Days: true,
          continuousReminderEvery2Days: true,
        },
        notes: 'Imported from Google Sheets spreadsheet',
        whoisSource: 'Google Sheets CSV Sync',
      };
    });

    onImportDomains(newItems);
    onClose();
  };

  const insertSampleData = () => {
    const sample = `Domain,Company,Registrar,Expiration Date
auth.payments-core.io,PayCloud Inc,Cloudflare,2026-10-18
cdn.staticassets-media.net,MediaStream Ltd,GoDaddy,2026-11-04
staging.internal-api.org,Enterprise Systems,Namecheap,2026-10-25
portal.customer-eu.de,Nordic Retail,Gandi,2027-02-14`;
    setCsvText(sample);
    setActiveTab('csvPaste');
    const parsed = parseDomainsFromCsv(sample);
    setParsedPreview(parsed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-xl w-full max-h-[90vh] overflow-y-auto rounded shadow-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Import Domains from Google Sheets
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Sync bulk domain portfolios directly from spreadsheet links or CSV tables.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 mt-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('sheetUrl')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'sheetUrl'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Google Sheets Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csvPaste')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'csvPaste'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Paste CSV / TSV Text
          </button>
        </div>

        {/* Tab 1: Google Sheet URL */}
        {activeTab === 'sheetUrl' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Google Sheets Shareable URL
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA.../edit?usp=sharing"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Make sure the spreadsheet is set to <em>"Anyone with the link can view"</em>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={insertSampleData}
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:underline text-left cursor-pointer"
              >
                Or test with sample data
              </button>

              <button
                type="button"
                onClick={handleFetchSheet}
                disabled={isFetching || !sheetUrl.trim()}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
              >
                {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Fetch &amp; Parse Sheet</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Raw CSV Paste */}
        {activeTab === 'csvPaste' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                CSV or TSV Domain Data (with headers)
              </label>
              <textarea
                rows={5}
                placeholder="Domain, Company, Registrar, Expiration Date&#10;api.gateway.io, PayCloud, Cloudflare, 2026-10-15&#10;corp.security.com, Vault Inc, GoDaddy, 2026-11-20"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-2.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParseCsvText}
                className="px-3.5 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded cursor-pointer"
              >
                Parse Data
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview Table */}
        {parsedPreview.length > 0 && (
          <div className="mt-5 border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Preview ({parsedPreview.length} domains detected)
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Ready to Import
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto overflow-x-auto touch-pan-x border border-neutral-200 dark:border-neutral-800 rounded text-xs font-mono">
              <table className="w-full text-left min-w-[420px]">
                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 sticky top-0">
                  <tr>
                    <th className="p-2">Domain</th>
                    <th className="p-2">Company</th>
                    <th className="p-2">Registrar</th>
                    <th className="p-2">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                  {parsedPreview.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-2 font-medium text-neutral-900 dark:text-white">{item.domain}</td>
                      <td className="p-2 text-neutral-600 dark:text-neutral-300">{item.company || '—'}</td>
                      <td className="p-2 text-neutral-600 dark:text-neutral-300">{item.registrar || '—'}</td>
                      <td className="p-2 text-neutral-600 dark:text-neutral-300">{item.expirationDate || 'Auto'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded transition-colors text-center cursor-pointer"
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
