import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const STORAGE_KEY_CONFIG = 'domainguard_supabase_config';
const STORAGE_KEY_FALLBACK_USER = 'domainguard_fallback_session';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.anonKey) {
          return { url: parsed.url, anonKey: parsed.anonKey, isCustom: true };
        }
      } catch {
        // ignore
      }
    }
  }

  return {
    url: envUrl || '',
    anonKey: envKey || '',
    isCustom: false,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ url, anonKey }));
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_CONFIG);
  }
}

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
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentConfigKey = key;
    return activeClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Fallback session helper for demonstration / sandboxed environments
export interface AuthState {
  user: { email: string; id: string; role?: string } | null;
  session: Session | null;
  loading: boolean;
  isLiveSupabase: boolean;
}

export function getStoredFallbackUser(): { email: string; id: string } | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEY_FALLBACK_USER);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredFallbackUser(user: { email: string; id: string } | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_FALLBACK_USER);
  } else {
    localStorage.setItem(STORAGE_KEY_FALLBACK_USER, JSON.stringify(user));
  }
}
