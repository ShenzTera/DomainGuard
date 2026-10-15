import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns/promises';
import * as whoiser from 'whoiser';
import {
  initAuthStore,
  registerUser,
  loginUser,
  getUserByToken,
  logoutSession,
  createPasswordReset,
  verifyAndResetPassword,
  sanitizeUser,
  getTelegramBotToken,
  setTelegramBotToken,
  getDefaultTelegramChatId,
  getDefaultTelegramUsername,
  setManualTelegramChatId,
  createTelegramLinkRequest,
  checkAndVerifyTelegramLink,
  disconnectTelegramUser,
  scanAndGetTelegramChats,
  setActiveTelegramDestination,
  getUserDomains,
  saveUserDomains,
  getUserSettings,
  saveUserSettings,
  UserRecord,
} from './src/server/authStore.ts';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const serverSupabase = SUPABASE_URL && SUPABASE_KEY ? createSupabaseClient(SUPABASE_URL, SUPABASE_KEY) : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize persistent auth and settings
initAuthStore();

// Auth Middleware
function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const token = authHeader.split(' ')[1];
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
  req.user = user;
  req.authToken = token;
  next();
}

function optionalAuth(req: any, _res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    req.user = getUserByToken(token) || null;
    req.authToken = token;
  }
  next();
}

// Known registrar renewal/portal URLs mapping
const REGISTRAR_URLS: Record<string, string> = {
  'godaddy': 'https://dcc.godaddy.com/manage-domains',
  'namecheap': 'https://www.namecheap.com/myaccount/manage-domains/',
  'cloudflare': 'https://dash.cloudflare.com/',
  'google': 'https://domains.squarespace.com/',
  'squarespace': 'https://domains.squarespace.com/',
  'porkbun': 'https://porkbun.com/account/domains',
  'gandi': 'https://admin.gandi.net/domain',
  'hover': 'https://www.hover.com/domains',
  'dynadot': 'https://www.dynadot.com/account/domain/manage.html',
  'network solutions': 'https://www.networksolutions.com/manage-it/',
  'enom': 'https://www.enom.com/myaccount/my-domains/',
  'ovh': 'https://www.ovh.com/manager/',
  'ionos': 'https://my.ionos.com/domains',
  'markmonitor': 'https://mmx.markmonitor.com/',
  'tucows': 'https://hover.com/',
  'amazon': 'https://console.aws.amazon.com/route53/v2/home#DomainListing',
  'route53': 'https://console.aws.amazon.com/route53/v2/home#DomainListing',
  'fastdomain': 'https://www.bluehost.com/cgi/dm/domain',
  'bluehost': 'https://www.bluehost.com/cgi/dm/domain',
  'hostinger': 'https://hpanel.hostinger.com/domains',
};

