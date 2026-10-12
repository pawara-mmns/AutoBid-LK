begin;
create or replace function public.seller_save_draft(p_input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_row public.seller_listings; v_key text; v_value jsonb; v_details jsonb := p_input->'details';
begin
  select * into v_row from public.seller_listings where id = (p_input->>'id')::uuid and owner_id = auth.uid() for update;
  if not found then raise exception 'not_available' using errcode = '42501'; end if;
  if v_row.status not in ('draft','changes_required') then raise exception 'not_editable' using errcode = '42501'; end if;
  if v_row.revision is distinct from (p_input->>'revision')::integer then raise exception 'revision_conflict' using errcode = '40001'; end if;
  if jsonb_typeof(v_details) is distinct from 'object' or octet_length(v_details::text) > 12000 then
    raise exception 'invalid_details' using errcode = '23514'; end if;
  for v_key, v_value in select * from jsonb_each(v_details) loop
    if v_key <> all(array['category','make','model','year','registered','registrationYear','fuel','transmission','mileage','district','town','condition','accident','accidentDetails','flood','floodDetails','mechanical','mechanicalDetails','finance','financeDetails','description','colour','serviceHistory','repairHistory','previousOwners','duration','phone','contactMethod','registeredOwner','terms','accuracy'])
      or jsonb_typeof(v_value) <> 'string' or char_length(v_value #>> '{}') > 1000 then
      raise exception 'invalid_field' using errcode = '23514'; end if;
  end loop;
  if v_row.status='changes_required' then
    for v_key in select distinct key from (select key from jsonb_each(v_details) union select key from jsonb_each(v_row.details)) keys loop
      if v_details->v_key is distinct from v_row.details->v_key and not (v_row.correction_scopes ? case when v_key in ('category','make','model','year','registered','registrationYear','fuel','transmission','mileage') then 'vehicle' when v_key in ('duration') then 'pricing' when v_key in ('phone','contactMethod','registeredOwner','terms','accuracy') then 'contact' else 'condition' end) then raise exception 'section_locked' using errcode='42501'; end if;
    end loop;
    if not (v_row.correction_scopes ? 'pricing') and ((p_input->>'expected_price_minor')::bigint is distinct from v_row.expected_price_minor or (p_input->>'minimum_price_minor')::bigint is distinct from v_row.minimum_price_minor or (p_input->>'buy_now_price_minor')::bigint is distinct from v_row.buy_now_price_minor) then raise exception 'section_locked' using errcode='42501'; end if;
    delete from public.listing_verifications where listing_id=v_row.id;
  end if;
  update public.seller_listings set details = v_details,
    expected_price_minor = (p_input->>'expected_price_minor')::bigint,
    minimum_price_minor = (p_input->>'minimum_price_minor')::bigint,
    buy_now_price_minor = (p_input->>'buy_now_price_minor')::bigint,
    last_step = coalesce((p_input->>'last_step')::integer,last_step),
    revision = revision + 1 where id = v_row.id returning * into v_row;
  return to_jsonb(v_row);
end; $$;
create or replace function public.seller_manage_photo(p_input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_listing public.seller_listings; v_photo public.seller_listing_photos; v_count integer; v_action text := p_input->>'action'; v_position integer; v_limit public.seller_upload_limits;
begin
  select * into v_listing from public.seller_listings where id=(p_input->>'listing_id')::uuid and owner_id=auth.uid() for update;
  if not found or not (v_listing.status='draft' or (v_listing.status='changes_required' and v_listing.correction_scopes ? 'photos')) then raise exception 'not_editable' using errcode='42501'; end if;
  if v_action = 'reserve' then
    insert into public.seller_upload_limits(owner_id) values (auth.uid()) on conflict do nothing;
    select * into v_limit from public.seller_upload_limits where owner_id=auth.uid() for update;
    if v_limit.window_started_at < now()-interval '1 hour' then
      update public.seller_upload_limits set attempts=0,window_started_at=now() where owner_id=auth.uid();
      v_limit.attempts := 0;
    end if;
    if v_limit.attempts >= 60 then raise exception 'upload_rate_limit' using errcode='23514'; end if;
    update public.seller_upload_limits set attempts=attempts+1 where owner_id=auth.uid();
    select count(*) into v_count from public.seller_listing_photos where listing_id=v_listing.id;
    if v_count >= 12 or (select count(*) from public.seller_listing_photos p join public.seller_listings l on l.id=p.listing_id where l.owner_id=auth.uid() and p.created_at > now()-interval '1 minute') >= 24 then raise exception 'photo_limit' using errcode='23514'; end if;
    insert into public.seller_listing_photos(id,listing_id,storage_path,slot,position)
    values ((p_input->>'photo_id')::uuid,v_listing.id,auth.uid()::text||'/'||v_listing.id::text||'/'||(p_input->>'photo_id')::uuid::text||'.jpg',p_input->>'slot',coalesce((select min(n) from generate_series(0,11) n where not exists(select 1 from public.seller_listing_photos p where p.listing_id=v_listing.id and p.position=n)),0)) returning * into v_photo;
  else
    select * into v_photo from public.seller_listing_photos where id=(p_input->>'photo_id')::uuid and listing_id=v_listing.id;
    if not found then raise exception 'not_available' using errcode='42501'; end if;
    if v_action = 'complete' then
      if not exists(select 1 from storage.objects where bucket_id='seller-draft-photos' and name=v_photo.storage_path) then raise exception 'photo_missing' using errcode='23514'; end if;
      update public.seller_listing_photos set uploaded_at=coalesce(uploaded_at,now()),is_cover=is_cover or not exists(select 1 from public.seller_listing_photos where listing_id=v_listing.id and is_cover) where id=v_photo.id returning * into v_photo;
    elsif v_action = 'remove' then
      if exists(select 1 from storage.objects where bucket_id='seller-draft-photos' and name=v_photo.storage_path) then raise exception 'remove_object_first' using errcode='23514'; end if;
      delete from public.seller_listing_photos where id=v_photo.id;
      if v_photo.is_cover then update public.seller_listing_photos set is_cover=true where id=(select id from public.seller_listing_photos where listing_id=v_listing.id and uploaded_at is not null order by position,id limit 1); end if;
    elsif v_action = 'cover' then
      if v_photo.uploaded_at is null then raise exception 'photo_missing' using errcode='23514'; end if;
      update public.seller_listing_photos set is_cover=false where listing_id=v_listing.id and is_cover;
      update public.seller_listing_photos set is_cover=true where id=v_photo.id;
    elsif v_action = 'earlier' or v_action = 'later' then
      select position into v_position from public.seller_listing_photos where listing_id=v_listing.id and (case when v_action='earlier' then position < v_photo.position else position > v_photo.position end) order by (case when v_action='earlier' then -position else position end),id limit 1;
      if v_position is not null then
        update public.seller_listing_photos set position=v_photo.position where listing_id=v_listing.id and position=v_position;
        update public.seller_listing_photos set position=v_position where id=v_photo.id;
      end if;
    else raise exception 'invalid_action' using errcode='23514'; end if;
  end if;
  update public.seller_listings set updated_at=now() where id=v_listing.id;
  if v_listing.status='changes_required' then delete from public.listing_verifications where listing_id=v_listing.id; end if;
  return to_jsonb(v_photo);
end; $$;

create or replace function public.seller_submit_listing(p_input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare l public.seller_listings; old_status text;
begin
 select * into l from public.seller_listings where id=(p_input->>'id')::uuid and owner_id=auth.uid() for update;
 if not found then raise exception 'not_available' using errcode='42501'; end if;
 if l.status='pending_review' then return to_jsonb(l); end if;
 if l.status not in ('draft','changes_required') then raise exception 'not_editable' using errcode='42501'; end if;
 if l.revision is distinct from (p_input->>'revision')::integer then raise exception 'revision_conflict' using errcode='40001'; end if;
 old_status:=l.status;
 delete from public.listing_verifications where listing_id=l.id;
 update public.seller_listings set status='pending_review',submitted_at=coalesce(submitted_at,now()),last_submitted_at=now(),resubmitted_at=case when old_status='changes_required' then now() else resubmitted_at end,revision=revision+1,correction_scopes='[]'::jsonb where id=l.id returning * into l;
 if old_status='changes_required' then insert into public.listing_review_events(request_id,listing_id,actor_id,action,previous_status,resulting_status,metadata) values(gen_random_uuid(),l.id,auth.uid(),'resubmit',old_status,l.status,jsonb_build_object('revision',l.revision)); end if;
 return to_jsonb(l);
end; $$;
drop policy seller_storage_insert_draft on storage.objects;
drop policy seller_storage_delete_draft on storage.objects;
create policy seller_storage_insert_editable on storage.objects for insert to authenticated with check(bucket_id='seller-draft-photos' and exists(select 1 from public.seller_listing_photos p join public.seller_listings l on l.id=p.listing_id where p.storage_path=name and l.owner_id=(select auth.uid()) and p.uploaded_at is null and (l.status='draft' or (l.status='changes_required' and l.correction_scopes ? 'photos'))));
create policy seller_storage_delete_editable on storage.objects for delete to authenticated using(bucket_id='seller-draft-photos' and exists(select 1 from public.seller_listing_photos p join public.seller_listings l on l.id=p.listing_id where p.storage_path=name and l.owner_id=(select auth.uid()) and (l.status='draft' or (l.status='changes_required' and l.correction_scopes ? 'photos'))));
commit;
