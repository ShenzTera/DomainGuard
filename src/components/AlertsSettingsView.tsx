import React, { useState, useEffect } from 'react';
import { AlertSettings, NotificationLog, DomainItem } from '../types/domain';
import { useAuth } from '../context/AuthContext';
import { dispatchAutomatedAlerts } from '../lib/domainService';
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
  Link2,
  Unlink,
  Check,
  ShieldCheck,
  Loader2,
  Users,
  Radio,
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
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState<AlertSettings>({
    ...settings,
    alertEmails:
      Array.isArray(settings.alertEmails) && settings.alertEmails.length > 0
        ? settings.alertEmails
        : [settings.alertEmail || 'admin@domainguard.io'],
    emailProvider: settings.emailProvider || 'direct',
  });

  const [newGmailInput, setNewGmailInput] = useState('');
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Modern Telegram Connection State
  const [botConfigured, setBotConfigured] = useState<boolean>(false);
  const [botUsername, setBotUsername] = useState<string>('');
  const [isStartingConnect, setIsStartingConnect] = useState(false);
  const [connectCode, setConnectCode] = useState<string | null>(null);
  const [connectDeepLink, setConnectDeepLink] = useState<string | null>(null);
  const [connectGroupDeepLink, setConnectGroupDeepLink] = useState<string | null>(null);
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Available Telegram Chats (Groups, Channels, Direct chats)
  const [availableChats, setAvailableChats] = useState<Array<{
    id: string;
    title: string;
    type: 'group' | 'supergroup' | 'channel' | 'private';
    username?: string;
    isActive: boolean;
    lastSeen?: string;
  }>>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isSwitchingChat, setIsSwitchingChat] = useState<string | null>(null);

  // Custom Bot Token setting accordion
  const [showBotTokenConfig, setShowBotTokenConfig] = useState(false);
  const [customBotToken, setCustomBotToken] = useState('');
  const [isSavingBotToken, setIsSavingBotToken] = useState(false);

  // Manual Chat ID fallback accordion (for Telegram Groups / Channels)
  const [showManualChatId, setShowManualChatId] = useState(false);
  const [manualChatIdInput, setManualChatIdInput] = useState(formData.telegramChatId || '');
  const [isSavingManualChatId, setIsSavingManualChatId] = useState(false);

  // Email test status
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; msg: string; provider?: string } | null>(null);

  // Provider configuration visibility toggle
  const [showProviderSetup, setShowProviderSetup] = useState(Boolean(formData.emailApiKey));

  const fetchAvailableChats = async () => {
    setIsLoadingChats(true);
    try {
      const token = localStorage.getItem('domainguard_auth_token');
      const res = await fetch('/api/telegram/available-chats', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.chats && Array.isArray(data.chats)) {
        setAvailableChats(data.chats);
        if (data.activeChatId && !formData.telegramChatId) {
          setFormData((prev) => ({
            ...prev,
            telegramChatId: data.activeChatId,
            telegramUsername: data.activeChatTitle,
            telegramConnected: true,
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch available Telegram chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Check server Telegram bot status on mount
  useEffect(() => {
    async function checkBotInfo() {
      try {
        const res = await fetch('/api/telegram/bot-info');
        const data = await res.json();
        if (data.configured && data.botUsername) {
          setBotConfigured(true);
          setBotUsername(data.botUsername);
          fetchAvailableChats();
        } else {
          setBotConfigured(false);
        }
      } catch (err) {
        console.warn('Could not check bot info:', err);
      }
    }
    checkBotInfo();
  }, []);

  // Automatic background polling for Telegram link verification
  useEffect(() => {
    if (!connectCode) return;
    let cancelled = false;
    let pollCount = 0;
    const maxPolls = 60; // 2.5 minutes polling

    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls || cancelled) {
        clearInterval(interval);
        return;
      }
      try {
        const token = localStorage.getItem('domainguard_auth_token');
        const res = await fetch('/api/telegram/verify-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ userId: user?.id }),
        });
        const data = await res.json();
        if (data.connected && !cancelled) {
          clearInterval(interval);
          setTelegramStatus({
            success: true,
            msg: `Connected successfully! Telegram user ${data.telegramUsername} is now linked.`,
          });
          updateUser({
            telegramChatId: data.chatId,
            telegramUsername: data.telegramUsername,
          });
          setFormData((prev) => ({
            ...prev,
            telegramEnabled: true,
            telegramConnected: true,
            telegramUsername: data.telegramUsername,
            telegramChatId: data.chatId,
          }));
          setConnectCode(null);
          setConnectDeepLink(null);

          onAddNotificationLog({
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            domain: 'Telegram Service',
            channel: 'telegram',
            recipient: data.telegramUsername,
            urgency: 'reminder',
            message: 'Telegram account auto-verified and linked successfully.',
            status: 'sent',
          });
        }
      } catch {
        // Continue polling silently
      }
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [connectCode, user?.id]);

  const handleAddGmail = (emailToAdd?: string) => {
    const email = (emailToAdd || newGmailInput).trim().toLowerCase();
    setGmailError(null);

    if (!email || !email.includes('@') || !email.includes('.')) {
      setGmailError('Please enter a valid email address (e.g. devops.alerts@gmail.com).');
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
    setSaveFeedback('Notification preferences and alert cadence saved.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Start Telegram Connection Flow
  const handleStartTelegramConnect = async () => {
    setIsStartingConnect(true);
    setTelegramStatus(null);
    try {
      const token = localStorage.getItem('domainguard_auth_token');
      const res = await fetch('/api/telegram/start-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConnectCode(data.verificationCode);
      setConnectDeepLink(data.deepLink);
      setConnectGroupDeepLink(data.groupDeepLink);
      if (data.botUsername) setBotUsername(data.botUsername);
      fetchAvailableChats();
    } catch (err: any) {
      setTelegramStatus({
        success: false,
        msg: err.message || 'Could not initiate Telegram connection. Ensure bot token is set.',
      });
    } finally {
      setIsStartingConnect(false);
    }
  };

  // Switch destination to a specific group or chat
  const handleSelectChat = async (chatId: string, title: string) => {
    setIsSwitchingChat(chatId);
    setTelegramStatus(null);
    try {
      const token = localStorage.getItem('domainguard_auth_token');
      const res = await fetch('/api/telegram/select-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          chatId,
          title,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      updateUser({
        telegramChatId: data.activeChatId,
        telegramUsername: data.activeChatTitle,
      });
      setFormData((prev) => ({
        ...prev,
        telegramEnabled: true,
        telegramConnected: true,
        telegramChatId: data.activeChatId,
        telegramUsername: data.activeChatTitle,
      }));

      setTelegramStatus({
        success: true,
        msg: `Alert destination switched to: ${data.activeChatTitle}!`,
      });

      fetchAvailableChats();

      onAddNotificationLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        domain: 'Telegram Routing',
        channel: 'telegram',
        recipient: data.activeChatTitle,
        urgency: 'reminder',
        message: `Alert destination set to ${data.activeChatTitle}`,
        status: 'sent',
      });
    } catch (err: any) {
      setTelegramStatus({
        success: false,
        msg: err.message || 'Failed to switch Telegram destination',
      });
    } finally {
      setIsSwitchingChat(null);
    }
  };

  // Verify Telegram connection from getUpdates
  const handleCheckTelegramVerify = async () => {
    setIsCheckingVerify(true);
    setTelegramStatus(null);
    try {
      const token = localStorage.getItem('domainguard_auth_token');
      const res = await fetch('/api/telegram/verify-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();

      if (data.connected) {
        setTelegramStatus({
          success: true,
          msg: `Connected successfully! Destination ${data.telegramUsername} is now linked.`,
        });
        updateUser({
          telegramChatId: data.chatId,
          telegramUsername: data.telegramUsername,
        });
        setFormData({
          ...formData,
          telegramEnabled: true,
          telegramConnected: true,
          telegramUsername: data.telegramUsername,
          telegramChatId: data.chatId,
        });
        setConnectCode(null);
        setConnectDeepLink(null);
        fetchAvailableChats();

        onAddNotificationLog({
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          domain: 'Telegram Service',
          channel: 'telegram',
          recipient: data.telegramUsername,
          urgency: 'reminder',
          message: 'Telegram destination verified and linked successfully.',
          status: 'sent',
        });
      } else {
        setTelegramStatus({
          success: false,
          msg: data.error || 'Verification pending. Please open the bot in Telegram or add to group, tap "Start" or send the code, then click Verify.',
        });
      }
    } catch (err: any) {
      setTelegramStatus({
        success: false,
        msg: err.message || 'Verification check failed.',
      });
    } finally {
      setIsCheckingVerify(false);
    }
  };

  // Disconnect Telegram
  const handleDisconnectTelegram = async () => {
    try {
      const token = localStorage.getItem('domainguard_auth_token');
      await fetch('/api/telegram/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      updateUser({ telegramChatId: null, telegramUsername: null });
      setFormData({
        ...formData,
        telegramConnected: false,
        telegramUsername: undefined,
        telegramChatId: '',
      });
      setTelegramStatus({
        success: true,
        msg: 'Telegram alert channel has been disconnected.',
      });
      fetchAvailableChats();
    } catch (err: any) {
      setTelegramStatus({ success: false, msg: err.message });
    }
  };

  // Send Test Alert directly to connected Telegram (or specific destination)
  const handleSendTestTelegram = async (customChatId?: string, customRecipientTitle?: string) => {
    setTelegramStatus(null);
    const destChatId = customChatId || user?.telegramChatId || formData.telegramChatId;
    const destTitle = customRecipientTitle || user?.telegramUsername || formData.telegramUsername || destChatId;
    const isGroup = String(destChatId).startsWith('-');

    if (!destChatId) {
      setTelegramStatus({
        success: false,
        msg: 'No connected Telegram destination found. Please connect or select a chat first.',
      });
      return;
    }

    try {
      const token = localStorage.getItem('domainguard_auth_token');
      const expiringDomains = domains.filter((d) => d.daysUntilExpiration <= 30);
      const testMsg =
        `🚨 <b>DomainGuard Renewal Alert Test</b>\n\n` +
        `This is a live test notification from your domain portfolio engine.\n` +
        `Destination: <b>${isGroup ? '👥 Group Chat' : '👤 Direct Message'} (${destTitle})</b>\n` +
        `Total Tracked Domains: <b>${domains.length}</b>\n` +
        `Domains expiring within 30 days: <b>${expiringDomains.length}</b>\n\n` +
        `<i>Reminder Cadence: Warnings at 30 days + continuous 48-hour reminders until renewal.</i>`;

      const res = await fetch('/api/telegram/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: testMsg,
          chatId: destChatId,
          recipientTitle: destTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTelegramStatus({
        success: true,
        msg: data.message || `Test alert successfully delivered to ${destTitle} on Telegram! Check your chat.`,
      });

      onAddNotificationLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        domain: 'Portfolio Renewal Test',
        channel: 'telegram',
        recipient: data.recipient || destTitle || 'Telegram',
        urgency: 'reminder',
        message: `Live Telegram alert dispatched to ${destTitle}`,
        status: 'sent',
      });
    } catch (err: any) {
      setTelegramStatus({
        success: false,
        msg: err.message || 'Telegram test alert failed.',
      });
    }
  };

  // Dispatch real automated portfolio expiration scan to active Telegram destination
  const [isDispatchingAutoAlerts, setIsDispatchingAutoAlerts] = useState(false);
  const handleDispatchAutomatedScan = async () => {
    setIsDispatchingAutoAlerts(true);
    setTelegramStatus(null);
    try {
      const res = await dispatchAutomatedAlerts(domains, true);
      setTelegramStatus({
        success: true,
        msg: res.message || 'Automated portfolio scan completed and alert delivered to your Telegram destination!',
      });
      onAddNotificationLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        domain: 'Portfolio Expiration Scan',
        channel: 'telegram',
        recipient: activeTelegramUser || 'Telegram',
        urgency: 'critical',
        message: `Automated scan alert sent: ${res.totalFlagged || 0} domains flagged.`,
        status: 'sent',
      });
    } catch (err: any) {
      setTelegramStatus({
        success: false,
        msg: err.message || 'Failed to dispatch automated alerts.',
      });
    } finally {
      setIsDispatchingAutoAlerts(false);
    }
  };

  // Save custom bot token
  const handleSaveBotToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBotToken.trim()) return;
    setIsSavingBotToken(true);
    try {
      const res = await fetch('/api/telegram/config-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: customBotToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBotConfigured(true);
      setBotUsername(data.botUsername);
      setShowBotTokenConfig(false);
      setCustomBotToken('');
      setTelegramStatus({
        success: true,
        msg: `Bot @${data.botUsername} successfully linked! You can now connect your Telegram account.`,
      });
    } catch (err: any) {
      setTelegramStatus({ success: false, msg: err.message });
    } finally {
      setIsSavingBotToken(false);
    }
  };

  // Save manual Chat ID (for enterprise groups, channels, or custom setups)
  const handleSaveManualChatId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualChatIdInput.trim()) return;
    setIsSavingManualChatId(true);
    setTelegramStatus(null);
    try {
      const token = localStorage.getItem('domainguard_auth_token');
      const res = await fetch('/api/telegram/manual-chat-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          chatId: manualChatIdInput.trim(),
          userId: user?.id,
          username: manualChatIdInput.trim().startsWith('-') ? 'Telegram Group' : 'Telegram User',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTelegramStatus({
        success: true,
        msg: data.message || `Telegram destination ${manualChatIdInput} linked successfully!`,
      });
      updateUser({
        telegramChatId: data.chatId,
        telegramUsername: data.telegramUsername,
      });
      setFormData({
        ...formData,
        telegramEnabled: true,
        telegramConnected: true,
        telegramUsername: data.telegramUsername,
        telegramChatId: data.chatId,
      });
      setShowManualChatId(false);

      onAddNotificationLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        domain: 'Telegram Service',
        channel: 'telegram',
        recipient: data.telegramUsername,
        urgency: 'reminder',
        message: 'Telegram Chat ID linked and verified.',
        status: 'sent',
      });
    } catch (err: any) {
      setTelegramStatus({ success: false, msg: err.message });
    } finally {
      setIsSavingManualChatId(false);
    }
  };

  // Test Email dispatch
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
          subject: '⚠️ DomainGuard Expiration Warning Verification',
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
        message: `Renewal alert dispatched to ${recipients.length} recipient(s): ${recipients.join(', ')}`,
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

  const isUserTelegramConnected = Boolean(user?.telegramChatId || formData.telegramChatId);
  const activeChatId = user?.telegramChatId || formData.telegramChatId || '';
  const isGroupDestination = activeChatId.startsWith('-');
  const activeTelegramUser =
    user?.telegramUsername ||
    formData.telegramUsername ||
    (isGroupDestination ? 'Telegram Group' : 'Connected User');
  const detectedGroup = availableChats.find(
    (c) => c.id.startsWith('-') || c.type === 'group' || c.type === 'supergroup'
  );

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
          Notification Rules & Telegram Bot Alerts
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Configure multi-recipient Gmail alerts, frictionless Telegram group and personal bot alerts, and mandatory 48-hour continuous expiration reminders.
        </p>
      </div>

      {saveFeedback && (
        <div className="p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm rounded-lg flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-7">
        {/* ============================================================== */}
        {/* SECTION 1: Streamlined Telegram Bot Connection Flow (Problem 2) */}
        {/* ============================================================== */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-4 sm:p-6 md:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-950 dark:text-white">
                  Telegram Bot Notifications
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Instant real-time expiration alerts delivered to your team group chat or personal Telegram account.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.telegramEnabled}
                onChange={(e) => setFormData({ ...formData, telegramEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900 dark:peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {/* Connection Status Box */}
          {isUserTelegramConnected ? (
            /* STATE A: ALREADY CONNECTED */
            <div className="space-y-4">
              <div
                className={`p-4 sm:p-5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isGroupDestination
                    ? 'border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/30'
                    : 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isGroupDestination
                        ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {isGroupDestination ? <Users className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {isGroupDestination ? 'Group Chat Destination Active' : 'Personal Chat Destination Active'}
                      </span>
                      <span
                        className={`px-2 py-0.5 font-mono text-xs rounded-full font-semibold ${
                          isGroupDestination
                            ? 'bg-purple-100 dark:bg-purple-900/70 text-purple-800 dark:text-purple-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {activeTelegramUser}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                        ({activeChatId})
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      {isGroupDestination
                        ? 'Automated 30-day and 48-hour continuous renewal warnings are currently posted directly into this Telegram group chat.'
                        : 'Alerts are currently delivered to your personal Telegram direct chat. You can switch to a group chat below.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isDispatchingAutoAlerts}
                    onClick={handleDispatchAutomatedScan}
                    className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex-1 sm:flex-initial"
                  >
                    {isDispatchingAutoAlerts ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Radio className="w-3.5 h-3.5" />
                    )}
                    <span>Run Automated Alert Check</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendTestTelegram()}
                    className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs flex-1 sm:flex-initial"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Alert to {isGroupDestination ? 'Group Chat' : 'My Chat'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnectTelegram}
                    className="px-3 py-2 text-xs font-medium border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md transition-colors cursor-pointer flex-1 sm:flex-initial justify-center"
                  >
                    <Unlink className="w-3.5 h-3.5 inline mr-1" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>

              {/* Automated Schedule Status Card */}
              <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Automated Alert Engine Active
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                    &bull; Bound to {isGroupDestination ? 'Group' : 'User'} ({activeTelegramUser})
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Continuous 48-Hour Reminders &amp; 30-Day Warning Enforced
                </div>
              </div>

              {/* Callout if in personal DM but a team group is detected */}
              {!isGroupDestination && detectedGroup && (
                <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800/80 bg-purple-50/70 dark:bg-purple-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200">
                        Team Group Chat Detected: &ldquo;{detectedGroup.title}&rdquo; ({detectedGroup.id})
                      </h4>
                      <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5">
                        Your alert destination is currently set to your personal DM. Click below to route all alerts to your group chat instead:
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSwitchingChat === detectedGroup.id}
                    onClick={() => handleSelectChat(detectedGroup.id, detectedGroup.title)}
                    className="px-3.5 py-1.5 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-md flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {isSwitchingChat === detectedGroup.id ? 'Switching...' : `Switch Alerts to ${detectedGroup.title}`}
                    </span>
                  </button>
                </div>
              )}

              {/* Discovered Telegram Destinations Panel */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-neutral-50/60 dark:bg-neutral-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                      Connected &amp; Detected Telegram Destinations ({availableChats.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAvailableChats}
                    disabled={isLoadingChats}
                    className="text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChats ? 'animate-spin' : ''}`} />
                    <span>Scan for Groups</span>
                  </button>
                </div>

                {/* Available chats list */}
                <div className="space-y-2">
                  {availableChats.length === 0 ? (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 py-2">
                      No additional Telegram destinations detected yet. Add the bot to your group chat below!
                    </p>
                  ) : (
                    availableChats.map((chat) => {
                      const isChatGroup = chat.id.startsWith('-') || chat.type === 'group' || chat.type === 'supergroup';
                      const isCurrent = chat.id === activeChatId;
                      return (
                        <div
                          key={chat.id}
                          className={`p-3 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                            isCurrent
                              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40'
                              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-md ${
                                isChatGroup
                                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                                  : 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                              }`}
                            >
                              {isChatGroup ? <Users className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-neutral-900 dark:text-white">{chat.title}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    isChatGroup
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                  }`}
                                >
                                  {isChatGroup ? 'Group Chat' : 'Direct Message'}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                                ID: {chat.id}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isCurrent ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-semibold rounded text-xs flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Active Target</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isSwitchingChat === chat.id}
                                onClick={() => handleSelectChat(chat.id, chat.title)}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded font-semibold text-xs cursor-pointer shadow-xs"
                              >
                                {isSwitchingChat === chat.id ? 'Switching...' : 'Switch Alerts Here'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleSendTestTelegram(chat.id, chat.title)}
                              className="px-2.5 py-1 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded font-medium text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Test Here</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add to Group Chat button */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-200/70 dark:border-neutral-800/70">
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Need alerts in another group? Add <strong>@{botUsername || 'your bot'}</strong> and send <code>/start</code> in the group.
                  </p>
                  <a
                    href={
                      connectGroupDeepLink ||
                      `https://t.me/${botUsername || 'Domain_Checker_SAM_bot'}?startgroup=connect&admin=post_messages`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Add Bot to Telegram Group Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* STATE B: NOT CONNECTED YET */
            <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Connect Your Telegram (Group Chat or Personal)
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Connect your team group chat or personal account with 1 click. No manual Chat ID required!
                  </p>
                </div>

                {!connectCode && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={
                        connectGroupDeepLink ||
                        `https://t.me/${botUsername || 'Domain_Checker_SAM_bot'}?startgroup=connect&admin=post_messages`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Add to Group Chat</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={handleStartTelegramConnect}
                      disabled={isStartingConnect}
                      className="px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      {isStartingConnect ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5" />
                      )}
                      <span>Connect Personal Chat</span>
                    </button>
                  </div>
                )}
              </div>

              {/* If chats were already detected (e.g. Domain test gc) */}
              {availableChats.length > 0 && !connectCode && (
                <div className="p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Detected Telegram Destinations:
                  </span>
                  <div className="space-y-1.5">
                    {availableChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center justify-between p-2 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {chat.id.startsWith('-') ? (
                            <Users className="w-4 h-4 text-purple-600" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-sky-600" />
                          )}
                          <span className="font-semibold text-neutral-900 dark:text-white">{chat.title}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">({chat.id})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectChat(chat.id, chat.title)}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded text-xs font-semibold cursor-pointer"
                        >
                          Connect Here
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Verification Session Details */}
              {connectCode && (
                <div className="p-4 rounded-md border border-sky-200 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/40 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 dark:text-sky-200 uppercase tracking-wide">
                      Verification in Progress
                    </span>
                    <span className="text-xs font-mono text-sky-700 dark:text-sky-300">
                      Code: <strong>{connectCode}</strong>
                    </span>
                  </div>

                  <div className="text-xs text-neutral-700 dark:text-neutral-300 space-y-2 leading-relaxed">
                    <p>
                      <strong>Option 1 (For Group Chat):</strong> Add the bot to your Telegram group and send code{' '}
                      <code>{connectCode}</code> or <code>/start</code>:
                    </p>
                    {connectGroupDeepLink && (
                      <a
                        href={connectGroupDeepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium text-xs shadow-xs"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Add @{botUsername || 'Bot'} to Group</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <p className="pt-1">
                      <strong>Option 2 (For Personal Chat):</strong> Tap Start in the bot chat:
                    </p>
                    {connectDeepLink && (
                      <div className="flex flex-wrap items-center gap-2 my-1.5">
                        <a
                          href={connectDeepLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium text-xs shadow-xs"
                        >
                          <span>Open in Telegram (@{botUsername || 'Bot'})</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 rounded font-medium">
                          <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                          <span>Auto-listening for bot interaction...</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCheckTelegramVerify}
                      disabled={isCheckingVerify}
                      className="px-4 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCheckingVerify ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Confirm &amp; Verify Connection</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConnectCode(null);
                        setConnectDeepLink(null);
                        setConnectGroupDeepLink(null);
                      }}
                      className="px-3 py-2 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Advanced Group / Manual Chat ID Accordion */}
              <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setShowManualChatId(!showManualChatId)}
                  className="text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <span>
                    {showManualChatId
                      ? 'Hide manual Chat ID input'
                      : 'Have a specific Telegram Group Chat ID? (e.g. -100123456789)'}
                  </span>
                  <span>{showManualChatId ? '▲' : '▼'}</span>
                </button>

                {showManualChatId && (
                  <form
                    onSubmit={handleSaveManualChatId}
                    className="mt-3 p-3.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
                  >
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Add <strong>@{botUsername || 'your bot'}</strong> to your Telegram Group, then paste the Group Chat ID below:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. -4835124728 or -100192837465"
                        value={manualChatIdInput}
                        onChange={(e) => setManualChatIdInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSavingManualChatId}
                        className="px-3 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingManualChatId ? 'Connecting...' : 'Link Chat ID'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Telegram Status Feedback Banner */}
          {telegramStatus && (
            <div
              className={`p-3.5 text-xs rounded-md border flex items-start gap-2.5 ${
                telegramStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
              }`}
            >
              {telegramStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              )}
              <span className="leading-relaxed">{telegramStatus.msg}</span>
            </div>
          )}

          {/* Bot Token Configuration Accordion for Server Administrators */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">
              Bot Status: {botConfigured ? (
                <strong className="text-emerald-600 dark:text-emerald-400">Active (@{botUsername})</strong>
              ) : (
                <strong className="text-amber-600 dark:text-amber-400">Token Needed</strong>
              )}
            </span>
            <button
              type="button"
              onClick={() => setShowBotTokenConfig(!showBotTokenConfig)}
              className="text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white underline font-medium"
            >
              {showBotTokenConfig ? 'Hide Bot Settings' : 'Configure Bot Token'}
            </button>
          </div>

          {showBotTokenConfig && (
            <div className="p-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wide">
                Telegram Bot Token Configuration
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Create a bot with <strong>@BotFather</strong> on Telegram, copy your API Token, and paste it here. It is stored securely on the backend and never exposed to client browsers.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={customBotToken}
                  onChange={(e) => setCustomBotToken(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleSaveBotToken}
                  disabled={isSavingBotToken || !customBotToken.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-md disabled:opacity-50"
                >
                  {isSavingBotToken ? 'Saving...' : 'Save Bot Token'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: Multi-Gmail Recipients & Live Dispatch (Problem 4) */}
        {/* ============================================================== */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Email Alert Recipients ({formData.alertEmails.length})
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Manage multiple Gmail addresses and corporate recipients for simultaneous renewal warnings.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.emailAlertsEnabled}
                onChange={(e) => setFormData({ ...formData, emailAlertsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900 dark:peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Add New Gmail Field */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
              Add Recipient Email Address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  placeholder="e.g. devops.alerts@gmail.com, security@enterprise.com"
                  value={newGmailInput}
                  onChange={(e) => setNewGmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGmail();
                    }
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddGmail()}
                className="px-4 py-2.5 text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Recipient</span>
              </button>
            </div>

            {/* Quick add suggestions (Problem 4: Demo email used) */}
            <div className="flex items-center gap-2 pt-1 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span>Quick add:</span>
              <button
                type="button"
                onClick={() => handleAddGmail('admin@domainguard.io')}
                className="hover:underline font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded text-xs"
              >
                + admin@domainguard.io
              </button>
              <button
                type="button"
                onClick={() => handleAddGmail('alerts.backup@gmail.com')}
                className="hover:underline font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded text-xs"
              >
                + alerts.backup@gmail.com
              </button>
              <button
                type="button"
                onClick={() => handleAddGmail('infra-team@enterprise.internal')}
                className="hover:underline font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded text-xs"
              >
                + infra-team@enterprise.internal
              </button>
            </div>

            {gmailError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{gmailError}</span>
              </p>
            )}
          </div>

          {/* List of active recipients */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2 uppercase tracking-wide">
              Active Recipients ({formData.alertEmails.length})
            </span>
            <div className="space-y-2">
              {formData.alertEmails.map((emailAddr, index) => {
                const isGmail = emailAddr.endsWith('@gmail.com');
                const isPrimary = index === 0;

                return (
                  <div
                    key={emailAddr}
                    className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-md bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {isGmail ? 'M' : '@'}
                      </div>
                      <span className="font-mono font-medium text-neutral-900 dark:text-white truncate">
                        {emailAddr}
                      </span>
                      {isPrimary && (
                        <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded uppercase font-semibold">
                          Primary
                        </span>
                      )}
                      {isGmail && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-mono text-xs rounded">
                          Gmail
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Subscribed
                      </span>
                      {formData.alertEmails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGmail(emailAddr)}
                          className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Remove recipient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Provider Options */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Live Email Delivery Options
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProviderSetup(!showProviderSetup)}
                className="text-xs text-neutral-600 dark:text-neutral-400 hover:underline"
              >
                {showProviderSetup ? 'Hide Provider Config' : 'Configure Live Email Provider'}
              </button>
            </div>

            {showProviderSetup && (
              <div className="mt-3.5 p-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Direct Inbox Delivery (Resend API)
                  </span>
                  <a
                    href="https://resend.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white inline-flex items-center gap-1"
                  >
                    <span>Get Free Resend Key (100 free emails/day)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Email API Key (Resend)
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
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
                        className="w-full pl-9 pr-3.5 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white"
                      />
                    </div>
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
                      className="w-full px-3.5 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Email Dispatch Feedback */}
          {emailStatus && (
            <div
              className={`p-3.5 text-xs rounded-md border flex items-start gap-2.5 ${
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

          {/* Trigger Test Email */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              Ready to alert {formData.alertEmails.length} recipient{formData.alertEmails.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={isTestingEmail}
              className="px-4 py-2.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isTestingEmail
                  ? 'Dispatching...'
                  : `Send Test Alert to All (${formData.alertEmails.length}) Recipients`}
              </span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 3: Expiration Cadence (30-day + 48h mandatory) */}
        {/* ============================================================== */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Expiration Warning Thresholds & Continuous Reminder Cadence
            </h2>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Per domain portfolio management rules: A mandatory continuous reminder every 2 days until expiry is enforced to avoid accidental lapses.
          </p>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer p-3.5 border border-neutral-100 dark:border-neutral-800 rounded-md bg-neutral-50/50 dark:bg-neutral-950/50">
              <input
                type="checkbox"
                checked={formData.warn30DaysBefore}
                onChange={(e) => setFormData({ ...formData, warn30DaysBefore: e.target.checked })}
                className="mt-0.5 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
              />
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                  Initial 30-Day Early Warning (Mandatory Safeguard)
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                  Sends first official renewal notification exactly 30 days prior to expiration date to all configured Gmail addresses and connected Telegram.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3.5 border border-amber-200/60 dark:border-amber-900/40 rounded-md bg-amber-50/30 dark:bg-amber-950/20">
              <input
                type="checkbox"
                checked={formData.continuousReminderEvery2Days}
                onChange={(e) => setFormData({ ...formData, continuousReminderEvery2Days: e.target.checked })}
                className="mt-0.5 rounded border-amber-400 dark:border-amber-700 text-amber-600 focus:ring-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Continuous Reminder Every 2 Days (Until Expiry)
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono text-xs font-bold rounded">
                    MANDATORY
                  </span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                  Repeats automated alerts every 48 hours for any domains within the danger zone (&le;30 days) until renewal is detected.
                </span>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer p-3 border border-neutral-100 dark:border-neutral-800 rounded-md">
                <input
                  type="checkbox"
                  checked={formData.warn15DaysBefore}
                  onChange={(e) => setFormData({ ...formData, warn15DaysBefore: e.target.checked })}
                  className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                />
                <span className="text-xs text-neutral-800 dark:text-neutral-200 font-medium">
                  Escalate warning at 15 days before expiry
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer p-3 border border-neutral-100 dark:border-neutral-800 rounded-md">
                <input
                  type="checkbox"
                  checked={formData.warn7DaysBefore}
                  onChange={(e) => setFormData({ ...formData, warn7DaysBefore: e.target.checked })}
                  className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                />
                <span className="text-xs text-neutral-800 dark:text-neutral-200 font-medium">
                  Critical red alert at 7 days before expiry
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: Auto-Refresh Interval */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Real-Time WHOIS Periodic Auto-Update Interval
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Periodically re-checks registry status, DNS health, and expiration timestamps in the background.
            </p>
          </div>

          <select
            value={formData.autoRefreshIntervalMinutes}
            onChange={(e) => setFormData({ ...formData, autoRefreshIntervalMinutes: Number(e.target.value) })}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white"
          >
            <option value={1}>Every 1 minute</option>
            <option value={5}>Every 5 minutes</option>
            <option value={15}>Every 15 minutes</option>
            <option value={60}>Every 1 hour</option>
          </select>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-semibold rounded-md transition-colors shadow-xs cursor-pointer"
          >
            Save Alert Configuration
          </button>
        </div>
      </form>

      {/* SECTION 5: Notification Audit Log */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-neutral-500 shrink-0" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Notification &amp; Multi-Channel Audit History
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400 shrink-0">
            {notificationLogs.length} events logged
          </span>
        </div>

        <div className="space-y-2.5">
          {notificationLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="p-3 sm:p-3.5 border border-neutral-100 dark:border-neutral-800/80 rounded-md bg-neutral-50/50 dark:bg-neutral-950/50 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2.5"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold text-sm text-neutral-900 dark:text-white break-all">
                    {log.domain}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-xs font-bold uppercase shrink-0 ${
                      log.urgency === 'critical'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : log.urgency === 'warning'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {log.urgency}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs font-mono shrink-0">
                    via {log.channel}
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs break-words">
                  {log.message}
                </p>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono break-all">
                  Recipient: {log.recipient}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-200/50 dark:border-neutral-800/50">
                <span className="text-neutral-500 dark:text-neutral-400 font-mono text-xs block">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs flex items-center justify-start sm:justify-end gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
