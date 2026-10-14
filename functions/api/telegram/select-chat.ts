// Cloudflare Pages Edge Function: /api/telegram/select-chat
export async function onRequestPost(context: any) {
  try {
    const { request } = context;
    const body = await request.json().catch(() => ({}));
    const chatId = (body.chatId || '').trim();
    const chatTitle = (body.chatTitle || '').trim() || (chatId.startsWith('-') ? 'Telegram Group' : 'Direct Message');

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'Chat ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        chatId,
        telegramUsername: chatTitle,
        message: `Active Telegram destination switched to "${chatTitle}"!`,
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Select chat error' }), {
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
