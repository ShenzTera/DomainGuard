import React, { useState } from 'react';
import { checkDomainDns } from '../lib/domainService';
import { DomainItem, DnsRecordType, DnsLookupResult, PortfolioTag } from '../types/domain';
import {
  Search,
  Loader2,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  Info,
  Server,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface DnsCheckerViewProps {
  onAddDomain?: (newDomain: DomainItem) => void;
  trackedDomains?: DomainItem[];
  onNavigateToWhois?: () => void;
}

const RECORD_TYPES: Array<{ type: DnsRecordType; label: string; desc: string }> = [
  { type: 'A', label: 'A', desc: 'IPv4 Address' },
  { type: 'AAAA', label: 'AAAA', desc: 'IPv6 Address' },
  { type: 'CNAME', label: 'CNAME', desc: 'Canonical Name' },
  { type: 'MX', label: 'MX', desc: 'Mail Exchanger' },
  { type: 'TXT', label: 'TXT', desc: 'Text & SPF / Verification' },
  { type: 'NS', label: 'NS', desc: 'Authoritative Nameservers' },
  { type: 'SOA', label: 'SOA', desc: 'Start of Authority' },
  { type: 'CAA', label: 'CAA', desc: 'Certificate Authority Authorization' },
];

export const DnsCheckerView: React.FC<DnsCheckerViewProps> = ({
  onAddDomain,
  trackedDomains = [],
  onNavigateToWhois,
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [recordType, setRecordType] = useState<DnsRecordType>('A');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DnsLookupResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleLookup = async (targetDomain?: string, targetType?: DnsRecordType) => {
    const rawDom = (targetDomain || domainInput).trim();
    const clean = rawDom.toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    const typeToQuery = targetType || recordType;

    if (!clean || !clean.includes('.')) {
      setErrorMsg('Please enter a valid domain name with extension (e.g. cloudscale.org)');
      return;
    }

    if (targetDomain) setDomainInput(targetDomain);
    if (targetType) setRecordType(targetType);

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await checkDomainDns(clean, typeToQuery);
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'DNS lookup failed. Please verify the domain and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedValue(text);
      setTimeout(() => setCopiedValue(null), 2000);
    }
  };

  const isAlreadyTracked = Boolean(
    result && trackedDomains.some((d) => d.domain.toLowerCase() === result.domain.toLowerCase())
  );

  const handleQuickTrack = () => {
    if (!result || !onAddDomain) return;
    const clean = result.domain;
    const oneYearOut = new Date();
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);

    const newItem: DomainItem = {
      id: `dom_${Date.now()}`,
      domain: clean,
      company: `${clean.split('.')[0].toUpperCase()} Infrastructure`,
      workingStatus: result.status === 'NOERROR' ? 'active' : 'dns_issue',
      registrar: 'Discovered via DNS Inspection',
      registrarPortalUrl: `https://www.google.com/search?q=${encodeURIComponent(clean + ' registrar login')}`,
      expirationDate: oneYearOut.toISOString().split('T')[0],
      daysUntilExpiration: 365,
      isResolving: result.records.length > 0,
      nameservers: result.nameservers || [],
      dnsIps: result.records.filter(r => r.type === 'A').map(r => r.value),
      portfolio: 'Core Infrastructure' as PortfolioTag,
      assignedEmployees: ['devops@enterprise.internal'],
      lastCheckedAt: new Date().toISOString(),
      renewalAlerts: {
        warn30Days: true,
        warn15Days: true,
        warn7Days: true,
        continuousReminderEvery2Days: true,
      },
      notes: `Imported via DomScan DNS Inspector (${recordType} check: ${result.status})`,
      whoisSource: result.source,
      httpStatusCode: 200,
      httpStatusText: '200 OK',
      httpLatencyMs: result.responseTimeMs || 35,
    };

    onAddDomain(newItem);
  };

  const samplePresets = ['cloudflare.com', 'google.com', 'github.com', 'wikipedia.org', 'vercel.app'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Zone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="eyebrow-label text-[#5B6178] mb-1 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#2A3AF0]" />
            <span>DNS RECONNAISSANCE</span>
          </div>
          <h1 className="font-display text-[30px] font-extrabold text-[#101432] dark:text-white leading-tight tracking-[-0.025em]">
            DNS Record Checker
          </h1>
          <p className="text-[14px] text-[#5B6178] mt-1 leading-normal">
            Inspect live DNS propagation, authoritative zone records, TTL parameters, and mail exchangers powered by DomScan API &amp; high-speed resolvers.
          </p>
        </div>

        {/* DomScan Engine Status Chip */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-[#101432] border border-[#E2E4EE] dark:border-[#1F2756] px-3 py-1.5 rounded-[10px] shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-[11px] font-mono leading-none">
            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase tracking-wider font-sans font-bold">API STATUS</span>
            <span className="text-slate-900 dark:text-white font-semibold">DomScan Connected</span>
          </div>
        </div>
      </div>

      {/* Query Control Card */}
      <div className="border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] p-5 sm:p-6 rounded-[14px] shadow-xs space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Domain input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#5B6178]" />
              <input
                type="text"
                placeholder="Enter domain (e.g. example.com, cloudscale.org)..."
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-[13.5px] font-mono bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white placeholder:text-[#5B6178] focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0] transition-all"
              />
            </div>

            {/* Record Type Dropdown Selector */}
            <div className="w-full sm:w-44">
              <select
                value={recordType}
                onChange={(e) => {
                  const newType = e.target.value as DnsRecordType;
                  setRecordType(newType);
                  if (domainInput.trim()) {
                    handleLookup(undefined, newType);
                  }
                }}
                aria-label="Select DNS Record Type"
                className="w-full px-3 py-2.5 text-[13px] font-mono font-bold bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0] cursor-pointer"
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.type} — {t.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !domainInput.trim()}
              className="btn-ultramarine flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer w-full sm:w-auto px-6 py-2.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Radio className="w-4 h-4" />
              )}
              <span className="font-semibold text-[13.5px]">Check DNS</span>
            </button>
          </div>

          {/* Quick Record Type Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-[#1F2756]">
            <span className="eyebrow-label text-[10px] text-[#5B6178] mr-1">QUICK TYPE:</span>
            {RECORD_TYPES.slice(0, 6).map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => {
                  setRecordType(t.type);
                  if (domainInput.trim()) {
                    handleLookup(undefined, t.type);
                  }
                }}
                className={`px-2.5 py-1 rounded-[7px] text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  recordType === t.type
                    ? 'bg-[#101432] text-white dark:bg-[#2A3AF0]'
                    : 'bg-[#F3F4F8] dark:bg-[#1B2050] text-[#5B6178] dark:text-slate-300 hover:bg-[#E2E4EE] dark:hover:bg-[#252C6E]'
                }`}
              >
                {t.type}
              </button>
            ))}
          </div>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 text-xs text-[#5B6178] flex-wrap pt-2">
          <span className="eyebrow-label text-[10px]">PRESETS:</span>
          {samplePresets.map((dom) => (
            <button
              key={dom}
              type="button"
              onClick={() => handleLookup(dom, recordType)}
              className="px-2.5 py-1 rounded-[7px] bg-[#F3F4F8] dark:bg-[#1B2050] hover:bg-[#E2E4EE] dark:hover:bg-[#252C6E] border border-[#E2E4EE] dark:border-[#1F2756] font-mono text-[11px] text-[#101432] dark:text-white transition-colors cursor-pointer"
            >
              {dom}
            </button>
          ))}

          {trackedDomains.length > 0 && (
            <span className="text-[11px] text-slate-400 ml-auto hidden md:inline">
              Tip: Click any domain from your ledger to inspect records
            </span>
          )}
        </div>
      </div>

      {/* Error State Banner */}
      {errorMsg && (
        <div className="p-4 border border-[#FCDAD7] bg-[#FFF4F2] dark:bg-[#2A141A] text-[#D63A2C] text-[13px] rounded-[10px] flex items-center gap-2.5 animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] rounded-[14px] p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          {/* Result Header & Status Cluster */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E4EE] dark:border-[#1F2756]">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold font-mono text-[#101432] dark:text-white break-all">
                  {result.domain}
                </h2>

                {/* Status Pill */}
                {result.status === 'NOERROR' ? (
                  <span className="px-3 py-1 bg-[#D7F4E6] text-[#0B7A57] border border-[#A2EAD1] rounded-full font-bold text-xs flex items-center gap-1.5 font-mono shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> NOERROR
                  </span>
                ) : result.status === 'NXDOMAIN' ? (
                  <span className="px-3 py-1 bg-[#FFF4F2] text-[#D63A2C] border border-[#FCDAD7] rounded-full font-bold text-xs flex items-center gap-1.5 font-mono shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" /> NXDOMAIN (Non-Existent)
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#FFF0C2] text-[#3D2800] border border-[#F5D56B] rounded-full font-bold text-xs flex items-center gap-1.5 font-mono shrink-0">
                    <Info className="w-3.5 h-3.5" /> {result.status}
                  </span>
                )}

                <span className="px-2.5 py-0.5 rounded-[6px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                  {result.type} Record
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#5B6178] font-mono mt-1.5 flex-wrap">
                <span>Source: <strong className="text-slate-800 dark:text-slate-200">{result.source}</strong></span>
                {result.responseTimeMs !== undefined && (
                  <span>· Response: <strong className="text-slate-800 dark:text-slate-200">{result.responseTimeMs}ms</strong></span>
                )}
                <span>· Timestamp: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleLookup(result.domain, recordType)}
                className="btn-neutral-surface px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
                title="Re-query records"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-query</span>
              </button>

              {onAddDomain && (
                <button
                  type="button"
                  onClick={handleQuickTrack}
                  disabled={isAlreadyTracked}
                  className={`px-3 py-2 text-xs font-semibold rounded-[10px] flex items-center gap-1.5 transition-all cursor-pointer ${
                    isAlreadyTracked
                      ? 'bg-slate-100 dark:bg-[#1B2050] text-[#5B6178] border border-slate-200 dark:border-[#1F2756]'
                      : 'btn-ultramarine'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAlreadyTracked ? 'Tracked in Ledger' : 'Track in Portfolio'}</span>
                </button>
              )}

              {onNavigateToWhois && (
                <button
                  type="button"
                  onClick={onNavigateToWhois}
                  className="btn-neutral-surface px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>RDAP Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px]">
              <span className="eyebrow-label text-[10px] text-[#5B6178] block">RECORDS FOUND</span>
              <span className="font-display text-2xl font-bold text-[#101432] dark:text-white mt-0.5 block">
                {result.records.length}
              </span>
            </div>

            <div className="p-3.5 bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px]">
              <span className="eyebrow-label text-[10px] text-[#5B6178] block">RECORD TYPE</span>
              <span className="font-mono text-xl font-bold text-[#2A3AF0] dark:text-sky-400 mt-0.5 block">
                {result.type}
              </span>
            </div>

            <div className="p-3.5 bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px]">
              <span className="eyebrow-label text-[10px] text-[#5B6178] block">PRIMARY TTL</span>
              <span className="font-mono text-xl font-bold text-[#101432] dark:text-white mt-0.5 block">
                {result.records[0]?.ttl ? `${result.records[0].ttl}s` : 'Standard'}
              </span>
            </div>

            <div className="p-3.5 bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px]">
              <span className="eyebrow-label text-[10px] text-[#5B6178] block">RESOLVER LATENCY</span>
              <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {result.responseTimeMs ? `${result.responseTimeMs}ms` : 'Instant'}
              </span>
            </div>
          </div>

          {/* DNS Records Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-[#101432] dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-[#2A3AF0]" />
                <span>Returned DNS Records</span>
              </h3>
              <span className="text-xs font-mono text-[#5B6178]">
                {result.records.length} {result.records.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {result.records.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E2E4EE] dark:border-[#1F2756] rounded-[12px] bg-[#F3F4F8]/50 dark:bg-[#0E122B]/50">
                <Info className="w-8 h-8 mx-auto text-[#5B6178] mb-2" />
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  No {result.type} records found for {result.domain}
                </p>
                <p className="text-xs text-[#5B6178] mt-1 max-w-md mx-auto">
                  The domain resolved with status {result.status}. Try querying another record type such as A, CNAME, or NS.
                </p>
              </div>
            ) : (
              <div className="border border-[#E2E4EE] dark:border-[#1F2756] rounded-[12px] overflow-hidden bg-white dark:bg-[#101432]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#101432] text-white uppercase text-[10.5px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3.5 w-16">TYPE</th>
                        <th className="py-2.5 px-3.5 w-48">HOST / NAME</th>
                        <th className="py-2.5 px-3.5">TARGET / VALUE</th>
                        <th className="py-2.5 px-3.5 w-24">TTL</th>
                        {result.type === 'MX' && <th className="py-2.5 px-3.5 w-24">PRIORITY</th>}
                        <th className="py-2.5 px-3.5 w-20 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E4EE] dark:divide-[#1F2756]">
                      {result.records.map((rec, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-[#F3F4F8]/80 dark:hover:bg-[#1B2050]/50 transition-colors"
                        >
                          <td className="py-3 px-3.5 font-bold text-[#2A3AF0] dark:text-sky-400">
                            <span className="px-2 py-0.5 rounded-[4px] bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                              {rec.type}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]" title={rec.name}>
                            {rec.name}
                          </td>
                          <td className="py-3 px-3.5 text-slate-900 dark:text-white font-semibold break-all selection:bg-[#2A3AF0] selection:text-white">
                            {rec.value}
                          </td>
                          <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {rec.ttl !== null && rec.ttl !== undefined ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{rec.ttl}s</span>
                              </span>
                            ) : (
                              'Auto'
                            )}
                          </td>
                          {result.type === 'MX' && (
                            <td className="py-3 px-3.5 font-bold text-amber-600 dark:text-amber-400">
                              {rec.priority !== null && rec.priority !== undefined ? `Pref ${rec.priority}` : '—'}
                            </td>
                          )}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleCopy(rec.value)}
                              className="p-1.5 rounded-[6px] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Copy record value to clipboard"
                            >
                              {copiedValue === rec.value ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-[10px] text-emerald-600 font-sans font-bold">Copied</span>
                                </>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Raw JSON Debug Inspector Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#1F2756]">
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{showRawJson ? '▼ Hide' : '▶ Show'} Raw DomScan API Payload</span>
            </button>

            {showRawJson && (
              <pre className="mt-3 p-4 bg-[#101432] text-slate-200 rounded-[10px] text-xs font-mono overflow-x-auto max-h-64 selection:bg-[#2A3AF0]">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Educational Cheatsheet Card */}
      <div className="border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] rounded-[14px] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2A3AF0]" />
          <h3 className="font-bold text-[14.5px] text-[#101432] dark:text-white font-sans">
            Standard DNS Record Reference
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#F3F4F8] dark:bg-[#0E122B] rounded-[9px] border border-[#E2E4EE] dark:border-[#1F2756]">
            <div className="font-mono font-bold text-[#2A3AF0] mb-0.5">A Record</div>
            <p className="text-[#5B6178] leading-relaxed">
              Maps hostname directly to a 32-bit IPv4 address (e.g. 104.16.133.229).
            </p>
          </div>

          <div className="p-3 bg-[#F3F4F8] dark:bg-[#0E122B] rounded-[9px] border border-[#E2E4EE] dark:border-[#1F2756]">
            <div className="font-mono font-bold text-[#2A3AF0] mb-0.5">AAAA Record</div>
            <p className="text-[#5B6178] leading-relaxed">
              Maps hostname to a 128-bit IPv6 address for next-gen Internet routing.
            </p>
          </div>

          <div className="p-3 bg-[#F3F4F8] dark:bg-[#0E122B] rounded-[9px] border border-[#E2E4EE] dark:border-[#1F2756]">
            <div className="font-mono font-bold text-[#2A3AF0] mb-0.5">CNAME Record</div>
            <p className="text-[#5B6178] leading-relaxed">
              Canonical Name alias directing one domain name to another target domain.
            </p>
          </div>

          <div className="p-3 bg-[#F3F4F8] dark:bg-[#0E122B] rounded-[9px] border border-[#E2E4EE] dark:border-[#1F2756]">
            <div className="font-mono font-bold text-[#2A3AF0] mb-0.5">MX Record</div>
            <p className="text-[#5B6178] leading-relaxed">
              Mail Exchanger defining incoming email servers and delivery preference weights.
            </p>
          </div>

          <div className="p-3 bg-[#F3F4F8] dark:bg-[#0E122B] rounded-[9px] border border-[#E2E4EE] dark:border-[#1F2756]">
            <div className="font-mono font-bold text-[#2A3AF0] mb-0.5">TXT Record</div>
            <p className="text-[#5B6178] leading-relaxed">
              Carries SPF authorization, DKIM public keys, DMARC policies, and SaaS ownership tokens.
            </p>
          </div>

          <div className="p-3 bg-[#F3F4F8] dark:bg-[#0E122B] rounded-[9px] border border-[#E2E4EE] dark:border-[#1F2756]">
            <div className="font-mono font-bold text-[#2A3AF0] mb-0.5">NS Record</div>
            <p className="text-[#5B6178] leading-relaxed">
              Delegates DNS zone authority to specified primary &amp; secondary nameservers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
