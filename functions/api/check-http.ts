// Cloudflare Pages Edge Function: /api/check-http
// Real-time website HTTP working status and HTTP status code checker

export async function onRequestGet(context: any) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const domain = (url.searchParams.get('domain') || '')
      .trim()
      .toLowerCase()
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
      .split('/')[0];

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain query parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const httpsRes = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DomainGuard-Monitor/1.0)' },
      }).catch(async () => {
        return await fetch(`https://${domain}`, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DomainGuard-Monitor/1.0)' },
        });
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      return new Response(
        JSON.stringify({
          domain,
          isOnline: httpsRes.status >= 200 && httpsRes.status < 400,
          statusCode: httpsRes.status,
          statusText: `${httpsRes.status} ${httpsRes.statusText || 'OK'}`,
          latencyMs,
          protocol: 'https',
        }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    } catch {
      // Fallback to HTTP
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const httpRes = await fetch(`http://${domain}`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DomainGuard-Monitor/1.0)' },
        });

        clearTimeout(timeout);
        const latencyMs = Date.now() - start;

        return new Response(
          JSON.stringify({
            domain,
            isOnline: httpRes.status >= 200 && httpRes.status < 400,
            statusCode: httpRes.status,
            statusText: `${httpRes.status} ${httpRes.statusText || 'OK'}`,
            latencyMs,
            protocol: 'http',
          }),
          {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      } catch {
        return new Response(
          JSON.stringify({
            domain,
            isOnline: false,
            statusCode: 0,
            statusText: 'Unreachable / Down',
            latencyMs: null,
            protocol: null,
          }),
          {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Check failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
