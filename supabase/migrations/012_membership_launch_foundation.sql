create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('coach','parent','player')),
  plan_code text not null,
  status text not null default 'preview' check (status in ('preview','active','past_due','canceled','expired')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,role)
);
alter table public.memberships enable row level security;
drop policy if exists memberships_self_read on public.memberships;
create policy memberships_self_read on public.memberships for select to authenticated using (user_id=auth.uid());
create index if not exists idx_memberships_user_role on public.memberships(user_id,role);