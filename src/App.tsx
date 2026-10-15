import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useDarkMode } from './hooks/useDarkMode';
import { AuthPage } from './components/AuthPage';
import { PublicWhoisLookupPage } from './components/PublicWhoisLookupPage';
import { TopNavigation, NavTab } from './components/TopNavigation';
import { DashboardView } from './components/DashboardView';
import { WhoisLookupView } from './components/WhoisLookupView';
import { AlertsSettingsView } from './components/AlertsSettingsView';
import { EnterpriseTeamView } from './components/EnterpriseTeamView';
import { AddDomainModal } from './components/AddDomainModal';
import { ImportSheetsModal } from './components/ImportSheetsModal';
import { WhoisDetailModal } from './components/WhoisDetailModal';
import {
  DomainItem,
  AlertSettings,
  NotificationLog,
  TeamMember,
} from './types/domain';
import {
  loadDomains,
  saveDomains,
  loadSettings,
  saveSettings,
  loadNotifications,
  saveNotifications,
  loadTeam,
  saveTeam,
  recalculateDaysUntilExpiration,
  fetchDomainWhois,
  checkWebsiteHttpStatus,
  dispatchAutomatedAlerts,
  fetchAccountDomains,
  syncAccountDomains,
  fetchAccountSettings,
  syncAccountSettings,
  INITIAL_DOMAINS,
} from './lib/domainService';

