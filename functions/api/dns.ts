// Cloudflare Pages Edge Function: /api/dns
// Real-time DNS Record Inspector using DomScan API with Cloudflare DoH fallback

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const domain = (url.searchParams.get('domain') || '')
      .trim()
      .toLowerCase()
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
      .split('/')[0];

    const type = ((url.searchParams.get('type') || url.searchParams.get('record_type') || 'A')).toUpperCase().trim();

    if (!domain || !domain.includes('.')) {
      return new Response(JSON.stringify({ error: 'Valid domain name is required.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const validTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA', 'ANY'];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: `Invalid record type '${type}'. Supported types: ${validTypes.join(', ')}` }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const domscanApiKey = (env?.DOMSCAN_API_KEY || request.headers.get('x-domscan-key') || '').trim();
    const startTime = Date.now();

    // 1. If DOMSCAN_API_KEY is configured, call DomScan DNS endpoint
    if (domscanApiKey) {
      try {
        const domscanUrl = new URL('https://domscan.net/v1/dns');
        domscanUrl.searchParams.set('domain', domain);
        domscanUrl.searchParams.set('type', type);

        const domscanRes = await fetch(domscanUrl.toString(), {
          headers: {
            'Accept': 'application/json',
            'X-API-Key': domscanApiKey,
            'User-Agent': 'DomainGuard-Cloudflare/1.0',
          },
        });

        const contentType = domscanRes.headers.get('content-type') || '';
        if (domscanRes.ok && contentType.includes('application/json')) {
          const data: any = await domscanRes.json();
          const latencyMs = Date.now() - startTime;

          let records: Array<{ name: string; type: string; value: string; ttl?: number | null; priority?: number | null }> = [];
          if (Array.isArray(data.records)) {
            records = data.records.map((r: any) => ({
              name: r.name || domain,
              type: r.type || type,
              value: typeof r === 'string' ? r : (r.value || r.address || r.target || r.data || JSON.stringify(r)),
              ttl: r.ttl ?? data.ttl ?? null,
              priority: r.priority ?? null,
            }));
          } else if (Array.isArray(data.answers)) {
            records = data.answers.map((r: any) => ({
              name: r.name || domain,
              type: r.type || type,
              value: r.data || r.value || r.address,
              ttl: r.TTL ?? r.ttl ?? null,
              priority: r.priority ?? null,
            }));
          } else if (data.record || data.value) {
            records = [{
              name: domain,
              type,
              value: String(data.record || data.value),
              ttl: data.ttl || null,
            }];
          }

          return new Response(JSON.stringify({
            success: true,
            domain,
            type,
            status: data.status || 'NOERROR',
            records,
            nameservers: data.nameservers || [],
            source: 'DomScan DNS API (v1/dns)',
            responseTimeMs: latencyMs,
            raw: data,
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (err) {
        console.warn('DomScan edge fetch error:', err);
      }
    }

    // 2. Edge Fallback: Cloudflare DNS over HTTPS
    const dohRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`, {
      headers: { Accept: 'application/dns-json' },
    });

    if (dohRes.ok) {
      const dohData: any = await dohRes.json();
      const typeMap: Record<number, string> = { 1: 'A', 28: 'AAAA', 5: 'CNAME', 15: 'MX', 16: 'TXT', 2: 'NS', 6: 'SOA', 257: 'CAA' };
      const records = (dohData.Answer || []).map((ans: any) => ({
        name: ans.name || domain,
        type: typeMap[ans.type] || type,
        value: ans.data || '',
        ttl: ans.TTL ?? null,
      }));

      const isNx = dohData.Status === 3;
      return new Response(JSON.stringify({
        success: !isNx,
        domain,
        type,
        status: isNx ? 'NXDOMAIN' : records.length > 0 ? 'NOERROR' : 'NODATA',
        records,
        source: domscanApiKey ? 'DomScan Fallback (Cloudflare DNS)' : 'Authoritative Cloudflare DNS (Configure DOMSCAN_API_KEY)',
        responseTimeMs: Date.now() - startTime,
        raw: dohData,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify({ error: `Failed to resolve DNS records for ${domain}` }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'DNS query failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
