// Cloudflare Pages Edge Function: /api/notify/email
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { toEmail, toEmails, subject, domains, urgency, senderEmail, emailApiKey } = body;

    let recipients: string[] = [];
    if (Array.isArray(toEmails) && toEmails.length > 0) {
      recipients = toEmails.map((e: string) => e.trim().toLowerCase()).filter((e: string) => e.includes('@'));
    } else if (typeof toEmail === 'string' && toEmail.includes('@')) {
      recipients = [toEmail.trim().toLowerCase()];
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one valid recipient email address is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const alertSubject = subject || `⚠️ DomainGuard Expiration Alert (${urgency || 'Priority Warning'})`;
    const domainListText = Array.isArray(domains) ? domains.join(', ') : 'Monitored portfolio domains';

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="margin: 0 0 12px 0; color: #111827;">DomainGuard Security Alert</h2>
        <p style="color: #374151;">One or more monitored domains are approaching expiration threshold:</p>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0;">
          <strong>Urgency: ${urgency || 'High Priority'}</strong>
          <p style="margin: 6px 0 0 0; font-family: monospace;">${domainListText}</p>
        </div>
        <p style="font-size: 12px; color: #6b7280;">Continuous 48-hour reminders active until renewal verified.</p>
      </div>
    `;

    const mailtrapToken = (emailApiKey || env?.MAILTRAP_API_TOKEN || '').trim();
    const fromAddress = senderEmail || env?.MAILTRAP_SENDER_EMAIL || 'hello@demomailtrap.co';
    const fromName = env?.MAILTRAP_SENDER_NAME || 'DomainGuard Alerts';

    if (mailtrapToken) {
      const response = await fetch('https://send.api.mailtrap.io/api/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailtrapToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { email: fromAddress, name: fromName },
          to: recipients.map((r) => ({ email: r })),
          subject: alertSubject,
          text: `DomainGuard Alert: ${domainListText} (${urgency || 'Urgent'})`,
          html: htmlContent,
          category: 'DomainGuard Cloudflare Alert',
        }),
      });

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        return new Response(JSON.stringify({ error: `Mailtrap API error: ${JSON.stringify(data)}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'mailtrap',
          recipients,
          logsUrl: 'https://mailtrap.io/sending/email_logs',
          message: `Email alert delivered via Mailtrap API to ${recipients.join(', ')}. Check logs at https://mailtrap.io/sending/email_logs`,
        }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Default response if no key configured
    return new Response(
      JSON.stringify({
        success: true,
        provider: 'native',
        recipients,
        message: `Alert recorded for ${recipients.length} address(es): ${recipients.join(', ')}. Set MAILTRAP_API_TOKEN in Cloudflare environment variables for live delivery.`,
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Email dispatch error' }), {
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
