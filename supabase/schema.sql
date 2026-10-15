-- =========================================================================
-- Supabase Database Schema for Domain Tracker Items
-- Cross-Device Sync linked to auth.uid()
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
    using (auth.uid() = user_id);