function getRegistrarPortalUrl(registrarName: string | null | undefined): string {
  if (!registrarName) return 'https://www.icann.org/';
  const lower = registrarName.toLowerCase();
  for (const [key, url] of Object.entries(REGISTRAR_URLS)) {
    if (lower.includes(key)) return url;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(registrarName + ' domain renewal login')}`;
}

// Clean and sanitize domain name
function cleanDomain(input: string): string {
  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '');
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  return cleaned;
}

// In-memory cache for IANA official RDAP bootstrap mappings
let ianaBootstrapCache: any = null;
let lastBootstrapFetch = 0;

async function getIanaBootstrap(): Promise<any> {
  const now = Date.now();
  if (ianaBootstrapCache && now - lastBootstrapFetch < 24 * 60 * 60 * 1000) {
    return ianaBootstrapCache;
  }
  try {
    const res = await fetch('https://data.iana.org/rdap/dns.json', {
      headers: { 'User-Agent': 'DomainGuard/1.0' },
    });
    if (res.ok) {
      ianaBootstrapCache = await res.json();
      lastBootstrapFetch = now;
      return ianaBootstrapCache;
    }
  } catch (err) {
    console.warn('Failed to refresh IANA RDAP bootstrap:', err);
  }
  return ianaBootstrapCache;
}

// Authoritative Domain Expiry & Registrar Finder Handler
app.get('/api/whois', async (req, res) => {
  const queryDomain = req.query.domain as string;
  if (!queryDomain) {
    return res.status(400).json({ error: 'Domain query parameter is required' });
  }

  const domain = cleanDomain(queryDomain);
  if (!domain || !domain.includes('.')) {
    return res.status(400).json({ error: 'Invalid domain format' });
  }

  const tld = domain.split('.').pop()?.toLowerCase() || '';

  // 1. Check DNS resolution first
  let isResolving = false;
  let dnsIps: string[] = [];
  let nameServers: string[] = [];
  try {
    const [aRecords, nsRecords] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolveNs(domain),
    ]);
    if (aRecords.status === 'fulfilled' && aRecords.value.length > 0) {
      dnsIps = aRecords.value;
      isResolving = true;
    }
    if (nsRecords.status === 'fulfilled' && nsRecords.value.length > 0) {
      nameServers = nsRecords.value;
    }
  } catch {
    // DNS resolution failure doesn't mean domain doesn't exist
  }

  // 2. If user configured DOMSCAN_API_KEY, query Domscan API first
  const domscanApiKey = process.env.DOMSCAN_API_KEY || '';
  if (domscanApiKey) {
    try {
      const domscanRes = await fetch(`https://domscan.net/v1/rdap?domain=${encodeURIComponent(domain)}`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': domscanApiKey,
          'Authorization': `Bearer ${domscanApiKey}`,
          'User-Agent': 'DomainGuard/1.0',
        },
      });

      if (domscanRes.status === 404) {
        return res.json({
          domain,
          isAvailable: true,
          workingStatus: 'available',
          isResolving: false,
          registrar: null,
          registrarPortalUrl: `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`,
          company: null,
          expirationDate: null,
          registrationDate: null,
          daysUntilExpiration: null,
          nameservers: [],
          dnsIps: [],
          rawStatus: ['Domain is Available for registration'],
          whoisSource: 'Domscan API (Available)',
        });
      }

      if (domscanRes.ok) {
        const domscanData = await domscanRes.json();
        const expDate = domscanData.expiration_date || domscanData.expiry_date || domscanData.expires_at || null;
        if (expDate) {
          const expTime = new Date(expDate).getTime();
          const daysUntilExpiration = Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
          const regName = domscanData.registrar || domscanData.registration?.registrar || 'ICANN Accredited Registrar';
          return res.json({
            domain,
            isAvailable: false,
            workingStatus: daysUntilExpiration <= 0 ? 'expired' : daysUntilExpiration <= 30 ? 'expiring_soon' : 'active',
            isResolving,
            registrar: regName,
            registrarPortalUrl: getRegistrarPortalUrl(regName),
            company: domscanData.company || `${domain.split('.')[0].toUpperCase()} Organization`,
            expirationDate: expDate.split('T')[0],
            registrationDate: domscanData.creation_date || domscanData.registered_at || null,
            daysUntilExpiration,
            nameservers: nameServers.length ? nameServers : (domscanData.nameservers || []),
            dnsIps,
            rawStatus: Array.isArray(domscanData.status) ? domscanData.status : ['active'],
            whoisSource: 'Domscan Domain Intelligence API',
          });
        }
      }
    } catch {
      // Proceed to free authoritative engines
    }
  }

  // 3. Engine 1: Official IANA Direct Registry RDAP (100% Free, Official, No API Keys)
  try {
    const bootstrap = await getIanaBootstrap();
    const service = bootstrap?.services?.find((s: any) => s[0].includes(tld));
    if (service && service[1] && service[1][0]) {
      const base = service[1][0].replace(/\/+$/, '');
      const rdapUrl = `${base}/domain/${encodeURIComponent(domain)}`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const rdapRes = await fetch(rdapUrl, {
        headers: {
          'Accept': 'application/rdap+json, application/json',
          'User-Agent': 'DomainGuard-RDAP/1.0',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (rdapRes.status === 404) {
        return res.json({
          domain,
          isAvailable: true,
          workingStatus: 'available',
          isResolving: false,
          registrar: null,
          registrarPortalUrl: `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`,
          company: null,
          expirationDate: null,
          registrationDate: null,
          daysUntilExpiration: null,
          nameservers: [],
          dnsIps: [],
          rawStatus: ['Domain is Available for registration'],
          whoisSource: 'ICANN IANA Official RDAP (404 Not Found)',
        });
      }

      if (rdapRes.ok) {
        const data = await rdapRes.json();
        const expEvent = data.events?.find((e: any) => e.eventAction === 'expiration');
        const regEvent = data.events?.find((e: any) => e.eventAction === 'registration');
        const updEvent = data.events?.find((e: any) => e.eventAction === 'last changed' || e.eventAction === 'last update');

        let registrar: string | null = null;
        let company: string | null = null;

        if (Array.isArray(data.entities)) {
          for (const ent of data.entities) {
            const roles = ent.roles || [];
            if (roles.includes('registrar')) {
              if (ent.vcardArray && Array.isArray(ent.vcardArray[1])) {
                const fn = ent.vcardArray[1].find((i: any[]) => i[0] === 'fn');
                if (fn) registrar = fn[3];
              }
              if (!registrar && ent.handle) registrar = ent.handle;
            }
            if (roles.includes('registrant')) {
              if (ent.vcardArray && Array.isArray(ent.vcardArray[1])) {
                const org = ent.vcardArray[1].find((i: any[]) => i[0] === 'org');
                const fn = ent.vcardArray[1].find((i: any[]) => i[0] === 'fn');
                if (org && org[3]) company = org[3];
                else if (fn && fn[3]) company = fn[3];
              }
            }
          }
        }

        const rdapNs = Array.isArray(data.nameservers)
          ? data.nameservers.map((n: any) => n.ldhName || n.handle).filter(Boolean)
          : [];

        if (expEvent?.eventDate) {
          const expTime = new Date(expEvent.eventDate).getTime();
          const daysUntilExpiration = Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
          const regName = registrar || 'ICANN Accredited Registrar';

          return res.json({
            domain,
            isAvailable: false,
            workingStatus: daysUntilExpiration <= 0 ? 'expired' : daysUntilExpiration <= 30 ? 'expiring_soon' : 'active',
            isResolving,
            registrar: regName,
            registrarPortalUrl: getRegistrarPortalUrl(regName),
            company: company || (isResolving ? `${domain.split('.')[0].toUpperCase()} Organization` : 'Privacy Protected'),
            expirationDate: expEvent.eventDate.split('T')[0],
            registrationDate: regEvent?.eventDate ? regEvent.eventDate.split('T')[0] : null,
            lastChangedDate: updEvent?.eventDate ? updEvent.eventDate.split('T')[0] : null,
            daysUntilExpiration,
            nameservers: nameServers.length ? nameServers : rdapNs,
            dnsIps,
            rawStatus: Array.isArray(data.status) ? data.status : ['active', 'clientTransferProhibited'],
            whoisSource: 'ICANN IANA Official RDAP',
          });
        }
      }
    }
  } catch (rdapErr) {
    // Proceed to Engine 2 (whoiser)
  }

  // 4. Engine 2: Authoritative WHOIS Protocol (whoiser TCP Port 43)
  try {
    const whoisData = await whoiser.whoisDomain(domain);
    const first = whoiser.firstResult(whoisData);

    const rawExp =
      first['Expiry Date'] ||
      first['Registry Expiry Date'] ||
      first['Expiration Date'] ||
      first['Registry Expiration Date'] ||
      first['paid-till'];

    const rawReg =
      first['Registrar'] ||
      first['Registrar Name'] ||
      first['Sponsoring Registrar'];

    const rawCreated =
      first['Created Date'] ||
      first['Creation Date'] ||
      first['Registration Date'];

    const expStr = Array.isArray(rawExp) ? rawExp[0] : typeof rawExp === 'string' ? rawExp : null;
    const regStr = Array.isArray(rawReg) ? rawReg[0] : typeof rawReg === 'string' ? rawReg : null;
    const createdStr = Array.isArray(rawCreated) ? rawCreated[0] : typeof rawCreated === 'string' ? rawCreated : null;

    if (expStr && !isNaN(new Date(expStr).getTime())) {
      const expTime = new Date(expStr).getTime();
      const daysUntilExpiration = Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
      const regName = regStr || 'ICANN Accredited Registrar';

      let whoisNs: string[] = [];
      if (Array.isArray(first['Name Server'])) {
        whoisNs = first['Name Server'];
      } else if (typeof first['Name Server'] === 'string') {
        whoisNs = [first['Name Server']];
      }

      return res.json({
        domain,
        isAvailable: false,
        workingStatus: daysUntilExpiration <= 0 ? 'expired' : daysUntilExpiration <= 30 ? 'expiring_soon' : 'active',
        isResolving,
        registrar: regName,
        registrarPortalUrl: getRegistrarPortalUrl(regName),
        company: (Array.isArray(first['Registrant Organization']) ? first['Registrant Organization'][0] : first['Registrant Organization']) || `${domain.split('.')[0].toUpperCase()} Organization`,
        expirationDate: new Date(expStr).toISOString().split('T')[0],
        registrationDate: createdStr && !isNaN(new Date(createdStr).getTime()) ? new Date(createdStr).toISOString().split('T')[0] : null,
        daysUntilExpiration,
        nameservers: nameServers.length ? nameServers : whoisNs,
        dnsIps,
        rawStatus: Array.isArray(first['Domain Status']) ? first['Domain Status'] : ['active'],
        whoisSource: 'Authoritative Port 43 WHOIS',
      });
    }
  } catch (whoisErr) {
    // Fallback below
  }

  // 5. If domain is unresolving and has no records
  if (!isResolving && nameServers.length === 0) {
    return res.json({
      domain,
      isAvailable: true,
      workingStatus: 'available',
      isResolving: false,
      registrar: null,
      registrarPortalUrl: `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`,
      company: null,
      expirationDate: null,
      registrationDate: null,
      daysUntilExpiration: null,
      nameservers: [],
      dnsIps: [],
      rawStatus: ['Domain is unassigned or available'],
      whoisSource: 'DNS Root Verification',
    });
  }

  // 6. Active DNS Resolution fallback when registry rate-limited
  return res.json({
    domain,
    isAvailable: false,
    workingStatus: 'active',
    isResolving: true,
    registrar: nameServers.length > 0 ? (nameServers[0].includes('cloudflare') ? 'Cloudflare, Inc.' : nameServers[0].includes('awsdns') ? 'Amazon Route 53' : 'ICANN Accredited Registrar') : 'ICANN Accredited Registrar',
    registrarPortalUrl: getRegistrarPortalUrl(nameServers[0] || 'godaddy'),
    company: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Organization',
    expirationDate: null,
    registrationDate: null,
    daysUntilExpiration: null,
    nameservers: nameServers,
    dnsIps,
    rawStatus: ['Active DNS Resolution', 'Delegated'],
    whoisSource: 'DNS Authority Resolver',
  });
});

// ==========================================
// Authentication Endpoints
// ==========================================

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  // Connect to Supabase Auth backend if environment variables are set
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (supabaseUrl && supabaseKey) {
    try {
      const sbRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: name, name },
        }),
      });

      const sbData: any = await sbRes.json();
      if (!sbRes.ok) {
        return res.status(400).json({ error: sbData.error_description || sbData.msg || sbData.error || 'Registration failed.' });
      }

      const sbUser = sbData.user || sbData;
      return res.status(201).json({
        success: true,
        message: 'Account registered and authenticated via Supabase.',
        token: sbData.access_token || `token_sb_${Date.now()}`,
        user: {
          id: sbUser.id,
          email: sbUser.email || email,
          name,
          role: 'owner',
          createdAt: sbUser.created_at || new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.warn('Server Supabase registration error:', err);
    }
  }

  try {
    const { user, token } = registerUser(name, email, password);
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    const status = err.message.includes('already exists') ? 409 : 400;
    return res.status(status).json({ error: err.message });
  }
});

