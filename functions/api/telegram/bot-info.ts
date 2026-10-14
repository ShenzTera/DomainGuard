// Cloudflare Pages Edge Function: /api/telegram/bot-info
export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('botToken') || '';
    const headerToken = request.headers.get('x-bot-token') || '';
    const botToken = (queryToken || headerToken || env?.TELEGRAM_BOT_TOKEN || '').trim();

    if (!botToken) {
      return new Response(
        JSON.stringify({
          configured: false,
          botUsername: null,
          message: 'Telegram Bot Token not configured. Enter your bot token in settings or set TELEGRAM_BOT_TOKEN in Cloudflare environment variables.',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData: any = await meRes.json().catch(() => ({}));

    if (meRes.ok && meData.ok && meData.result?.username) {
      return new Response(
        JSON.stringify({
          configured: true,
          botUsername: meData.result.username,
          botName: meData.result.first_name || 'DomainGuard Bot',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        configured: false,
        botUsername: null,
        message: meData.description || 'Bot token rejected by Telegram API. Verify token from @BotFather.',
      }),
      {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ configured: false, error: err.message }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bot-token',
    },
  });
}
