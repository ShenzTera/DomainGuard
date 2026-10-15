import { DomainItem } from '../types/domain';
import { getSupabaseClient } from './supabase';

export interface SupabaseDomainRow {
  id: string;
  user_id: string;
  domain: string;
  company?: string;
  working_status?: string;
  registrar?: string;
  registrar_portal_url?: string;
  expiration_date?: string;
  registration_date?: string;
  days_until_expiration?: number;
  is_resolving?: boolean;
  nameservers?: string[];
  dns_ips?: string[];
  portfolio?: string;
  assigned_employees?: string[];
  last_checked_at?: string;
  renewal_alerts?: any;
  notes?: string;
  whois_source?: string;
  http_status_code?: number | null;
  http_status_text?: string | null;
  http_latency_ms?: number | null;
  updated_at?: string;
  data?: any;
}

let resolvedTableName = 'domains';

export function domainItemToDbRow(item: DomainItem, userId: string): SupabaseDomainRow {
  return {
    id: String(item.id),
    user_id: userId, // Tied strictly to authenticated user's ID (auth.uid())
    domain: item.domain,
    company: item.company || '',
    working_status: item.workingStatus || 'active',
    registrar: item.registrar || '',
    registrar_portal_url: item.registrarPortalUrl || '',
    expiration_date: item.expirationDate || '',
    registration_date: item.registrationDate || '',
    days_until_expiration: typeof item.daysUntilExpiration === 'number' ? item.daysUntilExpiration : 0,
    is_resolving: Boolean(item.isResolving),
    nameservers: item.nameservers || [],
    dns_ips: item.dnsIps || [],
    portfolio: item.portfolio || 'Core Infrastructure',
    assigned_employees: item.assignedEmployees || [],
    last_checked_at: item.lastCheckedAt || new Date().toISOString(),
    renewal_alerts: item.renewalAlerts || {
      warn30Days: true,
      warn15Days: true,
      warn7Days: true,
      continuousReminderEvery2Days: true,
    },
    notes: item.notes || '',
    whois_source: item.whoisSource || '',
    http_status_code: item.httpStatusCode ?? null,
    http_status_text: item.httpStatusText ?? null,
    http_latency_ms: item.httpLatencyMs ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function dbRowToDomainItem(row: any): DomainItem {
  if (row.data && typeof row.data === 'object' && row.data.domain) {
    return {
      ...row.data,
      id: String(row.id || row.data.id),
      domain: String(row.domain || row.data.domain),
    };
  }

  return {
    id: String(row.id),
    domain: String(row.domain || ''),
    company: row.company || '',
    workingStatus: row.working_status || row.workingStatus || 'active',
    registrar: row.registrar || '',
    registrarPortalUrl: row.registrar_portal_url || row.registrarPortalUrl || '',
    expirationDate: row.expiration_date || row.expirationDate || '',
    registrationDate: row.registration_date || row.registrationDate,
    daysUntilExpiration:
      typeof row.days_until_expiration === 'number'
        ? row.days_until_expiration
        : typeof row.daysUntilExpiration === 'number'
        ? row.daysUntilExpiration
        : 0,
    isResolving:
      typeof row.is_resolving === 'boolean'
        ? row.is_resolving
        : typeof row.isResolving === 'boolean'
        ? row.isResolving
        : true,
    nameservers: Array.isArray(row.nameservers)
      ? row.nameservers
      : typeof row.nameservers === 'string'
      ? JSON.parse(row.nameservers || '[]')
      : [],
    dnsIps: Array.isArray(row.dns_ips)
      ? row.dns_ips
      : Array.isArray(row.dnsIps)
      ? row.dnsIps
      : [],
    portfolio: row.portfolio || 'Core Infrastructure',
    assignedEmployees: Array.isArray(row.assigned_employees)
      ? row.assigned_employees
      : Array.isArray(row.assignedEmployees)
      ? row.assignedEmployees
      : [],
    lastCheckedAt: row.last_checked_at || row.lastCheckedAt || new Date().toISOString(),
    renewalAlerts: row.renewal_alerts || row.renewalAlerts || {
      warn30Days: true,
      warn15Days: true,
      warn7Days: true,
      continuousReminderEvery2Days: true,
    },
    notes: row.notes || '',
    whoisSource: row.whois_source || row.whoisSource,
    httpStatusCode: row.http_status_code ?? row.httpStatusCode ?? null,
    httpStatusText: row.http_status_text ?? row.httpStatusText ?? null,
    httpLatencyMs: row.http_latency_ms ?? row.httpLatencyMs ?? null,
  };
}

/**
 * Fetches all domain tracker items for the authenticated user from Supabase database.
 * Every query is filtered by auth.uid() (user_id).
 */
export async function fetchUserDomainsFromSupabase(userId: string): Promise<DomainItem[] | null> {
  const client = getSupabaseClient();
  if (!client || !userId) {
    return null;
  }

  const tableCandidates = [resolvedTableName, 'domains', 'user_domains', 'tracked_domains'];
  const uniqueTables = Array.from(new Set(tableCandidates));

  for (const tableName of uniqueTables) {
    try {
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order('days_until_expiration', { ascending: true });

      if (!error && Array.isArray(data)) {
        resolvedTableName = tableName;
        return data.map(dbRowToDomainItem);
      }

      // If table doesn't exist, try next candidate
      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        continue;
      }

      if (error) {
        console.warn(`[DomainGuard] Supabase query error on table ${tableName}:`, error.message);
      }
    } catch (err) {
      console.warn(`[DomainGuard] Supabase fetch error on table ${tableName}:`, err);
    }
  }

  return null;
}

/**
 * Saves all domain tracker items for the authenticated user to Supabase database.
 * Automatically deletes removed items and upserts the current list with user_id = auth.uid().
 */
export async function saveUserDomainsToSupabase(
  domains: DomainItem[],
  userId: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !userId) {
    return false;
  }

  const tableName = resolvedTableName || 'domains';
  const rows = domains.map((d) => domainItemToDbRow(d, userId));

  try {
    // 1. Fetch current IDs in database for this user to delete items no longer tracked
    const { data: existingRows } = await client
      .from(tableName)
      .select('id')
      .eq('user_id', userId);

    if (Array.isArray(existingRows)) {
      const currentDbIds = new Set(existingRows.map((r: any) => String(r.id)));
      const incomingIds = new Set(rows.map((r) => String(r.id)));
      const idsToDelete = Array.from(currentDbIds).filter((id) => !incomingIds.has(id));

      if (idsToDelete.length > 0) {
        await client
          .from(tableName)
          .delete()
          .eq('user_id', userId)
          .in('id', idsToDelete);
      }
    }

    if (rows.length === 0) {
      return true;
    }

    // 2. Upsert rows with user_id = auth.uid()
    let upsertRes = await client
      .from(tableName)
      .upsert(rows, { onConflict: 'id,user_id' });

    if (upsertRes.error) {
      // Retry with onConflict: 'id' if table primary key is just 'id'
      upsertRes = await client
        .from(tableName)
        .upsert(rows, { onConflict: 'id' });
    }

    if (upsertRes.error) {
      console.warn(`[DomainGuard] Supabase upsert error on table ${tableName}:`, upsertRes.error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[DomainGuard] Failed to persist domains to Supabase database:', err);
    return false;
  }
}

/**
 * Adds or updates a single domain tracker item in Supabase database.
 */
export async function upsertSingleDomainInSupabase(
  domain: DomainItem,
  userId: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !userId) {
    return false;
  }

  const tableName = resolvedTableName || 'domains';
  const row = domainItemToDbRow(domain, userId);

  try {
    let res = await client
      .from(tableName)
      .upsert(row, { onConflict: 'id,user_id' });

    if (res.error) {
      res = await client
        .from(tableName)
        .upsert(row, { onConflict: 'id' });
    }

    return !res.error;
  } catch (err) {
    console.warn('[DomainGuard] Supabase single upsert error:', err);
    return false;
  }
}

/**
 * Deletes a single domain tracker item from Supabase database.
 */
export async function deleteSingleDomainFromSupabase(
  domainId: string,
  userId: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !userId) {
    return false;
  }

  const tableName = resolvedTableName || 'domains';
  try {
    const { error } = await client
      .from(tableName)
      .delete()
      .eq('user_id', userId)
      .eq('id', domainId);

    return !error;
  } catch (err) {
    console.warn('[DomainGuard] Supabase delete error:', err);
    return false;
  }
}
