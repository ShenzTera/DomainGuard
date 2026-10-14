// Cloudflare Pages Edge Function: /api/telegram/verify-status
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const headerToken = request.headers.get('x-bot-token') || '';
    const connectCode = (body.connectCode || body.verificationCode || body.code || '').trim();
    const botToken = (body.botToken || headerToken || env?.TELEGRAM_BOT_TOKEN || '').trim();

    if (!botToken) {
      return new Response(
        JSON.stringify({
          connected: false,
          error: 'No Bot Token provided. Enter your bot token in settings.',
        }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=30`);
    const updatesData: any = await updatesRes.json().catch(() => ({}));

    if (!updatesRes.ok || !updatesData.ok) {
      const desc = updatesData.description || 'Could not fetch Telegram updates';
      return new Response(
        JSON.stringify({
          connected: false,
          error: desc.includes('webhook')
            ? 'Webhook conflict: A webhook is currently active on your bot. Clear it by visiting: https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook'
            : desc,
        }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    if (Array.isArray(updatesData.result) && updatesData.result.length > 0) {
      // 1. First priority: Match message text with connect code
      if (connectCode) {
        for (const update of [...updatesData.result].reverse()) {
          const msg = update.message || update.channel_post || update.my_chat_member;
          const text = msg?.text || msg?.caption || '';
          if (text.includes(connectCode) && msg?.chat) {
            const chat = msg.chat;
            const title =
              chat.title ||
              [chat.first_name, chat.last_name].filter(Boolean).join(' ') ||
              chat.username ||
              'Telegram Chat';
            return new Response(
              JSON.stringify({
                connected: true,
                chatId: String(chat.id),
                telegramUsername: title,
                isGroupChat: chat.type === 'group' || chat.type === 'supergroup' || chat.type === 'channel',
                message: `Successfully verified and connected to ${title}!`,
              }),
              {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              }
            );
          }
        }
      }

      // 2. Second priority: If no specific code matched, find the latest active chat from recent messages
      const latestUpdate = [...updatesData.result].reverse().find((u) => u.message?.chat || u.channel_post?.chat);
      if (latestUpdate) {
        const chat = latestUpdate.message?.chat || latestUpdate.channel_post?.chat;
        if (chat && chat.id) {
          const title =
            chat.title ||
            [chat.first_name, chat.last_name].filter(Boolean).join(' ') ||
            chat.username ||
            'Telegram Chat';
          return new Response(
            JSON.stringify({
              connected: true,
              chatId: String(chat.id),
              telegramUsername: title,
              isGroupChat: chat.type === 'group' || chat.type === 'supergroup' || chat.type === 'channel',
              message: `Connected to latest active conversation (${title})!`,
            }),
            {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        connected: false,
        message: 'No messages received yet. Please open your bot in Telegram, tap START or send a message, then click Check Verification.',
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ connected: false, error: err.message || 'Verification error' }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
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
