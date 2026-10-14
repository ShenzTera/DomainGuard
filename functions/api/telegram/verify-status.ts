// Cloudflare Pages Edge Function: /api/telegram/verify-status
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const connectCode = (body.connectCode || '').trim();
    const botToken = (body.botToken || '').trim() || (env?.TELEGRAM_BOT_TOKEN || '').trim();

    if (!botToken) {
      return new Response(JSON.stringify({ connected: false }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (connectCode) {
      const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=20`);
      const updatesData: any = await updatesRes.json().catch(() => ({}));

      if (updatesData.ok && Array.isArray(updatesData.result)) {
        for (const update of updatesData.result) {
          const text = update.message?.text || '';
          if (text.includes(connectCode)) {
            const chat = update.message.chat;
            const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || 'Telegram User';
            return new Response(
              JSON.stringify({
                connected: true,
                chatId: String(chat.id),
                telegramUsername: title,
              }),
              {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              }
            );
          }
        }
      }
    }

    return new Response(JSON.stringify({ connected: false }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ connected: false, error: err.message }), {
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
