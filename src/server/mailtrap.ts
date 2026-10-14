import nodemailer from 'nodemailer';

export interface MailtrapEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  fromName?: string;
  apiToken?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
}

export interface MailtrapSendResult {
  success: boolean;
  provider: 'mailtrap-smtp' | 'mailtrap-api';
  messageId?: string;
  recipients: string[];
  message: string;
  logsUrl: string;
}

/**
 * Sends transactional email via Mailtrap SMTP (live.smtp.mailtrap.io:587)
 * using the project's environment variables or custom configuration,
 * with automatic fallback to Mailtrap Email Sending API.
 */
export async function sendMailtrapEmail(options: MailtrapEmailOptions): Promise<MailtrapSendResult> {
  const token = (options.apiToken || process.env.MAILTRAP_API_TOKEN || '').trim();
  const host = (options.smtpHost || process.env.MAILTRAP_SMTP_HOST || 'live.smtp.mailtrap.io').trim();
  const port = Number(options.smtpPort || process.env.MAILTRAP_SMTP_PORT) || 587;
  const user = (options.smtpUser || process.env.MAILTRAP_SMTP_USER || 'api').trim();
  const fromEmail = (options.from || process.env.MAILTRAP_SENDER_EMAIL || 'hello@demomailtrap.co').trim();
  const fromName = (options.fromName || process.env.MAILTRAP_SENDER_NAME || 'DomainGuard Alerts').trim();

  // Normalize recipient list
  const recipients = (Array.isArray(options.to) ? options.to : [options.to])
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'));

  if (recipients.length === 0) {
    throw new Error('At least one valid recipient email address is required.');
  }

  if (!token) {
    throw new Error('Mailtrap API token is required. Set MAILTRAP_API_TOKEN in your environment or enter it in settings.');
  }

  const logsUrl = 'https://mailtrap.io/sending/email_logs';

  // 1. Primary Strategy: Mailtrap SMTP via Nodemailer (smtp://live.smtp.mailtrap.io:587)
  let smtpError: Error | null = null;
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // port 587 uses STARTTLS (equivalent to --ssl-reqd)
      auth: {
        user,
        pass: token,
      },
      tls: {
        rejectUnauthorized: true,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipients.join(', '),
      subject: options.subject,
      text: options.text || (options.html ? options.html.replace(/<[^>]*>/g, '') : ''),
      html: options.html,
    });

    return {
      success: true,
      provider: 'mailtrap-smtp',
      messageId: info.messageId,
      recipients,
      message: `Email successfully delivered via Mailtrap SMTP (${host}:${port}) to ${recipients.join(', ')}.`,
      logsUrl,
    };
  } catch (err: any) {
    smtpError = err;
    console.warn(`[Mailtrap SMTP] Socket dispatch issue (${err.message}). Attempting Mailtrap Sending API fallback...`);
  }

  // 2. Secondary Strategy: Mailtrap Email Sending API (https://send.api.mailtrap.io/api/send)
  // This ensures delivery even if port 587 is restricted by local network or container firewalls
  try {
    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: recipients.map((r) => ({ email: r })),
        subject: options.subject,
        text: options.text || (options.html ? options.html.replace(/<[^>]*>/g, '') : ''),
        html: options.html,
        category: 'DomainGuard Notification',
      }),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiErrors = Array.isArray(data.errors) ? data.errors.join(', ') : (data.message || response.statusText);
      throw new Error(`Mailtrap API returned ${response.status}: ${apiErrors}`);
    }

    const messageIds = data.message_ids || [data.id || 'sent'];

    return {
      success: true,
      provider: 'mailtrap-api',
      messageId: messageIds[0],
      recipients,
      message: `Email successfully delivered via Mailtrap API to ${recipients.join(', ')}.`,
      logsUrl,
    };
  } catch (apiErr: any) {
    throw new Error(
      `Mailtrap delivery failed. SMTP Error: ${smtpError?.message || 'unknown'}. API Error: ${apiErr.message}. Check your token and verified sending domain in Mailtrap.`
    );
  }
}
