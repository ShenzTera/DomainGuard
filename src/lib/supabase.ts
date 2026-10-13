import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

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

export interface AuthState {
  user: { email: string; id: string; role?: string } | null;
  session: Session | null;
  loading: boolean;
}
