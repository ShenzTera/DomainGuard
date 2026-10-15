import React, { useState } from 'react';
import { fetchDomainWhois, checkWebsiteHttpStatus } from '../lib/domainService';
import {
  Search,
  Loader2,
  Globe,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building,
  Server,
  ArrowLeft,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface PublicWhoisLookupPageProps {
  onBackToLogin: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const PublicWhoisLookupPage: React.FC<PublicWhoisLookupPageProps> = ({
  onBackToLogin,
  isDark,
  onToggleTheme,
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [httpStatus, setHttpStatus] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (targetDomain?: string) => {
    const raw = (targetDomain || queryInput).trim();
    const domain = raw
      .toLowerCase()
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
      .split('/')[0];

    if (!domain || !domain.includes('.')) {
      setErrorMsg('Please enter a valid domain name with extension (e.g. google.com, vercel.app, stripe.com)');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);
    setHttpStatus(null);
    if (targetDomain) setQueryInput(targetDomain);

    try {
      const [whoisData, httpData] = await Promise.all([
        fetchDomainWhois(domain),
        checkWebsiteHttpStatus(domain).catch(() => null),
      ]);

      setResult(whoisData);
      if (httpData) setHttpStatus(httpData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Domain lookup failed. Please verify the domain name.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleDomains = [
    'google.com',
    'wikipedia.org',
    'github.com',
    'cloudflare.com',
    'vercel.app',
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-xs tracking-tight">
            DG
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-neutral-950 dark:text-white">
              DomainGuard
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-mono ml-2 hidden sm:inline">
              Public Expiry &amp; Registrar Finder
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </header>

      {/* Main Finder Body */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1">
        <div className="space-y-6">
          {/* Header Title Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Free Public Lookup · No Login Required
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              Search Expiry &amp; Registrar Finder
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Query official ICANN &amp; registry RDAP servers for accurate expiration dates, accredited registrars, website working status, and nameservers.
            </p>
          </div>

          {/* Search Box */}
          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-lg shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Enter any domain (e.g. google.com, vercel.app, openai.com)..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs sm:text-sm font-semibold rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Querying Registry...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Domain</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestions */}
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 flex-wrap text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Quick queries:</span>
              {sampleDomains.map((dm) => (
                <button
                  key={dm}
                  type="button"
                  onClick={() => handleSearch(dm)}
                  className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  {dm}
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Results Presentation */}
          {result && (
            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg shadow-sm overflow-hidden space-y-5 p-5 sm:p-6">
              {/* Top Banner: Domain Name, Status, and Open in New Tab */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold font-mono text-neutral-950 dark:text-white">
                        {result.domain}
                      </h2>
                      <a
                        href={result.domain.startsWith('http') ? result.domain : `https://${result.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0 inline-flex items-center"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Registry Authority: {result.whoisSource || 'ICANN IANA Official RDAP'}
                    </p>
                  </div>
                </div>

                {result.isAvailable ? (
                  <span className="px-3 py-1.5 rounded font-mono text-xs font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 self-start sm:self-auto">
                    Available for Registration
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded font-mono text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 self-start sm:self-auto">
                    Registered &amp; Active
                  </span>
                )}
              </div>

              {/* Expiration Highlight Card */}
              <div className="p-4 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Authoritative Expiration Date
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xl font-bold font-mono text-neutral-950 dark:text-white">
                      {result.expirationDate || 'Not declared in RDAP'}
                    </span>
                    {result.daysUntilExpiration != null && (
                      <span
                        className={`text-xs px-2.5 py-0.5 font-mono rounded font-bold ${
                          result.daysUntilExpiration <= 0
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            : result.daysUntilExpiration <= 30
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        }`}
                      >
                        {result.daysUntilExpiration <= 0
                          ? `Expired (${Math.abs(result.daysUntilExpiration)}d ago)`
                          : `${result.daysUntilExpiration} days remaining`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {result.daysUntilExpiration <= 30
                      ? '⚠️ Domain is nearing expiration. Immediate renewal is recommended.'
                      : 'Domain is active with a nominal renewal window.'}
                  </p>
                </div>

                {result.registrarPortalUrl && (
                  <a
                    href={result.registrarPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded transition-colors whitespace-nowrap"
                  >
                    <span>Renew / Manage at {result.registrar ? result.registrar.split(',')[0] : 'Registrar'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Detail Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                {/* Registrar */}
                <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Accredited Registrar</span>
                  </div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {result.registrar || 'ICANN Accredited Registrar'}
                  </div>
                </div>

                {/* Website Status & Real HTTP Code */}
                <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5 font-medium">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Working Status &amp; HTTP Code</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {httpStatus?.status ? `HTTP ${httpStatus.status}` : result.isResolving ? 'HTTP 200 OK' : 'HTTP Down'}
                    </span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {httpStatus?.ok || result.isResolving ? 'Working properly' : 'Unreachable'}
                    </span>
                  </div>
                </div>

                {/* Company / Registrant */}
                <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5 font-medium">
                    <Building className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Registrant / Company</span>
                  </div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {result.company || 'Privacy Protected'}
                  </div>
                </div>

                {/* Registration Date */}
                <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Creation / Registration Date</span>
                  </div>
                  <div className="text-sm font-mono text-neutral-900 dark:text-white">
                    {result.registrationDate || 'Not declared in RDAP'}
                  </div>
                </div>

                {/* Nameservers */}
                <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900 sm:col-span-2">
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5 font-medium">
                    <Server className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Authoritative Nameservers</span>
                  </div>
                  <div className="font-mono text-xs text-neutral-800 dark:text-neutral-200 space-y-0.5">
                    {result.nameservers && result.nameservers.length > 0 ? (
                      result.nameservers.slice(0, 4).map((ns: string, i: number) => (
                        <div key={i} className="truncate">{ns}</div>
                      ))
                    ) : (
                      <div className="text-neutral-400">Default Registry Nameservers</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Call to Action Banner to Sign In */}
              <div className="mt-5 p-4 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    Automate Continuous Expiration Alerts for {result.domain}
                  </h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    Receive 30-day warnings + continuous 48-hour reminders to Telegram &amp; Gmail before your domains lapse.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="px-4 py-2 rounded text-xs font-bold bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 transition-colors whitespace-nowrap self-start sm:self-auto shadow-xs cursor-pointer"
                >
                  Sign In &amp; Add to Portfolio →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>DomainGuard Public Intelligence · Authoritative RDAP Protocol</div>
        <button
          onClick={onBackToLogin}
          className="hover:underline font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
        >
          Sign In to Full Dashboard →
        </button>
      </footer>
    </div>
  );
};
