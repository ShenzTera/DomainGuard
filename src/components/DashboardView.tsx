import React, { useState, useMemo } from 'react';
import { DomainItem, PortfolioTag, AlertSettings } from '../types/domain';
import { exportDomainsToCsv } from '../lib/domainService';
import {
  ExternalLink,
  Plus,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Filter,
  ShieldCheck,
  Globe,
  Trash2,
  Bell,
  Eye,
  Info,
} from 'lucide-react';

interface DashboardViewProps {
  domains: DomainItem[];
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onRefreshAll: () => Promise<void>;
  isRefreshing: boolean;
  onDeleteDomain: (id: string) => void;
  onSelectDomainForDetails: (domain: DomainItem) => void;
  onToggleAlert2Days: (id: string) => void;
  settings: AlertSettings;
  lastUpdated: Date;
}

type SortField = 'expiry' | 'domain' | 'company' | 'registrar';
type SortOrder = 'asc' | 'desc';

export const DashboardView: React.FC<DashboardViewProps> = ({
  domains,
  onOpenAddModal,
  onOpenImportModal,
  onRefreshAll,
  isRefreshing,
  onDeleteDomain,
  onSelectDomainForDetails,
  onToggleAlert2Days,
  settings,
  lastUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('expiry'); // Default priority: Near to Expiry
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // ascending in days = nearest to expiry first

  // Filter & Priority Sorting (Near to Expiry on top)
  const filteredAndSortedDomains = useMemo(() => {
    let result = [...domains];

    // 1. Portfolio filter
    if (selectedPortfolio !== 'all') {
      result = result.filter((d) => d.portfolio === selectedPortfolio);
    }

    // 2. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.domain.toLowerCase().includes(q) ||
          d.company?.toLowerCase().includes(q) ||
          d.registrar?.toLowerCase().includes(q) ||
          d.portfolio.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortField === 'expiry') {
        // Priority sort: Expired & Near to Expiry (smallest daysUntilExpiration) on top
        return sortOrder === 'asc'
          ? a.daysUntilExpiration - b.daysUntilExpiration
          : b.daysUntilExpiration - a.daysUntilExpiration;
      }
      if (sortField === 'domain') {
        return sortOrder === 'asc'
          ? a.domain.localeCompare(b.domain)
          : b.domain.localeCompare(a.domain);
      }
      if (sortField === 'company') {
        return sortOrder === 'asc'
          ? (a.company || '').localeCompare(b.company || '')
          : (b.company || '').localeCompare(a.company || '');
      }
      if (sortField === 'registrar') {
        return sortOrder === 'asc'
          ? (a.registrar || '').localeCompare(b.registrar || '')
          : (b.registrar || '').localeCompare(a.registrar || '');
      }
      return 0;
    });

    return result;
  }, [domains, selectedPortfolio, searchQuery, sortField, sortOrder]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = domains.length;
    const expired = domains.filter((d) => d.daysUntilExpiration <= 0).length;
    const critical7d = domains.filter((d) => d.daysUntilExpiration > 0 && d.daysUntilExpiration <= 7).length;
    const warn30d = domains.filter((d) => d.daysUntilExpiration > 0 && d.daysUntilExpiration <= 30).length;
    const healthy = domains.filter((d) => d.daysUntilExpiration > 30).length;
    const resolving = domains.filter((d) => d.isResolving).length;
    const resolvingRate = total > 0 ? Math.round((resolving / total) * 100) : 100;

    return { total, expired, critical7d, warn30d, healthy, resolvingRate };
  }, [domains]);

  const handleExportCsv = () => {
    exportDomainsToCsv(filteredAndSortedDomains);
  };

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar & Refresh Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Monitored Domain Portfolio
          </h1>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
            <span>Priority Sorted: Near to Expiry</span>
            <span aria-hidden="true">·</span>
            <span>Last checked: {lastUpdated.toLocaleTimeString()}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Auto-sync {settings.autoRefreshIntervalMinutes}m</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="px-3 py-2 sm:py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded flex items-center justify-center gap-1.5 transition-colors text-neutral-700 dark:text-neutral-300 disabled:opacity-50 cursor-pointer"
            title="Perform real-time WHOIS refresh on all domains"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="truncate">{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="px-3 py-2 sm:py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded flex items-center justify-center gap-1.5 transition-colors text-neutral-700 dark:text-neutral-300 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">Import Sheets</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 sm:py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded flex items-center justify-center gap-1.5 transition-colors text-neutral-700 dark:text-neutral-300 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 sm:py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Add Domain</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Ribbon (Anti-slop clean tabular display) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
            Total Monitored
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5 truncate">Across all portfolios</div>
        </div>

        <div className="p-3 sm:p-3.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded">
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate">
            Near to Expiry (&le;30 Days)
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {stats.warn30d}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5 truncate">Top priority queue</div>
        </div>

        <div className="p-3 sm:p-3.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded">
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 truncate">
            Critical / Expired
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {stats.expired + stats.critical7d}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5 truncate">{stats.expired} exp · {stats.critical7d} &le;7d</div>
        </div>

        <div className="p-3 sm:p-3.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
            DNS Health & Resolution
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.resolvingRate}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5 truncate">Actively routing traffic</div>
        </div>
      </div>

      {/* Priority Expiry Warning Banner (If critical domains exist) */}
      {(stats.warn30d > 0 || stats.expired > 0) && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Action Required:</strong> {stats.warn30d} domains expire within 30 days. Priority sorting has positioned them at the top of the queue for immediate payment.
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 shrink-0">
            Continuous 48h reminders active
          </span>
        </div>
      )}

      {/* Controls: Portfolio Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-1">
        {/* Functional Segmented Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded overflow-x-auto no-scrollbar touch-pan-x text-xs font-medium -mx-1 sm:mx-0 px-1">
          <button
            onClick={() => setSelectedPortfolio('all')}
            className={`px-3 py-1.5 sm:py-1 rounded shrink-0 transition-colors whitespace-nowrap ${
              selectedPortfolio === 'all'
                ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Portfolios ({domains.length})
          </button>
          {['Core Infrastructure', 'Brand & Trademarks', 'Marketing Campaigns', 'SaaS Apps', 'Regional'].map((tag) => {
            const count = domains.filter((d) => d.portfolio === tag).length;
            return (
              <button
                key={tag}
                onClick={() => setSelectedPortfolio(tag)}
                className={`px-2.5 py-1.5 sm:py-1 rounded shrink-0 transition-colors whitespace-nowrap ${
                  selectedPortfolio === tag
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search domain, registrar, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          />
        </div>
      </div>

      {/* High-Density Data Grid (Mandatory Columns: Domain / Company / Working Status / Registrar / Expiration Date / Renewal) */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto touch-pan-x">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-neutral-50 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                {/* Column 1: Domain */}
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSortToggle('domain')}>
                  <div className="flex items-center gap-1.5">
                    <span>Domain</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>

                {/* Column 2: Company */}
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSortToggle('company')}>
                  <div className="flex items-center gap-1.5">
                    <span>Company / Organization</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>

                {/* Column 3: Working Status */}
                <th className="px-4 py-3">
                  <span>Working Status</span>
                </th>

                {/* Column 4: Registrar */}
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSortToggle('registrar')}>
                  <div className="flex items-center gap-1.5">
                    <span>Registrar</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>

                {/* Column 5: Expiration Date (Priority sort indicator) */}
                <th className="px-4 py-3 cursor-pointer select-none bg-neutral-100/60 dark:bg-neutral-900" onClick={() => handleSortToggle('expiry')}>
                  <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-bold">
                    <span>Expiration Date (Priority)</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-500" />
                  </div>
                </th>

                {/* Column 6: Renewal Action */}
                <th className="px-4 py-3 text-right">
                  <span>Immediate Renewal</span>
                </th>

                {/* Extra tools */}
                <th className="px-3 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredAndSortedDomains.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400 dark:text-neutral-500">
                    No domains found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredAndSortedDomains.map((domain) => {
                  const isExpired = domain.daysUntilExpiration <= 0;
                  const isCritical7d = domain.daysUntilExpiration > 0 && domain.daysUntilExpiration <= 7;
                  const isWarning30d = domain.daysUntilExpiration > 7 && domain.daysUntilExpiration <= 30;

                  return (
                    <tr
                      key={domain.id}
                      className={`hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors ${
                        isExpired
                          ? 'bg-rose-50/30 dark:bg-rose-950/15'
                          : isCritical7d
                          ? 'bg-rose-50/20 dark:bg-rose-950/10'
                          : isWarning30d
                          ? 'bg-amber-50/20 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* Column 1: Domain */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectDomainForDetails(domain)}
                            className="font-mono font-semibold text-neutral-950 dark:text-white hover:underline text-left"
                            title="Click to view full WHOIS / RDAP record"
                          >
                            {domain.domain}
                          </button>
                          <button
                            onClick={() => onSelectDomainForDetails(domain)}
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                            title="Inspect WHOIS"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          <span>{domain.portfolio}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono truncate max-w-[120px]">
                            {domain.assignedEmployees?.[0] || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Company */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {domain.company || 'Privacy Protected'}
                        </div>
                        {domain.notes && (
                          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate max-w-[180px]">
                            {domain.notes}
                          </div>
                        )}
                      </td>

                      {/* Column 3: Working Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 font-mono font-medium text-rose-600 dark:text-rose-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></span>
                              Expired
                            </span>
                          ) : isCritical7d ? (
                            <span className="inline-flex items-center gap-1 font-mono font-medium text-rose-600 dark:text-rose-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                              Urgent &le;7d
                            </span>
                          ) : isWarning30d ? (
                            <span className="inline-flex items-center gap-1 font-mono font-medium text-amber-600 dark:text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Expiring Soon
                            </span>
                          ) : domain.isResolving ? (
                            <span className="inline-flex items-center gap-1 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active (Resolving)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono font-medium text-neutral-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                              DNS Idle
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                          {domain.isResolving ? 'A record ok' : 'No active A'}
                        </div>
                      </td>

                      {/* Column 4: Registrar */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {domain.registrar || 'ICANN Registrar'}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                          {domain.nameservers?.[0] ? domain.nameservers[0].split('.')[1] : 'Nameserver active'}
                        </div>
                      </td>

                      {/* Column 5: Expiration Date */}
                      <td className="px-4 py-3.5 bg-neutral-50/40 dark:bg-neutral-900/40">
                        <div className="font-mono font-semibold text-neutral-900 dark:text-white">
                          {domain.expirationDate}
                        </div>
                        <div className="mt-0.5">
                          <span
                            className={`font-mono font-bold text-[11px] ${
                              isExpired
                                ? 'text-rose-600 dark:text-rose-400'
                                : isCritical7d
                                ? 'text-rose-600 dark:text-rose-400'
                                : isWarning30d
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-neutral-500 dark:text-neutral-400'
                            }`}
                          >
                            {isExpired
                              ? `Expired (${Math.abs(domain.daysUntilExpiration)}d ago)`
                              : `${domain.daysUntilExpiration} days remaining`}
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Immediate Renewal CTA Button */}
                      <td className="px-4 py-3.5 text-right">
                        <a
                          href={domain.registrarPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                            isExpired || isCritical7d
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                              : isWarning30d
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                              : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900'
                          }`}
                          title={`Redirect to ${domain.registrar} payment & renewal portal`}
                        >
                          <span>Renew Now</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      {/* Extra actions: 2-day reminder toggle, delete */}
                      <td className="px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleAlert2Days(domain.id)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              domain.renewalAlerts.continuousReminderEvery2Days
                                ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                            title={
                              domain.renewalAlerts.continuousReminderEvery2Days
                                ? 'Continuous 48h reminder ACTIVE'
                                : 'Continuous 48h reminder paused'
                            }
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteDomain(domain.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            title="Remove from monitoring"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