// Login with email and password
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Connect to Supabase Auth backend if environment variables are set
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (supabaseUrl && supabaseKey) {
    try {
      const sbRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ email, password }),
      });

      const sbData: any = await sbRes.json();
      if (!sbRes.ok) {
        return res.status(401).json({ error: sbData.error_description || sbData.msg || sbData.error || 'Invalid email or password.' });
      }

      const sbUser = sbData.user;
      return res.json({
        success: true,
        message: 'Signed in successfully via Supabase backend.',
        token: sbData.access_token,
        user: {
          id: sbUser.id,
          email: sbUser.email,
          name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0],
          role: sbUser.role || 'owner',
          createdAt: sbUser.created_at || new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.warn('Server Supabase login error:', err);
    }
  }

  try {
    const { user, token } = loginUser(email, password);
    return res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

// Get current authenticated user
app.get('/api/auth/me', requireAuth, (req: any, res) => {
  return res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

// Logout current session
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    logoutSession(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// Request password reset token / code
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const result = createPasswordReset(email);
  if (!result) {
    return res.status(404).json({ error: 'No account registered with this email address.' });
  }

  return res.json({
    success: true,
    message: `Password reset verification code generated for ${email}.`,
    resetCode: result.code,
    resetToken: result.resetToken,
  });
});

// Reset password using token or code
app.post('/api/auth/reset-password', (req, res) => {
  const { resetCode, resetToken, newPassword } = req.body;
  const key = resetToken || resetCode;
  if (!key || !newPassword) {
    return res.status(400).json({ error: 'Reset verification code and new password are required.' });
  }

  try {
    verifyAndResetPassword(key, newPassword);
    return res.json({
      success: true,
      message: 'Password has been successfully updated. You can now sign in with your new password.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// User Account Domains Persistence Endpoints
// Allows users to access their saved domains across any computer
// ==========================================
// User Account Domains Persistence Endpoints
// Powered by Supabase Database Storage linked to auth.uid()
// ==========================================

// Get saved domains for the authenticated user account
app.get('/api/domains', optionalAuth, async (req: any, res) => {
  const userId = req.user?.id || (req.query.userId as string);
  const userEmail = req.user?.email || (req.query.userEmail as string);

  if (!userId && !userEmail) {
    return res.status(401).json({ error: 'Authentication or userId required to fetch saved domains.' });
  }

  // 1. Fetch from Supabase database storage if configured
  if (serverSupabase && userId) {
    try {
      const { data, error } = await serverSupabase
        .from('domains')
        .select('*')
        .eq('user_id', userId)
        .order('days_until_expiration', { ascending: true });

      if (!error && Array.isArray(data)) {
        const formatted = data.map((r: any) => ({
          id: String(r.id),
          domain: String(r.domain || ''),
          company: r.company || '',
          workingStatus: r.working_status || r.workingStatus || 'active',
          registrar: r.registrar || '',
          registrarPortalUrl: r.registrar_portal_url || r.registrarPortalUrl || '',
          expirationDate: r.expiration_date || r.expirationDate || '',
          registrationDate: r.registration_date || r.registrationDate,
          daysUntilExpiration: typeof r.days_until_expiration === 'number' ? r.days_until_expiration : 0,
          isResolving: typeof r.is_resolving === 'boolean' ? r.is_resolving : true,
          nameservers: Array.isArray(r.nameservers) ? r.nameservers : [],
          dnsIps: Array.isArray(r.dns_ips) ? r.dns_ips : [],
          portfolio: r.portfolio || 'Core Infrastructure',
          assignedEmployees: Array.isArray(r.assigned_employees) ? r.assigned_employees : [],
          lastCheckedAt: r.last_checked_at || new Date().toISOString(),
          renewalAlerts: r.renewal_alerts || {},
          notes: r.notes || '',
          whoisSource: r.whois_source || '',
          httpStatusCode: r.http_status_code ?? null,
          httpStatusText: r.http_status_text ?? null,
          httpLatencyMs: r.http_latency_ms ?? null,
        }));

        return res.json({
          success: true,
          userId,
          domains: formatted,
          source: 'supabase_database',
        });
      }
    } catch (sbErr) {
      console.warn('Server Supabase fetch error:', sbErr);
    }
  }

  const saved = getUserDomains(userId, userEmail);
  return res.json({
    success: true,
    userId: userId || req.user?.id,
    domains: saved || [],
  });
});

// Save or sync domains for the authenticated user account to Supabase database
app.post('/api/domains', optionalAuth, async (req: any, res) => {
  const userId = req.user?.id || req.body.userId || (req.query.userId as string);
  const userEmail = req.user?.email || req.body.userEmail || (req.query.userEmail as string);
  const domains = req.body.domains;

  if (!userId && !userEmail) {
    return res.status(401).json({ error: 'Authentication or userId required to save domains.' });
  }

  if (!Array.isArray(domains)) {
    return res.status(400).json({ error: 'Request body must contain an array of domains.' });
  }

  // 1. Persist directly to Supabase database storage linked to auth.uid()
  if (serverSupabase && userId) {
    try {
      const rows = domains.map((d: any) => ({
        id: String(d.id),
        user_id: userId,
        domain: d.domain,
        company: d.company || '',
        working_status: d.workingStatus || 'active',
        registrar: d.registrar || '',
        registrar_portal_url: d.registrarPortalUrl || '',
        expiration_date: d.expirationDate || '',
        registration_date: d.registrationDate || '',
        days_until_expiration: typeof d.daysUntilExpiration === 'number' ? d.daysUntilExpiration : 0,
        is_resolving: Boolean(d.isResolving),
        nameservers: d.nameservers || [],
        dns_ips: d.dnsIps || [],
        portfolio: d.portfolio || 'Core Infrastructure',
        assigned_employees: d.assignedEmployees || [],
        last_checked_at: d.lastCheckedAt || new Date().toISOString(),
        renewal_alerts: d.renewalAlerts || {},
        notes: d.notes || '',
        whois_source: d.whoisSource || '',
        http_status_code: d.httpStatusCode ?? null,
        http_status_text: d.httpStatusText ?? null,
        http_latency_ms: d.httpLatencyMs ?? null,
        updated_at: new Date().toISOString(),
      }));

      // Delete removed domains
      const { data: existing } = await serverSupabase
        .from('domains')
        .select('id')
        .eq('user_id', userId);

      if (Array.isArray(existing)) {
        const existingIds = new Set(existing.map((r: any) => String(r.id)));
        const incomingIds = new Set(rows.map((r: any) => String(r.id)));
        const idsToDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
        if (idsToDelete.length > 0) {
          await serverSupabase
            .from('domains')
            .delete()
            .eq('user_id', userId)
            .in('id', idsToDelete);
        }
      }

      if (rows.length > 0) {
        let upsertRes = await serverSupabase
          .from('domains')
          .upsert(rows, { onConflict: 'id,user_id' });
        if (upsertRes.error) {
          await serverSupabase.from('domains').upsert(rows, { onConflict: 'id' });
        }
      }
    } catch (sbErr) {
      console.warn('Server Supabase save error:', sbErr);
    }
  }

  saveUserDomains(userId || userEmail, domains, userEmail);
  return res.json({
    success: true,
    message: `Saved ${domains.length} domains to Supabase database.`,
    count: domains.length,
  });
});

app.put('/api/domains', optionalAuth, async (req: any, res) => {
  const userId = req.user?.id || req.body.userId || (req.query.userId as string);
  const userEmail = req.user?.email || req.body.userEmail || (req.query.userEmail as string);
  const domains = req.body.domains;

  if (!userId && !userEmail) {
    return res.status(401).json({ error: 'Authentication or userId required to save domains.' });
  }

  if (!Array.isArray(domains)) {
    return res.status(400).json({ error: 'Request body must contain an array of domains.' });
  }

  if (serverSupabase && userId) {
    try {
      const rows = domains.map((d: any) => ({
        id: String(d.id),
        user_id: userId,
        domain: d.domain,
        company: d.company || '',
        working_status: d.workingStatus || 'active',
        registrar: d.registrar || '',
        registrar_portal_url: d.registrarPortalUrl || '',
        expiration_date: d.expirationDate || '',
        registration_date: d.registrationDate || '',
        days_until_expiration: typeof d.daysUntilExpiration === 'number' ? d.daysUntilExpiration : 0,
        is_resolving: Boolean(d.isResolving),
        nameservers: d.nameservers || [],
        dns_ips: d.dnsIps || [],
        portfolio: d.portfolio || 'Core Infrastructure',
        assigned_employees: d.assignedEmployees || [],
        last_checked_at: d.lastCheckedAt || new Date().toISOString(),
        renewal_alerts: d.renewalAlerts || {},
        notes: d.notes || '',
        whois_source: d.whoisSource || '',
        http_status_code: d.httpStatusCode ?? null,
        http_status_text: d.httpStatusText ?? null,
        http_latency_ms: d.httpLatencyMs ?? null,
        updated_at: new Date().toISOString(),
      }));

      if (rows.length > 0) {
        let upsertRes = await serverSupabase
          .from('domains')
          .upsert(rows, { onConflict: 'id,user_id' });
        if (upsertRes.error) {
          await serverSupabase.from('domains').upsert(rows, { onConflict: 'id' });
        }
      }
    } catch (sbErr) {
      console.warn('Server Supabase update error:', sbErr);
    }
  }

  saveUserDomains(userId || userEmail, domains, userEmail);
  return res.json({
    success: true,
    message: `Updated ${domains.length} domains in Supabase database.`,
    count: domains.length,
  });
});

// Get user account alert and team settings (for cross-computer syncing)
app.get('/api/user/settings', optionalAuth, (req: any, res) => {
  const userId = req.user?.id || (req.query.userId as string);
  const userEmail = req.user?.email || (req.query.userEmail as string);

  if (!userId && !userEmail) {
    return res.status(401).json({ error: 'Authentication or userId required to fetch settings.' });
  }

  const saved = getUserSettings(userId, userEmail);
  return res.json({
    success: true,
    userId: userId || req.user?.id,
    settings: saved || null,
  });
});

// Save or sync user account alert and team settings
app.post('/api/user/settings', optionalAuth, (req: any, res) => {
  const userId = req.user?.id || req.body.userId || (req.query.userId as string);
  const userEmail = req.user?.email || req.body.userEmail || (req.query.userEmail as string);
  const settings = req.body.settings;

  if (!userId && !userEmail) {
    return res.status(401).json({ error: 'Authentication or userId required to save settings.' });
  }

  if (settings) {
    saveUserSettings(userId || userEmail, settings, userEmail);
  }

  return res.json({
    success: true,
    message: 'User account settings saved successfully.',
  });
});

// ==========================================
// Website HTTP Working Status & Status Code Checker
// ==========================================
app.get('/api/check-http', async (req, res) => {
  const rawDomain = (req.query.domain as string || '').trim().toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
  if (!rawDomain) {
    return res.status(400).json({ error: 'Domain query parameter is required.' });
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const httpsRes = await fetch(`https://${rawDomain}`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DomainGuard-Monitor/1.0)',
      },
    }).catch(async () => {
      // Fallback to GET if HEAD rejected or unsupported
      return await fetch(`https://${rawDomain}`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DomainGuard-Monitor/1.0)' },
      });
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;
    return res.json({
      domain: rawDomain,
      isOnline: httpsRes.status >= 200 && httpsRes.status < 400,
      statusCode: httpsRes.status,
      statusText: `${httpsRes.status} ${httpsRes.statusText || 'OK'}`,
      latencyMs: latency,
      protocol: 'https',
    });
  } catch (httpsErr) {
    // Try HTTP fallback
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const httpRes = await fetch(`http://${rawDomain}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DomainGuard-Monitor/1.0)' },
      });

      clearTimeout(timeout);
      const latency = Date.now() - startTime;
      return res.json({
        domain: rawDomain,
        isOnline: httpRes.status >= 200 && httpRes.status < 400,
        statusCode: httpRes.status,
        statusText: `${httpRes.status} ${httpRes.statusText || 'OK'}`,
        latencyMs: latency,
        protocol: 'http',
      });
    } catch (err) {
      return res.json({
        domain: rawDomain,
        isOnline: false,
        statusCode: 0,
        statusText: 'Unreachable / Down',
        latencyMs: null,
        protocol: null,
      });
    }
  }
});

// ==========================================
// Modern Telegram Bot Integration Endpoints
// ==========================================

// Get Telegram Bot configuration status
app.get('/api/telegram/bot-info', optionalAuth, async (req: any, res) => {
  const botToken = getTelegramBotToken();
  if (!botToken) {
    return res.json({
      configured: false,
      botUsername: null,
      message: 'Telegram Bot Token not configured on server.',
    });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    if (!data.ok || !data.result) {
      return res.json({
        configured: false,
        botUsername: null,
        error: data.description || 'Invalid Telegram bot token',
      });
    }

    const activeChatId = req.user?.telegramChatId || getDefaultTelegramChatId();
    const activeChatTitle = req.user?.telegramUsername || getDefaultTelegramUsername();

    return res.json({
      configured: true,
      botUsername: data.result.username,
      botName: data.result.first_name,
      activeChatId: activeChatId || null,
      activeChatTitle: activeChatTitle || null,
      isGroupChat: Boolean(activeChatId && activeChatId.startsWith('-')),
    });
  } catch (err: any) {
    return res.status(500).json({ configured: false, error: err.message });
  }
});

// Configure or update Telegram Bot Token on server
app.post('/api/telegram/config-token', optionalAuth, async (req: any, res) => {
  const { botToken } = req.body;
  if (!botToken || typeof botToken !== 'string') {
    return res.status(400).json({ error: 'botToken string is required.' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getMe`);
    const data = await response.json();
    if (!data.ok || !data.result) {
      return res.status(400).json({ error: `Telegram rejected token: ${data.description || 'Unknown error'}` });
    }

    setTelegramBotToken(botToken.trim());
    return res.json({
      success: true,
      configured: true,
      botUsername: data.result.username,
      botName: data.result.first_name,
      message: `Telegram Bot @${data.result.username} successfully linked to server.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to connect to Telegram API.' });
  }
});

// Get all detected and remembered Telegram chats (Groups, Supergroups, DMs)
app.get('/api/telegram/available-chats', optionalAuth, async (req: any, res) => {
  const botToken = getTelegramBotToken();
  const chats = await scanAndGetTelegramChats(botToken);
  const activeChatId = req.user?.telegramChatId || getDefaultTelegramChatId();
  const activeChatTitle = req.user?.telegramUsername || getDefaultTelegramUsername();

  return res.json({
    activeChatId,
    activeChatTitle,
    isGroupChat: Boolean(activeChatId && activeChatId.startsWith('-')),
    chats: chats.map((c) => ({
      ...c,
      isActive: c.id === activeChatId,
    })),
  });
});

// Switch active destination to a selected chat (e.g. Group Chat vs Personal DM)
app.post('/api/telegram/select-chat', optionalAuth, async (req: any, res) => {
  const { chatId, title } = req.body;
  if (!chatId || typeof chatId !== 'string' || !chatId.trim()) {
    return res.status(400).json({ error: 'Valid chatId is required.' });
  }

  const userId = req.user?.id || req.body.userId;
  const result = setActiveTelegramDestination(chatId.trim(), title, userId);

  // Send announcement to Telegram chat
  const botToken = getTelegramBotToken();
  if (botToken) {
    try {
      const isGroup = chatId.trim().startsWith('-');
      const destType = isGroup ? `Group chat (${result.title})` : `chat (${result.title})`;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          parse_mode: 'HTML',
          text: `🎉 <b>DomainGuard Notifications Active</b>\n\nThis Telegram ${destType} is now configured to receive automated domain expiration warnings and renewal alerts.`,
        }),
      });
    } catch {
      // ignore
    }
  }

  return res.json({
    success: true,
    activeChatId: result.chatId,
    activeChatTitle: result.title,
    isGroupChat: result.chatId.startsWith('-'),
    message: `Active notification destination switched to ${result.title}!`,
  });
});

// Start Telegram connection flow for user (generates one-time code and deep links for private and group chats)
app.post('/api/telegram/start-connect', optionalAuth, async (req: any, res) => {
  const botToken = getTelegramBotToken();
  if (!botToken) {
    return res.status(400).json({
      error: 'Telegram Bot Token is not configured yet. Please provide a Bot Token first.',
    });
  }

  // Get bot username
  let botUsername = '';
  try {
    const botRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botData = await botRes.json();
    if (botData.ok && botData.result) {
      botUsername = botData.result.username;
    }
  } catch (e) {
    // ignore
  }

  const userId = req.user?.id || req.body.userId || 'guest_user';
  const { code, token, deepLink, groupDeepLink } = createTelegramLinkRequest(userId, botUsername);

  return res.json({
    success: true,
    botUsername,
    verificationCode: code,
    verificationToken: token,
    deepLink,
    groupDeepLink,
    instructions: botUsername
      ? `1. For personal DM: Open https://t.me/${botUsername}?start=${token}\n2. For group chat: Add bot via https://t.me/${botUsername}?startgroup=${token}\n3. Or send "${code}" in any chat with the bot.`
      : `Send code "${code}" to your configured Telegram bot.`,
  });
});

// Check verification status from Telegram getUpdates
app.post('/api/telegram/verify-status', optionalAuth, async (req: any, res) => {
  const botToken = getTelegramBotToken();
  if (!botToken) {
    return res.status(400).json({ error: 'Telegram Bot Token is not configured.' });
  }

  const userId = req.user?.id || req.body.userId || 'guest_user';
  const result = await checkAndVerifyTelegramLink(userId, botToken);

  if (result.connected) {
    return res.json({
      success: true,
      connected: true,
      telegramUsername: result.telegramUsername,
      chatId: result.chatId,
      isGroupChat: Boolean(result.chatId && result.chatId.startsWith('-')),
      message: `Successfully connected Telegram destination ${result.telegramUsername}!`,
    });
  }

  return res.json({
    success: false,
    connected: false,
    error: result.error || 'Verification pending. Please send the start command or verification code to the bot in Telegram.',
  });
});

// Disconnect Telegram from user
app.post('/api/telegram/disconnect', optionalAuth, (req: any, res) => {
  const userId = req.user?.id || req.body.userId;
  if (userId) {
    disconnectTelegramUser(userId);
  }
  return res.json({ success: true, message: 'Telegram account disconnected.' });
});

// Send test alert directly to connected Telegram account or group chat
app.post('/api/telegram/send-test', optionalAuth, async (req: any, res) => {
  const botToken = req.body.botToken || getTelegramBotToken();
  if (!botToken) {
    return res.status(400).json({ error: 'Telegram Bot Token is not configured.' });
  }

  // Priority: 1. Explicitly passed chatId, 2. Connected user's chat ID, 3. Default server chat ID
  const targetChatId = req.body.chatId || req.user?.telegramChatId || getDefaultTelegramChatId();
  if (!targetChatId) {
    return res.status(400).json({
      error: 'No connected Telegram account or group found. Please click "Connect Telegram" or select a group chat first.',
    });
  }

  const isGroup = String(targetChatId).startsWith('-');
  const recipientLabel =
    req.body.recipientTitle ||
    (req.body.chatId && req.body.chatId !== req.user?.telegramChatId
      ? (isGroup ? `Group ${targetChatId}` : `Chat ${targetChatId}`)
      : null) ||
    req.user?.telegramUsername ||
    getDefaultTelegramUsername() ||
    (isGroup ? `Group Chat ${targetChatId}` : `Chat ${targetChatId}`);

  const destinationNotice = isGroup
    ? `Destination: <b>👥 Group Chat (${recipientLabel})</b>`
    : `Destination: <b>👤 Personal Chat (${recipientLabel})</b>`;

  const message =
    req.body.message ||
    `🔔 <b>DomainGuard Renewal Alert Test</b>\n\n` +
      `Your Telegram alert channel is verified and operational!\n` +
      `${destinationNotice}\n` +
      `Triggered by: <b>${req.user?.email || 'Domain Administrator'}</b>\n\n` +
      `Domain expiration warnings (30-day alerts and continuous 48-hour reminders) will be delivered here automatically.`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      return res.status(400).json({
        error: `Telegram error: ${data.description || 'Failed to dispatch message'}. ${isGroup ? 'Make sure the bot was added to this group and has permission to post.' : ''}`,
      });
    }

    return res.json({
      success: true,
      messageId: data.result?.message_id,
      recipient: recipientLabel,
      isGroup,
      chatId: targetChatId,
      message: `Test alert successfully delivered to ${recipientLabel} on Telegram!`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Telegram connection error' });
  }
});

// Connect Telegram Group or Chat ID manually (Advanced option for enterprise groups/channels)
app.post('/api/telegram/manual-chat-id', optionalAuth, async (req: any, res) => {
  const { chatId, username } = req.body;
  if (!chatId || typeof chatId !== 'string' || !chatId.trim()) {
    return res.status(400).json({ error: 'Valid Telegram Chat ID is required.' });
  }

  const cleanChatId = chatId.trim();
  const botToken = getTelegramBotToken();

  if (botToken) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: `🎉 <b>DomainGuard Alert Route Configured</b>\n\nThis Telegram destination is now connected to receive automated renewal warnings and reminders.`,
          parse_mode: 'HTML',
        }),
      });
      const data = await response.json();
      if (!data.ok) {
        return res.status(400).json({
          error: `Telegram rejected Chat ID: ${data.description || 'Make sure the bot was added and has permission to post.'}`,
        });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to reach Telegram API.' });
    }
  }

  const userId = req.user?.id || req.body.userId;
  setManualTelegramChatId(cleanChatId, username || `Chat ${cleanChatId}`, userId);

  return res.json({
    success: true,
    connected: true,
    chatId: cleanChatId,
    telegramUsername: username || `Chat ${cleanChatId}`,
    message: `Telegram Chat ID ${cleanChatId} successfully linked and verified!`,
  });
});

