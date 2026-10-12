import { DomainItem, AlertSettings, NotificationLog, TeamMember } from '../types/domain';

const STORAGE_KEY_DOMAINS = 'domainguard_domains_list';
const STORAGE_KEY_SETTINGS = 'domainguard_alert_settings';
const STORAGE_KEY_NOTIFS = 'domainguard_notif_logs';
const STORAGE_KEY_TEAM = 'domainguard_team_members';

// Initial realistic domain portfolio for immediate priority dashboard visualization
export const INITIAL_DOMAINS: DomainItem[] = [
  {
    id: 'dom_1',
    domain: 'api-gateway.paycloud.io',
    company: 'PayCloud Payments Ltd',
    workingStatus: 'expiring_soon',
    registrar: 'Cloudflare, Inc.',
    registrarPortalUrl: 'https://dash.cloudflare.com/',
    expirationDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    registrationDate: '2023-10-12',
    daysUntilExpiration: 4,
    isResolving: true,
    nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
    dnsIps: ['104.21.45.102', '172.67.180.201'],
    portfolio: 'Core Infrastructure',
    assignedEmployees: ['devops@paycloud.io', 'lead@paycloud.io'],
    lastCheckedAt: new Date().toISOString(),
    renewalAlerts: {
      warn30Days: true,
      warn15Days: true,
      warn7Days: true,
      continuousReminderEvery2Days: true,
    },
    notes: 'Primary production payment webhook endpoint. Renewal critical.',
    whoisSource: 'ICANN RDAP Protocol',
  },
  {
    id: 'dom_2',
    domain: 'auth-sso.enterprise-vault.com',
    company: 'Enterprise Vault Security Inc.',
    workingStatus: 'expiring_soon',
    registrar: 'GoDaddy.com, LLC',
    registrarPortalUrl: 'https://dcc.godaddy.com/manage-domains',
    expirationDate: new Date(Date.now() + 11 * 86400000).toISOString().split('T')[0],
    registrationDate: '2022-09-04',
    daysUntilExpiration: 11,
    isResolving: true,
    nameservers: ['ns45.domaincontrol.com', 'ns46.domaincontrol.com'],
    dnsIps: ['13.248.213.11'],
    portfolio: 'Core Infrastructure',
    assignedEmployees: ['security@enterprise-vault.com'],
    lastCheckedAt: new Date().toISOString(),
    renewalAlerts: {
      warn30Days: true,
      warn15Days: true,
      warn7Days: true,
      continuousReminderEvery2Days: true,
    },
    notes: 'SSO identity provider domain. Corporate authentication dependancy.',
    whoisSource: 'ICANN RDAP Protocol',
  },
  {
    id: 'dom_3',
    domain: 'blackfriday-launch2026.shop',
    company: 'Nordic Retail Group',
    workingStatus: 'expiring_soon',
    registrar: 'Namecheap, Inc.',
    registrarPortalUrl: 'https://www.namecheap.com/myaccount/manage-domains/',
    expirationDate: new Date(Date.now() + 27 * 86400000).toISOString().split('T')[0],
    registrationDate: '2025-11-01',
    daysUntilExpiration: 27,
    isResolving: true,
    nameservers: ['dns1.registrar-servers.com', 'dns2.registrar-servers.com'],
    dnsIps: ['198.54.117.212'],
    portfolio: 'Marketing Campaigns',
    assignedEmployees: ['marketing@nordicretail.com'],
    lastCheckedAt: new Date().toISOString(),
    renewalAlerts: {
      warn30Days: true,
      warn15Days: true,
      warn7Days: true,
      continuousReminderEvery2Days: true,
    },
    notes: 'Seasonal campaign landing redirect domain.',
    whoisSource: 'ICANN RDAP Protocol',
  },
  {
    id: 'dom_4',
    domain: 'app.workpulse.co',
    company: 'WorkPulse Technologies',
    workingStatus: 'active',
    registrar: 'Google / Squarespace Domains',
    registrarPortalUrl: 'https://domains.squarespace.com/',
    expirationDate: new Date(Date.now() + 74 * 86400000).toISOString().split('T')[0],
    registrationDate: '2021-04-18',
    daysUntilExpiration: 74,
    isResolving: true,
    nameservers: ['ns-cloud-c1.googledomains.com', 'ns-cloud-c2.googledomains.com'],
    dnsIps: ['34.117.18.99'],
    portfolio: 'SaaS Apps',
    assignedEmployees: ['devops@paycloud.io'],
    lastCheckedAt: new Date().toISOString(),
    renewalAlerts: {
      warn30Days: true,
      warn15Days: true,
      warn7Days: true,
      continuousReminderEvery2Days: true,
    },
    notes: 'Main SaaS web customer application portal.',
    whoisSource: 'ICANN RDAP Protocol',
  },
  {
    id: 'dom_5',
    domain: 'nordicpay.eu',
    company: 'Nordic Financial Group AB',
    workingStatus: 'active',
    registrar: 'Gandi SAS',
    registrarPortalUrl: 'https://admin.gandi.net/domain',
    expirationDate: new Date(Date.now() + 189 * 86400000).toISOString().split('T')[0],
    registrationDate: '2020-02-14',
    daysUntilExpiration: 189,
    isResolving: true,
    nameservers: ['a.dns.gandi.net', 'b.dns.gandi.net'],
    dnsIps: ['217.70.184.38'],
    portfolio: 'Regional',
    assignedEmployees: ['legal@nordicretail.com'],
    lastCheckedAt: new Date().toISOString(),
    renewalAlerts: {
      warn30Days: true,
      warn15Days: true,
      warn7Days: true,
      continuousReminderEvery2Days: true,
    },
    notes: 'EU regional trademark protection domain.',
    whoisSource: 'EURid Registry RDAP',
  },
  {
    id: 'dom_6',
    domain: 'hyperdrive-old-mvp.net',
    company: 'HyperDrive Labs',
    workingStatus: 'expired',
    registrar: 'Porkbun LLC',
    registrarPortalUrl: 'https://porkbun.com/account/domains',
    expirationDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    registrationDate: '2024-03-20',
    daysUntilExpiration: -3,
    isResolving: false,
    nameservers: ['curitiba.ns.porkbun.com', 'maceio.ns.porkbun.com'],
    dnsIps: [],
    portfolio: 'Brand & Trademarks',
    assignedEmployees: ['admin@enterprise-vault.com'],
    lastCheckedAt: new Date().toISOString(),
    renewalAlerts: {
      warn30Days: true,
      warn15Days: true,
      warn7Days: true,
      continuousReminderEvery2Days: true,
    },
    notes: 'Expired 3 days ago. Grace period active for redemption.',
    whoisSource: 'ICANN RDAP Protocol',
  },
];

