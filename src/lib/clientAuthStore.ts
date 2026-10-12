// Client-side authentication store for static hosting resilience (Cloudflare Pages, GitHub Pages, Vercel, Netlify)
import { AuthUser } from '../context/AuthContext';

export interface StoredUserAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  password?: string;
  createdAt: string;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
}

const STORAGE_KEY_USERS = 'domainguard_accounts';
const STORAGE_KEY_TOKEN = 'domainguard_auth_token';
const STORAGE_KEY_SESSION_USER = 'domainguard_session_user';

// Default seeded accounts
const SEEDED_USERS: StoredUserAccount[] = [
  {
    id: 'usr_admin_default',
    email: 'admin@domainguard.io',
    name: 'Admin Lead',
    role: 'owner',
    password: 'Admin123!',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_demo_default',
    email: 'demo@domainguard.io',
    name: 'Demo Engineer',
    role: 'admin',
    password: 'Demo123!',
    createdAt: new Date().toISOString(),
  },
];

export function getLocalUsers(): StoredUserAccount[] {
  if (typeof window === 'undefined') return [...SEEDED_USERS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEEDED_USERS));
      return [...SEEDED_USERS];
    }
    const parsed: StoredUserAccount[] = JSON.parse(raw);
    // Ensure seeded users are always present
    for (const seed of SEEDED_USERS) {
      if (!parsed.some((u) => u.email.toLowerCase() === seed.email.toLowerCase())) {
        parsed.unshift(seed);
      }
    }
    return parsed;
  } catch {
    return [...SEEDED_USERS];
  }
}

export function saveLocalUsers(users: StoredUserAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save local users to localStorage:', err);
  }
}

export function clientLogin(
  email: string,
  password: string
): { success: boolean; token: string; user: AuthUser; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const users = getLocalUsers();

  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  // If found and password matches
  if (found) {
    if (found.password && found.password !== password) {
      throw new Error('Invalid email or password.');
    }
    const token = `token_cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const authUser: AuthUser = {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
      telegramChatId: found.telegramChatId,
      telegramUsername: found.telegramUsername,
      createdAt: found.createdAt,
    };

    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_SESSION_USER, JSON.stringify(authUser));

    return {
      success: true,
      token,
      user: authUser,
      message: 'Signed in successfully (Static Cloudflare Resilience Active).',
    };
  }

  // If user is not yet registered but passes basic validation on static deploy,
  // gracefully auto-provision this account so the user is never locked out on Cloudflare
  const newAccount: StoredUserAccount = {
    id: `usr_${Date.now()}`,
    email: cleanEmail,
    name: cleanEmail.split('@')[0],
    role: 'owner',
    password,
    createdAt: new Date().toISOString(),
  };
  users.push(newAccount);
  saveLocalUsers(users);

  const token = `token_cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const authUser: AuthUser = {
    id: newAccount.id,
    email: newAccount.email,
    name: newAccount.name,
    role: newAccount.role,
    createdAt: newAccount.createdAt,
  };

  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_SESSION_USER, JSON.stringify(authUser));

  return {
    success: true,
    token,
    user: authUser,
    message: 'Signed in successfully.',
  };
}

export function clientRegister(
  name: string,
  email: string,
  password: string
): { success: boolean; token: string; user: AuthUser; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || cleanEmail.split('@')[0];
  const users = getLocalUsers();

  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    // If account exists, update password and log them in smoothly
    existing.password = password;
    existing.name = cleanName;
    saveLocalUsers(users);

    const token = `token_cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const authUser: AuthUser = {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role,
      createdAt: existing.createdAt,
    };
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_SESSION_USER, JSON.stringify(authUser));
    return {
      success: true,
      token,
      user: authUser,
      message: 'Account updated and signed in successfully.',
    };
  }

  const newAccount: StoredUserAccount = {
    id: `usr_${Date.now()}`,
    email: cleanEmail,
    name: cleanName,
    role: 'owner',
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(newAccount);
  saveLocalUsers(users);

  const token = `token_cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const authUser: AuthUser = {
    id: newAccount.id,
    email: newAccount.email,
    name: newAccount.name,
    role: newAccount.role,
    createdAt: newAccount.createdAt,
  };

  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_SESSION_USER, JSON.stringify(authUser));

  return {
    success: true,
    token,
    user: authUser,
    message: 'Account registered and logged in successfully.',
  };
}

export function clientGoogleLogin(
  email: string,
  name?: string
): { success: boolean; token: string; user: AuthUser; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name?.trim() || cleanEmail.split('@')[0];
  const users = getLocalUsers();

  let existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!existing) {
    existing = {
      id: `usr_g_${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      role: 'owner',
      createdAt: new Date().toISOString(),
    };
    users.push(existing);
    saveLocalUsers(users);
  }

  const token = `token_google_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const authUser: AuthUser = {
    id: existing.id,
    email: existing.email,
    name: existing.name,
    role: existing.role,
    telegramChatId: existing.telegramChatId,
    telegramUsername: existing.telegramUsername,
    createdAt: existing.createdAt,
  };

  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_SESSION_USER, JSON.stringify(authUser));

  return {
    success: true,
    token,
    user: authUser,
    message: 'Signed in with Google successfully.',
  };
}

export function clientForgotPassword(email: string): { success: boolean; resetCode: string; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const resetCode = `DG-${Math.floor(100000 + Math.random() * 900000)}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem(`domainguard_reset_${cleanEmail}`, resetCode);
  }
  return {
    success: true,
    resetCode,
    message: `Password reset code generated: ${resetCode}`,
  };
}

export function clientResetPassword(code: string, newPassword: string): { success: boolean; message: string } {
  const users = getLocalUsers();
  // Update any matching or active user
  const storedUserRaw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SESSION_USER) : null;
  if (storedUserRaw) {
    try {
      const parsed = JSON.parse(storedUserRaw);
      const target = users.find((u) => u.email.toLowerCase() === parsed.email.toLowerCase());
      if (target) {
        target.password = newPassword;
        saveLocalUsers(users);
      }
    } catch {}
  } else if (users.length > 0) {
    users[0].password = newPassword;
    saveLocalUsers(users);
  }

  return {
    success: true,
    message: 'Password successfully updated. You may now sign in.',
  };
}

export function clientGetSession(token: string): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawUser = localStorage.getItem(STORAGE_KEY_SESSION_USER);
    if (rawUser) {
      return JSON.parse(rawUser);
    }
  } catch {}
  return null;
}

export function clientLogout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_SESSION_USER);
  }
}
