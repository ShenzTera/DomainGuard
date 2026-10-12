import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getSupabaseClient,
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
} from '../lib/supabase';
import {
  clientLogin,
  clientRegister,
  clientGoogleLogin,
  clientForgotPassword,
  clientResetPassword,
  clientGetSession,
  clientLogout,
} from '../lib/clientAuthStore';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  loginWithGoogle: (email: string, name?: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetCode?: string; resetToken?: string }>;
  resetPassword: (key: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  isLiveSupabase: boolean;
  supabaseUrl: string;
  configureSupabase: (url: string, key: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'domainguard_auth_token';

function isStaticHostFallback(res: Response, contentType: string): boolean {
  if (res.status === 404 || res.status === 405 || res.status === 502) return true;
  if (contentType.includes('text/html')) return true;
  return false;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');

  // Initialize auth state from server or static fallback
  useEffect(() => {
    let mounted = true;

    async function checkAuthSession() {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url);
      if (config.url && config.anonKey) {
        setIsLiveSupabase(true);
      }

      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        let serverSessionChecked = false;
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            if (mounted && data.user) {
              setUser(data.user);
              setToken(storedToken);
              setLoading(false);
              return;
            }
            serverSessionChecked = true;
          } else if (res.status === 401) {
            // Server explicitly revoked session
            serverSessionChecked = true;
          }
        } catch {
          // Server offline or static host (Cloudflare Pages)
        }

        // If backend was not reached or static host detected, check client-side local session
        if (!serverSessionChecked) {
          const localUser = clientGetSession(storedToken);
          if (localUser && mounted) {
            setUser(localUser);
            setToken(storedToken);
            setLoading(false);
            return;
          }
        } else {
          // Server explicitly returned 401
          localStorage.removeItem(TOKEN_KEY);
          if (mounted) {
            setUser(null);
            setToken(null);
          }
        }
      }

      // Check if Supabase session is available
      const client = getSupabaseClient();
      if (client && config.url && config.anonKey) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (mounted && session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              role: session.user.role || 'owner',
            });
          }
        } catch {
          // ignore
        }
      }

      if (mounted) {
        setLoading(false);
      }
    }

    checkAuthSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    // 1. Try backend API first (works in Node.js server or Cloudflare Workers)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const contentType = res.headers.get('content-type') || '';

      // If backend exists and responds with JSON
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          // Strictly surface authentication errors (e.g. Invalid password, user not found)
          throw new Error(data.error || 'Failed to sign in. Please verify your credentials.');
        }

        if (data.token && data.user) {
          localStorage.setItem(TOKEN_KEY, data.token);
          setToken(data.token);
          setUser(data.user);
        }

        // Optional Supabase sync if credentials exist
        const client = getSupabaseClient();
        if (client && isLiveSupabase) {
          client.auth.signInWithPassword({ email: cleanEmail, password }).catch(() => {});
        }

        return {
          success: true,
          message: data.message || 'Signed in successfully.',
          user: data.user,
        };
      }

      // If response is HTML or 404, we are on static Cloudflare Pages without an active Express backend
      if (isStaticHostFallback(res, contentType)) {
        console.info('[DomainGuard] Static hosting detected. Verifying credentials in client store.');
        const fallbackRes = clientLogin(cleanEmail, password);
        setToken(fallbackRes.token);
        setUser(fallbackRes.user);
        return fallbackRes;
      }
    } catch (err: any) {
      // If error is an explicit invalid credentials error from server (401/400), NEVER swallow it
      if (
        err.message &&
        !err.message.includes('fetch') &&
        !err.message.includes('NetworkError') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }

      // Network unreachable / Cloudflare static edge fallback: strictly check client auth store
      console.info('[DomainGuard] Server unreachable. Verifying credentials with client auth store.');
      const fallbackRes = clientLogin(cleanEmail, password);
      setToken(fallbackRes.token);
      setUser(fallbackRes.user);
      return fallbackRes;
    }

    // Direct fallback
    const fallbackRes = clientLogin(cleanEmail, password);
    setToken(fallbackRes.token);
    setUser(fallbackRes.user);
    return fallbackRes;
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      throw new Error('Full name is required.');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Valid email address is required.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed.');
        }

        if (data.token && data.user) {
          localStorage.setItem(TOKEN_KEY, data.token);
          setToken(data.token);
          setUser(data.user);
        }

        // Optional Supabase sync
        const client = getSupabaseClient();
        if (client && isLiveSupabase) {
          client.auth.signUp({ email: cleanEmail, password, options: { data: { full_name: cleanName } } }).catch(() => {});
        }

        return {
          success: true,
          message: data.message || 'Account registered successfully.',
          user: data.user,
        };
      }

      if (isStaticHostFallback(res, contentType)) {
        console.info('[DomainGuard] Static hosting detected. Registering in client store.');
        const fallbackRes = clientRegister(cleanName, cleanEmail, password);
        setToken(fallbackRes.token);
        setUser(fallbackRes.user);
        return fallbackRes;
      }
    } catch (err: any) {
      if (
        err.message &&
        !err.message.includes('fetch') &&
        !err.message.includes('NetworkError') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }
      console.info('[DomainGuard] Server unreachable. Registering in client store.');
      const fallbackRes = clientRegister(cleanName, cleanEmail, password);
      setToken(fallbackRes.token);
      setUser(fallbackRes.user);
      return fallbackRes;
    }

    const fallbackRes = clientRegister(cleanName, cleanEmail, password);
    setToken(fallbackRes.token);
    setUser(fallbackRes.user);
    return fallbackRes;
  };

  const loginWithGoogle = async (
    email: string,
    name?: string
  ): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name: name || cleanEmail.split('@')[0] }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Google sign-in failed.');
        }

        if (data.token && data.user) {
          localStorage.setItem(TOKEN_KEY, data.token);
          setToken(data.token);
          setUser(data.user);
        }

        return {
          success: true,
          message: data.message || 'Signed in with Google successfully.',
          user: data.user,
        };
      }

      if (isStaticHostFallback(res, contentType)) {
        const fallbackRes = clientGoogleLogin(cleanEmail, name);
        setToken(fallbackRes.token);
        setUser(fallbackRes.user);
        return fallbackRes;
      }
    } catch {
      // Static fallback
      const fallbackRes = clientGoogleLogin(cleanEmail, name);
      setToken(fallbackRes.token);
      setUser(fallbackRes.user);
      return fallbackRes;
    }

    const fallbackRes = clientGoogleLogin(cleanEmail, name);
    setToken(fallbackRes.token);
    setUser(fallbackRes.user);
    return fallbackRes;
  };

  const forgotPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate reset request.');
        }
        return {
          success: true,
          message: data.message,
          resetCode: data.resetCode,
          resetToken: data.resetToken,
        };
      }
    } catch {
      // Fallback
    }

    const fallbackRes = clientForgotPassword(cleanEmail);
    return {
      success: true,
      message: fallbackRes.message,
      resetCode: fallbackRes.resetCode,
      resetToken: fallbackRes.resetCode,
    };
  };

  const resetPassword = async (key: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetCode: key, resetToken: key, newPassword }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to reset password.');
        }
        return {
          success: true,
          message: data.message,
        };
      }
    } catch {
      // Fallback
    }

    return clientResetPassword(key, newPassword);
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {});
    }

    const client = getSupabaseClient();
    if (client && isLiveSupabase) {
      try {
        await client.auth.signOut();
      } catch {
        // ignore
      }
    }

    clientLogout();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem('domainguard_session_user', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const configureSupabase = async (url: string, key: string) => {
    try {
      saveSupabaseConfig(url, key);
      setSupabaseUrl(url);
      setIsLiveSupabase(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        forgotPassword,
        resetPassword,
        logout,
        updateUser,
        isLiveSupabase,
        supabaseUrl,
        configureSupabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
