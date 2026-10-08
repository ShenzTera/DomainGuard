import React, { useState } from 'react';
import { AlertSettings, NotificationLog, DomainItem } from '../types/domain';
import { sendTelegramAlert } from '../lib/domainService';
import {
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Mail,
  Clock,
  RefreshCw,
  ShieldAlert,
  History,
  Plus,
  Trash2,
  Key,
  ExternalLink,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface AlertsSettingsViewProps {
  settings: AlertSettings;
  onSaveSettings: (newSettings: AlertSettings) => void;
  notificationLogs: NotificationLog[];
  onAddNotificationLog: (log: NotificationLog) => void;
  domains: DomainItem[];
}

export const AlertsSettingsView: React.FC<AlertsSettingsViewProps> = ({
  settings,
  onSaveSettings,
  notificationLogs,
  onAddNotificationLog,
  domains,
}) => {
  const [formData, setFormData] = useState<AlertSettings>({
    ...settings,
    alertEmails:
      Array.isArray(settings.alertEmails) && settings.alertEmails.length > 0
        ? settings.alertEmails
        : [settings.alertEmail || 'shenz.terra@gmail.com'],
    emailProvider: settings.emailProvider || 'direct',
  });

  const [newGmailInput, setNewGmailInput] = useState('');
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Telegram test status
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Email test status
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; msg: string; provider?: string } | null>(null);

  // Provider configuration visibility toggle
  const [showProviderSetup, setShowProviderSetup] = useState(Boolean(formData.emailApiKey));

  const handleAddGmail = (emailToAdd?: string) => {
    const email = (emailToAdd || newGmailInput).trim().toLowerCase();
    setGmailError(null);

    if (!email || !email.includes('@')) {
      setGmailError('Please enter a valid email address (e.g. alerts.backup@gmail.com).');
      return;
    }

    if (formData.alertEmails.includes(email)) {
      setGmailError('This email is already on your alert notification list.');
      return;
    }

    const updatedEmails = [...formData.alertEmails, email];
    setFormData({
      ...formData,
      alertEmails: updatedEmails,
      alertEmail: updatedEmails[0],
    });
    setNewGmailInput('');
  };

  const handleRemoveGmail = (emailToRemove: string) => {
    if (formData.alertEmails.length <= 1) {
      setGmailError('At least one alert email recipient must remain active.');
      return;
    }
    const updatedEmails = formData.alertEmails.filter((e) => e !== emailToRemove);
    setFormData({
      ...formData,
      alertEmails: updatedEmails,
      alertEmail: updatedEmails[0],
    });
    setGmailError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveFeedback('Notification preferences, recipient Gmail list, and alert cadence saved.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleTestTelegram = async () => {
    if (!formData.telegramBotToken || !formData.telegramChatId) {
      setTelegramStatus({
        success: false,
        msg: 'Please specify both Telegram Bot Token and Chat ID before testing.',
      });
      return;
    }

    setIsTestingTelegram(true);
    setTelegramStatus(null);

    try {
      const expiringDomains = domains.filter((d) => d.daysUntilExpiration <= 30);
      const testMsg =
        `🚨 <b>DomainGuard Renewal Alert Test</b>\n\n` +
        `This is a live test notification from your domain portfolio engine.\n` +
        `Total Tracked Domains: <b>${domains.length}</b>\n` +
        `Domains expiring within 30 days: <b>${expiringDomains.length}</b>\n\n` +
        `<i>Recipients: ${formData.alertEmails.join(', ')}</i>\n` +
        `<i>Cadence: 30-day early warning + continuous 48-hour reminders until renewal.</i>`;

      await sendTelegramAlert(formData.telegramBotToken, formData.telegramChatId, testMsg);

      setTelegramStatus({
        success: true,
        msg: 'Test alert successfully delivered to your Telegram chat/channel!',
      });

      onAddNotificationLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        domain: 'Portfolio Test Alert',
        channel: 'telegram',
        recipient: `Telegram Chat ID: ${formData.telegramChatId}`,
        urgency: 'reminder',
        message: 'Live Telegram alert test dispatched successfully',
        status: 'sent',
      });
    } catch (err: any) {
      setTelegramStatus({
        success: false,
        msg: err.message || 'Telegram delivery failed. Check bot token and start the bot with /start.',
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleTestEmail = async () => {
    const recipients = formData.alertEmails.filter((e) => e.includes('@'));
    if (recipients.length === 0) {
      setEmailStatus({
        success: false,
        msg: 'Please add at least one recipient email address first.',
      });
      return;
    }

    setIsTestingEmail(true);
    setEmailStatus(null);

    try {
      const res = await fetch('/api/notify/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmails: recipients,
          toEmail: recipients[0],
          subject: '⚠️ DomainGuard Expiry Warning Verification',
          domains: domains.slice(0, 3).map((d) => d.domain),
          urgency: '30-Day Critical Warning',
          emailApiKey: formData.emailApiKey,
          emailProvider: formData.emailProvider,
          senderEmail: formData.emailSenderAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEmailStatus({
        success: true,
        msg: data.message || `Test alert dispatched to ${recipients.length} Gmail address(es): ${recipients.join(', ')}.`,
        provider: data.provider,
      });

      onAddNotificationLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        domain: domains[0]?.domain || 'Portfolio',
        channel: 'email',
        recipient: recipients.join(', '),
        urgency: 'warning',
        message: `Renewal alert dispatched to ${recipients.length} Gmail recipient(s): ${recipients.join(', ')}`,
        status: 'sent',
      });
    } catch (err: any) {
      setEmailStatus({
        success: false,
        msg: err.message || 'Email delivery failed.',
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
          Notification Rules & Multi-Gmail Alert Dispatch
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Configure multi-recipient Gmail alerts, continuous 48-hour reminders, and live email delivery providers.
        </p>
      </div>

      {saveFeedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Multiple Gmail / Email Recipients Management */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Alert Recipient Gmail Addresses ({formData.alertEmails.length})
              </h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.emailAlertsEnabled}
                onChange={(e) => setFormData({ ...formData, emailAlertsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900 dark:peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Add multiple Gmail accounts or team mailboxes. Every configured address will receive simultaneous renewal warnings at 30 days and continuous 48-hour reminders until domains are renewed.
          </p>

          {/* Add New Gmail Field */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Add More Gmail / Email Addresses
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  placeholder="e.g. devops.lead@gmail.com, security.alert@gmail.com"
                  value={newGmailInput}
                  onChange={(e) => setNewGmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGmail();
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder:text-neutral-400"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddGmail()}
                className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Gmail</span>
              </button>
            </div>

            {/* Quick add suggestions */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span>Quick add:</span>
              <button
                type="button"
                onClick={() => handleAddGmail('shenz.terra@gmail.com')}
                className="hover:underline font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-[11px]"
              >
                + shenz.terra@gmail.com
              </button>
              <button
                type="button"
                onClick={() => handleAddGmail('admin.domainalerts@gmail.com')}
                className="hover:underline font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-[11px]"
              >
                + admin.domainalerts@gmail.com
              </button>
              <button
                type="button"
                onClick={() => handleAddGmail('infra.backup@gmail.com')}
                className="hover:underline font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-[11px]"
              >
                + infra.backup@gmail.com
              </button>
            </div>

            {gmailError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{gmailError}</span>
              </p>
            )}
          </div>

          {/* List of active Gmail recipients */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
              Active Alert Recipients ({formData.alertEmails.length})
            </span>
            <div className="space-y-2">
              {formData.alertEmails.map((emailAddr, index) => {
                const isGmail = emailAddr.endsWith('@gmail.com');
                const isPrimary = index === 0;

                return (
                  <div
                    key={emailAddr}
                    className="p-2.5 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                        {isGmail ? 'M' : '@'}
                      </div>
                      <span className="font-mono font-medium text-neutral-900 dark:text-white truncate">
                        {emailAddr}
                      </span>
                      {isPrimary && (
                        <span className="px-1.5 py-0.2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-[10px] rounded uppercase font-semibold">
                          Primary
                        </span>
                      )}
                      {isGmail && (
                        <span className="px-1.5 py-0.2 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-mono text-[10px] rounded">
                          Gmail
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Subscribed
                      </span>
                      {formData.alertEmails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGmail(emailAddr)}
                          className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Remove recipient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Make the Website Send Real Emails Box */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Live Email Delivery Provider & API Integration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProviderSetup(!showProviderSetup)}
                className="text-xs text-neutral-600 dark:text-neutral-400 hover:underline flex items-center gap-1"
              >
                <span>{showProviderSetup ? 'Hide Provider Config' : 'Configure Live Email Dispatch'}</span>
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Want alerts to land directly in your real Gmail inboxes? Connect a free transactional email API key (e.g. <strong>Resend</strong>) or use our built-in dispatcher.
            </p>

            {showProviderSetup && (
              <div className="mt-3 p-4 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-950 space-y-3.5">
                <div className="flex items-center justify-between text-xs border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Live Delivery Options:
                  </span>
                  <a
                    href="https://resend.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white inline-flex items-center gap-1"
                  >
                    <span>Get Free Resend Key (100/day free)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Email API Key (Resend / SendGrid)
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="password"
                        placeholder="re_123456789..."
                        value={formData.emailApiKey || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emailApiKey: e.target.value,
                            emailProvider: e.target.value.startsWith('re_') ? 'resend' : 'direct',
                          })
                        }
                        className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      Paste key from resend.com for 100% direct inbox delivery to your Gmails
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Custom Sender Address (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="DomainGuard Alerts <onboarding@resend.dev>"
                      value={formData.emailSenderAddress || ''}
                      onChange={(e) => setFormData({ ...formData, emailSenderAddress: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      Leave empty to use verified Resend onboarding address
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Email Dispatch Feedback */}
          {emailStatus && (
            <div
              className={`p-3 text-xs rounded border flex items-start gap-2.5 ${
                emailStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
              }`}
            >
              {emailStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              )}
              <div className="space-y-0.5">
                <span className="font-semibold block">{emailStatus.msg}</span>
                {emailStatus.provider && (
                  <span className="text-[11px] opacity-80 block font-mono">
                    Provider: {emailStatus.provider === 'resend' ? 'Resend API (Live Inbox Delivery)' : 'DomainGuard Dispatcher'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Trigger Test Email to all added Gmails */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              Ready to alert {formData.alertEmails.length} recipient{formData.alertEmails.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={isTestingEmail}
              className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>
                {isTestingEmail
                  ? 'Dispatching...'
                  : `Send Test Alert to All (${formData.alertEmails.length}) Gmails`}
              </span>
            </button>
          </div>
        </div>

        {/* Section 2: Expiration Warning Cadence (30-day + continuous 2-day mandatory) */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Expiration Warning Thresholds & Continuous Reminder Cadence
            </h2>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Per governance policy: A mandatory continuous reminder every 2 days until expiry is enforced to avoid any accidental lapses.
          </p>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer p-3 border border-neutral-100 dark:border-neutral-800 rounded bg-neutral-50/50 dark:bg-neutral-950/50">
              <input
                type="checkbox"
                checked={formData.warn30DaysBefore}
                onChange={(e) => setFormData({ ...formData, warn30DaysBefore: e.target.checked })}
                className="mt-0.5 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                  Initial 30-Day Early Warning (Mandatory Safeguard)
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                  Sends first official renewal notification exactly 30 days prior to expiration date to all configured Gmails.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 border border-amber-200/60 dark:border-amber-900/40 rounded bg-amber-50/30 dark:bg-amber-950/20">
              <input
                type="checkbox"
                checked={formData.continuousReminderEvery2Days}
                onChange={(e) => setFormData({ ...formData, continuousReminderEvery2Days: e.target.checked })}
                className="mt-0.5 rounded border-amber-400 dark:border-amber-700 text-amber-600 focus:ring-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Continuous Reminder Every 2 Days (Until Expiry)
                  </span>
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono text-[10px] font-bold rounded">
                    MANDATORY
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                  Repeats automated alerts every 48 hours for any domains within the danger zone (&lt;30 days) to prevent accidental lapses.
                </span>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-neutral-100 dark:border-neutral-800 rounded">
                <input
                  type="checkbox"
                  checked={formData.warn15DaysBefore}
                  onChange={(e) => setFormData({ ...formData, warn15DaysBefore: e.target.checked })}
                  className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                />
                <span className="text-xs text-neutral-800 dark:text-neutral-200">
                  Escalate warning at 15 days before expiry
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-neutral-100 dark:border-neutral-800 rounded">
                <input
                  type="checkbox"
                  checked={formData.warn7DaysBefore}
                  onChange={(e) => setFormData({ ...formData, warn7DaysBefore: e.target.checked })}
                  className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                />
                <span className="text-xs text-neutral-800 dark:text-neutral-200">
                  Critical red alert at 7 days before expiry
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Telegram Bot Integration */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-500" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Telegram Bot Alerts
              </h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.telegramEnabled}
                onChange={(e) => setFormData({ ...formData, telegramEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900 dark:peer-checked:bg-sky-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Telegram Bot Token
              </label>
              <input
                type="password"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={formData.telegramBotToken}
                onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Telegram Chat / Channel ID
              </label>
              <input
                type="text"
                placeholder="-1001234567890 or @your_channel"
                value={formData.telegramChatId}
                onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {telegramStatus && (
            <div
              className={`p-2.5 text-xs rounded border flex items-center gap-2 ${
                telegramStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
              }`}
            >
              {telegramStatus.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
              <span>{telegramStatus.msg}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={isTestingTelegram}
              className="px-3.5 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3 text-sky-500" />
              <span>{isTestingTelegram ? 'Sending Test...' : 'Send Test Telegram Alert'}</span>
            </button>
          </div>
        </div>

        {/* Section 4: Periodic Auto-Refresh */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded p-5 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white">
              Real-Time WHOIS Periodic Auto-Update Interval
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Periodically re-checks registry status, DNS health, and expiration timestamps automatically in the background.
            </p>
          </div>

          <select
            value={formData.autoRefreshIntervalMinutes}
            onChange={(e) => setFormData({ ...formData, autoRefreshIntervalMinutes: Number(e.target.value) })}
            className="px-3 py-1.5 text-xs font-semibold bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
          >
            <option value={1}>Every 1 minute</option>
            <option value={5}>Every 5 minutes</option>
            <option value={15}>Every 15 minutes</option>
            <option value={60}>Every 1 hour</option>
          </select>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded transition-colors shadow-xs cursor-pointer"
          >
            Save Alert Configuration & Gmail Recipients
          </button>
        </div>
      </form>

      {/* Section 5: Real-time Notification Audit Log */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Notification & Multi-Gmail Audit History
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {notificationLogs.length} events logged
          </span>
        </div>

        <div className="space-y-2">
          {notificationLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="p-3 border border-neutral-100 dark:border-neutral-800/80 rounded bg-neutral-50/50 dark:bg-neutral-950/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                    {log.domain}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold uppercase ${
                      log.urgency === 'critical'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : log.urgency === 'warning'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {log.urgency}
                  </span>
                  <span className="text-neutral-400 text-[11px] font-mono">via {log.channel}</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                  {log.message}
                </p>
                <div className="text-[10px] text-neutral-400 font-mono">
                  To: {log.recipient}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-neutral-400 font-mono text-[11px] block">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[10px] flex items-center justify-end gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Dispatched
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
