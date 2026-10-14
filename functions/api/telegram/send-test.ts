// Cloudflare Pages Edge Function: /api/telegram/send-test
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const botToken = (body.botToken || '').trim() || (env?.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (body.chatId || '').trim();
    const message = body.message || '🔔 <b>DomainGuard Renewal Alert Test</b>\n\nLive Telegram bot alert delivered successfully!';
    const recipientTitle = body.recipientTitle || (chatId.startsWith('-') ? 'Telegram Group' : 'Telegram User');

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'Chat ID is required.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!botToken) {
      return new Response(
        JSON.stringify({
          error: 'No Telegram Bot Token configured. Click "Configure Bot Token" to enter your bot token from @BotFather.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
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
      return new Response(
        JSON.stringify({ error: tgData.description || 'Telegram Bot rejected message. Ensure bot is added to the group/chat.' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test alert successfully delivered to ${recipientTitle} on Telegram! Check your chat.`,
        recipient: recipientTitle,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Telegram test error' }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
