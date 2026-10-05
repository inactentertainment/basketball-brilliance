create table if not exists public.basketball_library_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  slug text not null unique,
  definition text not null,
  coach_cue text,
  common_mistake text,
  category text,
  source_label text,
  created_at timestamptz not null default now()
);
alter table public.basketball_library_terms enable row level security;
drop policy if exists library_terms_public_read on public.basketball_library_terms;
create policy library_terms_public_read on public.basketball_library_terms
for select to anon, authenticated using (true);

create table if not exists public.basketball_library_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  resource_type text not null,
  url text,
  category text,
  age_band text,
  audience text[] not null default array['coach','player','parent']::text[],
  description text,
  source_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.basketball_library_resources enable row level security;
drop policy if exists library_resources_public_read on public.basketball_library_resources;
create policy library_resources_public_read on public.basketball_library_resources
for select to anon, authenticated using (is_active=true);
create index if not exists idx_library_terms_category on public.basketball_library_terms(category);
create index if not exists idx_library_resources_type on public.basketball_library_resources(resource_type);