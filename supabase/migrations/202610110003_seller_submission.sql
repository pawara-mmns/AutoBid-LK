begin;
alter table public.seller_listings add column phone_verified boolean not null default false check (phone_verified = false);
alter table public.seller_listings add column submission_terms_version text;

-- This guard also protects direct RPC callers; application validation is not the only gate.
create function public.seller_submission_guard() returns trigger
language plpgsql set search_path = '' as $$
declare d jsonb := new.details; k text; max_year integer := extract(year from now() at time zone 'Asia/Colombo')::integer+1;
begin
  if new.status <> 'pending_review' then return new; end if;
  foreach k in array array['make','model','year','registered','fuel','transmission','mileage','district','town','condition','accident','flood','mechanical','finance','duration','phone','contactMethod','registeredOwner','terms','accuracy'] loop
    if coalesce(btrim(d->>k),'')='' then raise exception 'incomplete_submission' using errcode='23514'; end if;
  end loop;
  if d->>'category' is distinct from 'car' or char_length(d->>'make') > 60 or char_length(d->>'model') > 80 or char_length(d->>'town') > 80
    or d->>'registered' not in ('yes','no') or d->>'fuel' not in ('petrol','diesel','hybrid','electric','other')
    or d->>'transmission' not in ('automatic','manual','other') or d->>'condition' not in ('good','some_repairs','major_repairs')
    or d->>'duration' not in ('1','3','7') or d->>'contactMethod' not in ('call','whatsapp') or d->>'registeredOwner' not in ('yes','no')
    or d->>'terms' <> 'yes' or d->>'accuracy' <> 'yes' or d->>'phone' !~ '^\+94[1-9][0-9]{8}$'
    or d->>'district' not in ('Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya')
    then raise exception 'invalid_submission' using errcode='23514'; end if;
  if d->>'year' !~ '^[0-9]{4}$' or d->>'mileage' !~ '^[0-9]{1,7}$' then raise exception 'invalid_numbers' using errcode='23514'; end if;
  if (d->>'year')::integer not between 1900 and max_year or (d->>'mileage')::integer > 3000000 then raise exception 'invalid_numbers' using errcode='23514'; end if;
  if d->>'registered' = 'yes' then
    if coalesce(d->>'registrationYear','') !~ '^[0-9]{4}$' then raise exception 'invalid_registration' using errcode='23514'; end if;
    if (d->>'registrationYear')::integer not between (d->>'year')::integer and max_year then raise exception 'invalid_registration' using errcode='23514'; end if;
  end if;
  foreach k in array array['accident','flood','mechanical','finance'] loop
    if d->>k not in ('yes','no','unsure') or (d->>k='yes' and coalesce(btrim(d->>(k||'Details')),'')='') then raise exception 'invalid_history' using errcode='23514'; end if;
  end loop;
  if d->>'condition' <> 'good' and coalesce(btrim(d->>'mechanicalDetails'),'')='' then raise exception 'required_repairs' using errcode='23514'; end if;
  if coalesce(d->>'previousOwners','') <> '' then
    if d->>'previousOwners' !~ '^[0-9]{1,2}$' then raise exception 'invalid_owners' using errcode='23514'; end if;
    if (d->>'previousOwners')::integer > 50 then raise exception 'invalid_owners' using errcode='23514'; end if;
  end if;
  if new.expected_price_minor is null or new.minimum_price_minor is null then raise exception 'required_prices' using errcode='23514'; end if;
  if (select count(distinct p.slot) from public.seller_listing_photos p where p.listing_id=new.id and p.slot in ('front','back','interior','dashboard') and p.uploaded_at is not null
      and exists(select 1 from storage.objects o where o.bucket_id='seller-draft-photos' and o.name=p.storage_path)) <> 4 then raise exception 'required_photos' using errcode='23514'; end if;
  new.phone_verified := false;
  new.submission_terms_version := 'seller-intake-2026-10-11';
  return new;
end; $$;
revoke all on function public.seller_submission_guard() from public, anon, authenticated;
create trigger seller_listing_submission before insert or update on public.seller_listings for each row execute function public.seller_submission_guard();

create function public.seller_submit_listing(p_input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_row public.seller_listings;
begin
  select * into v_row from public.seller_listings where id=(p_input->>'id')::uuid and owner_id=auth.uid() for update;
  if not found then raise exception 'not_available' using errcode='42501'; end if;
  if v_row.status='pending_review' then return to_jsonb(v_row); end if;
  if v_row.revision is distinct from (p_input->>'revision')::integer then raise exception 'revision_conflict' using errcode='40001'; end if;
  update public.seller_listings set status='pending_review',submitted_at=now(),revision=revision+1 where id=v_row.id returning * into v_row;
  return to_jsonb(v_row);
end; $$;
revoke all on function public.seller_submit_listing(jsonb) from public, anon, authenticated;
grant execute on function public.seller_submit_listing(jsonb) to authenticated;
commit;