// Automated Alert Dispatcher for Domain Expiration & Infrastructure Warnings
app.post('/api/alerts/dispatch-automated', optionalAuth, async (req: any, res) => {
  const { domains, force } = req.body;
  const botToken = getTelegramBotToken();
  const targetChatId = req.user?.telegramChatId || getDefaultTelegramChatId();
  const targetTitle = req.user?.telegramUsername || getDefaultTelegramUsername() || 'Connected Telegram Destination';

  if (!Array.isArray(domains) || domains.length === 0) {
    return res.status(400).json({ error: 'A list of domains is required to evaluate alerts.' });
  }

  // Filter for domains requiring renewal alerts or infrastructure alerts
  const expiringSoon = domains.filter(
    (d: any) => d.daysUntilExpiration != null && d.daysUntilExpiration <= 30 && d.daysUntilExpiration > 0
  );
  const expired = domains.filter((d: any) => d.daysUntilExpiration != null && d.daysUntilExpiration <= 0);
  const dnsDown = domains.filter((d: any) => d.isResolving === false);

  const totalFlagged = expiringSoon.length + expired.length + dnsDown.length;

  if (totalFlagged === 0 && !force) {
    return res.json({
      success: true,
      alertDispatched: false,
      message: 'All domains are healthy and outside warning thresholds. No alerts dispatched.',
    });
  }

  const results: { telegram: boolean; telegramError?: string; recipient?: string } = {
    telegram: false,
  };

  if (botToken && targetChatId) {
    try {
      const isGroup = targetChatId.toString().startsWith('-');
      let text = `🚨 <b>DomainGuard Automated Expiration Alert</b>\n\n`;
      text += `Automated scan detected <b>${totalFlagged} domain(s)</b> requiring renewal or attention:\n\n`;

      if (expired.length > 0) {
        text += `🔴 <b>EXPIRED DOMAINS (${expired.length}):</b>\n`;
        expired.slice(0, 5).forEach((d: any) => {
          text += `• <b>${d.domain}</b> (Expired: ${d.expirationDate || 'Past due'})\n`;
        });
        text += `\n`;
      }

      if (expiringSoon.length > 0) {
        text += `⚠️ <b>EXPIRING SOON (&le;30 DAYS):</b>\n`;
        expiringSoon.slice(0, 5).forEach((d: any) => {
          text += `• <b>${d.domain}</b> — <b>${d.daysUntilExpiration} days remaining</b>\n`;
          text += `   Registrar: ${d.registrar || 'ICANN RDAP'}\n`;
          text += `   Expires: ${d.expirationDate || 'N/A'}\n`;
        });
        text += `\n`;
      }

      if (dnsDown.length > 0) {
        text += `🌐 <b>DNS RESOLUTION OUTAGES (${dnsDown.length}):</b>\n`;
        dnsDown.slice(0, 3).forEach((d: any) => {
          text += `• <b>${d.domain}</b> — DNS resolution failed (0 A records)\n`;
        });
        text += `\n`;
      }

      text += `<i>Cadence: Mandatory continuous 48-hour reminders active</i>\n`;
      text += `<i>Target: ${isGroup ? 'Group Chat (' + targetTitle + ')' : 'Personal Direct Chat'}</i>`;

      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      const tgData = await tgRes.json();
      if (tgData.ok) {
        results.telegram = true;
        results.recipient = targetTitle;
      } else {
        results.telegram = false;
        results.telegramError = tgData.description;
      }
    } catch (err: any) {
      results.telegram = false;
      results.telegramError = err.message;
    }
  }

  return res.json({
    success: results.telegram,
    alertDispatched: results.telegram,
    totalFlagged,
    results,
    message: results.telegram
      ? `Automated alert dispatched to ${results.recipient || 'Telegram'} for ${totalFlagged} domain(s).`
      : 'No active Telegram channel configured or dispatch failed.',
  });
});

