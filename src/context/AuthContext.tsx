import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getSupabaseClient,
  getSupabaseConfig,
} from '../lib/supabase';
import {
  clientLogin,
  clientRegister,
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
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetCode?: string; resetToken?: string }>;
  resetPassword: (key: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
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

  // Initialize auth state: Check Supabase session first, then server/local session
  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function initAuth() {
      const config = getSupabaseConfig();
      const hasSupabaseCreds = Boolean(config.url && config.anonKey);
      const client = getSupabaseClient();

      // 1. If Supabase is configured via build env, listen to session
      if (client && hasSupabaseCreds) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (mounted && session?.user) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              name:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.email?.split('@')[0] ||
                'User',
              role: session.user.role || 'owner',
              createdAt: session.user.created_at,
            };
            setUser(authUser);
            setToken(session.access_token);
            localStorage.setItem(TOKEN_KEY, session.access_token);
            setLoading(false);
          }

          // Subscribe to Supabase auth changes
          const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            if (session?.user) {
              const authUser: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                name:
                  session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.name ||
                  session.user.email?.split('@')[0] ||
                  'User',
                role: session.user.role || 'owner',
                createdAt: session.user.created_at,
              };
              setUser(authUser);
              setToken(session.access_token);
              localStorage.setItem(TOKEN_KEY, session.access_token);
            }
          });
          authSubscription = subscription;
        } catch (sbErr) {
          console.warn('Supabase auth listener initialization:', sbErr);
        }
      }

      // 2. If no user resolved yet from Supabase, check stored token / backend
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken && mounted && !user) {
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
            serverSessionChecked = true;
          }
        } catch {
          // Server offline or static host (Cloudflare Pages)
        }

        // If backend was not reached or static host detected, check client-side local session
        if (!serverSessionChecked && mounted) {
          const localUser = clientGetSession(storedToken);
          if (localUser) {
            setUser(localUser);
            setToken(storedToken);
            setLoading(false);
            return;
          }
        }
      }

      if (mounted) {
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
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

    // 1. Direct Supabase Authentication if configured via env
    const client = getSupabaseClient();
    const config = getSupabaseConfig();
    if (client && config.url && config.anonKey) {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Invalid email or password.');
      }

      if (data.user && data.session) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            cleanEmail.split('@')[0],
          role: data.user.role || 'owner',
          createdAt: data.user.created_at,
        };
        localStorage.setItem(TOKEN_KEY, data.session.access_token);
        setToken(data.session.access_token);
        setUser(authUser);

        return {
          success: true,
          message: 'Signed in successfully.',
          user: authUser,
        };
      }
    }

    // 2. Try Backend API (Cloudflare Pages Functions or Express Server)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to sign in. Please check your credentials.');
        }

        if (data.token && data.user) {
          localStorage.setItem(TOKEN_KEY, data.token);
          setToken(data.token);
          setUser(data.user);
        }

        return {
          success: true,
          message: data.message || 'Signed in successfully.',
          user: data.user,
        };
      }

      if (isStaticHostFallback(res, contentType)) {
        const fallbackRes = clientLogin(cleanEmail, password);
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

      const fallbackRes = clientLogin(cleanEmail, password);
      setToken(fallbackRes.token);
      setUser(fallbackRes.user);
      return fallbackRes;
    }

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

    // 1. Direct Supabase Registration if configured via env
    const client = getSupabaseClient();
    const config = getSupabaseConfig();
    if (client && config.url && config.anonKey) {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            name: cleanName,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Registration failed.');
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: cleanName,
          role: 'owner',
          createdAt: data.user.created_at,
        };

        const sessionToken = data.session?.access_token || `token_sb_${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, sessionToken);
        setToken(sessionToken);
        setUser(authUser);

        return {
          success: true,
          message: data.session
            ? 'Account registered and signed in successfully.'
            : 'Account registered. Please check your email for confirmation if required.',
          user: authUser,
        };
      }
    }

    // 2. Backend API Registration
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

        return {
          success: true,
          message: data.message || 'Account registered successfully.',
          user: data.user,
        };
      }

      if (isStaticHostFallback(res, contentType)) {
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

  const forgotPassword = async (
    email: string
  ): Promise<{ success: boolean; message: string; resetCode?: string; resetToken?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('A valid email address is required.');
    }

    const client = getSupabaseClient();
    const config = getSupabaseConfig();
    if (client && config.url && config.anonKey) {
      const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });
      if (error) {
        throw new Error(error.message);
      }
      return {
        success: true,
        message: `Password reset instructions sent to ${cleanEmail}.`,
      };
    }

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
          throw new Error(data.error || 'Failed to process password reset.');
        }
        return {
          success: true,
          message: data.message || `Password reset instructions sent to ${cleanEmail}.`,
          resetCode: data.resetCode,
          resetToken: data.resetToken,
        };
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
    }

    return clientForgotPassword(cleanEmail);
  };

  const resetPassword = async (key: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (!key.trim()) {
      throw new Error('Verification code or reset token is required.');
    }
    if (!newPass || newPass.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const client = getSupabaseClient();
    const config = getSupabaseConfig();
    if (client && config.url && config.anonKey) {
      const { error } = await client.auth.updateUser({ password: newPass });
      if (error) {
        throw new Error(error.message);
      }
      return {
        success: true,
        message: 'Your account password has been updated. You can now sign in.',
      };
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetCode: key, resetToken: key, newPassword: newPass }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update password.');
        }
        return {
          success: true,
          message: data.message || 'Password updated successfully.',
        };
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
    }

    return clientResetPassword(key, newPass);
  };

  const logout = async () => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out note:', err);
      }
    }

    if (activeToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${activeToken}` },
        });
      } catch {
        // ignore
      }
    }

    clientLogout();
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('domainguard_client_session_user', JSON.stringify(updated));
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
        forgotPassword,
        resetPassword,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
