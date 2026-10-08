create table public.portal_article_notes (
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('coach','parent')),
 article_slug text not null check (article_slug ~ '^[a-z0-9-]{1,80}$'),
 bookmark boolean not null default true,
 highlights jsonb not null default '[]'::jsonb check(jsonb_typeof(highlights)='array' and jsonb_array_length(highlights)<=50 and octet_length(highlights::text)<=50000),
 journal_note text not null default '' check (length(journal_note)<=4000),
 updated_at timestamptz not null default now(),
 primary key(user_id,role,article_slug)
);
alter table public.portal_article_notes enable row level security;
revoke all on public.portal_article_notes from anon, authenticated;
grant select,insert,update,delete on public.portal_article_notes to authenticated;
create policy portal_article_read_own on public.portal_article_notes for select to authenticated using ((select auth.uid())=user_id);
create policy portal_article_delete_own on public.portal_article_notes for delete to authenticated using ((select auth.uid())=user_id);
create policy portal_article_insert_member on public.portal_article_notes for insert to authenticated with check (
 (select auth.uid())=user_id and exists(select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.role::text=portal_article_notes.role and m.status='active' and (m.current_period_end is null or m.current_period_end>now()))
);
create policy portal_article_update_member on public.portal_article_notes for update to authenticated using (
 (select auth.uid())=user_id and exists(select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.role::text=portal_article_notes.role and m.status='active' and (m.current_period_end is null or m.current_period_end>now()))
) with check (
 (select auth.uid())=user_id and exists(select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.role::text=portal_article_notes.role and m.status='active' and (m.current_period_end is null or m.current_period_end>now()))
);
