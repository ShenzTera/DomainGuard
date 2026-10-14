// Cloudflare Pages Edge Function: /api/telegram/manual-chat-id
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const chatId = (body.chatId || '').trim();
    const userId = body.userId;
    const username = (body.username || '').trim() || (chatId.startsWith('-') ? 'Telegram Group' : 'Telegram User');
    const customToken = (body.botToken || '').trim() || (env?.TELEGRAM_BOT_TOKEN || '').trim();

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'Chat ID is required.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    let resolvedTitle = username;

    // If bot token is available, attempt to verify chat via Telegram Bot API
    if (customToken) {
      try {
        const chatRes = await fetch(`https://api.telegram.org/bot${customToken}/getChat?chat_id=${encodeURIComponent(chatId)}`);
        const chatData: any = await chatRes.json().catch(() => ({}));
        if (chatRes.ok && chatData.ok && chatData.result) {
          resolvedTitle = chatData.result.title || chatData.result.username || chatData.result.first_name || resolvedTitle;
        }
      } catch {
        // Fall back to provided label if getChat restricted
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        chatId,
        telegramUsername: resolvedTitle,
        message: `Telegram destination (${resolvedTitle}) linked successfully!`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to save manual Chat ID' }), {
      status: 500,
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
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
