begin;
create table public.seller_listing_photos (
  id uuid primary key,
  listing_id uuid not null references public.seller_listings(id) on delete cascade,
  storage_path text not null unique,
  slot text not null check (slot in ('front','back','interior','dashboard','extra')),
  position integer not null check (position between 0 and 11),
  is_cover boolean not null default false,
  uploaded_at timestamptz,
  created_at timestamptz not null default now()
);
create index seller_photos_listing_order_idx on public.seller_listing_photos(listing_id, position, id);
create unique index seller_photos_one_cover_idx on public.seller_listing_photos(listing_id) where is_cover;
create table public.seller_upload_limits (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts between 0 and 60)
);
alter table public.seller_upload_limits enable row level security;
revoke all on public.seller_upload_limits from public, anon, authenticated;
grant all on public.seller_upload_limits to service_role;
alter table public.seller_listing_photos enable row level security;
revoke all on public.seller_listing_photos from public, anon, authenticated;
grant select on public.seller_listing_photos to authenticated;
grant all on public.seller_listing_photos to service_role;
create policy seller_photos_read_own on public.seller_listing_photos for select to authenticated
using (exists(select 1 from public.seller_listings l where l.id=listing_id and l.owner_id=(select auth.uid())));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('seller-draft-photos','seller-draft-photos',false,8388608,array['image/jpeg','image/png','image/webp']);
create policy seller_storage_read_own on storage.objects for select to authenticated
using (bucket_id='seller-draft-photos' and exists(select 1 from public.seller_listing_photos p join public.seller_listings l on l.id=p.listing_id where p.storage_path=name and l.owner_id=(select auth.uid())));
create policy seller_storage_insert_draft on storage.objects for insert to authenticated
with check (bucket_id='seller-draft-photos' and exists(select 1 from public.seller_listing_photos p join public.seller_listings l on l.id=p.listing_id where p.storage_path=name and l.owner_id=(select auth.uid()) and l.status='draft' and p.uploaded_at is null));
create policy seller_storage_delete_draft on storage.objects for delete to authenticated
using (bucket_id='seller-draft-photos' and exists(select 1 from public.seller_listing_photos p join public.seller_listings l on l.id=p.listing_id where p.storage_path=name and l.owner_id=(select auth.uid()) and l.status='draft'));
-- No UPDATE policy: a completed object cannot be overwritten through upsert.

create function public.seller_manage_photo(p_input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_listing public.seller_listings; v_photo public.seller_listing_photos; v_count integer; v_action text := p_input->>'action'; v_position integer; v_limit public.seller_upload_limits;
begin
  select * into v_listing from public.seller_listings where id=(p_input->>'listing_id')::uuid and owner_id=auth.uid() for update;
  if not found or v_listing.status <> 'draft' then raise exception 'not_editable' using errcode='42501'; end if;
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
  return to_jsonb(v_photo);
end; $$;
revoke all on function public.seller_manage_photo(jsonb) from public, anon, authenticated;
grant execute on function public.seller_manage_photo(jsonb) to authenticated;
commit;