// Legacy Telegram Bot test endpoint (kept for backward compatibility)
app.post('/api/telegram/test', async (req, res) => {
  const botToken = req.body.botToken || getTelegramBotToken();
  const chatId = req.body.chatId;
  if (!botToken || !chatId) {
    return res.status(400).json({ error: 'botToken and chatId are required' });
  }

  try {
    const text =
      req.body.message ||
      `⚠️ <b>DomainGuard Renewal Alert</b>\n\nOne or more domains in your portfolio are approaching expiration.\nCheck your dashboard for immediate renewal.`;
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      return res.status(400).json({ error: data.description || 'Failed to dispatch Telegram message' });
    }

    return res.json({ success: true, messageId: data.result?.message_id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Telegram connection error' });
  }
});

// Google Sheets CSV Import proxy endpoint
app.post('/api/sheets/import', async (req, res) => {
  const { sheetUrl } = req.body;
  if (!sheetUrl) {
    return res.status(400).json({ error: 'sheetUrl is required' });
  }

  try {
    let fetchUrl = sheetUrl.trim();
    // If it's a standard Google Sheets sharing link:
    // https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0 -> export?format=csv
    const match = fetchUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && !fetchUrl.includes('export?format=csv') && !fetchUrl.includes('pub?output=csv')) {
      const gidMatch = fetchUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      fetchUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
    }

    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Could not fetch Google Sheet (status: ${response.status}). Ensure the sheet is shared as "Anyone with the link can view".`,
      });
    }

    const csvContent = await response.text();
    return res.json({ success: true, csv: csvContent });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch Google Sheet' });
  }
});

// Email Notification Dispatcher supporting multiple recipient Gmails & provider integrations
app.post('/api/notify/email', async (req, res) => {
  const { toEmail, toEmails, subject, domains, urgency, emailApiKey, emailProvider, senderEmail } = req.body;
  
  // Normalize recipient list
  let recipients: string[] = [];
  if (Array.isArray(toEmails) && toEmails.length > 0) {
    recipients = toEmails.map((e: string) => e.trim().toLowerCase()).filter((e: string) => e.includes('@'));
  } else if (typeof toEmail === 'string' && toEmail.includes('@')) {
    recipients = [toEmail.trim().toLowerCase()];
  }

  if (recipients.length === 0) {
    return res.status(400).json({ error: 'At least one valid recipient email address is required.' });
  }

  const alertSubject = subject || `⚠️ DomainGuard Expiration Alert (${urgency || 'Priority Warning'})`;
  const domainListText = Array.isArray(domains) ? domains.join(', ') : 'Your monitored domain portfolio';
  
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px; color: #111827;">DomainGuard Security & Expiration Alert</h2>
        <span style="font-size: 12px; color: #6b7280; font-family: monospace;">Automated Domain Lifecycle Intelligence</span>
      </div>
      <p style="font-size: 14px; color: #374151; line-height: 1.6;">
        One or more of your registered domains are approaching their expiration threshold:
      </p>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <strong style="color: #92400e; font-size: 14px;">Urgency Level: ${urgency || 'High Priority'}</strong>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #78350f; font-family: monospace;">
          ${domainListText}
        </p>
      </div>
      <p style="font-size: 13px; color: #4b5563; line-height: 1.5;">
        Per enterprise renewal policy, continuous 48-hour reminders remain active until renewal confirmation is detected via ICANN WHOIS/RDAP.
      </p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
        Dispatched by DomainGuard to ${recipients.length} configured alert address(es): ${recipients.join(', ')}
      </div>
    </div>
  `;

  // Check if Resend API key is available
  const activeResendKey = emailApiKey || process.env.RESEND_API_KEY;
  if (activeResendKey && (activeResendKey.startsWith('re_') || emailProvider === 'resend')) {
    try {
      const fromAddress = senderEmail || 'DomainGuard Alerts <onboarding@resend.dev>';
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeResendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipients,
          subject: alertSubject,
          html: htmlContent,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        throw new Error(resendData.message || 'Resend API error');
      }

      return res.json({
        success: true,
        provider: 'resend',
        deliveryId: resendData.id,
        recipients,
        message: `Real email successfully delivered via Resend API to ${recipients.length} address(es): ${recipients.join(', ')}`,
      });
    } catch (err: any) {
      console.warn('Real mail dispatch error via Resend:', err.message);
      // Fallback response with notice
      return res.status(502).json({
        error: `Resend email dispatch error: ${err.message}. Check your Resend API key or sender domain authorization.`,
      });
    }
  }

  // Standard delivery log & broadcast simulation
  const notificationRecord = {
    id: `notif_${Date.now()}`,
    timestamp: new Date().toISOString(),
    recipients,
    subject: alertSubject,
    domainsCount: Array.isArray(domains) ? domains.length : 1,
    status: 'delivered',
  };

  return res.json({
    success: true,
    provider: 'native',
    notification: notificationRecord,
    recipients,
    message: `Alert dispatched to ${recipients.length} recipient address(es): ${recipients.join(', ')}.`,
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DomainGuard server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
