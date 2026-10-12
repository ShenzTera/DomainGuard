// Cloudflare Pages Edge Function: /api/auth/login
export async function onRequestPost(context: any) {
  try {
    const { request } = context;
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email address is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!password) {
      return new Response(JSON.stringify({ error: 'Password is required to sign in.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Explicit password verification for known seeded accounts
    let role = 'member';
    let name = email.split('@')[0];
    let id = `usr_${Date.now()}`;

    if (email === 'admin@domainguard.io') {
      if (password !== 'Admin123!') {
        return new Response(JSON.stringify({ error: 'Invalid password. Please check your credentials.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      role = 'owner';
      name = 'Admin Lead';
      id = 'usr_admin_default';
    } else if (email === 'demo@domainguard.io') {
      if (password !== 'Demo123!') {
        return new Response(JSON.stringify({ error: 'Invalid password. Please check your credentials.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      role = 'admin';
      name = 'Demo Engineer';
      id = 'usr_demo_default';
    } else {
      // Require registration for unknown accounts
      return new Response(
        JSON.stringify({
          error: 'No account registered with this email on Cloudflare Edge. Please create an account first.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
