import React, { useState, useMemo } from 'react';
import { DomainItem, AlertSettings } from '../types/domain';
import { exportDomainsToCsv } from '../lib/domainService';
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  AlertTriangle,
  ExternalLink,
  Bell,
  Trash2,
  FileSpreadsheet,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  XCircle,
  Filter,
  X,
  Globe,
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
}

type SortField = 'expiry' | 'domain' | 'company' | 'registrar' | 'statusCode';
type SortOrder = 'asc' | 'desc';
type MetricFilter = 'all' | 'near_expiry' | 'critical' | 'resolving' | null;

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
  const [metricFilter, setMetricFilter] = useState<MetricFilter>(null);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = domains.length;
    const expired = domains.filter((d) => d.daysUntilExpiration <= 0).length;
    const critical7d = domains.filter((d) => d.daysUntilExpiration > 0 && d.daysUntilExpiration <= 7).length;
    const warn30d = domains.filter((d) => d.daysUntilExpiration > 0 && d.daysUntilExpiration <= 30).length;
    const healthy = domains.filter((d) => d.daysUntilExpiration > 30).length;
    const resolving = domains.filter((d) => d.isResolving).length;
    const resolvingRate = total > 0 ? Math.round((resolving / total) * 100) : 100;

    return { total, expired, critical7d, warn30d, healthy, resolving, resolvingRate };
  }, [domains]);

  // Filter & Priority Sorting (Near to Expiry on top)
  const filteredAndSortedDomains = useMemo(() => {
    let result = [...domains];

    // 1. Metric Ribbon Button filter
    if (metricFilter === 'all') {
      // keep all
    } else if (metricFilter === 'near_expiry') {
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
      // Toggle off to show all
      setMetricFilter(null);
    } else {
      setMetricFilter(type);
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
            title="Perform real-time WHOIS refresh and website HTTP check on all domains"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="truncate">{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="px-3 py-2 sm:py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded flex items-center justify-center gap-1.5 transition-colors text-neutral-700 dark:text-neutral-300 cursor-pointer"
            title="Import domains from a CSV file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate font-semibold">Import CSV</span>
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

      {/* Summary Metric Ribbon: Interactive Buttons to Filter What Is Under Each */}
      {/* Summary Metric Ribbon: Interactive Buttons to Filter What Is Under Each */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Button 1: Total Monitored */}
        <button
          type="button"
          onClick={() => handleMetricButtonClick('all')}
          className={`p-3 sm:p-3.5 border rounded text-left transition-all cursor-pointer relative group min-h-[96px] h-full flex flex-col justify-between ${
            metricFilter === 'all'
              ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/20 dark:ring-white/20 bg-neutral-100 dark:bg-neutral-800 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-xs'
          }`}
          title="Click to view all monitored domains"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 truncate">
              Total Monitored
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
              metricFilter === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold'
                : 'text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
            }`}>
              {metricFilter === 'all' ? 'Active' : 'Filter ↗'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white my-1">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            Across all portfolios
          </div>
        </button>

        {/* Button 2: Near to Expiry */}
        <button
          type="button"
          onClick={() => handleMetricButtonClick('near_expiry')}
          className={`p-3 sm:p-3.5 border rounded text-left transition-all cursor-pointer relative group min-h-[96px] h-full flex flex-col justify-between ${
            metricFilter === 'near_expiry'
              ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/80 dark:bg-amber-950/40 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-xs'
          }`}
          title="Click to filter domains expiring within 30 days"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 truncate">
              Near to Expiry
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
              metricFilter === 'near_expiry'
                ? 'bg-amber-500 text-white font-bold'
                : 'text-amber-500/80 group-hover:text-amber-700 dark:group-hover:text-amber-300'
            }`}>
              {metricFilter === 'near_expiry' ? 'Active' : 'Filter ↗'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 my-1">
            {stats.warn30d}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 truncate">
            ≤ 30 days priority queue
          </div>
        </button>

        {/* Button 3: Critical / Expired */}
        <button
          type="button"
          onClick={() => handleMetricButtonClick('critical')}
          className={`p-3 sm:p-3.5 border rounded text-left transition-all cursor-pointer relative group min-h-[96px] h-full flex flex-col justify-between ${
            metricFilter === 'critical'
              ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/80 dark:bg-rose-950/40 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-xs'
          }`}
          title="Click to filter critical domains (≤7 days or expired)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 truncate">
              Critical / Expired
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
              metricFilter === 'critical'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-rose-500/80 group-hover:text-rose-700 dark:group-hover:text-rose-300'
            }`}>
              {metricFilter === 'critical' ? 'Active' : 'Filter ↗'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 my-1">
            {stats.expired + stats.critical7d}
          </div>
          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 truncate">
            {stats.expired} expired · {stats.critical7d} ≤7d
          </div>
        </button>

        {/* Button 4: DNS Health & Working Websites */}
        <button
          type="button"
          onClick={() => handleMetricButtonClick('resolving')}
          className={`p-3 sm:p-3.5 border rounded text-left transition-all cursor-pointer relative group min-h-[96px] h-full flex flex-col justify-between ${
            metricFilter === 'resolving'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xs'
          }`}
          title="Click to filter active resolving domains"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
              DNS Health &amp; HTTP
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
              metricFilter === 'resolving'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-emerald-500/80 group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
            }`}>
              {metricFilter === 'resolving' ? 'Active' : 'Filter ↗'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 my-1">
            {stats.resolvingRate}%
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 truncate">
            {stats.resolving} active routing traffic
          </div>
        </button>
      </div>

      {/* Active Metric Filter Bar */}
      {metricFilter && (
        <div className="flex items-center justify-between p-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 rounded-lg text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <Filter className="w-4 h-4 shrink-0" />
            <span>
              <strong>Showing:</strong>{' '}
              {metricFilter === 'all'
                ? 'All Monitored Domains'
                : metricFilter === 'near_expiry'
                ? 'Near to Expiry Domains (≤ 30 Days)'
                : metricFilter === 'critical'
                ? 'Critical & Expired Domains (≤ 7 Days)'
                : 'Active Resolving Domains'}
            </span>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-white/20 dark:bg-neutral-900/20">
              {filteredAndSortedDomains.length} domains
            </span>
          </div>
          <button
            onClick={() => setMetricFilter(null)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 dark:bg-neutral-900/10 dark:hover:bg-neutral-900/20 font-semibold cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filter (Show All)</span>
          </button>
        </div>
      )}

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
            className={`px-3 py-1.5 sm:py-1 rounded shrink-0 transition-colors whitespace-nowrap cursor-pointer ${
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
                className={`px-2.5 py-1.5 sm:py-1 rounded shrink-0 transition-colors whitespace-nowrap cursor-pointer ${
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
            placeholder="Search domain, status code, registrar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          />
        </div>
      </div>

      {/* High-Density Data Grid (Mandatory Columns: Domain / Company / Working Status & HTTP / Registrar / Expiration Date / Renewal) */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto touch-pan-x">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-neutral-50 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                {/* Column 1: Domain & Open In New Tab */}
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

                {/* Column 3: Working Status & HTTP Code */}
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSortToggle('statusCode')}>
                  <div className="flex items-center gap-1.5">
                    <span>Working Status &amp; HTTP Code</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
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
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No domains found matching the current filters.</p>
                      {metricFilter && (
                        <button
                          onClick={() => setMetricFilter(null)}
                          className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                        >
                          Clear metric filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedDomains.map((domain) => {
                  const isExpired = domain.daysUntilExpiration <= 0;
                  const isCritical7d = domain.daysUntilExpiration > 0 && domain.daysUntilExpiration <= 7;
                  const isWarning30d = domain.daysUntilExpiration > 7 && domain.daysUntilExpiration <= 30;

                  // Clean domain URL for opening in a new tab
                  const cleanDomainUrl = domain.domain.startsWith('http')
                    ? domain.domain
                    : `https://${domain.domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')}`;

                  const statusCode = domain.httpStatusCode ?? (domain.isResolving ? 200 : 0);
                  const isHttpOk = statusCode >= 200 && statusCode < 400;

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
                      {/* Column 1: Domain + Minimalistic Option to Open in New Tab */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectDomainForDetails(domain)}
                            className="font-mono font-semibold text-neutral-950 dark:text-white hover:underline text-left cursor-pointer truncate max-w-[200px] sm:max-w-[240px]"
                            title="Click to view full WHOIS & RDAP record"
                          >
                            {domain.domain}
                          </button>

                          {/* Minimalistic Open in New Tab Icon */}
                          <a
                            href={cleanDomainUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-0.5 shrink-0 inline-flex items-center justify-center"
                            title={`Open ${domain.domain} in new tab`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
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
                      <td className="px-4 py-3.5 align-middle">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {domain.company || 'Privacy Protected'}
                        </div>
                        {domain.notes && (
                          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate max-w-[180px]">
                            {domain.notes}
                          </div>
                        )}
                      </td>

                      {/* Column 3: Working Status & HTTP Status Code */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-col gap-1">
                          {/* Real HTTP Status Code Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold border ${
                                statusCode >= 200 && statusCode < 300
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : statusCode >= 300 && statusCode < 400
                                  ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                                  : statusCode >= 400 && statusCode < 500
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                  : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              }`}
                              title={domain.httpStatusText || (isHttpOk ? 'Website reachable' : 'Website offline')}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isHttpOk ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              ></span>
                              {statusCode > 0 ? `HTTP ${statusCode}` : 'HTTP Down'}
                            </span>

                            {domain.httpLatencyMs && (
                              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                                {domain.httpLatencyMs}ms
                              </span>
                            )}
                          </div>

                          {/* Human readable working status description */}
                          <div className="flex items-center gap-1.5 text-[11px]">
                            {isHttpOk ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Working properly
                              </span>
                            ) : statusCode >= 400 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                {domain.httpStatusText || 'Response error'}
                              </span>
                            ) : !domain.isResolving ? (
                              <span className="text-rose-600 dark:text-rose-400 font-medium">
                                Site unreachable / DNS idle
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Working properly
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Registrar */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {domain.registrar || 'ICANN Registrar'}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                          {domain.nameservers?.[0] || 'Managed Nameserver'}
                        </div>
                      </td>

                      {/* Column 5: Expiration Date (Priority Column) */}
                      <td className="px-4 py-3.5 align-middle bg-neutral-100/40 dark:bg-neutral-900/60 font-mono">
                        <div className="font-bold text-neutral-950 dark:text-white">
                          {domain.expirationDate || 'Pending WHOIS'}
                        </div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-block font-semibold text-[11px] ${
                              isExpired
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : isCritical7d
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
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
                      <td className="px-4 py-3.5 align-middle text-right">
                        <a
                          href={domain.registrarPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
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
                      <td className="px-3 py-3.5 align-middle text-right">
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
