begin;

-- Private seller intake. Publication deliberately uses the separate approved read model.
create table public.seller_listings (
  id uuid primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'pending_review')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 12000),
  expected_price_minor bigint check (expected_price_minor between 1 and 1000000000000),
  minimum_price_minor bigint check (minimum_price_minor between 1 and 1000000000000),
  buy_now_price_minor bigint check (buy_now_price_minor between 1 and 1000000000000),
  revision integer not null default 0 check (revision >= 0),
  last_step integer not null default 1 check (last_step between 1 and 5),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (minimum_price_minor <= expected_price_minor),
  check (buy_now_price_minor >= expected_price_minor),
  check ((status = 'pending_review') = (submitted_at is not null))
);
create index seller_listings_owner_updated_idx on public.seller_listings(owner_id, updated_at desc, id);
create trigger seller_listings_updated_at before update on public.seller_listings
for each row execute function public.set_updated_at();
alter table public.seller_listings enable row level security;
revoke all on public.seller_listings from public, anon, authenticated;
grant select on public.seller_listings to authenticated;
grant all on public.seller_listings to service_role;
create policy seller_listings_read_own on public.seller_listings for select to authenticated
using (owner_id = (select auth.uid()));

create function public.seller_create_draft(p_input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := auth.uid(); v_row public.seller_listings;
begin
  if v_owner is null then raise exception 'identity_required' using errcode = '42501'; end if;
  perform 1 from public.profiles where id = v_owner for update;
  select * into v_row from public.seller_listings where id = (p_input->>'id')::uuid and owner_id = v_owner;
  if found then return to_jsonb(v_row); end if;
  if (select count(*) from public.seller_listings where owner_id = v_owner and status = 'draft') >= 25
    or (select count(*) from public.seller_listings where owner_id = v_owner and created_at > now() - interval '24 hours') >= 20
    then raise exception 'draft_limit' using errcode = '23514'; end if;
  insert into public.seller_listings(id, owner_id) values ((p_input->>'id')::uuid, v_owner) returning * into v_row;
  return to_jsonb(v_row);
end; $$;

create function public.seller_save_draft(p_input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_row public.seller_listings; v_key text; v_value jsonb; v_details jsonb := p_input->'details';
begin
  select * into v_row from public.seller_listings where id = (p_input->>'id')::uuid and owner_id = auth.uid() for update;
  if not found then raise exception 'not_available' using errcode = '42501'; end if;
  if v_row.status <> 'draft' then raise exception 'not_editable' using errcode = '42501'; end if;
  if v_row.revision is distinct from (p_input->>'revision')::integer then raise exception 'revision_conflict' using errcode = '40001'; end if;
  if jsonb_typeof(v_details) is distinct from 'object' or octet_length(v_details::text) > 12000 then
    raise exception 'invalid_details' using errcode = '23514'; end if;
  for v_key, v_value in select * from jsonb_each(v_details) loop
    if v_key <> all(array['category','make','model','year','registered','registrationYear','fuel','transmission','mileage','district','town','condition','accident','accidentDetails','flood','floodDetails','mechanical','mechanicalDetails','finance','financeDetails','description','colour','serviceHistory','repairHistory','previousOwners','duration','phone','contactMethod','registeredOwner','terms','accuracy'])
      or jsonb_typeof(v_value) <> 'string' or char_length(v_value #>> '{}') > 1000 then
      raise exception 'invalid_field' using errcode = '23514'; end if;
  end loop;
  update public.seller_listings set details = v_details,
    expected_price_minor = (p_input->>'expected_price_minor')::bigint,
    minimum_price_minor = (p_input->>'minimum_price_minor')::bigint,
    buy_now_price_minor = (p_input->>'buy_now_price_minor')::bigint,
    last_step = coalesce((p_input->>'last_step')::integer,last_step),
    revision = revision + 1 where id = v_row.id returning * into v_row;
  return to_jsonb(v_row);
end; $$;
revoke all on function public.seller_create_draft(jsonb), public.seller_save_draft(jsonb) from public, anon, authenticated;
grant execute on function public.seller_create_draft(jsonb), public.seller_save_draft(jsonb) to authenticated;
commit;
