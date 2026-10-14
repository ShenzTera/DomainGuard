// Cloudflare Pages Edge Function: /api/notify/email
// Dispatches real expiration warning emails to Gmail and corporate recipients
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));

    const {
      toEmail,
      toEmails,
      subject,
      domains,
      urgency,
      emailApiKey,
      emailProvider,
      senderEmail,
    } = body;

    // Normalize recipient addresses
    let recipients: string[] = [];
    if (Array.isArray(toEmails) && toEmails.length > 0) {
      recipients = toEmails
        .map((e: string) => String(e).trim().toLowerCase())
        .filter((e: string) => e.includes('@'));
    } else if (typeof toEmail === 'string' && toEmail.includes('@')) {
      recipients = [toEmail.trim().toLowerCase()];
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one valid recipient email address is required.' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const alertSubject = subject || `⚠️ DomainGuard Expiration Alert (${urgency || 'Priority Warning'})`;
    const domainListText =
      Array.isArray(domains) && domains.length > 0
        ? domains.join(', ')
        : 'Monitored Domain Portfolio';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; color: #111827;">DomainGuard Security & Expiration Alert</h2>
          <span style="font-size: 12px; color: #6b7280; font-family: monospace;">Automated Domain Lifecycle Intelligence</span>
        </div>
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">
          One or more of your registered domains are approaching their expiration threshold:
        </p>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <strong style="color: #92400e; font-size: 14px;">Urgency Level: ${urgency || 'High Priority'}</strong>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #78350f; font-family: monospace;">
            ${domainListText}
          </p>
        </div>
        <p style="font-size: 13px; color: #4b5563; line-height: 1.5;">
          Per renewal policy, continuous 48-hour reminders remain active until renewal confirmation is detected via ICANN WHOIS/RDAP.
        </p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          Dispatched by DomainGuard to ${recipients.length} configured alert address(es): ${recipients.join(', ')}
        </div>
      </div>
    `;

    // 1. Live transactional delivery via Resend (https://resend.com)
    const headerApiKey = request.headers.get('x-email-api-key') || '';
    const activeResendKey = (emailApiKey || headerApiKey || env?.RESEND_API_KEY || '').trim();

    if (activeResendKey && (activeResendKey.startsWith('re_') || emailProvider === 'resend')) {
      try {
        const fromAddress = senderEmail || 'DomainGuard Alerts <onboarding@resend.dev>';
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeResendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: recipients,
            subject: alertSubject,
            html: htmlContent,
          }),
        });

        const resendData: any = await resendRes.json().catch(() => ({}));

        if (resendRes.ok) {
          return new Response(
            JSON.stringify({
              success: true,
              liveDelivered: true,
              provider: 'Resend Live Email API',
              recipients,
              message: `Live email alert delivered directly to ${recipients.length} inbox(es): ${recipients.join(', ')}.`,
              resendId: resendData.id,
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        } else {
          let errorMsg = resendData.message || 'Resend rejected email dispatch.';
          if (errorMsg.includes('only send testing emails to your own email address')) {
            errorMsg = `Resend Free Tier Restriction: You can currently only send test emails to your registered Resend account address. To send to other addresses (${recipients.join(', ')}), add and verify your custom domain in Resend (resend.com/domains).`;
          } else if (errorMsg.includes('API key is invalid') || resendRes.status === 401) {
            errorMsg = 'Invalid Resend API Key. Please get a free API key from https://resend.com/api-keys';
          }

          return new Response(
            JSON.stringify({
              error: errorMsg,
              provider: 'Resend',
              statusCode: resendRes.status,
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
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || 'Failed connecting to Resend API.' }),
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

    // 2. In-App Notification Gateway (When no third-party email API key configured)
    return new Response(
      JSON.stringify({
        success: true,
        liveDelivered: false,
        simulated: true,
        provider: 'DomainGuard In-App Gateway',
        recipients,
        message: `Alert recorded for ${recipients.length} address(es): ${recipients.join(', ')}. To deliver directly to real Gmail inboxes, add a free Resend API key in Settings (or set RESEND_API_KEY in Cloudflare Pages environment variables).`,
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
      JSON.stringify({ error: err.message || 'Internal email dispatch error' }),
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-email-api-key',
    },
  });
}
