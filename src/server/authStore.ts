import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'server_settings.json');

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: 'owner' | 'admin' | 'monitor' | 'viewer';
  createdAt: string;
  telegramChatId?: string;
  telegramUsername?: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: number; // timestamp
}

export interface PasswordResetRecord {
  token: string;
  code: string;
  email: string;
  expiresAt: number;
}

export interface TelegramPendingLink {
  token: string;
  code: string;
  userId: string;
  createdAt: number;
}

export interface KnownTelegramChat {
  id: string;
  title: string;
  type: 'group' | 'supergroup' | 'channel' | 'private';
  username?: string;
  lastSeen?: string;
}

// In-memory caches backed by JSON files
let usersMap = new Map<string, UserRecord>(); // email -> UserRecord
let usersById = new Map<string, UserRecord>(); // id -> UserRecord
let sessionsMap = new Map<string, SessionRecord>(); // token -> SessionRecord
let passwordResetsMap = new Map<string, PasswordResetRecord>(); // token/code -> record
let telegramPendingLinks = new Map<string, TelegramPendingLink>(); // userId -> pending link
let knownTelegramChats = new Map<string, KnownTelegramChat>(); // chatId -> KnownTelegramChat

let serverTelegramBotToken: string = process.env.TELEGRAM_BOT_TOKEN || '';
let serverDefaultTelegramChatId: string = process.env.TELEGRAM_CHAT_ID || '';
let serverDefaultTelegramUsername: string = '';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

