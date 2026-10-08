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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white font-mono">
                {domain.domain}
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span>WHOIS & RDAP Record Details</span>
                <span aria-hidden="true">·</span>
                <span>{domain.whoisSource || 'ICANN RDAP Protocol'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Expiration & Renewal Card */}
          <div className="p-4 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Expiration Status
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                  {domain.expirationDate || 'Pending query'}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 font-mono rounded font-semibold ${
                    domain.daysUntilExpiration <= 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      : domain.daysUntilExpiration <= 7
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      : domain.daysUntilExpiration <= 30
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  }`}
                >
                  {domain.daysUntilExpiration <= 0
                    ? `Expired (${Math.abs(domain.daysUntilExpiration)}d ago)`
                    : `${domain.daysUntilExpiration} days remaining`}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Priority: {domain.daysUntilExpiration <= 7 ? 'Critical / Immediate Action' : domain.daysUntilExpiration <= 30 ? 'High Warning (<30d)' : 'Nominal'}
              </p>
            </div>

            <a
              href={domain.registrarPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <span>Renew via {domain.registrar.split(',')[0]}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Core Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
              <div className="text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5 font-medium">
                <Building className="w-3.5 h-3.5" />
                <span>Registrant Organization / Company</span>
              </div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                {domain.company || 'Privacy Protected'}
              </div>
            </div>

            <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
              <div className="text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Registrar of Record</span>
              </div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                {domain.registrar || 'Unknown'}
              </div>
            </div>

            <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
              <div className="text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Registration Date</span>
              </div>
              <div className="text-sm font-mono text-neutral-800 dark:text-neutral-200">
                {domain.registrationDate || 'Not declared in RDAP'}
              </div>
            </div>

            <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900">
              <div className="text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5 font-medium">
                <Server className="w-3.5 h-3.5" />
                <span>Working DNS Resolution</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {domain.isResolving ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Active (Resolving A/AAAA records)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Unassigned or DNS Inactive
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Nameservers & DNS IPs */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
              Authoritative Nameservers
            </h4>
            <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-950 font-mono text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
              {domain.nameservers && domain.nameservers.length > 0 ? (
                domain.nameservers.map((ns, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{ns}</span>
                    <span className="text-neutral-400 dark:text-neutral-600 text-[11px]">NS #{idx + 1}</span>
                  </div>
                ))
              ) : (
                <div className="text-neutral-400">No delegated nameservers returned.</div>
              )}
            </div>
          </div>

          {/* Resolving IP Addresses */}
          {domain.dnsIps && domain.dnsIps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                Resolved IP Records (A)
              </h4>
              <div className="flex flex-wrap gap-2">
                {domain.dnsIps.map((ip, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-xs border border-neutral-200 dark:border-neutral-700"
                  >
                    {ip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Renewal Alert Configuration for this Domain */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Continuous 2-Day Renewal Alert Schedule
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
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
                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900 dark:peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
          <span className="text-xs font-mono text-neutral-400 dark:text-neutral-600">
            ID: {domain.id} · Checked: {new Date(domain.lastCheckedAt).toLocaleTimeString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
