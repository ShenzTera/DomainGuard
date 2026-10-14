// Cloudflare Pages Edge Function: /api/telegram/send-test
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const headerToken = request.headers.get('x-bot-token') || '';
    const botToken = (body.botToken || headerToken || env?.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (body.chatId || '').trim();
    const message = body.message || '🔔 <b>DomainGuard Renewal Alert Test</b>\n\nLive Telegram bot alert delivered successfully!';
    const recipientTitle = body.recipientTitle || (chatId.startsWith('-') ? 'Telegram Group' : 'Telegram User');

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'Chat ID is required. Please select or enter a chat ID.' }), {
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
          error: 'No Telegram Bot Token configured. Click "Configure Bot Token" below to enter your bot token from @BotFather, or set TELEGRAM_BOT_TOKEN in Cloudflare Pages environment variables.',
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
      let friendlyError = tgData.description || 'Telegram Bot rejected message.';
      if (friendlyError.includes('chat not found')) {
        friendlyError = `Chat ID ${chatId} not found. In Telegram, you MUST open the bot and tap START or send a message before the bot can message you. If this is a group, add the bot to the group first.`;
      } else if (friendlyError.includes('bot was blocked')) {
        friendlyError = 'The bot is blocked by this user in Telegram. Please unblock the bot.';
      } else if (friendlyError.includes('bot is not a member')) {
        friendlyError = 'The bot is not a member of the group/channel. Please invite the bot to your group.';
      }

      return new Response(
        JSON.stringify({ error: friendlyError, rawError: tgData.description }),
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
        message: `Live Telegram alert delivered to ${recipientTitle} (Chat ID: ${chatId})!`,
        recipient: recipientTitle,
        messageId: tgData.result?.message_id,
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
      JSON.stringify({ error: err.message || 'Failed to dispatch Telegram message' }),
      {
        status: 500,
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bot-token',
    },
  });
}