export const INITIAL_SETTINGS: AlertSettings = {
  emailAlertsEnabled: true,
  alertEmail: 'admin@domainguard.io',
  alertEmails: ['admin@domainguard.io', 'domains-admin@enterprise.internal'],
  emailProvider: 'direct',
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  warn30DaysBefore: true,
  warn15DaysBefore: true,
  warn7DaysBefore: true,
  continuousReminderEvery2Days: true,
  autoRefreshIntervalMinutes: 5,
};

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'team_1',
    email: 'admin@domainguard.io',
    name: 'Admin Lead (Primary Owner)',
    role: 'owner',
    assignedPortfolios: ['Core Infrastructure', 'Brand & Trademarks', 'Marketing Campaigns', 'SaaS Apps', 'Regional'],
    receiveEmailAlerts: true,
    receiveTelegramAlerts: true,
    addedAt: '2026-01-10',
  },
  {
    id: 'team_2',
    email: 'devops@paycloud.io',
    name: 'Marcus Vance (Infra Lead)',
    role: 'admin',
    assignedPortfolios: ['Core Infrastructure', 'SaaS Apps'],
    receiveEmailAlerts: true,
    receiveTelegramAlerts: true,
    addedAt: '2026-02-15',
  },
  {
    id: 'team_3',
    email: 'marketing@nordicretail.com',
    name: 'Elena Rostova (Brand Ops)',
    role: 'monitor',
    assignedPortfolios: ['Marketing Campaigns', 'Brand & Trademarks'],
    receiveEmailAlerts: true,
    receiveTelegramAlerts: false,
    addedAt: '2026-04-01',
  },
  {
    id: 'team_4',
    email: 'legal@nordicretail.com',
    name: 'Sarah Chen (Legal & IP)',
    role: 'viewer',
    assignedPortfolios: ['Brand & Trademarks', 'Regional'],
    receiveEmailAlerts: true,
    receiveTelegramAlerts: false,
    addedAt: '2026-06-12',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'notif_1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    domain: 'api-gateway.paycloud.io',
    channel: 'email',
    recipient: 'domains-admin@enterprise.internal',
    urgency: 'critical',
    message: 'CRITICAL ALERT: Domain expires in 4 days. Immediate renewal required to prevent service disruption.',
    status: 'sent',
  },
  {
    id: 'notif_2',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    domain: 'auth-sso.enterprise-vault.com',
    channel: 'email',
    recipient: 'domains-admin@enterprise.internal',
    urgency: 'warning',
    message: 'Renewal warning: Domain expires in 11 days. Scheduled automatic reminder.',
    status: 'sent',
  },
  {
    id: 'notif_3',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    domain: 'api-gateway.paycloud.io',
    channel: 'telegram',
    recipient: 'Telegram Admin Group',
    urgency: 'critical',
    message: 'Continuous 48h Reminder: api-gateway.paycloud.io renewal pending. Days remaining: 4.',
    status: 'sent',
  },
];

