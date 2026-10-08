import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, Shield, Database } from 'lucide-react';

export type NavTab = 'dashboard' | 'whois' | 'alerts' | 'team';

interface TopNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  trackedCount: number;
  nearExpiryCount: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  trackedCount,
  nearExpiryCount,
}) => {
  const { user, logout, isLiveSupabase } = useAuth();

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 sticky top-0 z-40 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="text-base font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2 hover:opacity-85 transition-opacity"
          >
            <span className="w-6 h-6 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs flex items-center justify-center font-bold">
              DG
            </span>
            <span>DomainGuard</span>
          </button>
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 pl-1 border-l border-neutral-200 dark:border-neutral-800 hidden sm:inline">
            {trackedCount} tracked
          </span>
        </div>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="flex items-center gap-1 sm:gap-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`py-1 relative transition-colors ${
              currentTab === 'dashboard'
                ? 'text-neutral-950 dark:text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Dashboard
            {nearExpiryCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 rounded font-mono text-[10px] font-semibold">
                {nearExpiryCount} urgent
              </span>
            )}
            {currentTab === 'dashboard' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950 dark:bg-white -mb-4" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('whois')}
            className={`py-1 relative transition-colors ${
              currentTab === 'whois'
                ? 'text-neutral-950 dark:text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            WHOIS & Availability
            {currentTab === 'whois' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950 dark:bg-white -mb-4" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('alerts')}
            className={`py-1 relative transition-colors ${
              currentTab === 'alerts'
                ? 'text-neutral-950 dark:text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Alerts & Reminders
            {currentTab === 'alerts' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950 dark:bg-white -mb-4" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('team')}
            className={`py-1 relative transition-colors ${
              currentTab === 'team'
                ? 'text-neutral-950 dark:text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Enterprise Portfolios
            {currentTab === 'team' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950 dark:bg-white -mb-4" />
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Supabase backend status indicator */}
          <div
            className="hidden md:flex items-center gap-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800"
            title={isLiveSupabase ? 'Active Supabase Backend Session' : 'Local Authenticated Session'}
          >
            <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{isLiveSupabase ? 'Supabase live' : 'Supabase session'}</span>
          </div>

          {/* Dark Mode toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle dark mode"
            className="p-1.5 rounded text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-mono text-neutral-600 dark:text-neutral-300 hidden lg:inline max-w-[140px] truncate">
              {user?.email}
            </span>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
