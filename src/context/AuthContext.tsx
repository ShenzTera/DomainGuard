import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getSupabaseClient,
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
} from '../lib/supabase';

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
  isLiveSupabase: boolean;
  supabaseUrl: string;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  loginWithGoogle: (email: string, name?: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetCode?: string; resetToken?: string }>;
  resetPassword: (key: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  configureSupabase: (url: string, anonKey: string) => Promise<{ success: boolean; error?: string }>;
  resetSupabaseConfig: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'domainguard_auth_token';

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

  // Initialize auth state from server
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
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            if (mounted && data.user) {
              setUser(data.user);
              setToken(storedToken);
              setLoading(false);
              return;
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem(TOKEN_KEY);
            if (mounted) {
              setToken(null);
              setUser(null);
            }
          }
        } catch (err) {
          console.warn('Auth check error:', err);
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
        } catch (e) {
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

    // 1. Authenticate with backend API
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { error: `Server error (${res.status})` };
    }

    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in.');
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
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { error: `Server error (${res.status})` };
    }

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
  };

  const loginWithGoogle = async (
    email: string,
    name?: string
  ): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, name: name || cleanEmail.split('@')[0] }),
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { error: `Server error (${res.status})` };
    }

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
  };

  const forgotPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { error: `Server error (${res.status})` };
    }

    if (!res.ok) {
      throw new Error(data.error || 'Failed to generate reset request.');
    }

    return {
      success: true,
      message: data.message,
      resetCode: data.resetCode,
      resetToken: data.resetToken,
    };
  };

  const resetPassword = async (key: string, newPassword: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetCode: key, resetToken: key, newPassword }),
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { error: `Server error (${res.status})` };
    }

    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password.');
    }

    return {
      success: true,
      message: data.message,
    };
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
      } catch (e) {
        // ignore
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const configureSupabase = async (url: string, anonKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      saveSupabaseConfig(url.trim(), anonKey.trim());
      setSupabaseUrl(url.trim());
      setIsLiveSupabase(true);
      const client = getSupabaseClient();
      if (client) {
        await client.auth.getSession();
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resetSupabaseConfig = () => {
    clearSupabaseConfig();
    setIsLiveSupabase(false);
    setSupabaseUrl('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLiveSupabase,
        supabaseUrl,
        login,
        register,
        loginWithGoogle,
        forgotPassword,
        resetPassword,
        logout,
        updateUser,
        configureSupabase,
        resetSupabaseConfig,
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
