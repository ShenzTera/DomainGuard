// Cloudflare Pages Edge Function: /api/telegram/test
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const headerToken = request.headers.get('x-bot-token') || '';
    const botToken = (body.botToken || headerToken || env?.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (body.chatId || env?.TELEGRAM_CHAT_ID || '').trim();
    const message = body.message || '🔔 <b>DomainGuard Test Alert</b>\n\nCloudflare Edge Telegram test successful!';

    if (!botToken) {
      return new Response(JSON.stringify({ error: 'Telegram Bot Token is required. Please configure it in settings.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'Telegram Chat ID is required. Please link a chat first.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const tgData: any = await tgRes.json().catch(() => ({}));
    if (!tgRes.ok || !tgData.ok) {
      return new Response(JSON.stringify({ error: tgData.description || 'Telegram Bot API error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Telegram alert delivered directly via Cloudflare Edge Worker.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Telegram processing error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bot-token',
    },
  });
}