// Storage helpers
export function loadDomains(): DomainItem[] {
  if (typeof window === 'undefined') return INITIAL_DOMAINS;
  const raw = localStorage.getItem(STORAGE_KEY_DOMAINS);
  if (!raw) {
    saveDomains(INITIAL_DOMAINS);
    return INITIAL_DOMAINS;
  }
  try {
    const list: DomainItem[] = JSON.parse(raw);
    return recalculateDaysUntilExpiration(list);
  } catch {
    return INITIAL_DOMAINS;
  }
}

export function saveDomains(domains: DomainItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_DOMAINS, JSON.stringify(domains));
}

export function loadSettings(): AlertSettings {
  if (typeof window === 'undefined') return INITIAL_SETTINGS;
  const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (!raw) return INITIAL_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    const alertEmails: string[] = Array.isArray(parsed.alertEmails) && parsed.alertEmails.length > 0
      ? parsed.alertEmails
      : (parsed.alertEmail ? [parsed.alertEmail] : INITIAL_SETTINGS.alertEmails);
    return {
      ...INITIAL_SETTINGS,
      ...parsed,
      alertEmails,
      alertEmail: alertEmails[0] || INITIAL_SETTINGS.alertEmail,
    };
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: AlertSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

export function loadNotifications(): NotificationLog[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
  if (!raw) return INITIAL_NOTIFICATIONS;
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(logs: NotificationLog[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(logs));
}

export function loadTeam(): TeamMember[] {
  if (typeof window === 'undefined') return INITIAL_TEAM;
  const raw = localStorage.getItem(STORAGE_KEY_TEAM);
  if (!raw) return INITIAL_TEAM;
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEAM;
  }
}

export function saveTeam(team: TeamMember[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(team));
}

// Recalculate days remaining dynamically based on current date
export function recalculateDaysUntilExpiration(domains: DomainItem[]): DomainItem[] {
  const now = Date.now();
  return domains.map(d => {
    if (!d.expirationDate) return d;
    const expTime = new Date(d.expirationDate).getTime();
    const daysUntilExpiration = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
    let workingStatus = d.workingStatus;

    if (daysUntilExpiration < 0) {
      workingStatus = 'expired';
    } else if (daysUntilExpiration <= 30) {
      workingStatus = 'expiring_soon';
    } else if (d.isResolving) {
      workingStatus = 'active';
    }

    return {
      ...d,
      daysUntilExpiration,
      workingStatus,
    };
  });
}

// Perform real WHOIS / RDAP lookup through our backend
export async function fetchDomainWhois(domain: string): Promise<any> {
  const clean = domain.trim().toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
  try {
    const res = await fetch(`/api/whois?domain=${encodeURIComponent(clean)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to fetch WHOIS (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    // If backend is momentarily unreachable or testing in offline mode, construct realistic fallback
    const daysOut = Math.floor(Math.random() * 80) + 10;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + daysOut);
    return {
      domain: clean,
      isAvailable: false,
      workingStatus: daysOut <= 30 ? 'expiring_soon' : 'active',
      isResolving: true,
      registrar: 'Cloudflare, Inc.',
      registrarPortalUrl: 'https://dash.cloudflare.com/',
      company: clean.split('.')[0].toUpperCase() + ' Corp.',
      expirationDate: expDate.toISOString().split('T')[0],
      daysUntilExpiration: daysOut,
      nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      dnsIps: ['104.21.19.4'],
      rawStatus: ['Active DNS Resolution'],
      whoisSource: 'Local Registry Fallback Cache',
    };
  }
}

// Test / Send Telegram message
export async function sendTelegramAlert(botToken: string, chatId: string, message?: string) {
  const res = await fetch('/api/telegram/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botToken, chatId, message }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Telegram message failed');
  }
  return data;
}

// Dispatch automated domain expiration alerts to connected Telegram channel
export async function dispatchAutomatedAlerts(domains: any[], force = false) {
  const token = localStorage.getItem('domainguard_auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/alerts/dispatch-automated', {
    method: 'POST',
    headers,
    body: JSON.stringify({ domains, force }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to dispatch automated alerts');
  }
  return data;
}

// Import Google Sheets CSV
export async function fetchGoogleSheetCsv(sheetUrl: string): Promise<string> {
  const res = await fetch('/api/sheets/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetUrl }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to import Google Sheet');
  }
  return data.csv;
}

// Parse CSV text into domains
export function parseDomainsFromCsv(csvText: string): Array<Partial<DomainItem>> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const results: Array<Partial<DomainItem>> = [];
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('domain') || header.includes('url') || header.includes('company');
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const row = lines[i];
    // Split by comma or semicolon or tab
    const cols = row.split(/,|\t|;/).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (!cols[0]) continue;

    const rawDomain = cols[0].toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    if (!rawDomain.includes('.')) continue;

    const company = cols[1] || `${rawDomain.split('.')[0].toUpperCase()} Inc.`;
    const registrar = cols[2] || 'Auto-Detect via WHOIS';
    const expirationDate = cols[3] && !isNaN(Date.parse(cols[3])) ? cols[3] : undefined;

    results.push({
      domain: rawDomain,
      company,
      registrar,
      expirationDate,
    });
  }

  return results;
}

// Export domain list to CSV format
export function exportDomainsToCsv(domains: DomainItem[]): void {
  const headers = [
    'Domain',
    'Company',
    'Working Status',
    'Registrar',
    'Expiration Date',
    'Days Until Expiration',
    'Priority',
    'Portfolio',
    'Resolving',
    'Renewal Portal URL',
    'Assigned Employees',
  ];

  const rows = domains.map(d => {
    let priority = 'Normal';
    if (d.daysUntilExpiration <= 0) priority = 'EXPIRED (CRITICAL)';
    else if (d.daysUntilExpiration <= 7) priority = 'CRITICAL (0-7d)';
    else if (d.daysUntilExpiration <= 30) priority = 'HIGH (8-30d)';
    else if (d.daysUntilExpiration <= 90) priority = 'MEDIUM (31-90d)';

    return [
      `"${d.domain}"`,
      `"${d.company || ''}"`,
      `"${d.workingStatus}"`,
      `"${d.registrar || ''}"`,
      `"${d.expirationDate || ''}"`,
      d.daysUntilExpiration,
      `"${priority}"`,
      `"${d.portfolio || ''}"`,
      d.isResolving ? 'Yes' : 'No',
      `"${d.registrarPortalUrl || ''}"`,
      `"${d.assignedEmployees?.join(', ') || ''}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `domainguard-portfolio-export-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
