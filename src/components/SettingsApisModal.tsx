import React, { useState } from 'react';
import { Settings, X, Shield, Send, CheckCircle2, Globe, Database, Key } from 'lucide-react';
import { AlertSettings } from '../types/domain';

interface SettingsApisModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlertSettings;
  onSaveSettings: (settings: AlertSettings) => void;
}

export const SettingsApisModal: React.FC<SettingsApisModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AlertSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#101432] rounded-[16px] border border-slate-200 dark:border-[#1F2756] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#1B2050] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Settings &amp; API Integrations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage backend endpoints, Telegram bots, notifications, and cloud sync
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Settings updated successfully and persisted to cloud!
            </div>
          )}

          {/* Telegram Alerts Config */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1F2756] bg-slate-50/50 dark:bg-[#161C40]/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Send className="w-4 h-4 text-sky-500" />
              Telegram Instant Notification Bot
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  placeholder="e.g. 123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  value={formData.telegramBotToken || ''}
                  onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1F2756] bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Telegram Destination Chat ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. -100123456789 or @channelname"
                  value={formData.telegramChatId || ''}
                  onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1F2756] bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>
            </div>
          </div>

          {/* Email Delivery */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1F2756] bg-slate-50/50 dark:bg-[#161C40]/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-500" />
              Security Alerts Notification Email
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Primary Ops Alert Email
              </label>
              <input
                type="email"
                placeholder="devops@company.com"
                value={formData.alertEmail || ''}
                onChange={(e) => setFormData({ ...formData, alertEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1F2756] bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
              />
            </div>
          </div>

          {/* Cloudflare & Supabase Status Indicator */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1F2756] bg-slate-50/50 dark:bg-[#161C40]/50 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              <Database className="w-4 h-4 text-emerald-500" />
              Connected Cloud Infrastructure
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-[#1F2756]">
              <span className="text-slate-500">Cloudflare Pages &amp; Functions</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active (Edge)
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-[#1F2756]">
              <span className="text-slate-500">Supabase Multi-Tenant RLS</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Connected
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">DomScan DNS &amp; RDAP API</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> DOMSCAN_API_KEY Ready
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
