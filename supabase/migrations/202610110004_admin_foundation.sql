begin;
alter table public.seller_listings drop constraint seller_listings_status_check;
alter table public.seller_listings add constraint seller_listings_status_check check(status in ('draft','pending_review','under_review','changes_required','approved','rejected'));
-- Replace the earlier two-state timestamp invariant without relying on its auto-name.
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid='public.seller_listings'::regclass and contype='c' and pg_get_constraintdef(oid) like '%submitted_at%' loop
    execute format('alter table public.seller_listings drop constraint %I',c.conname);
  end loop;
end $$;
alter table public.seller_listings add constraint seller_submission_time check((status='draft')=(submitted_at is null));
alter table public.seller_listings add column last_submitted_at timestamptz;
alter table public.seller_listings add column resubmitted_at timestamptz;
alter table public.seller_listings add column public_feedback text check(char_length(public_feedback)<=1000);
alter table public.seller_listings add column correction_scopes jsonb not null default '[]'::jsonb check(jsonb_typeof(correction_scopes)='array' and jsonb_array_length(correction_scopes)<=6);
update public.seller_listings set last_submitted_at=submitted_at where submitted_at is not null;
create index seller_review_queue_idx on public.seller_listings(status,last_submitted_at,id) where status<>'draft';
create policy admin_submissions_read on public.seller_listings for select to authenticated
using(status<>'draft' and exists(select 1 from public.admin_grants g where g.user_id=(select auth.uid())));
create policy admin_submitted_profiles_read on public.profiles for select to authenticated
using(exists(select 1 from public.admin_grants g where g.user_id=(select auth.uid())) and exists(select 1 from public.seller_listings l where l.owner_id=profiles.id and l.status<>'draft'));
create policy admin_submitted_photos_read on public.seller_listing_photos for select to authenticated
using(exists(select 1 from public.admin_grants g where g.user_id=(select auth.uid())) and exists(select 1 from public.seller_listings l where l.id=listing_id and l.status<>'draft'));
create policy admin_submitted_photo_objects_read on storage.objects for select to authenticated
using(bucket_id='seller-draft-photos' and exists(select 1 from public.admin_grants g where g.user_id=(select auth.uid())) and exists(select 1 from public.seller_listing_photos p join public.seller_listings l on l.id=p.listing_id where p.storage_path=name and l.status<>'draft'));

create function public.admin_review_queue(p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare v_page integer:=coalesce((p_input->>'page')::integer,1); v_status text:=coalesce(p_input->>'status','waiting'); v_q text:=coalesce(btrim(p_input->>'q'),''); v_sort text:=coalesce(p_input->>'sort','oldest'); v_count integer; v_rows jsonb;
begin
  if not exists(select 1 from public.admin_grants where user_id=auth.uid()) then raise exception 'admin_required' using errcode='42501'; end if;
  if v_page not between 1 and 1000 or char_length(v_q)>80 or v_sort not in ('oldest','newest') or v_status not in ('waiting','pending_review','under_review','changes_required','approved','rejected','all') then raise exception 'invalid_filters' using errcode='23514'; end if;
  if coalesce(p_input->>'from','')<>'' and p_input->>'from' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'invalid_date' using errcode='23514'; end if;
  if coalesce(p_input->>'to','')<>'' and p_input->>'to' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'invalid_date' using errcode='23514'; end if;
  select count(*) into v_count from public.seller_listings l where l.status<>'draft'
    and (v_status='all' or (v_status='waiting' and l.status in ('pending_review','under_review')) or l.status=v_status)
    and position(lower(v_q) in lower(coalesce(l.details->>'make','')||' '||coalesce(l.details->>'model','')||' '||coalesce(l.details->>'year','')))>0
    and (coalesce(p_input->>'from','')='' or coalesce(l.last_submitted_at,l.submitted_at)>=(nullif(p_input->>'from','')::date::timestamp at time zone 'Asia/Colombo'))
    and (coalesce(p_input->>'to','')='' or coalesce(l.last_submitted_at,l.submitted_at)<((nullif(p_input->>'to','')::date+1)::timestamp at time zone 'Asia/Colombo'));
  select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into v_rows from (
    select l.id,l.status,l.owner_id,l.details->>'make' as make,l.details->>'model' as model,l.details->>'year' as year,
      p.display_name as seller_name,coalesce(l.last_submitted_at,l.submitted_at) as submitted_at,
      (select f.id from public.seller_listing_photos f where f.listing_id=l.id and f.is_cover and f.uploaded_at is not null limit 1) as photo_id
    from public.seller_listings l left join public.profiles p on p.id=l.owner_id where l.status<>'draft'
    and (v_status='all' or (v_status='waiting' and l.status in ('pending_review','under_review')) or l.status=v_status)
    and position(lower(v_q) in lower(coalesce(l.details->>'make','')||' '||coalesce(l.details->>'model','')||' '||coalesce(l.details->>'year','')))>0
    and (coalesce(p_input->>'from','')='' or coalesce(l.last_submitted_at,l.submitted_at)>=(nullif(p_input->>'from','')::date::timestamp at time zone 'Asia/Colombo'))
    and (coalesce(p_input->>'to','')='' or coalesce(l.last_submitted_at,l.submitted_at)<((nullif(p_input->>'to','')::date+1)::timestamp at time zone 'Asia/Colombo'))
    order by case when v_sort='oldest' then coalesce(l.last_submitted_at,l.submitted_at) end asc,
      case when v_sort='newest' then coalesce(l.last_submitted_at,l.submitted_at) end desc,l.id
    limit 20 offset (v_page-1)*20
  ) r;
  return jsonb_build_object('count',v_count,'rows',v_rows);
end; $$;
create function public.admin_review_counts(p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.admin_grants where user_id=auth.uid()) then raise exception 'admin_required' using errcode='42501'; end if;
  return (select jsonb_build_object('waiting',count(*) filter(where status in ('pending_review','under_review')),
    'changes',count(*) filter(where status='changes_required'),'approved',count(*) filter(where status='approved'),
    'rejected',count(*) filter(where status='rejected' and updated_at>=now()-interval '30 days')) from public.seller_listings where status<>'draft');
end; $$;
revoke all on function public.admin_review_queue(jsonb),public.admin_review_counts(jsonb) from public,anon,authenticated;
grant execute on function public.admin_review_queue(jsonb),public.admin_review_counts(jsonb) to authenticated;
commit;
