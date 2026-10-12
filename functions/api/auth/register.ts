// Cloudflare Pages Edge Function: /api/auth/register
export async function onRequestPost(context: any) {
  try {
    const { request } = context;
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim() || email.split('@')[0];
    const password = body.password || '';

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email address is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = `token_cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const user = {
      id: `usr_${Date.now()}`,
      email,
      name,
      role: 'owner',
      createdAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user,
        message: 'Account registered and authenticated on Cloudflare Pages.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Registration processing error' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
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
