// Cloudflare Pages Edge Function: /api/telegram/start-connect
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const botToken = (body.botToken || '').trim() || (env?.TELEGRAM_BOT_TOKEN || '').trim();

    if (!botToken) {
      return new Response(JSON.stringify({ error: 'Telegram Bot Token not configured.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData: any = await meRes.json().catch(() => ({}));
    const botUsername = meData.result?.username;

    if (!botUsername) {
      return new Response(JSON.stringify({ error: 'Could not resolve bot username.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const connectCode = `DG_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const connectUrl = `https://t.me/${botUsername}?start=${connectCode}`;

    return new Response(
      JSON.stringify({
        success: true,
        connectCode,
        connectUrl,
        botUsername,
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Start connect error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