function persistUsers() {
  try {
    ensureDataDir();
    const list = Array.from(usersById.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist users:', err);
  }
}

function persistSessions() {
  try {
    ensureDataDir();
    const list = Array.from(sessionsMap.values());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist sessions:', err);
  }
}

function persistServerSettings() {
  try {
    ensureDataDir();
    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify(
        {
          telegramBotToken: serverTelegramBotToken,
          defaultTelegramChatId: serverDefaultTelegramChatId,
          defaultTelegramUsername: serverDefaultTelegramUsername,
          knownChats: Array.from(knownTelegramChats.values()),
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed to persist server settings:', err);
  }
}

export function initAuthStore() {
  ensureDataDir();

  // Load server settings
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      if (parsed.telegramBotToken) {
        serverTelegramBotToken = parsed.telegramBotToken;
      }
      if (parsed.defaultTelegramChatId) {
        serverDefaultTelegramChatId = parsed.defaultTelegramChatId;
      }
      if (parsed.defaultTelegramUsername) {
        serverDefaultTelegramUsername = parsed.defaultTelegramUsername;
      }
      if (Array.isArray(parsed.knownChats)) {
        for (const chat of parsed.knownChats) {
          if (chat && chat.id) {
            knownTelegramChats.set(chat.id, chat);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Pre-seed known team group from verified Telegram interaction if not present
  if (!knownTelegramChats.has('-4835124728')) {
    knownTelegramChats.set('-4835124728', {
      id: '-4835124728',
      title: 'Domain test gc',
      type: 'group',
      lastSeen: new Date().toISOString(),
    });
  }

  // Load users
  if (fs.existsSync(USERS_FILE)) {
    try {
      const list: UserRecord[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      usersMap.clear();
      usersById.clear();
      for (const u of list) {
        usersMap.set(u.email.toLowerCase(), u);
        usersById.set(u.id, u);
      }
    } catch (err) {
      console.warn('Error reading users file:', err);
    }
  }

  // Seed default demo accounts if not present
  const adminEmail = 'admin@domainguard.io';
  if (!usersMap.has(adminEmail)) {
    const salt = crypto.randomBytes(16).toString('hex');
    const adminUser: UserRecord = {
      id: 'usr_admin_default',
      email: adminEmail,
      name: 'Admin Lead',
      passwordHash: hashPassword('Admin123!', salt),
      salt,
      role: 'owner',
      createdAt: new Date().toISOString(),
    };
    usersMap.set(adminEmail, adminUser);
    usersById.set(adminUser.id, adminUser);
  }

  const demoEmail = 'demo@domainguard.io';
  if (!usersMap.has(demoEmail)) {
    const salt = crypto.randomBytes(16).toString('hex');
    const demoUser: UserRecord = {
      id: 'usr_demo_default',
      email: demoEmail,
      name: 'Demo Engineer',
      passwordHash: hashPassword('Demo123!', salt),
      salt,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    usersMap.set(demoEmail, demoUser);
    usersById.set(demoUser.id, demoUser);
  }

  persistUsers();

  // Load sessions
  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      const list: SessionRecord[] = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      const now = Date.now();
      sessionsMap.clear();
      for (const s of list) {
        if (s.expiresAt > now && usersById.has(s.userId)) {
          sessionsMap.set(s.token, s);
        }
      }
    } catch (err) {
      console.warn('Error reading sessions file:', err);
    }
  }
}

export function registerUser(name: string, email: string, password: string): { user: UserRecord; token: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('A valid email address is required.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!cleanName) {
    throw new Error('Full name is required.');
  }

  if (usersMap.has(cleanEmail)) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    email: cleanEmail,
    name: cleanName,
    passwordHash,
    salt,
    role: usersMap.size === 0 ? 'owner' : 'admin',
    createdAt: new Date().toISOString(),
  };

  usersMap.set(cleanEmail, newUser);
  usersById.set(newUser.id, newUser);
  persistUsers();

  const token = createSession(newUser.id);
  return { user: newUser, token };
}

export function loginUser(email: string, password: string): { user: UserRecord; token: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('Email and password are required.');
  }

  const user = usersMap.get(cleanEmail);
  if (!user) {
    throw new Error('Invalid email or password. Please check your credentials.');
  }

  const isMatch = verifyPassword(password, user.passwordHash, user.salt);
  if (!isMatch) {
    throw new Error('Invalid email or password. Please check your credentials.');
  }

  const token = createSession(user.id);
  return { user, token };
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const session: SessionRecord = {
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  sessionsMap.set(token, session);
  persistSessions();
  return token;
}

export function getUserByToken(token: string): UserRecord | null {
  if (!token) return null;
  const session = sessionsMap.get(token);
  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    sessionsMap.delete(token);
    persistSessions();
    return null;
  }

  return usersById.get(session.userId) || null;
}

export function getUserById(userId: string): UserRecord | null {
  return usersById.get(userId) || null;
}

export function logoutSession(token: string) {
  sessionsMap.delete(token);
  persistSessions();
}

export function createPasswordReset(email: string): { resetToken: string; code: string } | null {
  const cleanEmail = email.trim().toLowerCase();
  const user = usersMap.get(cleanEmail);
  if (!user) return null;

  const resetToken = crypto.randomBytes(24).toString('hex');
  const code = `DG-${crypto.randomInt(100000, 999999)}`;
  const record: PasswordResetRecord = {
    token: resetToken,
    code,
    email: cleanEmail,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  };

  passwordResetsMap.set(resetToken, record);
  passwordResetsMap.set(code.toLowerCase(), record);
  return { resetToken, code };
}

export function verifyAndResetPassword(tokenOrCode: string, newPassword: string): boolean {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const cleanKey = tokenOrCode.trim().toLowerCase();
  const record = passwordResetsMap.get(cleanKey);
  if (!record || record.expiresAt < Date.now()) {
    throw new Error('Invalid or expired password reset verification code.');
  }

  const user = usersMap.get(record.email);
  if (!user) {
    throw new Error('User not found.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  user.passwordHash = hashPassword(newPassword, salt);
  user.salt = salt;

  persistUsers();

  // Invalidate all resets and sessions
  passwordResetsMap.delete(record.token);
  passwordResetsMap.delete(record.code.toLowerCase());

  // Invalidate old sessions
  for (const [token, s] of sessionsMap.entries()) {
    if (s.userId === user.id) {
      sessionsMap.delete(token);
    }
  }
  persistSessions();

  return true;
}

export function sanitizeUser(u: UserRecord) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    telegramChatId: u.telegramChatId || null,
    telegramUsername: u.telegramUsername || null,
  };
}

// Telegram Bot Methods
export function getTelegramBotToken(): string {
  return serverTelegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '';
}

export function setTelegramBotToken(token: string) {
  serverTelegramBotToken = token.trim();
  persistServerSettings();
}

export function createTelegramLinkRequest(
  userId: string,
  botUsername: string
): { code: string; token: string; deepLink: string; groupDeepLink: string } {
  const token = `link_${userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}_${crypto.randomBytes(4).toString('hex')}`;
  const code = `DG-${crypto.randomInt(1000, 9999)}`;

  const entry: TelegramPendingLink = {
    token,
    code,
    userId,
    createdAt: Date.now(),
  };

  telegramPendingLinks.set(userId, entry);
  const deepLink = botUsername ? `https://t.me/${botUsername}?start=${token}` : '';
  const groupDeepLink = botUsername ? `https://t.me/${botUsername}?startgroup=${token}&admin=post_messages` : '';

  return { code, token, deepLink, groupDeepLink };
}

export function getDefaultTelegramChatId(): string {
  return serverDefaultTelegramChatId || process.env.TELEGRAM_CHAT_ID || '';
}

export function getDefaultTelegramUsername(): string {
  return serverDefaultTelegramUsername || '';
}

export async function scanAndGetTelegramChats(botToken: string): Promise<KnownTelegramChat[]> {
  if (botToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=-50&limit=50`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          const chat = update.message?.chat || update.my_chat_member?.chat || update.channel_post?.chat;
          if (!chat) continue;
          const chatId = String(chat.id);
          const isGroup = chat.type === 'group' || chat.type === 'supergroup';
          const isChannel = chat.type === 'channel';

          let title = chat.title;
          if (!title) {
            const nameParts = [chat.first_name, chat.last_name].filter(Boolean).join(' ');
            title = nameParts || (chat.username ? `@${chat.username}` : `Chat ${chatId}`);
          }

          const existing = knownTelegramChats.get(chatId) || {
            id: chatId,
            title,
            type: chat.type as any,
            username: chat.username ? `@${chat.username}` : undefined,
            lastSeen: new Date().toISOString(),
          };

          existing.title = title;
          existing.type = chat.type as any;
          if (chat.username) existing.username = `@${chat.username}`;
          existing.lastSeen = new Date().toISOString();

          knownTelegramChats.set(chatId, existing);
        }
        persistServerSettings();
      }
    } catch (err) {
      console.warn('Failed to scan Telegram updates for chats:', err);
    }
  }

  // Ensure default chat is in list if configured
  if (serverDefaultTelegramChatId && !knownTelegramChats.has(serverDefaultTelegramChatId)) {
    knownTelegramChats.set(serverDefaultTelegramChatId, {
      id: serverDefaultTelegramChatId,
      title: serverDefaultTelegramUsername || (serverDefaultTelegramChatId.startsWith('-') ? 'Group Chat' : 'Connected Chat'),
      type: serverDefaultTelegramChatId.startsWith('-') ? 'group' : 'private',
      lastSeen: new Date().toISOString(),
    });
  }

  return Array.from(knownTelegramChats.values());
}

export function setActiveTelegramDestination(
  chatId: string,
  title?: string,
  userId?: string
): { success: boolean; chatId: string; title: string } {
  const cleanChatId = chatId.trim();
  if (!cleanChatId) throw new Error('Chat ID is required');

  const cleanTitle =
    title?.trim() ||
    (cleanChatId.startsWith('-') ? `👥 Group Chat (${cleanChatId})` : `👤 Chat (${cleanChatId})`);

  serverDefaultTelegramChatId = cleanChatId;
  serverDefaultTelegramUsername = cleanTitle;

  // Track in known chats map
  const existing = knownTelegramChats.get(cleanChatId);
  if (existing) {
    if (title) existing.title = title.replace(/^👥\s*|Group:\s*/g, '').trim();
    existing.lastSeen = new Date().toISOString();
    knownTelegramChats.set(cleanChatId, existing);
  } else {
    knownTelegramChats.set(cleanChatId, {
      id: cleanChatId,
      title: cleanTitle.replace(/^👥\s*|Group:\s*/g, '').trim(),
      type: cleanChatId.startsWith('-') ? 'group' : 'private',
      lastSeen: new Date().toISOString(),
    });
  }

  persistServerSettings();

  if (userId) {
    const user = usersById.get(userId);
    if (user) {
      user.telegramChatId = cleanChatId;
      user.telegramUsername = cleanTitle;
      persistUsers();
    }
  }

  return { success: true, chatId: cleanChatId, title: cleanTitle };
}

export function setManualTelegramChatId(chatId: string, username?: string, userId?: string): boolean {
  const cleanChatId = chatId.trim();
  if (!cleanChatId) return false;

  const isGroup = cleanChatId.startsWith('-');
  const label = username
    ? (username.startsWith('@') || username.startsWith('👥') ? username : isGroup ? `👥 ${username}` : `@${username}`)
    : (isGroup ? `👥 Group Chat ${cleanChatId}` : `Connected Chat ${cleanChatId}`);

  setActiveTelegramDestination(cleanChatId, label, userId);
  return true;
}

export async function checkAndVerifyTelegramLink(
  userId: string,
  botToken: string
): Promise<{ connected: boolean; telegramUsername?: string; chatId?: string; error?: string }> {
  const user = usersById.get(userId);

  // If already connected for this user
  if (user?.telegramChatId) {
    return {
      connected: true,
      telegramUsername: user.telegramUsername || serverDefaultTelegramUsername,
      chatId: user.telegramChatId,
    };
  }

  // Get active pending link for this user or any recent pending link
  let pending = telegramPendingLinks.get(userId);
  if (!pending && telegramPendingLinks.size > 0) {
    // If only one link is pending created recently, use it
    const allPending = Array.from(telegramPendingLinks.values());
    allPending.sort((a, b) => b.createdAt - a.createdAt);
    if (allPending.length > 0 && Date.now() - allPending[0].createdAt < 10 * 60 * 1000) {
      pending = allPending[0];
    }
  }

  if (!pending) {
    return { connected: false, error: 'No active Telegram verification session found. Click "Connect Telegram" to start.' };
  }

  // Query Telegram getUpdates
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=-30&limit=30`);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) {
      return { connected: false, error: data.description || 'Could not fetch updates from Telegram' };
    }

    const cleanCode = pending.code.replace('DG-', '').trim();
    const tokenLower = pending.token.toLowerCase();

    // Look for matching message in recent updates (checking in reverse to prefer newest updates)
    for (let i = data.result.length - 1; i >= 0; i--) {
      const update = data.result[i];
      const msg = update.message;
      if (!msg) continue;
      const text = (msg.text || '').trim();
      const textLower = text.toLowerCase();
      const msgDateMs = (msg.date || 0) * 1000;

      // Allow match if text has token, code, or if /start was clicked recently after pending link creation
      const isTokenMatch = textLower.includes(tokenLower);
      const isCodeMatch = text.includes(pending.code) || (cleanCode && text.includes(cleanCode));
      const isRecentStart = textLower.startsWith('/start') && msgDateMs >= pending.createdAt - 60000;
      const isRecentMessage = msgDateMs >= pending.createdAt - 30000 && text.length > 0;

      const isMatch = isTokenMatch || isCodeMatch || isRecentStart || isRecentMessage;

      if (isMatch) {
        const chatId = String(msg.chat.id);
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
        const displayLabel = isGroup
          ? `👥 Group: ${msg.chat.title || 'Telegram Group'}`
          : (msg.from?.username ? `@${msg.from.username}` : (msg.from?.first_name || 'Telegram User'));

        // Update user if user exists
        if (user) {
          user.telegramChatId = chatId;
          user.telegramUsername = displayLabel;
          persistUsers();
        }

        // Update default server settings and destination
        setActiveTelegramDestination(chatId, displayLabel, userId);

        telegramPendingLinks.delete(userId);
        if (pending.userId) telegramPendingLinks.delete(pending.userId);

        // Send confirmation message to Telegram
        try {
          const userLabel = user ? `(<b>${user.email}</b>)` : '';
          const destinationType = isGroup ? `Group chat (${msg.chat.title})` : `account (${displayLabel})`;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `🎉 <b>DomainGuard Connected!</b>\n\nThis Telegram ${destinationType} is now successfully linked to DomainGuard ${userLabel}.\n\nYou will automatically receive 30-day domain expiration warnings and continuous 48-hour reminders here.`,
            }),
          });
        } catch {
          // ignore notification error
        }

        return {
          connected: true,
          telegramUsername: displayLabel,
          chatId,
        };
      }
    }

    return {
      connected: false,
      error: `Waiting for message. Tap "Start" in Telegram or send verification code "${pending.code}".`,
    };
  } catch (err: any) {
    return { connected: false, error: err.message || 'Error communicating with Telegram Bot API' };
  }
}

export function disconnectTelegramUser(userId: string): boolean {
  const user = usersById.get(userId);
  if (user) {
    user.telegramChatId = undefined;
    user.telegramUsername = undefined;
    persistUsers();
  }
  serverDefaultTelegramChatId = '';
  serverDefaultTelegramUsername = '';
  persistServerSettings();

  telegramPendingLinks.delete(userId);
  return true;
}


export function getAllUsers(): UserRecord[] {
  return Array.from(usersById.values());
}
