import React from 'react';
import { DomainItem } from '../types/domain';
import { ExternalLink, Globe, Shield, Server, Calendar, Building, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface WhoisDetailModalProps {
  domain: DomainItem | null;
  onClose: () => void;
  onToggleAlert2Days?: (id: string) => void;
}

export const WhoisDetailModal: React.FC<WhoisDetailModalProps> = ({ domain, onClose, onToggleAlert2Days }) => {
  if (!domain) return null;

  const isExpired = domain.daysUntilExpiration <= 0;
  const isCritical7d = domain.daysUntilExpiration > 0 && domain.daysUntilExpiration <= 7;
  const isWarning30d = domain.daysUntilExpiration > 7 && domain.daysUntilExpiration <= 30;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101432] border border-[#E2E4EE] dark:border-[#1F2756] max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-[14px] shadow-lg flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E2E4EE] dark:border-[#1F2756] flex items-center justify-between sticky top-0 bg-white dark:bg-[#101432] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-[#E6E8FF] text-[#2A3AF0]">
              <Globe className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono text-[#101432] dark:text-white break-all">
                  {domain.domain}
                </h2>
                <a
                  href={domain.domain.startsWith('http') ? domain.domain : `https://${domain.domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5B6178] hover:text-[#2A3AF0] transition-colors p-1 rounded-[6px] hover:bg-[#F3F4F8] dark:hover:bg-[#1B2050] shrink-0 inline-flex items-center"
                  title="Open live site"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5B6178] font-mono mt-0.5">
                <span>WHOIS &amp; RDAP RECORD</span>
                <span>·</span>
                <span className="truncate">{domain.whoisSource || 'ICANN RDAP Protocol'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5B6178] hover:text-[#101432] dark:hover:text-white rounded-[8px] hover:bg-[#F3F4F8] dark:hover:bg-[#1B2050] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-[13px]">
          {/* Expiration & Renewal Card */}
          <div
            className={`p-5 rounded-[12px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isExpired || isCritical7d
                ? 'border-[#FCDAD7] bg-[#FFF4F2] dark:bg-[#2A141A]'
                : isWarning30d
                ? 'border-[#F5D56B] bg-[#FFF0C2] dark:bg-[#2A2109]'
                : 'border-[#E2E4EE] dark:border-[#1F2756] bg-[#F3F4F8] dark:bg-[#0E122B]'
            }`}
          >
            <div>
              <div className="eyebrow-label text-[#5B6178]">
                Expiration Status
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xl font-bold font-mono text-[#101432] dark:text-white">
                  {domain.expirationDate || 'Pending query'}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 font-mono rounded-full font-bold ${
                    isExpired || isCritical7d
                      ? 'bg-[#D63A2C] text-white'
                      : isWarning30d
                      ? 'bg-[#FFC21A] text-[#3D2800]'
                      : 'bg-[#D7F4E6] text-[#0B7A57]'
                  }`}
                >
                  {domain.daysUntilExpiration <= 0
                    ? `Expired (${Math.abs(domain.daysUntilExpiration)}d ago)`
                    : `${domain.daysUntilExpiration} days remaining`}
                </span>
              </div>
              <p className="text-xs text-[#5B6178] font-mono mt-1">
                Priority: {isCritical7d ? 'Critical Action' : isWarning30d ? 'Act Soon (<30d)' : 'Nominal'}
              </p>
            </div>

            <a
              href={domain.registrarPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all whitespace-nowrap self-stretch sm:self-auto cursor-pointer ${
                isExpired || isCritical7d
                  ? 'btn-coral'
                  : isWarning30d
                  ? 'btn-sun'
                  : 'btn-ultramarine'
              }`}
            >
              <span>Renew via {domain.registrar.split(',')[0]}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Core Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-white dark:bg-[#101432]">
              <div className="text-[#5B6178] mb-1 flex items-center gap-1.5 font-medium">
                <Building className="w-4 h-4 text-[#2A3AF0]" />
                <span className="eyebrow-label">Registrant Organization</span>
              </div>
              <div className="text-sm font-semibold text-[#101432] dark:text-white mt-1">
                {domain.company || 'Privacy Protected'}
              </div>
            </div>

            <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-white dark:bg-[#101432]">
              <div className="text-[#5B6178] mb-1 flex items-center gap-1.5 font-medium">
                <Shield className="w-4 h-4 text-[#2A3AF0]" />
                <span className="eyebrow-label">Registrar of Record</span>
              </div>
              <div className="text-sm font-semibold text-[#101432] dark:text-white mt-1">
                {domain.registrar || 'Unknown'}
              </div>
            </div>

            <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-white dark:bg-[#101432]">
              <div className="text-[#5B6178] mb-1 flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-[#2A3AF0]" />
                <span className="eyebrow-label">Registration Date</span>
              </div>
              <div className="text-sm font-mono text-[#101432] dark:text-white mt-1">
                {domain.registrationDate || 'Not declared in RDAP'}
              </div>
            </div>

            <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-white dark:bg-[#101432]">
              <div className="text-[#5B6178] mb-1 flex items-center gap-1.5 font-medium">
                <Server className="w-4 h-4 text-[#2A3AF0]" />
                <span className="eyebrow-label">Working DNS Resolution</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {domain.isResolving ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#0B7A57]" />
                    <span className="text-sm font-mono text-[#0B7A57] font-semibold">
                      Active (Resolving)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-[#D63A2C]" />
                    <span className="text-sm font-mono text-[#D63A2C] font-semibold">
                      Unassigned or Inactive DNS
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-white dark:bg-[#101432] sm:col-span-2">
              <div className="text-[#5B6178] mb-1 flex items-center gap-1.5 font-medium">
                <Globe className="w-4 h-4 text-[#2A3AF0]" />
                <span className="eyebrow-label">Website Working Status &amp; HTTP Code</span>
              </div>
              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#D7F4E6] text-[#0B7A57]">
                  {domain.httpStatusCode ? `HTTP ${domain.httpStatusCode}` : 'HTTP 200 OK'}
                </span>
                <span className="text-xs font-mono text-[#101432] dark:text-white">
                  Latency: {domain.httpLatencyMs ? `${domain.httpLatencyMs}ms` : 'normal'}
                </span>
              </div>
            </div>
          </div>

          {/* Nameservers */}
          <div>
            <div className="eyebrow-label text-[#5B6178] mb-2">
              Authoritative Nameservers
            </div>
            <div className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B] font-mono text-xs text-[#101432] dark:text-white space-y-1.5">
              {domain.nameservers && domain.nameservers.length > 0 ? (
                domain.nameservers.map((ns, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{ns}</span>
                    <span className="text-[#5B6178] text-[11px]">NS #{idx + 1}</span>
                  </div>
                ))
              ) : (
                <div className="text-[#5B6178]">No delegated nameservers returned.</div>
              )}
            </div>
          </div>

          {/* 2-Day Renewal Alert Toggle */}
          <div className="pt-4 border-t border-[#E2E4EE] dark:border-[#1F2756]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-[#101432] dark:text-white">
                  Continuous 2-Day Renewal Alert Schedule
                </h4>
                <p className="text-xs text-[#5B6178]">
                  Sends automated reminders every 48 hours until domain renewal is finalized.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={domain.renewalAlerts.continuousReminderEvery2Days}
                  onChange={() => onToggleAlert2Days && onToggleAlert2Days(domain.id)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A3AF0]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E2E4EE] dark:border-[#1F2756] bg-[#F3F4F8] dark:bg-[#0E122B] flex items-center justify-between">
          <span className="text-xs font-mono text-[#5B6178]">
            Checked: {new Date(domain.lastCheckedAt).toLocaleTimeString()}
          </span>
          <button
            onClick={onClose}
            className="btn-neutral-surface text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
