begin;
create temporary table bb_article_test_users as select gen_random_uuid() owner_id, gen_random_uuid() other_id;
grant select on bb_article_test_users to authenticated,anon;
insert into auth.users(id,email) select owner_id,owner_id::text||'@example.invalid' from bb_article_test_users union all select other_id,other_id::text||'@example.invalid' from bb_article_test_users;
insert into public.memberships(user_id,role,plan_code,status,current_period_end)
select owner_id,'player','player_test','active',now()+interval '1 day' from bb_article_test_users
on conflict(user_id,role) do update set status='active',current_period_end=now()+interval '1 day';
select set_config('request.jwt.claims',json_build_object('sub',owner_id,'role','authenticated')::text,true) from bb_article_test_users;
set local role authenticated;
insert into public.player_article_notes(user_id,article_slug,journal_note) select owner_id,'rls-test','owner note' from bb_article_test_users;
do $$begin
 if (select count(*) from public.player_article_notes where article_slug='rls-test')<>1 then raise exception 'owner select failed'; end if;
 update public.player_article_notes set journal_note='updated' where article_slug='rls-test';
 if (select journal_note from public.player_article_notes where article_slug='rls-test')<>'updated' then raise exception 'owner update failed'; end if;
 begin update public.player_article_notes set user_id=(select other_id from bb_article_test_users) where article_slug='rls-test';raise exception 'ownership reassignment allowed'; exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims',json_build_object('sub',other_id,'role','authenticated')::text,true) from bb_article_test_users;
do $$declare n int;begin
 if (select count(*) from public.player_article_notes where article_slug='rls-test')<>0 then raise exception 'cross-owner read allowed';end if;
 update public.player_article_notes set journal_note='intrusion' where article_slug='rls-test';get diagnostics n=row_count;if n<>0 then raise exception 'cross-owner update allowed';end if;
 delete from public.player_article_notes where article_slug='rls-test';get diagnostics n=row_count;if n<>0 then raise exception 'cross-owner delete allowed';end if;
 begin insert into public.player_article_notes(user_id,article_slug)select other_id,'nonmember-test' from bb_article_test_users;raise exception 'nonmember insert allowed';exception when insufficient_privilege then null;end;
 begin insert into public.player_article_notes(user_id,article_slug)select owner_id,'cross-owner-test' from bb_article_test_users;raise exception 'cross-owner insert allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
update public.memberships set current_period_end=now()-interval '1 day' where user_id=(select owner_id from bb_article_test_users) and role='player';
select set_config('request.jwt.claims',json_build_object('sub',owner_id,'role','authenticated')::text,true) from bb_article_test_users;
set local role authenticated;
do $$declare n int;begin
 if (select count(*) from public.player_article_notes where article_slug='rls-test')<>1 then raise exception 'expired owner cannot read existing notes';end if;
 update public.player_article_notes set journal_note='expired edit' where article_slug='rls-test';get diagnostics n=row_count;if n<>0 then raise exception 'expired update allowed';end if;
 begin insert into public.player_article_notes(user_id,article_slug)select owner_id,'expired-test' from bb_article_test_users;raise exception 'expired insert allowed';exception when insufficient_privilege then null;end;
 delete from public.player_article_notes where article_slug='rls-test';get diagnostics n=row_count;if n<>1 then raise exception 'owner delete failed';end if;
end$$;
set local role anon;
do $$begin
 begin perform * from public.player_article_notes;raise exception 'anon read allowed';exception when insufficient_privilege then null;end;
 begin insert into public.player_article_notes(user_id,article_slug)select owner_id,'anon-test' from bb_article_test_users;raise exception 'anon insert allowed';exception when insufficient_privilege then null;end;
 begin update public.player_article_notes set bookmark=false;raise exception 'anon update allowed';exception when insufficient_privilege then null;end;
 begin delete from public.player_article_notes;raise exception 'anon delete allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
select 'PASS: owner CRUD, other-user denial, no membership denial, expired writes denied, existing notes readable/deletable, anonymous CRUD denied' as result;
rollback;
