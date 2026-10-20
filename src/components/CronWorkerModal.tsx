import React, { useState } from 'react';
import { Cpu, Copy, Check, X, Shield, ExternalLink, Terminal, Clock } from 'lucide-react';

interface CronWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CRON_WORKER_CODE = `/**
 * Cloudflare Worker: DomainGuard Automated Expiration & Health Monitor
 * Triggered daily via Cloudflare Cron Triggers: "0 8 * * *" (Every day at 08:00 UTC)
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

export default {
  // 1. Scheduled Handler: Cloudflare Cron Trigger
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(\`[DomainGuard Cron] Initiating daily registry sweep: \${event.cron}\`);

    // Fetch domains expiring in <= 30 days directly from Supabase
    const endpoint = \`\${env.SUPABASE_URL}/rest/v1/domains?days_until_expiration=lte.30&select=*\`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: \`Bearer \${env.SUPABASE_ANON_KEY}\`,
      },
    });

    if (!res.ok) {
      console.error('[DomainGuard Cron] Failed to fetch domains from Supabase:', res.statusText);
      return;
    }

    const domains: any[] = await res.json();
    console.log(\`[DomainGuard Cron] Found \${domains.length} priority domains needing alerts.\`);

    // Dispatch Telegram alert if configured
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID && domains.length > 0) {
      const urgentList = domains
        .slice(0, 5)
        .map((d) => \`• <b>\${d.domain}</b>: \${d.days_until_expiration <= 0 ? '🚨 EXPIRED' : \`⚠️ \${d.days_until_expiration} days left\`}\`)
        .join('\\n');

      const text = \`🛡️ <b>DomainGuard Morning Security Sweep</b>\\n\\n\${urgentList}\\n\\nRenew immediately via your registrar.\`;

      await fetch(\`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendMessage\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      });
    }
  },

  // 2. HTTP Fetch Handler: Manual Trigger / Health Endpoint
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response(JSON.stringify({ status: 'online', service: 'DomainGuard Cron Worker v1.0.4' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};`;

const WRANGLER_TOML = `name = "domainguard-cron-worker"
main = "src/index.ts"
compatibility_date = "2024-04-01"

[triggers]
crons = ["0 8 * * *"] # Daily at 08:00 UTC

[vars]
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_ANON_KEY = "your-anon-key"
TELEGRAM_BOT_TOKEN = "your-bot-token"
TELEGRAM_CHAT_ID = "your-chat-id"`;

export const CronWorkerModal: React.FC<CronWorkerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'worker' | 'wrangler'>('worker');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const contentToCopy = activeTab === 'worker' ? CRON_WORKER_CODE : WRANGLER_TOML;

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#101432] rounded-[16px] border border-slate-200 dark:border-[#1F2756] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#1B2050] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/80 dark:border-sky-800/80">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Cloudflare Cron Worker Code
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                  Daily 08:00 UTC
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated 24/7 background domain health monitoring and Telegram dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-[#1B2050] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('worker')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'worker'
                ? 'border-[#0284c7] text-[#0284c7] dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            worker.ts (Cloudflare Worker)
          </button>
          <button
            onClick={() => setActiveTab('wrangler')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'wrangler'
                ? 'border-[#0284c7] text-[#0284c7] dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            wrangler.toml (Config & Cron Triggers)
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick instructions banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#161C40] rounded-xl border border-slate-200/80 dark:border-[#1F2756] text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                How to deploy on Cloudflare Workers (Free):
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11.5px]">
                Run <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">npx wrangler deploy</code> in your worker directory, or create a Worker in the Cloudflare Dashboard under <strong>Workers &amp; Pages &gt; Create Worker &gt; Triggers &gt; Cron</strong>.
              </p>
            </div>
          </div>

          {/* Code Block with Copy Button */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#1F2756] bg-slate-900">
            <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                {activeTab === 'worker' ? 'worker.ts' : 'wrangler.toml'}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[12px] font-mono text-sky-300 leading-relaxed overflow-x-auto max-h-[360px]">
              <code>{contentToCopy}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#1B2050] bg-slate-50 dark:bg-[#161C40] flex items-center justify-between">
          <a
            href="https://dash.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#0284c7] hover:underline flex items-center gap-1 font-medium"
          >
            Open Cloudflare Workers Dashboard
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
