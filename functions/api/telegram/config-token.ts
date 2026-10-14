// Cloudflare Pages Edge Function: /api/telegram/config-token
export async function onRequestPost(context: any) {
  try {
    const { request } = context;
    const body = await request.json().catch(() => ({}));
    const botToken = (body.botToken || '').trim();

    if (!botToken) {
      return new Response(JSON.stringify({ error: 'Bot Token is required.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const testRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const testData: any = await testRes.json().catch(() => ({}));

    if (!testRes.ok || !testData.ok || !testData.result?.username) {
      return new Response(
        JSON.stringify({ error: testData.description || 'Invalid Telegram Bot Token. Verify token format from @BotFather.' }),
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
        botUsername: testData.result.username,
        botName: testData.result.first_name || 'DomainGuard Bot',
        message: `Bot @${testData.result.username} verified successfully!`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Verification error' }), {
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
