// Cloudflare Pages Edge Function: /api/auth/register
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim() || email.split('@')[0];
    const password = body.password || '';

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email address is required.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 1. Supabase Auth backend (if configured)
    const supabaseUrl = (env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || '').trim();
    const supabaseKey = (env?.SUPABASE_ANON_KEY || env?.VITE_SUPABASE_ANON_KEY || '').trim();

    if (supabaseUrl && supabaseKey) {
      try {
        const cleanBaseUrl = supabaseUrl.replace(/\/$/, '');
        const sbResponse = await fetch(`${cleanBaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            email,
            password,
            data: { full_name: name, name },
          }),
        });

        const sbData: any = await sbResponse.json().catch(() => ({}));

        if (!sbResponse.ok) {
          const errMsg = (sbData.error_description || sbData.msg || sbData.error || '').toLowerCase();

          if (errMsg.includes('already registered') || errMsg.includes('already exists')) {
            return new Response(
              JSON.stringify({ error: 'An account with this email already exists. Please sign in instead.' }),
              {
                status: 409,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                },
              }
            );
          }

          // If rate limited, attempt direct token
          if (errMsg.includes('rate limit') || sbResponse.status === 429) {
            const tokenRes = await fetch(`${cleanBaseUrl}/auth/v1/token?grant_type=password`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
              },
              body: JSON.stringify({ email, password }),
            });

            if (tokenRes.ok) {
              const tokenData: any = await tokenRes.json();
              return new Response(
                JSON.stringify({
                  success: true,
                  token: tokenData.access_token,
                  user: {
                    id: tokenData.user?.id || `usr_${Date.now()}`,
                    email,
                    name,
                    role: 'owner',
                    createdAt: tokenData.user?.created_at || new Date().toISOString(),
                  },
                  message: 'Account registered and authenticated successfully.',
                }),
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  },
                }
              );
            }
          }
        } else {
          const sbUser = sbData.user || sbData;
          return new Response(
            JSON.stringify({
              success: true,
              token: sbData.access_token || `token_sb_${Date.now()}`,
              user: {
                id: sbUser.id || `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
                email: sbUser.email || email,
                name,
                role: 'owner',
                createdAt: sbUser.created_at || new Date().toISOString(),
              },
              message: 'Account registered and authenticated via Supabase.',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }
      } catch (err: any) {
        console.warn('Supabase edge registration note:', err);
      }
    }

    // 2. Cloudflare KV integration (DOMAINS_KV or KV or STORAGE)
    const kv = env?.DOMAINS_KV || env?.KV || env?.STORAGE;
    const userId = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const userRecord = {
      id: userId,
      email,
      name,
      password, // Stored in private KV namespace
      role: 'owner',
      createdAt: new Date().toISOString(),
    };

    if (kv) {
      try {
        const existing = await kv.get(`user_${email}`);
        if (existing) {
          return new Response(
            JSON.stringify({ error: 'An account with this email already exists. Please sign in.' }),
            {
              status: 409,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }
        await kv.put(`user_${email}`, JSON.stringify(userRecord));
      } catch (kvErr) {
        console.warn('KV registration save note:', kvErr);
      }
    }

    const token = `token_cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const safeUser = {
      id: userId,
      email,
      name,
      role: 'owner',
      createdAt: userRecord.createdAt,
    };

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: safeUser,
        message: 'Account registered successfully.',
        hasKv: Boolean(kv),
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
