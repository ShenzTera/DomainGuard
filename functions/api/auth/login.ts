// Cloudflare Pages Edge Function: /api/auth/login
export async function onRequestPost(context: any) {
  try {
    const { request } = context;
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email address is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default accounts validation
    let role = 'member';
    let name = email.split('@')[0];
    let id = `usr_${Date.now()}`;

    if (email === 'admin@domainguard.io') {
      role = 'owner';
      name = 'Admin Lead';
      id = 'usr_admin_default';
    } else if (email === 'demo@domainguard.io') {
      role = 'admin';
      name = 'Demo Engineer';
      id = 'usr_demo_default';
    }

    const token = `token_cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const user = {
      id,
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user,
        message: 'Signed in successfully via Cloudflare Edge Runtime.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Login processing error' }), {
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
