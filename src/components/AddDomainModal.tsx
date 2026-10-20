import React, { useState } from 'react';
import { DomainItem, PortfolioTag } from '../types/domain';
import { fetchDomainWhois } from '../lib/domainService';
import { Loader2, Plus, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDomain: (newDomain: DomainItem) => void;
  availableEmployees: string[];
}

export const AddDomainModal: React.FC<AddDomainModalProps> = ({
  isOpen,
  onClose,
  onAddDomain,
  availableEmployees,
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [company, setCompany] = useState('');
  const [registrar, setRegistrar] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [portfolio, setPortfolio] = useState<PortfolioTag>('Core Infrastructure');
  const [assignedEmployee, setAssignedEmployee] = useState(availableEmployees[0] || 'admin@enterprise.internal');
  const [notes, setNotes] = useState('');
  const [warn30Days, setWarn30Days] = useState(true);
  const [continuous2Days, setContinuous2Days] = useState(true);

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);
  const [whoisData, setWhoisData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleLookup = async () => {
    if (!domainInput || !domainInput.includes('.')) {
      setLookupFeedback('Please provide a valid domain (e.g. acme-corp.com)');
      return;
    }

    setIsLookingUp(true);
    setLookupFeedback(null);

    try {
      const data = await fetchDomainWhois(domainInput);
      setWhoisData(data);

      if (data.company) setCompany(data.company);
      if (data.registrar) setRegistrar(data.registrar);
      if (data.expirationDate) {
        setExpirationDate(data.expirationDate.split('T')[0]);
      }
      setLookupFeedback(
        data.isAvailable
          ? 'Domain is AVAILABLE! Ready for registration.'
          : `Verified: Registered via ${data.registrar || 'Registry'}`
      );
    } catch {
      setLookupFeedback('Could not fetch RDAP data; manual entry available.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = domainInput.trim().toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    if (!clean || !clean.includes('.')) return;

    let finalExpDate = expirationDate;
    let finalRegistrar = registrar;
    let finalCompany = company;
    let finalWhois = whoisData;
    let daysUntilExpiration = 90;

    if (!finalExpDate || !finalRegistrar) {
      try {
        setIsLookingUp(true);
        const liveData = await fetchDomainWhois(clean);
        finalWhois = liveData;
        if (liveData.expirationDate) {
          finalExpDate = liveData.expirationDate.split('T')[0];
        }
        if (liveData.registrar) {
          finalRegistrar = liveData.registrar;
        }
        if (liveData.company && !finalCompany) {
          finalCompany = liveData.company;
        }
      } catch {
        // Fallback gracefully
      } finally {
        setIsLookingUp(false);
      }
    }

    if (finalExpDate) {
      const expTime = new Date(finalExpDate).getTime();
      if (!isNaN(expTime)) {
        daysUntilExpiration = Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
      }
    }

    let workingStatus: DomainItem['workingStatus'] = 'active';
    if (daysUntilExpiration <= 0) workingStatus = 'expired';
    else if (daysUntilExpiration <= 30) workingStatus = 'expiring_soon';

    const item: DomainItem = {
      id: `dom_${Date.now()}`,
      domain: clean,
      company: finalCompany || `${clean.split('.')[0].toUpperCase()} Organization`,
      workingStatus,
      registrar: finalRegistrar || 'ICANN Accredited Registrar',
      registrarPortalUrl:
        finalWhois?.registrarPortalUrl ||
        `https://www.google.com/search?q=${encodeURIComponent((finalRegistrar || 'domain') + ' renewal')}`,
      expirationDate: finalExpDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      daysUntilExpiration,
      isResolving: finalWhois?.isResolving ?? true,
      nameservers: finalWhois?.nameservers || [],
      dnsIps: finalWhois?.dnsIps || [],
      portfolio,
      assignedEmployees: [assignedEmployee],
      lastCheckedAt: new Date().toISOString(),
      renewalAlerts: {
        warn30Days,
        warn15Days: true,
        warn7Days: true,
        continuousReminderEvery2Days: continuous2Days,
      },
      notes,
      whoisSource: finalWhois?.whoisSource || 'ICANN IANA Official RDAP',
    };

    onAddDomain(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101432] border border-[#E2E4EE] dark:border-[#1F2756] max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-[14px] shadow-lg p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E4EE] dark:border-[#1F2756]">
          <div>
            <div className="eyebrow-label text-[#5B6178]">LEDGER ENTRY</div>
            <h3 className="text-lg font-semibold text-[#101432] dark:text-white mt-0.5">
              Track New Domain
            </h3>
            <p className="text-xs text-[#5B6178] mt-0.5">
              Query authoritative WHOIS &amp; RDAP to auto-fill expiration and registrar.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#5B6178] hover:text-[#101432] dark:hover:text-white p-1 rounded-[8px] hover:bg-[#F3F4F8] dark:hover:bg-[#1B2050] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Domain name with Auto-lookup button */}
          <div>
            <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
              Domain Name
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder="e.g. cloud-infra.org"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onBlur={() => {
                  if (domainInput && !whoisData && domainInput.includes('.')) {
                    handleLookup();
                  }
                }}
                className="flex-1 px-3.5 py-2 text-[13px] font-mono bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={isLookingUp}
                className="btn-neutral-surface flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
              >
                {isLookingUp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2A3AF0]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#2A3AF0]" />
                )}
                <span>Auto-Fill RDAP</span>
              </button>
            </div>
            {lookupFeedback && (
              <p className="text-[11px] font-mono text-[#0B7A57] mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lookupFeedback}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
                Registrant / Entity
              </label>
              <input
                type="text"
                required
                placeholder="Acme Global Inc."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
                Accredited Registrar
              </label>
              <input
                type="text"
                required
                placeholder="GoDaddy, Cloudflare, etc."
                value={registrar}
                onChange={(e) => setRegistrar(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
                Expiration Date
              </label>
              <input
                type="date"
                required
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] font-mono bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
                Portfolio Classification
              </label>
              <select
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value as PortfolioTag)}
                className="w-full px-3.5 py-2 text-[13px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
              >
                <option value="Core Infrastructure">Core Infrastructure</option>
                <option value="Brand & Trademarks">Brand & Trademarks</option>
                <option value="Marketing Campaigns">Marketing Campaigns</option>
                <option value="SaaS Apps">SaaS Apps</option>
                <option value="Regional">Regional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
              Assigned Employee / Lead
            </label>
            <select
              value={assignedEmployee}
              onChange={(e) => setAssignedEmployee(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] font-mono bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
            >
              {availableEmployees.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
              Operational Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Primary load balancer SSL certificate host"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
            />
          </div>

          {/* Alert settings */}
          <div className="pt-3 border-t border-[#E2E4EE] dark:border-[#1F2756] space-y-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={warn30Days}
                onChange={(e) => setWarn30Days(e.target.checked)}
                className="w-4 h-4 rounded text-[#2A3AF0] accent-[#2A3AF0]"
              />
              <span className="text-[#101432] dark:text-white font-medium">
                Warning at 30 days before expiration date
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={continuous2Days}
                onChange={(e) => setContinuous2Days(e.target.checked)}
                className="w-4 h-4 rounded text-[#2A3AF0] accent-[#2A3AF0]"
              />
              <span className="text-[#101432] dark:text-white font-medium">
                Continuous reminder every 2 days until expiry
              </span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-neutral-surface cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-ultramarine flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Track Domain</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
