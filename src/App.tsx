import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useDarkMode } from './hooks/useDarkMode';
import { AuthPage } from './components/AuthPage';
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
} from './lib/domainService';

function MainApplication() {
  const { user, loading } = useAuth();
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

  // Load initial data
  useEffect(() => {
    const loadedDomains = loadDomains();
    setDomains(loadedDomains);
    setSettings(loadSettings());
    setNotifications(loadNotifications());
    setTeamMembers(loadTeam());
  }, []);

  // Sync domains to storage whenever modified
  const updateDomains = useCallback((newDomains: DomainItem[]) => {
    setDomains(newDomains);
    saveDomains(newDomains);
  }, []);

  // Periodic automatic updates ticker
  useEffect(() => {
    const intervalMinutes = settings.autoRefreshIntervalMinutes || 5;
    const intervalMs = intervalMinutes * 60 * 1000;

    const timer = setInterval(() => {
      setDomains((prev) => {
        const recalculated = recalculateDaysUntilExpiration(prev);
        saveDomains(recalculated);
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
            const whois = await fetchDomainWhois(item.domain);
            const daysUntilExpiration = whois.daysUntilExpiration ?? item.daysUntilExpiration;
            let workingStatus = item.workingStatus;

            if (daysUntilExpiration <= 0) workingStatus = 'expired';
            else if (daysUntilExpiration <= 30) workingStatus = 'expiring_soon';
            else if (whois.isResolving) workingStatus = 'active';

            return {
              ...item,
              workingStatus,
              daysUntilExpiration,
              registrar: whois.registrar || item.registrar,
              expirationDate: whois.expirationDate ? whois.expirationDate.split('T')[0] : item.expirationDate,
              isResolving: whois.isResolving ?? item.isResolving,
              nameservers: whois.nameservers?.length ? whois.nameservers : item.nameservers,
              lastCheckedAt: new Date().toISOString(),
            };
          } catch {
            return item;
          }
        })
      );

      updateDomains(updatedList);
      setLastUpdated(new Date());

      // Log notification if any critical domains found
      const criticalCount = updatedList.filter((d) => d.daysUntilExpiration <= 30).length;
      if (criticalCount > 0) {
        const recipientsList = settings.alertEmails?.length ? settings.alertEmails.join(', ') : settings.alertEmail;
        const newLog: NotificationLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          domain: 'Portfolio Batch Scan',
          channel: 'email',
          recipient: recipientsList,
          urgency: 'warning',
          message: `Periodic WHOIS update completed: ${criticalCount} domains expiring within 30 days.`,
          status: 'sent',
        };
        const updatedLogs = [newLog, ...notifications];
        setNotifications(updatedLogs);
        saveNotifications(updatedLogs);
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
    saveNotifications(updatedLogs);
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
    saveSettings(newSettings);
  };

  const handleAddNotificationLog = (log: NotificationLog) => {
    const updated = [log, ...notifications];
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleAddTeamMember = (member: TeamMember) => {
    const updated = [...teamMembers, member];
    setTeamMembers(updated);
    saveTeam(updated);
  };

  const handleRemoveTeamMember = (id: string) => {
    const updated = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(updated);
    saveTeam(updated);
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

  // If not authenticated, show clean email-only login page
  if (!user) {
    return <AuthPage isDark={isDark} onToggleTheme={toggleTheme} />;
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
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
