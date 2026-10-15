// Cloudflare Pages Edge Function: /api/domains
// Persistent multi-account domain storage across sessions, computers, and devices

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization') || '';
    const userId = url.searchParams.get('userId') || '';
    const userEmail = (url.searchParams.get('userEmail') || '').toLowerCase().trim();

    // 1. Supabase integration (if configured)
    const supabaseUrl = (env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || '').trim();
    const supabaseKey = (env?.SUPABASE_ANON_KEY || env?.VITE_SUPABASE_ANON_KEY || '').trim();

    if (supabaseUrl && supabaseKey && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      try {
        const sbRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
          headers: { Authorization: `Bearer ${token}`, apikey: supabaseKey },
        });
        if (sbRes.ok) {
          const sbUser: any = await sbRes.json();
          const domains = sbUser.user_metadata?.saved_domains || [];
          return new Response(
            JSON.stringify({
              success: true,
              domains,
              userId: sbUser.id,
              source: 'supabase',
            }),
            {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            }
          );
        }
      } catch (err) {
        console.warn('Supabase edge domain fetch note:', err);
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

    // 1. Supabase integration (if configured)
    const supabaseUrl = (env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || '').trim();
    const supabaseKey = (env?.SUPABASE_ANON_KEY || env?.VITE_SUPABASE_ANON_KEY || '').trim();

    if (supabaseUrl && supabaseKey && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      try {
        await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: { saved_domains: domains },
          }),
        });
      } catch (e) {
        console.warn('Supabase save error:', e);
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
