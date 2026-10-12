export type WorkingStatus = 'active' | 'expiring_soon' | 'expired' | 'available' | 'dns_issue';

export type PortfolioTag = 'Core Infrastructure' | 'Brand & Trademarks' | 'Marketing Campaigns' | 'SaaS Apps' | 'Regional';

export interface DomainItem {
  id: string;
  domain: string;
  company: string;
  workingStatus: WorkingStatus;
  registrar: string;
  registrarPortalUrl: string;
  expirationDate: string; // ISO date YYYY-MM-DD
  registrationDate?: string;
  daysUntilExpiration: number;
  isResolving: boolean;
  nameservers: string[];
  dnsIps?: string[];
  portfolio: PortfolioTag;
  assignedEmployees: string[]; // employee emails
  lastCheckedAt: string;
  renewalAlerts: {
    warn30Days: boolean;
    warn15Days: boolean;
    warn7Days: boolean;
    continuousReminderEvery2Days: boolean;
  };
  notes?: string;
  whoisSource?: string;
}

export type UserRole = 'owner' | 'admin' | 'monitor' | 'viewer';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedPortfolios: PortfolioTag[];
  receiveEmailAlerts: boolean;
  receiveTelegramAlerts: boolean;
  addedAt: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  domain: string;
  channel: 'email' | 'telegram';
  recipient: string;
  urgency: 'critical' | 'warning' | 'reminder';
  message: string;
  status: 'sent' | 'pending' | 'failed';
}

export interface AlertSettings {
  emailAlertsEnabled: boolean;
  alertEmail: string; // primary fallback
  alertEmails: string[]; // multiple recipient Gmails & corporate addresses
  emailProvider?: 'direct' | 'resend' | 'sendgrid' | 'smtp';
  emailApiKey?: string;
  emailSenderName?: string;
  emailSenderAddress?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  telegramConnected?: boolean;
  telegramUsername?: string;
  telegramBotUsername?: string;
  warn30DaysBefore: boolean;
  warn15DaysBefore: boolean;
  warn7DaysBefore: boolean;
  continuousReminderEvery2Days: boolean;
  autoRefreshIntervalMinutes: number; // e.g. 5, 15, 60
}
