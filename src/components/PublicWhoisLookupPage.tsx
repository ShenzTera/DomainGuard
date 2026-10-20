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
  Shield,
} from 'lucide-react';

interface PublicWhoisLookupPageProps {
  onBackToLogin: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const PublicWhoisLookupPage: React.FC<PublicWhoisLookupPageProps> = ({
  onBackToLogin,
  isDark = false,
  onToggleTheme,
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [httpStatus, setHttpStatus] = useState<{
    code: number;
    latencyMs: number;
    statusText?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (domainOverride?: string) => {
    const target = (domainOverride || queryInput).trim().toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    if (!target || !target.includes('.')) {
      setErrorMsg('Please enter a valid domain (e.g. google.com, vercel.app, github.io)');
      return;
    }

    if (domainOverride) setQueryInput(domainOverride);
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);
    setHttpStatus(null);

    try {
      const data = await fetchDomainWhois(target);
      setResult(data);

      try {
        const httpData = await checkWebsiteHttpStatus(target);
        setHttpStatus({
          code: httpData.status,
          latencyMs: httpData.latencyMs || 0,
          statusText: httpData.statusText,
        });
      } catch {
        // Non-blocking
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'WHOIS query failed. Please verify the domain and try again.');
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
    <div className="min-h-screen flex flex-col justify-between bg-[#F3F4F8] dark:bg-[#0B0E23] text-[#101432] dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between border-b border-[#E2E4EE] dark:border-[#1F2756]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#101432] text-[#D6F24B] border border-[#1B2050] flex items-center justify-center font-bold text-xs tracking-tight shadow-sm">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-display text-[18px] font-extrabold tracking-tight text-[#101432] dark:text-white">
              DomainGuard
            </span>
            <span className="text-[#5B6178] text-xs font-mono ml-2.5 hidden sm:inline">
              Public RDAP &amp; WHOIS Finder
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle dark mode"
              className="btn-neutral-surface p-2 cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-[#FFC21A]" /> : <Moon className="w-4 h-4 text-[#101432]" />}
            </button>
          )}

          <button
            type="button"
            onClick={onBackToLogin}
            className="btn-neutral-surface flex items-center gap-2 cursor-pointer text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Main Finder Body */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1">
        <div className="space-y-6">
          {/* Header Title Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#D7F4E6] text-[#0B7A57]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Free Public Query · Authoritative IANA RDAP
            </span>
            <h1 className="font-display text-[28px] sm:text-[32px] font-extrabold tracking-[-0.025em] text-[#101432] dark:text-white leading-tight">
              Domain Expiry &amp; Registrar Finder
            </h1>
            <p className="text-[14px] text-[#5B6178] leading-relaxed">
              Query official ICANN &amp; registry RDAP servers for accurate expiration dates, accredited registrars, website working status, and nameservers.
            </p>
          </div>

          {/* Search Box */}
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
                  placeholder="Enter any domain (e.g. google.com, vercel.app, openai.com)..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-[13px] font-mono bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white placeholder:text-[#5B6178] focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-ultramarine flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
            <div className="mt-4 pt-3 border-t border-[#E2E4EE] dark:border-[#1F2756] flex items-center gap-2 flex-wrap text-xs text-[#5B6178]">
              <span className="eyebrow-label text-[10px]">Quick queries:</span>
              {sampleDomains.map((dm) => (
                <button
                  key={dm}
                  type="button"
                  onClick={() => handleSearch(dm)}
                  className="px-2.5 py-1 rounded-[8px] bg-[#F3F4F8] dark:bg-[#0E122B] hover:bg-[#E2E4EE] dark:hover:bg-[#1B2050] border border-[#E2E4EE] dark:border-[#1F2756] font-mono text-[11px] text-[#101432] dark:text-white transition-colors cursor-pointer"
                >
                  {dm}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-[10px] bg-[#FFF4F2] text-[#D63A2C] border border-[#FCDAD7] text-[13px] flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] rounded-[14px] shadow-xs overflow-hidden space-y-6 p-6 sm:p-7">
              {/* Top Result Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E4EE] dark:border-[#1F2756]">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold font-mono text-[#101432] dark:text-white break-all">
                      {result.domain}
                    </h2>
                    <a
                      href={`https://${result.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5B6178] hover:text-[#2A3AF0] transition-colors p-1"
                      title="Visit domain"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="text-xs font-mono text-[#5B6178] mt-1">
                    Registry Provider: {result.whoisSource} · Query at {new Date().toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {result.isAvailable ? (
                    <span className="px-3 py-1 rounded-full font-mono font-bold text-xs bg-[#D7F4E6] text-[#0B7A57] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      AVAILABLE FOR REGISTRATION
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full font-mono font-bold text-xs bg-[#FFF0C2] text-[#3D2800] border border-[#F5D56B] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ACTIVE REGISTERED DOMAIN
                    </span>
                  )}
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                {/* Expiration Date Card */}
                <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B]">
                  <div className="flex items-center gap-2 eyebrow-label text-[#5B6178]">
                    <Calendar className="w-4 h-4 text-[#2A3AF0]" />
                    <span>EXPIRATION DATE</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-[#101432] dark:text-white mt-1.5">
                    {result.expirationDate || 'Not declared in RDAP'}
                  </div>
                  {result.daysUntilExpiration !== null && (
                    <div className="mt-1 font-mono text-xs font-semibold text-[#2A3AF0]">
                      {result.daysUntilExpiration <= 0
                        ? `Expired ${Math.abs(result.daysUntilExpiration)} days ago`
                        : `${result.daysUntilExpiration} days remaining until expiry`}
                    </div>
                  )}
                </div>

                {/* Registrar Card */}
                <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B]">
                  <div className="flex items-center gap-2 eyebrow-label text-[#5B6178]">
                    <Building className="w-4 h-4 text-[#2A3AF0]" />
                    <span>ACCREDITED REGISTRAR</span>
                  </div>
                  <div className="text-lg font-bold text-[#101432] dark:text-white mt-1.5 truncate">
                    {result.registrar || 'Protected / Hidden'}
                  </div>
                  {result.registrarPortalUrl && (
                    <a
                      href={result.registrarPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-[#2A3AF0] hover:underline"
                    >
                      <span>Visit Renewal Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Company / Registrant */}
                <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B]">
                  <div className="flex items-center gap-2 eyebrow-label text-[#5B6178]">
                    <Shield className="w-4 h-4 text-[#2A3AF0]" />
                    <span>REGISTRANT ORGANIZATION</span>
                  </div>
                  <div className="text-base font-semibold text-[#101432] dark:text-white mt-1.5 truncate">
                    {result.company || 'Registry Privacy Protected'}
                  </div>
                </div>

                {/* HTTP & DNS Working Status */}
                <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B]">
                  <div className="flex items-center gap-2 eyebrow-label text-[#5B6178]">
                    <Globe className="w-4 h-4 text-[#2A3AF0]" />
                    <span>HTTP LIVE STATUS</span>
                  </div>
                  <div className="text-base font-mono font-semibold mt-1.5 flex items-center gap-2">
                    {httpStatus ? (
                      <>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          httpStatus.code >= 200 && httpStatus.code < 400
                            ? 'bg-[#D7F4E6] text-[#0B7A57]'
                            : 'bg-[#FFF4F2] text-[#D63A2C]'
                        }`}>
                          HTTP {httpStatus.code}
                        </span>
                        <span className="text-xs text-[#5B6178]">
                          {httpStatus.latencyMs}ms response
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-[#5B6178]">
                        {result.isResolving ? 'DNS Resolving (Online)' : 'No active A/AAAA DNS records'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Nameservers List */}
              {result.nameservers && result.nameservers.length > 0 && (
                <div>
                  <div className="eyebrow-label text-[#5B6178] mb-2">
                    Authoritative Nameservers ({result.nameservers.length})
                  </div>
                  <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B] font-mono text-xs space-y-1 text-[#101432] dark:text-white">
                    {result.nameservers.map((ns: string, i: number) => (
                      <div key={i}>{ns}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-[#5B6178] font-mono border-t border-[#E2E4EE] dark:border-[#1F2756]">
        DomainGuard · ICANN WHOIS &amp; RDAP Portfolio Ledger
      </footer>
    </div>
  );
};
