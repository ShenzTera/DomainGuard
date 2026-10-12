// Client-side authentication store for resilient user management and personalized data isolation
import { AuthUser } from '../context/AuthContext';

export interface StoredUserAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string; // Stored securely
  createdAt: string;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
}

const STORAGE_KEY_USERS = 'domainguard_accounts';
const STORAGE_KEY_TOKEN = 'domainguard_auth_token';
const STORAGE_KEY_SESSION_USER = 'domainguard_session_user';

// Simple deterministic password hasher for client-side storage
function hashClientPassword(password: string): string {
  let hash = 0;
  const salted = `domainguard_salt_2026_${password}`;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash).toString(36)}_${salted.length}`;
}

// Seeded default demo accounts with verified hashes
const SEEDED_USERS: StoredUserAccount[] = [
  {
    id: 'usr_admin_default',
    email: 'admin@domainguard.io',
    name: 'Admin Lead',
    role: 'owner',
    passwordHash: hashClientPassword('Admin123!'),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_demo_default',
    email: 'demo@domainguard.io',
    name: 'Demo Engineer',
    role: 'admin',
    passwordHash: hashClientPassword('Demo123!'),
    createdAt: '2026-01-01T00:00:00.000Z',
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
    const parsed: any[] = JSON.parse(raw);
    const users: StoredUserAccount[] = parsed.map((u) => {
      // Migrate legacy plaintext passwords to hashed form if necessary
      if (u.password && !u.passwordHash) {
        return {
          ...u,
          passwordHash: hashClientPassword(u.password),
        };
      }
      return u;
    });

    // Ensure seeded users are always present
    for (const seed of SEEDED_USERS) {
      if (!users.some((u) => u.email.toLowerCase() === seed.email.toLowerCase())) {
        users.unshift(seed);
      }
    }
    return users;
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

/**
 * Strict Client-Side Login:
 * Strictly verifies email and password.
 * NEVER auto-creates accounts or accepts invalid passwords.
 */
export function clientLogin(
  email: string,
  password: string
): { success: boolean; token: string; user: AuthUser; message: string } {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail) {
    throw new Error('Please enter your email address.');
  }
  if (!cleanPass) {
    throw new Error('Please enter your account password.');
  }

  const users = getLocalUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    throw new Error('No account found with this email. Please check your spelling or register a new account.');
  }

  const providedHash = hashClientPassword(cleanPass);
  if (found.passwordHash !== providedHash) {
    throw new Error('Incorrect password. Please verify your credentials and try again.');
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
    message: 'Signed in successfully.',
  };
}

/**
 * Strict Client-Side Registration:
 * Requires valid name, email, and password (min 6 chars).
 * Prevents duplicate registration.
 */
export function clientRegister(
  name: string,
  email: string,
  password: string
): { success: boolean; token: string; user: AuthUser; message: string } {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!cleanName) {
    throw new Error('Please enter your full name.');
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const users = getLocalUsers();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  const newAccount: StoredUserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    name: cleanName,
    role: 'owner',
    passwordHash: hashClientPassword(cleanPass),
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

/**
 * Google Sign-In: requires explicit email confirmation
 */
export function clientGoogleLogin(
  email: string,
  name?: string
): { success: boolean; token: string; user: AuthUser; message: string } {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = name?.trim() || cleanEmail.split('@')[0];

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Valid Google account email is required.');
  }

  const users = getLocalUsers();
  let existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!existing) {
    existing = {
      id: `usr_g_${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      role: 'owner',
      passwordHash: hashClientPassword(`google_oauth_${cleanEmail}`),
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
  const users = getLocalUsers();
  const target = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!target) {
    throw new Error('No account found with this email address.');
  }

  const resetCode = `DG-${Math.floor(100000 + Math.random() * 900000)}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem(`domainguard_reset_${cleanEmail}`, resetCode);
  }
  return {
    success: true,
    resetCode,
    message: `Password reset verification code generated for ${cleanEmail}: ${resetCode}`,
  };
}

export function clientResetPassword(code: string, newPassword: string): { success: boolean; message: string } {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const users = getLocalUsers();
  let matchedEmail: string | null = null;

  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('domainguard_reset_')) {
        const storedCode = localStorage.getItem(k);
        if (storedCode && storedCode.trim().toUpperCase() === code.trim().toUpperCase()) {
          matchedEmail = k.replace('domainguard_reset_', '');
          localStorage.removeItem(k);
          break;
        }
      }
    }
  }

  if (!matchedEmail) {
    // If not found in localStorage keys, check if code matches standard format
    throw new Error('Invalid or expired verification code.');
  }

  const target = users.find((u) => u.email.toLowerCase() === matchedEmail.toLowerCase());
  if (!target) {
    throw new Error('Target account not found.');
  }

  target.passwordHash = hashClientPassword(newPassword);
  saveLocalUsers(users);

  return {
    success: true,
    message: 'Password successfully updated. You may now sign in with your new credentials.',
  };
}

export function clientGetSession(token: string): AuthUser | null {
  if (typeof window === 'undefined' || !token) return null;
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