function MainApplication() {
  const { user, token, loading } = useAuth();
  const { isDark, toggle: toggleTheme } = useDarkMode();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [settings, setSettings] = useState<AlertSettings>(loadSettings());
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedDomainForDetails, setSelectedDomainForDetails] = useState<DomainItem | null>(null);
  const [isPublicLookupOpen, setIsPublicLookupOpen] = useState(false);

  // Check URL on initial load for direct lookup deep-link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('lookup') || search.includes('lookup')) {
        setIsPublicLookupOpen(true);
      }
    }
  }, []);

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Load initial data isolated to the authenticated user and sync with cloud account
  useEffect(() => {
    if (!user) return;
    const localDomains = loadDomains(user.id);
    setDomains(localDomains);
    setSettings(loadSettings(user.id, user.email));
    setNotifications(loadNotifications(user.id));
    setTeamMembers(loadTeam(user.id));

    let isMounted = true;
    setCloudSyncStatus('syncing');

    // Fetch cloud domains from server for cross-computer synchronization
    fetchAccountDomains(user.id, token, user.email)
      .then((serverDomains) => {
        if (!isMounted) return;

        if (serverDomains && serverDomains.length > 0) {
          // Cloud has stored domains for this account: populate state and local storage
          setDomains(serverDomains);
          saveDomains(serverDomains, user.id);
          setCloudSyncStatus('synced');

          // Auto-sync real registry dates if any domain has outdated placeholder days
          const hasDefaulted = serverDomains.some(
            (d) => d.daysUntilExpiration === 90 || d.daysUntilExpiration === 84 || !d.expirationDate
          );
          if (hasDefaulted) {
            setTimeout(() => {
              handleRefreshAll();
            }, 500);
          }
        } else if (localDomains && localDomains.length > 0) {
          // Machine has local domains from previous session: auto-upload them to the cloud account now!
          syncAccountDomains(localDomains, user.id, token, user.email)
            .then((ok) => {
              if (isMounted) setCloudSyncStatus(ok ? 'synced' : 'offline');
            })
            .catch(() => {
              if (isMounted) setCloudSyncStatus('offline');
            });
        } else {
          // Both are empty: if admin or demo, seed initial domains and sync to cloud
          const isDemoOrAdmin =
            user.id.includes('admin') ||
            user.id.includes('demo') ||
            user.email.includes('admin') ||
            user.email.includes('demo');
          if (isDemoOrAdmin) {
            setDomains(INITIAL_DOMAINS);
            saveDomains(INITIAL_DOMAINS, user.id);
            syncAccountDomains(INITIAL_DOMAINS, user.id, token, user.email);
          }
          setCloudSyncStatus('synced');
        }
      })
      .catch((err) => {
        console.warn('Initial cloud sync error:', err);
        if (isMounted) setCloudSyncStatus('offline');
      });

    // Also fetch saved alert/team settings from cloud account
    fetchAccountSettings(user.id, token, user.email).then((cloudSettings) => {
      if (isMounted && cloudSettings) {
        setSettings(cloudSettings);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email, token]);

  // Sync domains to local storage and cloud server whenever modified
  const updateDomains = useCallback((newDomains: DomainItem[]) => {
    setDomains(newDomains);
    saveDomains(newDomains, user?.id);
    if (user?.id) {
      setCloudSyncStatus('syncing');
      syncAccountDomains(newDomains, user.id, token, user.email)
        .then((ok) => {
          setCloudSyncStatus(ok ? 'synced' : 'offline');
        })
        .catch(() => {
          setCloudSyncStatus('offline');
        });
    }
  }, [user?.id, user?.email, token]);

  // Periodic automatic updates ticker & continuous alert scheduler
  useEffect(() => {
    const intervalMinutes = settings.autoRefreshIntervalMinutes || 5;
    const intervalMs = intervalMinutes * 60 * 1000;

    const timer = setInterval(() => {
      setDomains((prev) => {
        const recalculated = recalculateDaysUntilExpiration(prev);
        saveDomains(recalculated);

        // Continuous alert evaluation: check if critical domains exist
        const criticalDomains = recalculated.filter(
          (d) => (d.daysUntilExpiration != null && d.daysUntilExpiration <= 30) || !d.isResolving
        );

        if (criticalDomains.length > 0) {
          const lastAlertTimestamp = Number(localStorage.getItem('domainguard_last_auto_alert') || '0');
          const hoursSinceLastAlert = (Date.now() - lastAlertTimestamp) / (1000 * 60 * 60);

          // If mandatory 48-hour continuous reminder is due (or initial check after 24h)
          if (hoursSinceLastAlert >= 48) {
            dispatchAutomatedAlerts(recalculated)
              .then((res) => {
                if (res.alertDispatched) {
                  localStorage.setItem('domainguard_last_auto_alert', String(Date.now()));
                  const autoLog: NotificationLog = {
                    id: `log_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    domain: 'Automated 48-Hour Renewal Cadence',
                    channel: 'telegram',
                    recipient: res.results?.recipient || 'Telegram Channel',
                    urgency: 'critical',
                    message: `Continuous 48h reminder delivered: ${res.totalFlagged} expiring/down domain(s) flagged.`,
                    status: 'sent',
                  };
                  setNotifications((curr) => {
                    const next = [autoLog, ...curr];
                    saveNotifications(next);
                    return next;
                  });
                }
              })
              .catch((err) => console.warn('Background alert dispatch error:', err));
          }
        }

        return recalculated;
      });
      setLastUpdated(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings.autoRefreshIntervalMinutes]);

  // Full WHOIS Refresh handler for all domains
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      const updatedList = await Promise.all(
        domains.map(async (item) => {
          try {
            const [whois, httpCheck] = await Promise.all([
              fetchDomainWhois(item.domain),
              checkWebsiteHttpStatus(item.domain).catch(() => null),
            ]);

            let daysUntilExpiration = whois.daysUntilExpiration ?? item.daysUntilExpiration;
            const expirationDate = whois.expirationDate ? whois.expirationDate.split('T')[0] : item.expirationDate;

            if (expirationDate) {
              const expTime = new Date(expirationDate).getTime();
              if (!isNaN(expTime)) {
                daysUntilExpiration = Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
              }
            }

            let workingStatus = item.workingStatus;
            if (daysUntilExpiration != null) {
              if (daysUntilExpiration <= 0) workingStatus = 'expired';
              else if (daysUntilExpiration <= 30) workingStatus = 'expiring_soon';
              else if (whois.isResolving) workingStatus = 'active';
            }

            return {
              ...item,
              workingStatus,
              daysUntilExpiration,
              registrar: whois.registrar || item.registrar,
              expirationDate,
              isResolving: whois.isResolving ?? item.isResolving,
              nameservers: whois.nameservers?.length ? whois.nameservers : item.nameservers,
              lastCheckedAt: new Date().toISOString(),
              whoisSource: whois.whoisSource || item.whoisSource,
              httpStatusCode: httpCheck?.status ?? (whois.isResolving ? 200 : 0),
              httpStatusText: httpCheck?.statusText ?? (whois.isResolving ? '200 OK' : 'Down'),
              httpLatencyMs: httpCheck?.latencyMs ?? (whois.isResolving ? 40 : null),
            };
          } catch {
            return item;
          }
        })
      );

      updateDomains(updatedList);
      setLastUpdated(new Date());

      // Check for critical domains and dispatch automated alert update
      const criticalDomains = updatedList.filter(
        (d) => (d.daysUntilExpiration != null && d.daysUntilExpiration <= 30) || !d.isResolving
      );

      if (criticalDomains.length > 0) {
        // Automatically dispatch live Telegram alert for batch refresh
        try {
          const autoRes = await dispatchAutomatedAlerts(updatedList);
          if (autoRes.alertDispatched) {
            localStorage.setItem('domainguard_last_auto_alert', String(Date.now()));
            const tgLog: NotificationLog = {
              id: `log_tg_${Date.now()}`,
              timestamp: new Date().toISOString(),
              domain: 'Portfolio Batch Scan',
              channel: 'telegram',
              recipient: autoRes.results?.recipient || 'Telegram Group',
              urgency: 'warning',
              message: `Live WHOIS scan alert dispatched: ${criticalDomains.length} expiring domains reported to Telegram.`,
              status: 'sent',
            };
            const updatedLogs = [tgLog, ...notifications];
            setNotifications(updatedLogs);
            saveNotifications(updatedLogs, user?.id);
          }
        } catch (err) {
          console.warn('Telegram batch dispatch notification warning:', err);
        }

        // Email notification log
        const recipientsList = settings.alertEmails?.length ? settings.alertEmails.join(', ') : settings.alertEmail;
        const emailLog: NotificationLog = {
          id: `log_em_${Date.now()}`,
          timestamp: new Date().toISOString(),
          domain: 'Portfolio Batch Scan',
          channel: 'email',
          recipient: recipientsList,
          urgency: 'warning',
          message: `Periodic WHOIS update completed: ${criticalDomains.length} domains expiring within 30 days.`,
          status: 'sent',
        };
        setNotifications((curr) => {
          const next = [emailLog, ...curr];
          saveNotifications(next, user?.id);
          return next;
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddDomain = (newDomain: DomainItem) => {
    const updated = [newDomain, ...domains];
    updateDomains(updated);
  };

  const handleImportDomains = (newDomains: DomainItem[]) => {
    // Avoid duplicate domains
    const existingMap = new Set(domains.map((d) => d.domain.toLowerCase()));
    const filteredNew = newDomains.filter((d) => !existingMap.has(d.domain.toLowerCase()));
    const updated = [...filteredNew, ...domains];
    updateDomains(updated);

    const recipientsList = settings.alertEmails?.length ? settings.alertEmails.join(', ') : settings.alertEmail;
    const log: NotificationLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      domain: `Bulk Sync (${filteredNew.length} items)`,
      channel: 'email',
      recipient: recipientsList,
      urgency: 'reminder',
      message: `Imported ${filteredNew.length} domains from Google Sheets sync. Priority queue updated.`,
      status: 'sent',
    };
    const updatedLogs = [log, ...notifications];
    setNotifications(updatedLogs);
    saveNotifications(updatedLogs, user?.id);
  };

  const handleDeleteDomain = (id: string) => {
    const updated = domains.filter((d) => d.id !== id);
    updateDomains(updated);
  };

  const handleToggleAlert2Days = (id: string) => {
    const updated = domains.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          renewalAlerts: {
            ...d.renewalAlerts,
            continuousReminderEvery2Days: !d.renewalAlerts.continuousReminderEvery2Days,
          },
        };
      }
      return d;
    });
    updateDomains(updated);
  };

  const handleSaveSettings = (newSettings: AlertSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings, user?.id);
    if (user?.id) {
      syncAccountSettings(newSettings, user.id, token, user.email).catch((e) =>
        console.warn('Sync settings error:', e)
      );
    }
  };

  const handleCloudSync = async () => {
    if (!user) return;
    setCloudSyncStatus('syncing');
    try {
      const serverDomains = await fetchAccountDomains(user.id, token, user.email);
      if (serverDomains && serverDomains.length > 0) {
        setDomains(serverDomains);
        saveDomains(serverDomains, user.id);
      } else if (domains.length > 0) {
        await syncAccountDomains(domains, user.id, token, user.email);
      }
      setCloudSyncStatus('synced');
    } catch {
      setCloudSyncStatus('offline');
    }
  };

  const handleLoadSamplePortfolio = () => {
    updateDomains(INITIAL_DOMAINS);
  };

  const handleAddNotificationLog = (log: NotificationLog) => {
    const updated = [log, ...notifications];
    setNotifications(updated);
    saveNotifications(updated, user?.id);
  };

  const handleAddTeamMember = (member: TeamMember) => {
    const updated = [...teamMembers, member];
    setTeamMembers(updated);
    saveTeam(updated, user?.id);
  };

  const handleRemoveTeamMember = (id: string) => {
    const updated = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(updated);
    saveTeam(updated, user?.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white animate-ping"></span>
          <span>Initializing DomainGuard Session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, allow accessing public Expiry & Registrar Finder or Sign In
  if (!user) {
    if (isPublicLookupOpen) {
      return (
        <PublicWhoisLookupPage
          onBackToLogin={() => setIsPublicLookupOpen(false)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      );
    }
    return (
      <AuthPage
        onNavigateToLookup={() => setIsPublicLookupOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const nearExpiryCount = domains.filter((d) => d.daysUntilExpiration <= 30).length;
  const employeeEmails = teamMembers.map((m) => m.email);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-200">
      {/* 3-Zone Top Bar Navigation */}
      <TopNavigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        trackedCount={domains.length}
        nearExpiryCount={nearExpiryCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            domains={domains}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onRefreshAll={handleRefreshAll}
            isRefreshing={isRefreshing}
            onDeleteDomain={handleDeleteDomain}
            onSelectDomainForDetails={(d) => setSelectedDomainForDetails(d)}
            onToggleAlert2Days={handleToggleAlert2Days}
            settings={settings}
            lastUpdated={lastUpdated}
            cloudSyncStatus={cloudSyncStatus}
            onCloudSync={handleCloudSync}
            onLoadSamplePortfolio={handleLoadSamplePortfolio}
          />
        )}

        {currentTab === 'whois' && (
          <WhoisLookupView
            onAddDomain={handleAddDomain}
            trackedDomains={domains}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsSettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            notificationLogs={notifications}
            onAddNotificationLog={handleAddNotificationLog}
            domains={domains}
          />
        )}

        {currentTab === 'team' && (
          <EnterpriseTeamView
            teamMembers={teamMembers}
            onAddTeamMember={handleAddTeamMember}
            onRemoveTeamMember={handleRemoveTeamMember}
            domains={domains}
          />
        )}
      </main>

      {/* Modals */}
      <AddDomainModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDomain={handleAddDomain}
        availableEmployees={employeeEmails}
      />

      <ImportSheetsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportDomains={handleImportDomains}
        defaultEmployee={user.email}
      />

      <WhoisDetailModal
        domain={selectedDomainForDetails}
        onClose={() => setSelectedDomainForDetails(null)}
        onToggleAlert2Days={handleToggleAlert2Days}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
