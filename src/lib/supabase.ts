import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import type { SupportedStorage } from '@supabase/auth-js';

// Clean up any legacy stored keys from earlier client versions
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('domainguard_supabase_config');
  } catch {
    // ignore
  }
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  // Read strictly from environment variables injected securely at build/runtime
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  return {
    url: envUrl,
    anonKey: envKey,
  };
}

/**
 * Dynamically resolves the root/parent domain (e.g. '.domain.io' for 'user.domain.io')
 * so cookies can be read and shared across all subdomains.
 * Returns undefined for localhost or IP addresses.
 */
export function getApexDomain(): string | undefined {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return undefined;
  }

  const parts = hostname.split('.');
  if (parts.length <= 1) return undefined;

  // Test candidate domains starting from fewest parts (e.g. 2 parts: .domain.io) up to all parts
  for (let numParts = 2; numParts <= parts.length; numParts++) {
    const candidate = '.' + parts.slice(-numParts).join('.');
    const testKey = '__sb_subdomain_probe__';
    try {
      document.cookie = `${testKey}=1; Domain=${candidate}; Path=/; SameSite=Lax`;
      if (document.cookie.includes(`${testKey}=1`)) {
        // Successfully verified browser accepts this parent domain
        document.cookie = `${testKey}=; Domain=${candidate}; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        return candidate;
      }
    } catch {
      // ignore probe error
    }
  }

  if (parts.length >= 2) {
    return '.' + parts.slice(-2).join('.');
  }
  return undefined;
}

function getSingleCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escapedName + '=([^;]*)'));
  return match ? match[1] : null;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  // First check if chunked cookies exist (name.0, name.1, ...)
  let chunkIndex = 0;
  let chunkedValue = '';
  while (true) {
    const chunkName = `${name}.${chunkIndex}`;
    const value = getSingleCookie(chunkName);
    if (value === null) break;
    chunkedValue += value;
    chunkIndex++;
  }
  if (chunkIndex > 0) {
    try {
      return decodeURIComponent(chunkedValue);
    } catch {
      return chunkedValue;
    }
  }

  // Not chunked, check single cookie
  const single = getSingleCookie(name);
  if (single !== null) {
    try {
      return decodeURIComponent(single);
    } catch {
      return single;
    }
  }
  return null;
}

export function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const cookieDomain = getApexDomain();
  const domainPart = cookieDomain ? `; Domain=${cookieDomain}` : '';
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const securePart = isSecure ? '; Secure' : '';
  const maxAge = 60 * 60 * 24 * 365; // 1 year persistence
  const encodedValue = encodeURIComponent(value);

  // Clear any existing chunks
  let chunkIndex = 0;
  while (chunkIndex < 20) {
    const chunkName = `${name}.${chunkIndex}`;
    if (getSingleCookie(chunkName) === null) break;
    document.cookie = `${chunkName}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}${securePart}; SameSite=Lax`;
    chunkIndex++;
  }

  const MAX_CHUNK_SIZE = 3000;
  if (encodedValue.length <= MAX_CHUNK_SIZE) {
    document.cookie = `${name}=${encodedValue}; Path=/; Max-Age=${maxAge}${domainPart}${securePart}; SameSite=Lax`;
  } else {
    // Value exceeds safe single-cookie size, chunk it
    document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}${securePart}; SameSite=Lax`;
    let offset = 0;
    let idx = 0;
    while (offset < encodedValue.length) {
      const chunk = encodedValue.substring(offset, offset + MAX_CHUNK_SIZE);
      const chunkName = `${name}.${idx}`;
      document.cookie = `${chunkName}=${chunk}; Path=/; Max-Age=${maxAge}${domainPart}${securePart}; SameSite=Lax`;
      offset += MAX_CHUNK_SIZE;
      idx++;
    }
  }
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  const cookieDomain = getApexDomain();
  const domainPart = cookieDomain ? `; Domain=${cookieDomain}` : '';
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const securePart = isSecure ? '; Secure' : '';

  document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}${securePart}; SameSite=Lax`;
  document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

  let chunkIndex = 0;
  while (chunkIndex < 20) {
    const chunkName = `${name}.${chunkIndex}`;
    if (getSingleCookie(chunkName) === null) break;
    document.cookie = `${chunkName}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}${securePart}; SameSite=Lax`;
    document.cookie = `${chunkName}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    chunkIndex++;
  }
}

export interface CrossSubdomainStorageAdapter extends SupportedStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/**
 * Storage adapter that uses root-domain cookies for cross-subdomain session persistence
 * (e.g., between 'user.domain.io' and 'domain.io') while falling back to localStorage.
 */
export const crossSubdomainStorage: CrossSubdomainStorageAdapter = {
  getItem: (key: string): string | null => {
    const cookieVal = getCookie(key);
    if (cookieVal !== null && cookieVal !== '') {
      return cookieVal;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    setCookie(key, value);
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    removeCookie(key);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

let activeClient: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url}_${config.anonKey}`;
  if (activeClient && currentConfigKey === key) {
    return activeClient;
  }

  try {
    activeClient = createClient(config.url, config.anonKey, {
      auth: {
        storage: crossSubdomainStorage,
        storageKey: 'sb-auth-token',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
    currentConfigKey = key;
    return activeClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export interface AuthState {
  user: { email: string; id: string; role?: string } | null;
  session: Session | null;
  loading: boolean;
}

