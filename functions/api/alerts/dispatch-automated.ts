// Cloudflare Pages Edge Function: /api/alerts/dispatch-automated
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const domains: any[] = Array.isArray(body.domains) ? body.domains : [];
    const headerToken = request.headers.get('x-bot-token') || '';
    const botToken = (body.botToken || headerToken || env?.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (body.chatId || env?.TELEGRAM_CHAT_ID || '').trim();

    const critical = domains.filter(
      (d: any) => (d.daysUntilExpiration != null && d.daysUntilExpiration <= 30) || !d.isResolving
    );

    let telegramSent = false;
    let telegramError = null;

    if (botToken && chatId && critical.length > 0) {
      try {
        const text =
          `🚨 <b>DomainGuard Automated Expiration Scan</b>\n\n` +
          `The following domain(s) require renewal attention:\n` +
          critical
            .map(
              (d: any) =>
                `• <b>${d.domain}</b> — ${
                  d.daysUntilExpiration <= 0
                    ? '🔴 EXPIRED'
                    : d.daysUntilExpiration <= 7
                    ? `⚠️ ${d.daysUntilExpiration} days remaining (CRITICAL)`
                    : `⏳ ${d.daysUntilExpiration} days remaining`
                }`
            )
            .join('\n') +
          `\n\n<i>Next check in 48 hours or upon dashboard refresh.</i>`;

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
          }),
        });

        const tgData: any = await tgRes.json().catch(() => ({}));
        telegramSent = tgRes.ok && tgData.ok;
        if (!telegramSent) {
          telegramError = tgData.description;
        }
      } catch (err: any) {
        telegramError = err.message;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertDispatched: critical.length > 0,
        totalFlagged: critical.length,
        telegramDelivered: telegramSent,
        telegramError,
        message: `Automated alert scan completed (${critical.length} flagged domains).`,
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
      JSON.stringify({ success: false, error: err.message }),
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bot-token',
    },
  });
}
