import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  Search,
  Bell,
  Users,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'whois' | 'alerts' | 'team';

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

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: nearExpiryCount > 0 ? nearExpiryCount : null,
    },
    {
      id: 'whois' as NavTab,
      label: 'Expiry & WHOIS',
      icon: Search,
      badge: null,
    },
    {
      id: 'alerts' as NavTab,
      label: 'Alerts & Webhooks',
      icon: Bell,
      badge: null,
    },
    {
      id: 'team' as NavTab,
      label: 'Team & Portfolios',
      icon: Users,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Top Bar (Screen < 1024px) */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#101432] border-b border-[#1B2050] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[#D6F24B] text-[#101432] flex items-center justify-center font-bold shadow-sm">
            <Shield className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-display text-[17px] font-extrabold text-white tracking-tight">
              DomainGuard
            </span>
            <div className="eyebrow-label text-[10px] text-[#8E95AF]">
              {trackedCount} Monitored
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {nearExpiryCount > 0 && (
            <span className="bg-[#D6F24B] text-[#101432] font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
              {nearExpiryCount} due
            </span>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 rounded-[8px] text-[#8E95AF] hover:text-white hover:bg-[#1B2050] transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#FFC21A]" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-[8px] bg-[#1B2050] text-white hover:bg-[#252C6E] transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 240px Ink Sidebar (Fixed on desktop, drawer on mobile) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[240px] bg-[#101432] border-r border-[#1B2050] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Brand Header */}
          <div className="p-5 border-b border-[#1B2050]">
            <button
              onClick={() => handleTabClick('dashboard')}
              className="flex items-center gap-3 text-left w-full group"
            >
              {/* Brand spark #1: Logo Tile (Lime on ink) */}
              <div className="w-9 h-9 rounded-[10px] bg-[#D6F24B] text-[#101432] flex items-center justify-center font-bold shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-[18px] font-extrabold text-white tracking-tight leading-tight">
                  DomainGuard
                </div>
                <div className="eyebrow-label text-[10px] text-[#8E95AF] truncate mt-0.5">
                  Portfolio Ledger
                </div>
              </div>
            </button>

            {onOpenAddModal && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAddModal();
                }}
                className="w-full mt-4 bg-[#2A3AF0] hover:bg-[#1E2BC4] text-white rounded-[10px] py-2 px-3 text-[13px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Track Domain</span>
              </button>
            )}
          </div>

          {/* Navigation Section */}
          <div className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 eyebrow-label text-[10px] text-[#5B6178]">
              Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#1B2050] text-white font-semibold shadow-xs border-l-[3px] border-[#2A3AF0]'
                      : 'text-[#8E95AF] hover:text-white hover:bg-[#1B2050]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#2A3AF0]' : 'text-[#8E95AF]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge > 0 && (
                    /* Brand spark #2: Urgent badge (Lime on ink) */
                    <span className="bg-[#D6F24B] text-[#101432] font-mono text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Portfolio Ledger Status Box */}
          <div className="mt-auto px-4 py-3 mx-3 my-2 bg-[#1B2050]/50 border border-[#1B2050] rounded-[10px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="eyebrow-label text-[10px] text-[#8E95AF]">Coverage</span>
              <span className="font-mono text-[11px] text-[#D6F24B] font-bold">{trackedCount} Active</span>
            </div>
            <p className="text-[11px] text-[#8E95AF] leading-relaxed">
              Auto-checking ICANN RDAP DNS every 30m.
            </p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1B2050] bg-[#0E122B]/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#1B2050] border border-[#2B3472] text-[#D6F24B] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-white font-medium truncate max-w-[110px]">
                  {user?.email?.split('@')[0] || 'Domain Admin'}
                </div>
                <div className="font-mono text-[10px] text-[#8E95AF] truncate">
                  Enterprise
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Toggle theme"
                className="p-1.5 rounded-[8px] text-[#8E95AF] hover:text-white hover:bg-[#1B2050] transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-4 h-4 text-[#FFC21A]" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-[8px] text-[#8E95AF] hover:text-[#D63A2C] hover:bg-[#D63A2C]/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
