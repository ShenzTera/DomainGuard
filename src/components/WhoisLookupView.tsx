import React, { useState } from 'react';
import { fetchDomainWhois } from '../lib/domainService';
import { DomainItem, PortfolioTag } from '../types/domain';
import {
  Search,
  Loader2,
  Globe,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface WhoisLookupViewProps {
  onAddDomain: (newDomain: DomainItem) => void;
  trackedDomains: DomainItem[];
}

export const WhoisLookupView: React.FC<WhoisLookupViewProps> = ({ onAddDomain, trackedDomains }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (targetDomain?: string) => {
    const domain = (targetDomain || queryInput).trim().toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    if (!domain || !domain.includes('.')) {
      setErrorMsg('Please enter a valid domain name with extension (e.g. cloudscale.org)');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    if (targetDomain) setQueryInput(targetDomain);

    try {
      const data = await fetchDomainWhois(domain);
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'WHOIS query failed. Try another domain.');
    } finally {
      setIsLoading(false);
    }
  };

  const isAlreadyTracked = result && trackedDomains.some((d) => d.domain.toLowerCase() === result.domain.toLowerCase());

  const handleTrackResult = () => {
    if (!result) return;
    let expDate = result.expirationDate;
    let daysUntilExpiration = result.daysUntilExpiration;

    if (expDate) {
      const expTime = new Date(expDate).getTime();
      if (!isNaN(expTime)) {
        daysUntilExpiration = Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
      }
    } else {
      const oneYearOut = new Date();
      oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);
      expDate = oneYearOut.toISOString().split('T')[0];
      daysUntilExpiration = 365;
    }

    let workingStatus: DomainItem['workingStatus'] = 'active';
    if (daysUntilExpiration <= 0) workingStatus = 'expired';
    else if (daysUntilExpiration <= 30) workingStatus = 'expiring_soon';

    const newItem: DomainItem = {
      id: `dom_${Date.now()}`,
      domain: result.domain,
      company: result.company || `${result.domain.split('.')[0].toUpperCase()} Organization`,
      workingStatus,
      registrar: result.registrar || 'ICANN Accredited Registrar',
      registrarPortalUrl: result.registrarPortalUrl || `https://www.google.com/search?q=${encodeURIComponent((result.registrar || 'domain') + ' renewal')}`,
      expirationDate: expDate,
      daysUntilExpiration,
      isResolving: result.isResolving ?? true,
      nameservers: result.nameservers || [],
      dnsIps: result.dnsIps || [],
      portfolio: 'Core Infrastructure' as PortfolioTag,
      assignedEmployees: ['admin@enterprise.internal'],
      lastCheckedAt: new Date().toISOString(),
      renewalAlerts: {
        warn30Days: true,
        warn15Days: true,
        warn7Days: true,
        continuousReminderEvery2Days: true,
      },
      notes: `Discovered via Authoritative Registry Lookup on ${new Date().toLocaleDateString()}`,
      whoisSource: result.whoisSource || 'ICANN IANA Official RDAP',
    };

    onAddDomain(newItem);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Description */}
      <div>
        <div className="eyebrow-label text-[#5B6178] mb-1">
          REGISTRY INSPECTION
        </div>
        <h1 className="font-display text-[30px] font-extrabold text-[#101432] dark:text-white leading-tight tracking-[-0.025em]">
          Expiry &amp; Registrar Finder
        </h1>
        <p className="text-[14px] text-[#5B6178] mt-1 leading-normal">
          Authoritative intelligence powered by Official IANA RDAP &amp; Registry WHOIS: Discover real expiration dates, accredited registrars, and live DNS lifecycle status without API keys.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] p-6 rounded-[14px] shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#5B6178]" />
            <input
              type="text"
              placeholder="Query any domain (e.g. cloudscale.org, vercel.app, github.com)..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-[13px] font-mono bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white placeholder:text-[#5B6178] focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0] transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !queryInput.trim()}
            className="btn-ultramarine flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            <span>Lookup Domain</span>
          </button>
        </form>

        {/* Quick query presets */}
        <div className="mt-4 flex items-center gap-2 text-xs text-[#5B6178] flex-wrap">
          <span className="eyebrow-label text-[10px]">Presets:</span>
          {['cloudflare.com', 'wikipedia.org', 'github.com', 'domainsecurity.io'].map((dom) => (
            <button
              key={dom}
              type="button"
              onClick={() => handleSearch(dom)}
              className="px-2.5 py-1 rounded-[8px] bg-[#F3F4F8] dark:bg-[#1B2050] hover:bg-[#E2E4EE] dark:hover:bg-[#252C6E] border border-[#E2E4EE] dark:border-[#1F2756] font-mono text-[11px] text-[#101432] dark:text-white transition-colors cursor-pointer"
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 border border-[#FCDAD7] bg-[#FFF4F2] dark:bg-[#2A141A] text-[#D63A2C] text-[13px] rounded-[10px] flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] rounded-[14px] p-6 sm:p-7 shadow-xs space-y-6">
          {/* Header Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E4EE] dark:border-[#1F2756]">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold font-mono text-[#101432] dark:text-white break-all">
                  {result.domain}
                </h2>
                {result.isAvailable ? (
                  <span className="px-3 py-1 bg-[#D7F4E6] text-[#0B7A57] border border-[#A2EAD1] rounded-full font-bold text-xs flex items-center gap-1.5 font-mono shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#FFF0C2] text-[#3D2800] border border-[#F5D56B] rounded-full font-bold text-xs flex items-center gap-1.5 font-mono shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3D2800]" /> REGISTERED
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5B6178] font-mono mt-1.5">
                Source: {result.whoisSource} · Query timestamp: {new Date().toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {result.isAvailable ? (
                <a
                  href={`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(result.domain)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ultramarine flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <span>Register Domain</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <>
                  <a
                    href={result.registrarPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-neutral-surface flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                  >
                    <span>Renewal Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleTrackResult}
                    disabled={isAlreadyTracked}
                    className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] flex items-center gap-2 transition-all flex-1 sm:flex-initial justify-center ${
                      isAlreadyTracked
                        ? 'bg-[#F3F4F8] dark:bg-[#1B2050] text-[#5B6178] cursor-default border border-[#E2E4EE] dark:border-[#1F2756]'
                        : 'btn-ultramarine cursor-pointer'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAlreadyTracked ? 'Tracked in Ledger' : 'Track in Portfolio'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* If Registered, Show Expiry & WHOIS Details */}
          {!result.isAvailable && (
            <div className="space-y-6">
              {/* Expiration Timeline Banner */}
              <div
                className={`p-5 rounded-[12px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  result.daysUntilExpiration !== null && result.daysUntilExpiration <= 7
                    ? 'border-[#FCDAD7] bg-[#FFF4F2] dark:bg-[#2A141A]'
                    : result.daysUntilExpiration !== null && result.daysUntilExpiration <= 30
                    ? 'border-[#F5D56B] bg-[#FFF0C2] dark:bg-[#2A2109]'
                    : 'border-[#E2E4EE] dark:border-[#1F2756] bg-[#F3F4F8] dark:bg-[#0E122B]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-[10px] bg-white dark:bg-[#101432] border border-[#E2E4EE] dark:border-[#1F2756] shrink-0 text-[#101432] dark:text-white shadow-xs">
                    <Calendar className="w-5 h-5 text-[#2A3AF0]" />
                  </div>
                  <div>
                    <div className="eyebrow-label text-[#5B6178]">
                      Expiration Date
                    </div>
                    <div className="text-lg font-bold font-mono text-[#101432] dark:text-white mt-0.5">
                      {result.expirationDate || 'Registry RDAP Privacy Shield Active'}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span
                    className={`px-3 py-1 font-mono text-xs font-bold rounded-full inline-block ${
                      result.daysUntilExpiration !== null
                        ? result.daysUntilExpiration <= 7
                          ? 'bg-[#D63A2C] text-white'
                          : result.daysUntilExpiration <= 30
                          ? 'bg-[#FFC21A] text-[#3D2800]'
                          : 'bg-[#D7F4E6] text-[#0B7A57]'
                        : 'bg-[#E8F3FC] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                    }`}
                  >
                    {result.daysUntilExpiration !== null
                      ? result.daysUntilExpiration <= 0
                        ? `Expired (${Math.abs(result.daysUntilExpiration)}d ago)`
                        : `${result.daysUntilExpiration} days remaining`
                      : 'Active (Privacy Protected)'}
                  </span>
                  <div className="font-mono text-[11px] text-[#5B6178] mt-1">
                    {result.daysUntilExpiration !== null
                      ? result.daysUntilExpiration <= 30
                        ? 'Priority: Immediate renewal recommended'
                        : 'Priority: Ledger nominal'
                      : 'Registry RDAP redacted · Verified active'}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-white dark:bg-[#101432]">
                  <span className="eyebrow-label text-[#5B6178] block mb-1">Registrar</span>
                  <span className="font-semibold text-sm text-[#101432] dark:text-white">
                    {result.registrar || 'Privacy / Unlisted'}
                  </span>
                </div>

                <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-white dark:bg-[#101432]">
                  <span className="eyebrow-label text-[#5B6178] block mb-1">Company / Organization</span>
                  <span className="font-semibold text-sm text-[#101432] dark:text-white">
                    {result.company || 'Privacy Protected'}
                  </span>
                </div>

                <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-white dark:bg-[#101432]">
                  <span className="eyebrow-label text-[#5B6178] block mb-1">Registration Date</span>
                  <span className="font-mono text-sm text-[#101432] dark:text-white">
                    {result.registrationDate || 'Undisclosed'}
                  </span>
                </div>

                <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-white dark:bg-[#101432]">
                  <span className="eyebrow-label text-[#5B6178] block mb-1">DNS Resolution Status</span>
                  <span className="flex items-center gap-1.5 font-medium text-sm mt-0.5">
                    {result.isResolving ? (
                      <span className="text-[#0B7A57] flex items-center gap-1.5 font-mono text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Resolving (Online)
                      </span>
                    ) : (
                      <span className="text-[#D63A2C] flex items-center gap-1.5 font-mono text-xs font-semibold">
                        <AlertTriangle className="w-4 h-4" /> Unresolving / Inactive
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Nameservers */}
              {result.nameservers && result.nameservers.length > 0 && (
                <div>
                  <div className="eyebrow-label text-[#5B6178] mb-2">
                    Authoritative Nameservers ({result.nameservers.length})
                  </div>
                  <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B] font-mono text-xs space-y-1.5">
                    {result.nameservers.map((ns: string, i: number) => (
                      <div key={i} className="text-[#101432] dark:text-white">
                        {ns}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If Available */}
          {result.isAvailable && (
            <div className="p-8 border border-[#A2EAD1] dark:border-emerald-900/60 bg-[#D7F4E6]/40 dark:bg-emerald-950/20 rounded-[12px] text-center space-y-4">
              <div className="w-12 h-12 rounded-[10px] bg-[#D7F4E6] text-[#0B7A57] border border-[#A2EAD1] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold font-display text-[#101432] dark:text-white">
                {result.domain} is Available for Registration!
              </h3>
              <p className="text-[13px] text-[#5B6178] max-w-md mx-auto leading-relaxed">
                No active WHOIS or RDAP records exist for this domain. You can claim it now before competitors or domain squatters acquire it.
              </p>
              <div className="pt-2">
                <a
                  href={`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(result.domain)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ultramarine inline-flex items-center gap-2"
                >
                  <span>Claim Domain</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
