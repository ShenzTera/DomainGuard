import React, { useState, useMemo } from 'react';
import {
  DomainItem,
  PortfolioTag,
  AlertSettings,
} from '../types/domain';
import { exportDomainsToCsv } from '../lib/domainService';
import {
  Search,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Trash2,
  Bell,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  X,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  domains: DomainItem[];
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onDeleteDomain: (id: string) => void;
  onSelectDomainForDetails: (domain: DomainItem) => void;
  onToggleAlert2Days: (id: string) => void;
  settings: AlertSettings;
  lastUpdated: Date;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline';
  onCloudSync?: () => void;
  onLoadSamplePortfolio?: () => void;
}

type SortField = 'expiry' | 'domain' | 'company' | 'registrar' | 'statusCode';

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
  cloudSyncStatus = 'synced',
  onCloudSync,
  onLoadSamplePortfolio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioTag | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('expiry');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [metricFilter, setMetricFilter] = useState<'all' | 'near_expiry' | 'critical' | 'resolving' | null>(null);

  // Real-time calculations
  const stats = useMemo(() => {
    const total = domains.length;
    const expired = domains.filter((d) => d.daysUntilExpiration <= 0).length;
    const critical7d = domains.filter((d) => d.daysUntilExpiration > 0 && d.daysUntilExpiration <= 7).length;
    const warn30d = domains.filter((d) => d.daysUntilExpiration > 0 && d.daysUntilExpiration <= 30).length;
    const resolving = domains.filter((d) => d.isResolving).length;
    const resolvingRate = total > 0 ? Math.round((resolving / total) * 100) : 100;

    return {
      total,
      expired,
      critical7d,
      warn30d,
      resolving,
      resolvingRate,
    };
  }, [domains]);

  // Filter & Priority Sorting (Near to Expiry on top)
  const filteredAndSortedDomains = useMemo(() => {
    let result = [...domains];

    // 1. Metric filter
    if (metricFilter === 'near_expiry') {
      result = result.filter((d) => d.daysUntilExpiration <= 30 && d.daysUntilExpiration > 0);
    } else if (metricFilter === 'critical') {
      result = result.filter((d) => d.daysUntilExpiration <= 7);
    } else if (metricFilter === 'resolving') {
      result = result.filter((d) => d.isResolving);
    }

    // 2. Portfolio filter
    if (selectedPortfolio !== 'all') {
      result = result.filter((d) => d.portfolio === selectedPortfolio);
    }

    // 3. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.domain.toLowerCase().includes(q) ||
          d.company?.toLowerCase().includes(q) ||
          d.registrar?.toLowerCase().includes(q) ||
          d.portfolio.toLowerCase().includes(q) ||
          String(d.httpStatusCode || '').includes(q)
      );
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortField === 'expiry') {
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
      if (sortField === 'statusCode') {
        const aCode = a.httpStatusCode ?? 0;
        const bCode = b.httpStatusCode ?? 0;
        return sortOrder === 'asc' ? aCode - bCode : bCode - aCode;
      }
      return 0;
    });

    return result;
  }, [domains, metricFilter, selectedPortfolio, searchQuery, sortField, sortOrder]);

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

  const handleMetricButtonClick = (type: 'all' | 'near_expiry' | 'critical' | 'resolving') => {
    if (metricFilter === type) {
      setMetricFilter(null);
    } else {
      setMetricFilter(type);
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. HERO HEADER                                               */}
      {/* Bricolage Grotesque 800 display, tight tracking, calm ledger */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <div className="eyebrow-label text-[#5B6178] mb-1">
            ICANN WHOIS &amp; RDAP LEDGER
          </div>
          <h1 className="font-display text-[34px] font-extrabold text-[#101432] dark:text-white leading-none tracking-[-0.025em]">
            Dashboard
          </h1>
          <p className="text-[14px] text-[#5B6178] mt-2 leading-normal">
            Calm domain-expiry monitoring. Loud only where urgent renewal is required.
          </p>
        </div>

        {/* Action Controls (10px radius, 13px font) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="btn-neutral-surface flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Refresh WHOIS and website HTTP response status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2A3AF0]' : 'text-[#5B6178]'}`} />
            <span>{isRefreshing ? 'Checking RDAP...' : 'Refresh'}</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="btn-neutral-surface flex items-center gap-2 cursor-pointer"
            title="Import domains from Google Sheets or CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#5B6178]" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="btn-neutral-surface flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#5B6178]" />
            <span>Export</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="btn-ultramarine flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. STAT CARDS (4-up on desktop, 2-up on tablet, 1-up mobile) */}
      {/* Principle: Coral for Critical, Sun for Near Expiry color-block */}
      {/* 52px Bricolage numerals, 11px uppercase eyebrow, 13px caption */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Domains (Surface white) */}
        <button
          type="button"
          onClick={() => handleMetricButtonClick('all')}
          className={`p-5 rounded-[14px] text-left transition-all cursor-pointer flex flex-col justify-between border ${
            metricFilter === 'all'
              ? 'border-[#2A3AF0] ring-2 ring-[#2A3AF0]/20 bg-white dark:bg-[#101432]'
              : 'border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] hover:border-[#2A3AF0]/40'
          }`}
        >
          <div className="eyebrow-label text-[#5B6178]">
            TOTAL MONITORED
          </div>
          <div className="my-3">
            <span className="stat-numeral text-[#101432] dark:text-white">
              {stats.total}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px] text-[#5B6178]">
            <span>Across all portfolios</span>
            <span className="font-mono text-[11px] text-[#2A3AF0]">
              {metricFilter === 'all' ? '● Filtered' : 'View all'}
            </span>
          </div>
        </button>

        {/* Card 2: Near Expiry (<= 30 days) -> COLOR-BLOCKED IN SUN (#FFC21A) */}
        <button
          type="button"
          onClick={() => handleMetricButtonClick('near_expiry')}
          className={`p-5 rounded-[14px] text-left transition-all cursor-pointer flex flex-col justify-between bg-[#FFC21A] text-[#3D2800] border border-[#E5AC12] ${
            metricFilter === 'near_expiry' ? 'ring-2 ring-[#101432]' : 'hover:brightness-95'
          }`}
        >
          <div className="eyebrow-label text-[#3D2800]/80 font-bold">
            NEAR EXPIRY (≤ 30 DAYS)
          </div>
          <div className="my-3">
            <span className="stat-numeral text-[#3D2800]">
              {stats.warn30d}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px] text-[#3D2800]/90 font-medium">
            <span>Renew soon required</span>
            <span className="font-mono text-[11px] font-bold text-[#3D2800]">
              {metricFilter === 'near_expiry' ? '● Selected' : 'Filter ↗'}
            </span>
          </div>
        </button>

        {/* Card 3: Critical / Expired (<= 7 days or expired) -> COLOR-BLOCKED IN CORAL (#D63A2C) */}
        <button
          type="button"
          onClick={() => handleMetricButtonClick('critical')}
          className={`p-5 rounded-[14px] text-left transition-all cursor-pointer flex flex-col justify-between bg-[#D63A2C] text-white border border-[#B52B1E] ${
            metricFilter === 'critical' ? 'ring-2 ring-[#101432]' : 'hover:brightness-95'
          }`}
        >
          <div className="eyebrow-label text-white/80 font-bold">
            CRITICAL (≤ 7 DAYS / EXPIRED)
          </div>
          <div className="my-3">
            <span className="stat-numeral text-white">
              {stats.expired + stats.critical7d}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px] text-white/90">
            <span>{stats.expired} expired · {stats.critical7d} urgent</span>
            <span className="font-mono text-[11px] font-bold text-white underline">
              {metricFilter === 'critical' ? '● Selected' : 'Act now ↗'}
            </span>
          </div>
        </button>

        {/* Card 4: DNS Resolving & Health (Surface white) */}
        <button
          type="button"
          onClick={() => handleMetricButtonClick('resolving')}
          className={`p-5 rounded-[14px] text-left transition-all cursor-pointer flex flex-col justify-between border ${
            metricFilter === 'resolving'
              ? 'border-[#0B7A57] ring-2 ring-[#0B7A57]/20 bg-white dark:bg-[#101432]'
              : 'border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] hover:border-[#0B7A57]/40'
          }`}
        >
          <div className="eyebrow-label text-[#5B6178]">
            DNS &amp; HTTP RESOLVING
          </div>
          <div className="my-3">
            <span className="stat-numeral text-[#0B7A57]">
              {stats.resolvingRate}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px] text-[#5B6178]">
            <span>{stats.resolving} active routing</span>
            <span className="font-mono text-[11px] text-[#0B7A57]">
              {metricFilter === 'resolving' ? '● Filtered' : 'Healthy'}
            </span>
          </div>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 3. ALERT BANNER                                              */}
      {/* sun-tint fill (#FFF0C2), 1px #F5D56B border, dark amber text */}
      {/* lime-on-ink chip on the right (#101432 background, #D6F24B) */}
      {/* ============================================================ */}
      {(stats.warn30d > 0 || stats.expired > 0) && (
        <div className="p-4 bg-[#FFF0C2] dark:bg-[#2A2109] border border-[#F5D56B] dark:border-[#6B5313] rounded-[14px] text-[#3D2800] dark:text-[#FFE39A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#FFC21A] text-[#3D2800] flex items-center justify-center shrink-0 font-bold">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-semibold text-[14px]">Action Required:</span>{' '}
              <span className="text-[13px]">
                {stats.warn30d} domains expire within 30 days. Priority ledger queue has arranged urgent renewals at the top.
              </span>
            </div>
          </div>

          {/* Lime-on-ink chip */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="bg-[#101432] text-[#D6F24B] font-mono text-[11px] px-3 py-1 rounded-full font-bold">
              Continuous 48h Reminders Active
            </span>
          </div>
        </div>
      )}

      {/* Active Filter Notification Bar */}
      {metricFilter && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#101432] text-white rounded-[10px] text-[13px]">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#D6F24B]" />
            <span>
              <strong>Filtered:</strong>{' '}
              {metricFilter === 'all'
                ? 'All Monitored Domains'
                : metricFilter === 'near_expiry'
                ? 'Near Expiry (≤ 30 Days)'
                : metricFilter === 'critical'
                ? 'Critical & Expired (≤ 7 Days)'
                : 'Active Resolving Domains'}
            </span>
            <span className="ml-2 font-mono text-[11px] text-[#D6F24B] font-bold">
              ({filteredAndSortedDomains.length} records)
            </span>
          </div>
          <button
            onClick={() => setMetricFilter(null)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-xs font-mono cursor-pointer transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. FILTER CONTROLS & SEARCH                                  */}
      {/* Tabs: Pill buttons (selected tab is #101432 ink)             */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Portfolio Tabs (Pill buttons) */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#101432] border border-[#E2E4EE] dark:border-[#1F2756] rounded-full overflow-x-auto no-scrollbar text-[13px]">
          <button
            onClick={() => setSelectedPortfolio('all')}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
              selectedPortfolio === 'all'
                ? 'bg-[#101432] text-white dark:bg-white dark:text-[#101432] shadow-xs'
                : 'text-[#5B6178] hover:text-[#101432] dark:hover:text-white'
            }`}
          >
            All Portfolios ({domains.length})
          </button>
          {['Core Infrastructure', 'Brand & Trademarks', 'Marketing Campaigns', 'SaaS Apps', 'Regional'].map((tag) => {
            const count = domains.filter((d) => d.portfolio === tag).length;
            return (
              <button
                key={tag}
                onClick={() => setSelectedPortfolio(tag as PortfolioTag)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
                  selectedPortfolio === tag
                    ? 'bg-[#101432] text-white dark:bg-white dark:text-[#101432] shadow-xs'
                    : 'text-[#5B6178] hover:text-[#101432] dark:hover:text-white'
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input (10px radius) */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6178]" />
          <input
            type="text"
            placeholder="Search ledger by domain, registrar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] font-sans bg-white dark:bg-[#101432] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white placeholder:text-[#5B6178] focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0] transition-all"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. DOMAIN GUARD LEDGER TABLE                                 */}
      {/* Ink table header (#101432), 14px radius, DM Mono data,        */}
      {/* One loud thing per row: expiry/renew cluster saturated,      */}
      {/* Coral-tint (#FFF4F2) wash on critical rows                   */}
      {/* ============================================================ */}
      <div className="rounded-[14px] border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[900px]">
            {/* Table Header: Ink #101432 with DM Mono uppercase labels */}
            <thead className="bg-[#101432] text-white font-mono text-[11px] uppercase tracking-[0.05em] border-b border-[#1B2050]">
              <tr>
                <th className="px-5 py-3.5 cursor-pointer select-none" onClick={() => handleSortToggle('domain')}>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <span>DOMAIN</span>
                    <ArrowUpDown className="w-3 h-3 text-white/50" />
                  </div>
                </th>

                <th className="px-4 py-3.5 cursor-pointer select-none" onClick={() => handleSortToggle('company')}>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <span>ENTITY / PORTFOLIO</span>
                    <ArrowUpDown className="w-3 h-3 text-white/50" />
                  </div>
                </th>

                <th className="px-4 py-3.5 cursor-pointer select-none" onClick={() => handleSortToggle('statusCode')}>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <span>HTTP &amp; LATENCY</span>
                    <ArrowUpDown className="w-3 h-3 text-white/50" />
                  </div>
                </th>

                <th className="px-4 py-3.5 cursor-pointer select-none" onClick={() => handleSortToggle('registrar')}>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <span>REGISTRAR / DNS</span>
                    <ArrowUpDown className="w-3 h-3 text-white/50" />
                  </div>
                </th>

                <th className="px-5 py-3.5 cursor-pointer select-none bg-[#1B2050]" onClick={() => handleSortToggle('expiry')}>
                  <div className="flex items-center gap-1.5 text-[#D6F24B] font-bold">
                    <span>EXPIRY (PRIORITY)</span>
                    <ArrowUpDown className="w-3 h-3 text-[#D6F24B]" />
                  </div>
                </th>

                <th className="px-4 py-3.5 text-right text-white/90">
                  <span>ACTION</span>
                </th>

                <th className="px-3 py-3.5 text-right">
                  <span className="sr-only">Controls</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2E4EE] dark:divide-[#1F2756]">
              {filteredAndSortedDomains.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[#5B6178]">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-[10px] bg-[#F3F4F8] dark:bg-[#1B2050] text-[#101432] dark:text-white flex items-center justify-center">
                        <Search className="w-5 h-5 text-[#5B6178]" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-[#101432] dark:text-white text-[15px]">
                          {metricFilter || searchQuery || selectedPortfolio !== 'all'
                            ? 'No domains match current criteria'
                            : 'No tracked domains on this account'}
                        </p>
                        <p className="text-[13px] text-[#5B6178]">
                          {metricFilter || searchQuery || selectedPortfolio !== 'all'
                            ? 'Reset filters or search terms to inspect complete domain registry.'
                            : 'Add domains manually, inspect WHOIS records, or import from CSV.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
                        {metricFilter && (
                          <button
                            type="button"
                            onClick={() => setMetricFilter(null)}
                            className="btn-neutral-surface text-xs"
                          >
                            Clear Filter
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onOpenAddModal}
                          className="btn-ultramarine text-xs"
                        >
                          Add Domain
                        </button>
                        {onLoadSamplePortfolio && (
                          <button
                            type="button"
                            onClick={onLoadSamplePortfolio}
                            className="px-3.5 py-2 text-xs font-semibold text-[#2A3AF0] hover:underline cursor-pointer"
                          >
                            Load Sample Ledger
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedDomains.map((domain) => {
                  const isExpired = domain.daysUntilExpiration <= 0;
                  const isCritical7d = domain.daysUntilExpiration > 0 && domain.daysUntilExpiration <= 7;
                  const isWarning30d = domain.daysUntilExpiration > 7 && domain.daysUntilExpiration <= 30;

                  const cleanDomainUrl = domain.domain.startsWith('http')
                    ? domain.domain
                    : `https://${domain.domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')}`;

                  const statusCode = domain.httpStatusCode ?? (domain.isResolving ? 200 : 0);
                  const isHttpOk = statusCode >= 200 && statusCode < 400;

                  return (
                    <tr
                      key={domain.id}
                      className={`transition-colors ${
                        /* Rule: Coral-tint (#FFF4F2) critical row wash */
                        isExpired || isCritical7d
                          ? 'bg-[#FFF4F2] dark:bg-[#2A141A] hover:bg-[#FFE4E0] dark:hover:bg-[#381B23]'
                          : isWarning30d
                          ? 'bg-amber-50/40 dark:bg-[#2A2109]/30 hover:bg-amber-50/70'
                          : 'hover:bg-[#F3F4F8]/70 dark:hover:bg-[#1B2050]/40'
                      }`}
                    >
                      {/* Column 1: Domain (Typeset in DM Mono) */}
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectDomainForDetails(domain)}
                            className="font-mono font-semibold text-[#101432] dark:text-white hover:text-[#2A3AF0] text-left cursor-pointer truncate max-w-[220px] transition-colors"
                            title="Open WHOIS & RDAP inspection modal"
                          >
                            {domain.domain}
                          </button>

                          <a
                            href={cleanDomainUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#5B6178] hover:text-[#2A3AF0] transition-colors p-1 shrink-0"
                            title={`Open ${domain.domain} live site`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="font-mono text-[11px] text-[#5B6178] mt-0.5">
                          {domain.portfolio}
                        </div>
                      </td>

                      {/* Column 2: Company / Org */}
                      <td className="px-4 py-4 align-middle">
                        <div className="font-medium text-[#101432] dark:text-white">
                          {domain.company || 'Registry Protected'}
                        </div>
                        <div className="font-mono text-[11px] text-[#5B6178] truncate max-w-[160px] mt-0.5">
                          {domain.assignedEmployees?.[0] || 'Unassigned'}
                        </div>
                      </td>

                      {/* Column 3: HTTP & Latency (Monospaced data) */}
                      <td className="px-4 py-4 align-middle font-mono">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {statusCode >= 300 && statusCode < 400 ? (
                            /* ultramarine-tint for redirect (3xx) pill */
                            <span className="bg-[#E6E8FF] text-[#2A3AF0] text-[11px] font-mono font-medium px-2 py-0.5 rounded-full">
                              HTTP {statusCode}
                            </span>
                          ) : (
                            <span
                              className={`text-[12px] font-semibold ${
                                isHttpOk ? 'text-[#0B7A57]' : 'text-[#D63A2C]'
                              }`}
                            >
                              {statusCode > 0 ? `HTTP ${statusCode}` : 'Down / Unreachable'}
                            </span>
                          )}

                          {domain.httpLatencyMs && (
                            <span className="text-[11px] text-[#5B6178] tabular-nums">
                              · {domain.httpLatencyMs}ms
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#5B6178] font-sans mt-0.5">
                          {isHttpOk ? 'Resolving DNS' : 'Connection failure'}
                        </div>
                      </td>

                      {/* Column 4: Registrar & Nameservers (DM Mono) */}
                      <td className="px-4 py-4 align-middle">
                        <div className="font-medium text-[#101432] dark:text-white">
                          {domain.registrar || 'ICANN Registrar'}
                        </div>
                        <div className="font-mono text-[11px] text-[#5B6178] truncate max-w-[180px] mt-0.5">
                          {domain.nameservers?.[0] || 'Managed NS'}
                        </div>
                      </td>

                      {/* Column 5: Expiration (ONE LOUD THING PER ROW) */}
                      <td className="px-5 py-4 align-middle font-mono">
                        <div className="font-semibold text-[#101432] dark:text-white">
                          {domain.expirationDate || 'Pending RDAP'}
                        </div>
                        <div className="mt-1">
                          {isExpired ? (
                            <span className="inline-block bg-[#D63A2C] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                              EXPIRED ({Math.abs(domain.daysUntilExpiration)}d ago)
                            </span>
                          ) : isCritical7d ? (
                            <span className="inline-block bg-[#D63A2C] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {domain.daysUntilExpiration}d remaining (Critical)
                            </span>
                          ) : isWarning30d ? (
                            <span className="inline-block bg-[#FFC21A] text-[#3D2800] text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {domain.daysUntilExpiration}d remaining (Act soon)
                            </span>
                          ) : (
                            <span className="inline-block text-[#0B7A57] text-[11px] font-medium">
                              {domain.daysUntilExpiration}d remaining
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 6: Action (Renew Button) */}
                      <td className="px-4 py-4 align-middle text-right">
                        <a
                          href={domain.registrarPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                            isExpired || isCritical7d
                              ? 'bg-[#D63A2C] hover:bg-[#B52B1E] text-white font-semibold'
                              : isWarning30d
                              ? 'bg-[#FFC21A] hover:bg-[#E5AC12] text-[#3D2800] font-semibold'
                              : 'bg-[#2A3AF0] hover:bg-[#1E2BC4] text-white'
                          }`}
                          title={`Go to ${domain.registrar} renewal dashboard`}
                        >
                          <span>{isExpired || isCritical7d ? 'Renew Now' : isWarning30d ? 'Renew Soon' : 'Manage'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      {/* Column 7: Secondary Controls */}
                      <td className="px-3 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onToggleAlert2Days(domain.id)}
                            className={`p-1.5 rounded-[8px] transition-colors cursor-pointer ${
                              domain.renewalAlerts.continuousReminderEvery2Days
                                ? 'text-[#FFC21A] bg-[#FFF0C2] dark:bg-[#2A2109]'
                                : 'text-[#5B6178] hover:text-[#101432] dark:hover:text-white'
                            }`}
                            title={
                              domain.renewalAlerts.continuousReminderEvery2Days
                                ? '48h reminders ACTIVE'
                                : 'Enable 48h reminders'
                            }
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteDomain(domain.id)}
                            className="p-1.5 text-[#5B6178] hover:text-[#D63A2C] rounded-[8px] transition-colors cursor-pointer"
                            title="Remove domain"
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

      {/* Footer Ledger Telemetry */}
      <div className="flex items-center justify-between text-xs text-[#5B6178] font-mono px-2 pt-2 border-t border-[#E2E4EE] dark:border-[#1F2756]">
        <div className="flex items-center gap-2">
          <span>ICANN RDAP / WHOIS Engine</span>
          <span>·</span>
          <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          <span>·</span>
          <span>Interval: {settings.autoRefreshIntervalMinutes}m</span>
        </div>

        {onCloudSync && (
          <button
            type="button"
            onClick={onCloudSync}
            className="flex items-center gap-1.5 text-[#2A3AF0] hover:underline cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Database Connected'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
