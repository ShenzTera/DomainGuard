// Cloudflare Pages Edge Function: /api/telegram/available-chats
export async function onRequestGet(context: any) {
  try {
    const { env } = context;
    const botToken = (env?.TELEGRAM_BOT_TOKEN || '').trim();

    if (!botToken) {
      return new Response(JSON.stringify({ chats: [] }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=20`);
    const updatesData: any = await updatesRes.json().catch(() => ({}));

    const chatsMap = new Map<string, any>();
    if (updatesData.ok && Array.isArray(updatesData.result)) {
      for (const update of updatesData.result) {
        const msg = update.message || update.channel_post || update.my_chat_member;
        const chat = msg?.chat;
        if (chat && chat.id) {
          const id = String(chat.id);
          const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || 'Direct Chat';
          chatsMap.set(id, {
            id,
            title,
            type: chat.type === 'supergroup' || chat.type === 'group' || chat.type === 'channel' ? 'group' : 'direct',
            isCurrent: false,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        chats: Array.from(chatsMap.values()),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ chats: [], error: err.message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
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
