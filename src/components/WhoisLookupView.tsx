import React, { useState } from 'react';
import { fetchDomainWhois } from '../lib/domainService';
import { DomainItem, PortfolioTag } from '../types/domain';
import { Search, Loader2, Globe, ExternalLink, Plus, CheckCircle2, AlertTriangle, ShieldCheck, Server, Calendar } from 'lucide-react';

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
        <h1 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
          Domain Expiry &amp; Registrar Finder
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Direct registry intelligence powered by Official IANA RDAP &amp; Authoritative WHOIS: Discover real expiration dates, accredited registrars, and live DNS lifecycle status (100% Free, Zero API keys required).
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 sm:p-4 rounded shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Query any domain (e.g. google.com, vercel.app, github.com)..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !queryInput.trim()}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            <span>Find Expiry &amp; Registrar</span>
          </button>
        </form>

        {/* Quick query presets */}
        <div className="mt-3 flex items-center gap-1.5 sm:gap-2 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
          <span className="text-[11px]">Quick inspect:</span>
          {['cloudflare.com', 'wikipedia.org', 'avail-brand-test-2026.org', 'github.com'].map((dom) => (
            <button
              key={dom}
              type="button"
              onClick={() => handleSearch(dom)}
              className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-3.5 border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
          {/* Header Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-mono text-neutral-900 dark:text-white break-all">
                  {result.domain}
                </h2>
                {result.isAvailable ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded font-semibold text-xs flex items-center gap-1 font-mono shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 rounded font-semibold text-xs flex items-center gap-1 font-mono shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> REGISTERED
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Source: {result.whoisSource} · Query timestamp: {new Date().toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {result.isAvailable ? (
                <a
                  href={`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(result.domain)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
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
                    className="px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors flex-1 sm:flex-initial justify-center"
                  >
                    <span>Renewal Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleTrackResult}
                    disabled={isAlreadyTracked}
                    className={`px-4 py-2 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors flex-1 sm:flex-initial justify-center ${
                      isAlreadyTracked
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-default'
                        : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAlreadyTracked ? 'Tracked in Dashboard' : 'Track in Portfolio'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* If Registered, Show Comprehensive Expiry & WHOIS Details */}
          {!result.isAvailable && (
            <div className="space-y-5 sm:space-y-6">
              {/* Expiration Timeline Banner */}
              <div className="p-3.5 sm:p-4 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shrink-0">
                    <Calendar className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      Expiration Date
                    </div>
                    <div className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                      {result.expirationDate || 'Not declared in RDAP'}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span
                    className={`px-3 py-1 font-mono text-xs font-bold rounded inline-block ${
                      result.daysUntilExpiration <= 0
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : result.daysUntilExpiration <= 30
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {result.daysUntilExpiration !== null
                      ? result.daysUntilExpiration <= 0
                        ? `Expired (${Math.abs(result.daysUntilExpiration)}d ago)`
                        : `${result.daysUntilExpiration} days remaining`
                      : 'Active'}
                  </span>
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                    {result.daysUntilExpiration <= 30
                      ? 'Priority: Immediate renewal recommended'
                      : 'Priority: Nominal'}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
                  <span className="text-neutral-400 dark:text-neutral-500 block mb-1">Registrar</span>
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                    {result.registrar || 'Privacy / Unlisted'}
                  </span>
                </div>

                <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
                  <span className="text-neutral-400 dark:text-neutral-500 block mb-1">Company / Organization</span>
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                    {result.company || 'Privacy Protected'}
                  </span>
                </div>

                <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
                  <span className="text-neutral-400 dark:text-neutral-500 block mb-1">Registration Date</span>
                  <span className="font-mono text-sm text-neutral-800 dark:text-neutral-200">
                    {result.registrationDate || 'Undisclosed'}
                  </span>
                </div>

                <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
                  <span className="text-neutral-400 dark:text-neutral-500 block mb-1">DNS Resolution Status</span>
                  <span className="flex items-center gap-1.5 font-medium text-sm mt-0.5">
                    {result.isResolving ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolving (Online)
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Unresolving / Inactive
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Nameservers */}
              {result.nameservers && result.nameservers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                    Authoritative Nameservers ({result.nameservers.length})
                  </h4>
                  <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-950 font-mono text-xs space-y-1">
                    {result.nameservers.map((ns: string, i: number) => (
                      <div key={i} className="text-neutral-700 dark:text-neutral-300">
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
            <div className="p-6 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 rounded text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {result.domain} is Available for Purchase!
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                No active WHOIS or RDAP records exist for this domain. You can claim it now before competitors or domain squatters acquire it.
              </p>
              <div className="pt-2">
                <a
                  href={`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(result.domain)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-xs"
                >
                  <span>Claim on Namecheap</span>
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
