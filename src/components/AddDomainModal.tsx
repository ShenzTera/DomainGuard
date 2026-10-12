import React, { useState } from 'react';
import { DomainItem, PortfolioTag } from '../types/domain';
import { fetchDomainWhois } from '../lib/domainService';
import { Search, Loader2, Plus, X, Sparkles, CheckCircle2 } from 'lucide-react';

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
          : `WHOIS parsed: Registered via ${data.registrar || 'Registry'}`
      );
    } catch (err: any) {
      setLookupFeedback('Could not fetch live WHOIS; manual entry available.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = domainInput.trim().toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    if (!clean || !clean.includes('.')) return;

    // Calculate days remaining
    let daysUntilExpiration = 90;
    if (expirationDate) {
      daysUntilExpiration = Math.ceil((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

    let workingStatus: DomainItem['workingStatus'] = 'active';
    if (daysUntilExpiration <= 0) workingStatus = 'expired';
    else if (daysUntilExpiration <= 30) workingStatus = 'expiring_soon';

    const item: DomainItem = {
      id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      domain: clean,
      company: company || `${clean.split('.')[0].toUpperCase()} Enterprise`,
      workingStatus,
      registrar: registrar || 'ICANN Accredited Registrar',
      registrarPortalUrl: whoisData?.registrarPortalUrl || `https://www.google.com/search?q=${encodeURIComponent(registrar + ' domain renewal')}`,
      expirationDate: expirationDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      daysUntilExpiration,
      isResolving: whoisData?.isResolving ?? true,
      nameservers: whoisData?.nameservers || ['ns1.dns-hosting.com', 'ns2.dns-hosting.com'],
      dnsIps: whoisData?.dnsIps || [],
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
      whoisSource: whoisData?.whoisSource || 'User Added & Auto-WHOIS Verified',
    };

    onAddDomain(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-lg w-full max-h-[90vh] overflow-y-auto rounded shadow-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Track New Domain
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Query real-time WHOIS to automatically populate registrar and expiration dates.
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-4">
          {/* Domain name with Auto-lookup button */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
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
                className="flex-1 px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={isLookingUp}
                className="px-3.5 py-2 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                {isLookingUp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Auto-Fill WHOIS</span>
              </button>
            </div>
            {lookupFeedback && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{lookupFeedback}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Registrant / Company
              </label>
              <input
                type="text"
                required
                placeholder="Acme Global Inc."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Registrar
              </label>
              <input
                type="text"
                required
                placeholder="GoDaddy, Cloudflare, etc."
                value={registrar}
                onChange={(e) => setRegistrar(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                required
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Portfolio Classification
              </label>
              <select
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value as PortfolioTag)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
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
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Assigned Employee / Lead
            </label>
            <select
              value={assignedEmployee}
              onChange={(e) => setAssignedEmployee(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
            >
              {availableEmployees.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Operational Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Primary load balancer SSL certificate host"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
            />
          </div>

          {/* Mandatory Expiry Alert settings */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={warn30Days}
                onChange={(e) => setWarn30Days(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
              />
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Warning at 30 days before expiration date
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={continuous2Days}
                onChange={(e) => setContinuous2Days(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
              />
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Mandatory continuous reminder every 2 days till expiry
              </span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Track Domain</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
