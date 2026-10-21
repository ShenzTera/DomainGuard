import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LayoutGrid,
  Globe,
  Calendar,
  Search,
  Bell,
  Layers,
  Database,
  Cpu,
  Settings,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Plus,
  Radio,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'domains'
  | 'calendar'
  | 'whois'
  | 'dns'
  | 'alerts'
  | 'team'
  | 'supabase'
  | 'cron'
  | 'settings';

interface TopNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  trackedCount: number;
  nearExpiryCount: number;
  onOpenAddModal?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  trackedCount,
  nearExpiryCount,
  onOpenAddModal,
}) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#101432] text-slate-800 dark:text-slate-200">
      {/* 1. Header Zone: Clean brand header */}
      <div className="p-4 pb-3 border-b border-slate-100 dark:border-[#1F2756] flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
        </div>

        <div className="min-w-0">
          <h1 className="font-bold text-[15px] leading-tight text-slate-900 dark:text-white font-sans tracking-tight truncate">
            DomainGuard
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-tight mt-0.5 truncate">
            v1.0.4 • Cloudflare + Supabase
          </p>
        </div>
      </div>

      {/* 2. Navigation Items: 3 Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* SECTION 1: CORE MONITORING */}
        <div>
          <div className="px-3 pb-1.5 text-[10.5px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-sans">
            CORE MONITORING
          </div>
          <div className="space-y-0.5">
            {/* Overview */}
            <button
              type="button"
              onClick={() => handleTabClick('overview')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'overview'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <LayoutGrid
                className={`w-4 h-4 shrink-0 ${
                  currentTab === 'overview'
                    ? 'text-[#0284c7] dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="truncate">Overview</span>
            </button>

            {/* All Domains */}
            <button
              type="button"
              onClick={() => handleTabClick('domains')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'domains'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Globe
                className={`w-4 h-4 shrink-0 ${
                  currentTab === 'domains'
                    ? 'text-[#0284c7] dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="truncate">All Domains</span>
              <span className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded-full font-medium">
                {trackedCount}
              </span>
            </button>

            {/* Expiry Calendar */}
            <button
              type="button"
              onClick={() => handleTabClick('calendar')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'calendar'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Calendar
                className={`w-4 h-4 shrink-0 ${
                  currentTab === 'calendar'
                    ? 'text-[#0284c7] dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="truncate">Expiry Calendar</span>
            </button>

            {/* RDAP Finder */}
            <button
              type="button"
              onClick={() => handleTabClick('whois')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'whois'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Search
                className={`w-4 h-4 shrink-0 ${
                  currentTab === 'whois'
                    ? 'text-[#0284c7] dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="truncate">RDAP Finder</span>
            </button>

            {/* DNS Checker */}
            <button
              type="button"
              onClick={() => handleTabClick('dns')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'dns'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Radio
                className={`w-4 h-4 shrink-0 ${
                  currentTab === 'dns'
                    ? 'text-[#0284c7] dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="truncate">DNS Checker</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: ALERTS & RULES */}
        <div>
          <div className="px-3 pb-1.5 text-[10.5px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-sans">
            ALERTS &amp; RULES
          </div>
          <div className="space-y-0.5">
            {/* Alerts & Reminders */}
            <button
              type="button"
              onClick={() => handleTabClick('alerts')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'alerts'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Bell
                className={`w-4 h-4 shrink-0 ${
                  currentTab === 'alerts'
                    ? 'text-[#0284c7] dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="truncate">Alerts &amp; Reminders</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-100 dark:ring-red-950/80"></span>
            </button>

            {/* Portfolios */}
            <button
              type="button"
              onClick={() => handleTabClick('team')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'team'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Layers
                className={`w-4 h-4 shrink-0 ${
                  currentTab === 'team'
                    ? 'text-[#0284c7] dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="truncate">Portfolios</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: SYSTEM ARCHITECTURE */}
        <div>
          <div className="px-3 pb-1.5 text-[10.5px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-sans">
            SYSTEM ARCHITECTURE
          </div>
          <div className="space-y-0.5">
            {/* Supabase Schema */}
            <button
              type="button"
              onClick={() => handleTabClick('supabase')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'supabase'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Database className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <span className="truncate">Supabase Schema</span>
            </button>

            {/* Cron Worker Code */}
            <button
              type="button"
              onClick={() => handleTabClick('cron')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'cron'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0 text-sky-500 dark:text-sky-400" />
              <span className="truncate">Cron Worker Code</span>
            </button>

            {/* Settings & APIs */}
            <button
              type="button"
              onClick={() => handleTabClick('settings')}
              className={`w-full px-3 py-2 rounded-lg text-[13.5px] flex items-center gap-3 transition-colors text-left cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-[#e8f3fc] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 font-semibold shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="truncate">Settings &amp; APIs</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Footer Zone: User Account & System Actions */}
      <div className="p-3 border-t border-slate-100 dark:border-[#1F2756] bg-slate-50/70 dark:bg-[#161C40]/50 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 pr-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.name || user?.email?.split('@')[0] || 'Operator'}
              </p>
              <p className="text-[10.5px] text-slate-400 font-mono truncate">
                {user?.email || 'Authenticated'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle dark/light theme"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              title="Sign out of DomainGuard"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar (Screen < 1024px) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white dark:bg-[#101432] border-b border-slate-200 dark:border-[#1F2756] text-slate-900 dark:text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0284c7] text-white flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-sans text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
              DomainGuard
            </span>
            <span className="block text-[10px] text-slate-500 font-mono">
              v1.0.4 • Cloudflare + Supabase
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {nearExpiryCount > 0 && (
            <span className="bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
              {nearExpiryCount} due
            </span>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle sidebar menu"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Desktop Fixed Left Sidebar (240px wide) */}
      <aside className="hidden lg:flex flex-col w-[240px] h-screen fixed top-0 left-0 z-30 border-r border-slate-200 dark:border-[#1F2756] bg-white dark:bg-[#101432] shadow-xs">
        {navContent}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-[260px] max-w-[80vw] h-full z-10 shadow-2xl flex flex-col">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
