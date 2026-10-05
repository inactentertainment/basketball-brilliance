create table if not exists public.parent_children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  graduation_year integer,
  grade text,
  primary_position text,
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.parent_passport_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid references public.parent_children(id) on delete cascade,
  season text,
  team text not null,
  coach text,
  level text,
  position text,
  milestones text,
  created_at timestamptz not null default now()
);
create table if not exists public.parent_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid references public.parent_children(id) on delete cascade,
  title text not null,
  opportunity_type text,
  organization text,
  event_date date,
  deadline date,
  cost numeric(10,2),
  url text,
  status text not null default 'researching',
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.parent_recruiting (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid references public.parent_children(id) on delete cascade,
  school text not null,
  level text,
  fit text,
  contact_name text,
  contact_email text,
  status text not null default 'researching',
  next_step text,
  next_step_date date,
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.parent_next_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid references public.parent_children(id) on delete cascade,
  title text not null,
  due_date date,
  category text,
  status text not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.parent_vault_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid references public.parent_children(id) on delete cascade,
  title text not null,
  document_type text,
  storage_path text,
  external_url text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.parent_children enable row level security;
alter table public.parent_passport_entries enable row level security;
alter table public.parent_opportunities enable row level security;
alter table public.parent_recruiting enable row level security;
alter table public.parent_next_steps enable row level security;
alter table public.parent_vault_documents enable row level security;
drop policy if exists parent_children_self on public.parent_children;
create policy parent_children_self on public.parent_children for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists parent_passport_self on public.parent_passport_entries;
create policy parent_passport_self on public.parent_passport_entries for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists parent_opportunities_self on public.parent_opportunities;
create policy parent_opportunities_self on public.parent_opportunities for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists parent_recruiting_self on public.parent_recruiting;
create policy parent_recruiting_self on public.parent_recruiting for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists parent_next_steps_self on public.parent_next_steps;
create policy parent_next_steps_self on public.parent_next_steps for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists parent_vault_self on public.parent_vault_documents;
create policy parent_vault_self on public.parent_vault_documents for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
insert into storage.buckets (id,name,public) values ('parent-vault','parent-vault',false) on conflict (id) do nothing;
drop policy if exists parent_vault_storage_select on storage.objects;
create policy parent_vault_storage_select on storage.objects for select to authenticated using (bucket_id='parent-vault' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists parent_vault_storage_insert on storage.objects;
create policy parent_vault_storage_insert on storage.objects for insert to authenticated with check (bucket_id='parent-vault' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists parent_vault_storage_delete on storage.objects;
create policy parent_vault_storage_delete on storage.objects for delete to authenticated using (bucket_id='parent-vault' and (storage.foldername(name))[1]=auth.uid()::text);
create index if not exists idx_parent_children_user on public.parent_children(user_id,created_at desc);
create index if not exists idx_parent_passport_user on public.parent_passport_entries(user_id,created_at desc);
create index if not exists idx_parent_opps_user on public.parent_opportunities(user_id,event_date);
create index if not exists idx_parent_recruiting_user on public.parent_recruiting(user_id,next_step_date);
create index if not exists idx_parent_steps_user on public.parent_next_steps(user_id,due_date);
create index if not exists idx_parent_vault_user on public.parent_vault_documents(user_id,created_at desc);