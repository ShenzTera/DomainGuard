import React, { useState } from 'react';
import { Database, Copy, Check, X, Shield, ExternalLink, Terminal } from 'lucide-react';

interface SupabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCHEMA_SQL = `-- =========================================================================
-- Supabase Database Schema for DomainGuard
-- Multi-Tenant Persistence with Row Level Security (RLS) linked to auth.uid()
-- =========================================================================

-- 1. Create table public.domains
create table if not exists public.domains (
    id text not null,
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    domain text not null,
    company text default '',
    working_status text default 'active',
    registrar text default '',
    registrar_portal_url text default '',
    expiration_date text default '',
    registration_date text default '',
    days_until_expiration integer default 0,
    is_resolving boolean default true,
    nameservers text[] default array[]::text[],
    dns_ips text[] default array[]::text[],
    portfolio text default 'Core Infrastructure',
    assigned_employees text[] default array[]::text[],
    last_checked_at text default '',
    renewal_alerts jsonb default '{"warn30Days": true, "warn15Days": true, "warn7Days": true, "continuousReminderEvery2Days": true}'::jsonb,
    notes text default '',
    whois_source text default '',
    http_status_code integer,
    http_status_text text,
    http_latency_ms integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id, user_id)
);

-- 2. Indexes for high performance querying
create index if not exists idx_domains_user_id on public.domains(user_id);
create index if not exists idx_domains_domain on public.domains(domain);
create index if not exists idx_domains_days_until_expiration on public.domains(days_until_expiration);

-- 3. Enable Row Level Security (RLS)
alter table public.domains enable row level security;

-- 4. Row Level Security Policies (Enforces auth.uid() isolation across all operations)
drop policy if exists "Users can view their own domains" on public.domains;
create policy "Users can view their own domains"
    on public.domains for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert their own domains" on public.domains;
create policy "Users can insert their own domains"
    on public.domains for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update their own domains" on public.domains;
create policy "Users can update their own domains"
    on public.domains for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own domains" on public.domains;
create policy "Users can delete their own domains"
    on public.domains for delete
    using (auth.uid() = user_id);`;

export const SupabaseSchemaModal: React.FC<SupabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#101432] rounded-[16px] border border-slate-200 dark:border-[#1F2756] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#1B2050] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/80">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Supabase SQL Schema
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  RLS Hardened
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute this in your Supabase SQL Editor to enable persistent multi-user domain tracking
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick instructions banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#161C40] rounded-xl border border-slate-200/80 dark:border-[#1F2756] text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                How to apply to your Supabase project:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-500 dark:text-slate-400 text-[11.5px]">
                <li>Open your Supabase dashboard and click <strong>SQL Editor</strong> in the left sidebar.</li>
                <li>Click <strong>New Query</strong>, paste the SQL below, and click <strong>Run</strong>.</li>
                <li>Your database is now ready with Row Level Security (RLS) ensuring each user only accesses their own domains.</li>
              </ol>
            </div>
          </div>

          {/* SQL Block with Copy Button */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#1F2756] bg-slate-900">
            <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                schema.sql
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
                    Copy SQL
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[12px] font-mono text-emerald-400 leading-relaxed overflow-x-auto max-h-[380px]">
              <code>{SCHEMA_SQL}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#1B2050] bg-slate-50 dark:bg-[#161C40] flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#0284c7] hover:underline flex items-center gap-1 font-medium"
          >
            Open Supabase Dashboard
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
