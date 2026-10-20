import React from 'react';
import { Calendar, X, AlertTriangle, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import { DomainItem } from '../types/domain';

interface ExpiryCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: DomainItem[];
  onSelectDomain: (domain: DomainItem) => void;
}

export const ExpiryCalendarModal: React.FC<ExpiryCalendarModalProps> = ({
  isOpen,
  onClose,
  domains,
  onSelectDomain,
}) => {
  if (!isOpen) return null;

  // Group domains by urgency buckets
  const expired = domains.filter((d) => d.daysUntilExpiration <= 0);
  const critical = domains.filter((d) => d.daysUntilExpiration > 0 && d.daysUntilExpiration <= 7);
  const warning = domains.filter((d) => d.daysUntilExpiration > 7 && d.daysUntilExpiration <= 30);
  const upcoming = domains.filter((d) => d.daysUntilExpiration > 30 && d.daysUntilExpiration <= 90);
  const healthy = domains.filter((d) => d.daysUntilExpiration > 90);

  const sections = [
    { title: 'Expired Domains', items: expired, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900/40', badge: 'Action Required', icon: AlertTriangle },
    { title: 'Critical Expirations (≤ 7 Days)', items: critical, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/70 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/40', badge: 'Due Imminently', icon: Clock },
    { title: 'Act Soon (8 - 30 Days)', items: warning, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/70 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/40', badge: 'Renewal Window', icon: Clock },
    { title: 'Upcoming (31 - 90 Days)', items: upcoming, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-900/40', badge: 'Next Quarter', icon: Calendar },
    { title: 'Secured Long-Term (90+ Days)', items: healthy, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-900/40', badge: 'Healthy', icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#101432] rounded-[16px] border border-slate-200 dark:border-[#1F2756] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#1B2050] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center border border-sky-200/80 dark:border-sky-800/80">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Expiry Calendar &amp; Timeline
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {domains.length} Tracked
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chronological expiration runway mapped across registry renewal windows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {sections.map((sec, idx) => {
            if (sec.items.length === 0) return null;
            const Icon = sec.icon;

            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${sec.color}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      {sec.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {sec.items.length} {sec.items.length === 1 ? 'domain' : 'domains'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {sec.items.map((domain) => (
                    <div
                      key={domain.id}
                      className={`p-3 rounded-xl border ${sec.border} ${sec.bg} flex items-center justify-between transition-transform hover:-translate-y-0.5`}
                    >
                      <div className="min-w-0 pr-3">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectDomain(domain);
                          }}
                          className="font-mono text-xs font-bold text-slate-900 dark:text-white hover:underline text-left truncate block max-w-[220px]"
                        >
                          {domain.domain}
                        </button>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                          <span>{domain.expirationDate || 'Unknown'}</span>
                          <span>•</span>
                          <span className={sec.color}>
                            {domain.daysUntilExpiration <= 0
                              ? 'Expired'
                              : `${domain.daysUntilExpiration}d remaining`}
                          </span>
                        </div>
                      </div>

                      <a
                        href={domain.registrarPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center gap-1 shadow-2xs"
                      >
                        Renew
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#1B2050] bg-slate-50 dark:bg-[#161C40] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
