import React from 'react';
import { Search, Mail, Bell } from 'lucide-react';
import { TabType } from './types';
import { AVATARS } from './mockData';

interface TopNavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  variant?: 'light' | 'dark';
  onOpenSearch?: () => void;
  unreadCount?: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onSelectTab,
  variant = 'light',
  onOpenSearch,
  unreadCount = 2,
}) => {
  const isDark = variant === 'dark';

  const navItems: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'guests', label: 'Guests' },
    { id: 'reservations', label: 'Reservations' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'restaurant', label: 'Restaurant' },
  ];

  return (
    <header
      className={`w-full transition-all duration-300 ${
        isDark
          ? 'bg-transparent text-white pb-6'
          : 'bg-white text-slate-900 rounded-[24px] px-6 py-3.5 shadow-xl shadow-black/10'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer shrink-0 select-none group"
        >
          {/* Logo Hexagon / Cube Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C47FF] to-[#8C6BFF] flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <span
            className={`font-bold text-lg tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Inntegrate
          </span>
        </div>

        {/* Center Navigation - Segmented Capsule Controls */}
        <nav
          className={`hidden md:flex items-center gap-1 p-1 rounded-2xl ${
            isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50/80'
          }`}
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? isDark
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'bg-white text-slate-900 shadow-md shadow-slate-200/60'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Zone - Actions & Profile Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSearch}
            title="Search dashboard"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isDark
                ? 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            title="Messages"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isDark
                ? 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
          </button>

          <button
            title="Notifications"
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isDark
                ? 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF4B8B] rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* User Profile Avatar */}
          <div className="relative group cursor-pointer ml-1">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-purple-500/30 shadow-sm">
              <img
                src={AVATARS.hotelManager}
                alt="Hotel Manager"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="w-full h-full bg-gradient-to-tr from-[#6C47FF] to-[#A855F7] flex items-center justify-center text-white text-xs font-bold">
                HM
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav bar below on small screens */}
      <div className="md:hidden flex items-center justify-around gap-1 pt-3 border-t border-slate-100/20 mt-3 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
                isActive
                  ? 'bg-[#6C47FF] text-white'
                  : isDark
                  ? 'text-slate-300'
                  : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
