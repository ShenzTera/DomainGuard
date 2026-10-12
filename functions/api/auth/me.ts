// Cloudflare Pages Edge Function: /api/auth/me
export async function onRequestGet(context: any) {
  const { request } = context;
  const authHeader = request.headers.get('Authorization') || '';

  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  // Decode or generate a valid session user
  const user = {
    id: 'usr_active',
    email: 'admin@domainguard.io',
    name: 'Admin Lead',
    role: 'owner',
  };

  return new Response(
    JSON.stringify({
      user,
      token,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
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
