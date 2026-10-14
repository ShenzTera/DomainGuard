// Cloudflare Pages Edge Function: /api/telegram/start-connect
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const headerToken = request.headers.get('x-bot-token') || '';
    const botToken = (body.botToken || headerToken || env?.TELEGRAM_BOT_TOKEN || '').trim();

    if (!botToken) {
      return new Response(
        JSON.stringify({
          error: 'Telegram Bot Token not configured. Please enter your Bot Token from @BotFather in settings or set TELEGRAM_BOT_TOKEN in Cloudflare environment variables.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData: any = await meRes.json().catch(() => ({}));
    const botUsername = meData.result?.username;

    if (!botUsername) {
      return new Response(
        JSON.stringify({ error: meData.description || 'Could not resolve bot username. Verify your Telegram bot token.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const connectCode = `DG_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const directDeepLink = `https://t.me/${botUsername}?start=${connectCode}`;
    const groupDeepLink = `https://t.me/${botUsername}?startgroup=${connectCode}`;

    return new Response(
      JSON.stringify({
        success: true,
        botUsername,
        botName: meData.result?.first_name || 'DomainGuard Bot',
        connectCode,
        verificationCode: connectCode,
        verificationToken: connectCode,
        connectUrl: directDeepLink,
        deepLink: directDeepLink,
        groupDeepLink,
        instructions: `1. Open Telegram bot link:\n   - Personal DM: ${directDeepLink}\n   - Group/Channel: ${groupDeepLink}\n2. Click "START" or send "${connectCode}" in chat.\n3. Return here and click "Check Verification".`,
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bot-token',
    },
  });
}
