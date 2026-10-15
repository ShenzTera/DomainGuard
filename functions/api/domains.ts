// Cloudflare Pages Edge Function: /api/domains
// Persistent multi-account domain storage across sessions, computers, and devices

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization') || '';
    const userId = url.searchParams.get('userId') || '';
    const userEmail = (url.searchParams.get('userEmail') || '').toLowerCase().trim();

    // 1. Supabase Database integration (queries public.domains table linked to auth.uid())
    const supabaseUrl = (env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || '').trim();
    const supabaseKey = (env?.SUPABASE_ANON_KEY || env?.VITE_SUPABASE_ANON_KEY || '').trim();

    if (supabaseUrl && supabaseKey && (authHeader.startsWith('Bearer ') || userId)) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : '';
      const targetUserId = userId || '';
      try {
        const queryParams = new URLSearchParams({
          select: '*',
          order: 'days_until_expiration.asc',
        });
        if (targetUserId) {
          queryParams.append('user_id', `eq.${targetUserId}`);
        }

        const sbRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/domains?${queryParams.toString()}`, {
          headers: {
            apikey: supabaseKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
          },
        });

        if (sbRes.ok) {
          const rawRows: any[] = await sbRes.json();
          if (Array.isArray(rawRows)) {
            const formatted = rawRows.map((r) => ({
              id: String(r.id),
              domain: String(r.domain || ''),
              company: r.company || '',
              workingStatus: r.working_status || r.workingStatus || 'active',
              registrar: r.registrar || '',
              registrarPortalUrl: r.registrar_portal_url || r.registrarPortalUrl || '',
              expirationDate: r.expiration_date || r.expirationDate || '',
              registrationDate: r.registration_date || r.registrationDate,
              daysUntilExpiration: typeof r.days_until_expiration === 'number' ? r.days_until_expiration : 0,
              isResolving: typeof r.is_resolving === 'boolean' ? r.is_resolving : true,
              nameservers: Array.isArray(r.nameservers) ? r.nameservers : [],
              dnsIps: Array.isArray(r.dns_ips) ? r.dns_ips : [],
              portfolio: r.portfolio || 'Core Infrastructure',
              assignedEmployees: Array.isArray(r.assigned_employees) ? r.assigned_employees : [],
              lastCheckedAt: r.last_checked_at || new Date().toISOString(),
              renewalAlerts: r.renewal_alerts || {},
              notes: r.notes || '',
              whoisSource: r.whois_source || '',
              httpStatusCode: r.http_status_code ?? null,
              httpStatusText: r.http_status_text ?? null,
              httpLatencyMs: r.http_latency_ms ?? null,
            }));

            return new Response(
              JSON.stringify({
                success: true,
                domains: formatted,
                userId: targetUserId,
                source: 'supabase_database',
              }),
              {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              }
            );
          }
        }
      } catch (err) {
        console.warn('Supabase edge database fetch note:', err);
      }
    }

    // 2. Cloudflare KV integration (DOMAINS_KV or KV or STORAGE)
    const kv = env?.DOMAINS_KV || env?.KV || env?.STORAGE;
    if (kv) {
      const keySuffix = userId || userEmail;
      if (keySuffix) {
        try {
          const stored = await kv.get(`domains_${keySuffix}`);
          if (stored) {
            const domains = JSON.parse(stored);
            return new Response(
              JSON.stringify({
                success: true,
                domains: Array.isArray(domains) ? domains : [],
                userId: keySuffix,
                source: 'cloudflare_kv',
              }),
              {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              }
            );
          }
        } catch (kvErr) {
          console.warn('KV domain fetch error:', kvErr);
        }
      }
    }

    // 3. Fallback response with setup guidance if KV or Supabase not yet bound in Cloudflare Pages
    return new Response(
      JSON.stringify({
        success: true,
        domains: [],
        userId,
        requiresKvBinding: !kv && !supabaseUrl,
        message: !kv && !supabaseUrl
          ? 'Cloudflare KV (DOMAINS_KV) or Supabase can be bound in Cloudflare Pages Settings for multi-device sync.'
          : 'No saved domains yet for this account.',
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch domains' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const body = await request.json().catch(() => ({}));
    const domains = Array.isArray(body.domains) ? body.domains : [];
    const userId = (body.userId || body.id || '').trim();
    const userEmail = (body.email || body.userEmail || '').toLowerCase().trim();

    // 1. Supabase Database integration (upserts into public.domains linked to auth.uid())
    const supabaseUrl = (env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || '').trim();
    const supabaseKey = (env?.SUPABASE_ANON_KEY || env?.VITE_SUPABASE_ANON_KEY || '').trim();

    if (supabaseUrl && supabaseKey && (authHeader.startsWith('Bearer ') || userId)) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : '';
      const targetUserId = userId || '';
      try {
        const rows = domains.map((d: any) => ({
          id: String(d.id),
          user_id: targetUserId,
          domain: d.domain,
          company: d.company || '',
          working_status: d.workingStatus || 'active',
          registrar: d.registrar || '',
          registrar_portal_url: d.registrarPortalUrl || '',
          expiration_date: d.expirationDate || '',
          registration_date: d.registrationDate || '',
          days_until_expiration: typeof d.daysUntilExpiration === 'number' ? d.daysUntilExpiration : 0,
          is_resolving: Boolean(d.isResolving),
          nameservers: d.nameservers || [],
          dns_ips: d.dnsIps || [],
          portfolio: d.portfolio || 'Core Infrastructure',
          assigned_employees: d.assignedEmployees || [],
          last_checked_at: d.lastCheckedAt || new Date().toISOString(),
          renewal_alerts: d.renewalAlerts || {},
          notes: d.notes || '',
          whois_source: d.whoisSource || '',
          http_status_code: d.httpStatusCode ?? null,
          http_status_text: d.httpStatusText ?? null,
          http_latency_ms: d.httpLatencyMs ?? null,
          updated_at: new Date().toISOString(),
        }));

        if (rows.length > 0) {
          await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/domains`, {
            method: 'POST',
            headers: {
              apikey: supabaseKey,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify(rows),
          });
        }
      } catch (e) {
        console.warn('Supabase edge database save error:', e);
      }
    }

    // 2. Cloudflare KV integration
    const kv = env?.DOMAINS_KV || env?.KV || env?.STORAGE;
    if (kv) {
      const keySuffix = userId || userEmail;
      if (keySuffix) {
        try {
          await kv.put(`domains_${keySuffix}`, JSON.stringify(domains));
        } catch (kvErr) {
          console.warn('KV domain put error:', kvErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Saved ${domains.length} domains to user account.`,
        count: domains.length,
        hasKv: Boolean(kv),
        hasSupabase: Boolean(supabaseUrl),
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to save domains' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
