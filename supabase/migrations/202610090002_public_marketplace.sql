begin;

-- A public-safe read model. Ownership, documents, reserves and moderation notes
-- belong to later private workflows, never to this public projection.
create table public.vehicle_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 3 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text not null default 'car' check (category = 'car'),
  make text not null check (char_length(btrim(make)) between 1 and 60),
  model text not null check (char_length(btrim(model)) between 1 and 80),
  manufacture_year smallint not null check (manufacture_year between 1900 and 2100),
  registration_year smallint check (registration_year between manufacture_year and 2100),
  district text not null check (district in ('Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya')),
  mileage_km integer check (mileage_km between 0 and 3000000),
  currency text not null default 'LKR' check (currency = 'LKR'),
  price_minor bigint not null check (price_minor between 1 and 1000000000000),
  price_kind text not null default 'asking_price' check (price_kind = 'asking_price'),
  fuel_type text check (fuel_type in ('petrol','diesel','hybrid','electric','other')),
  transmission text check (transmission in ('automatic','manual','other')),
  engine_capacity_cc integer check (engine_capacity_cc between 100 and 10000),
  body_type text check (char_length(body_type) between 1 and 60),
  condition_description text check (char_length(condition_description) between 1 and 3000),
  known_defects text check (char_length(known_defects) between 1 and 3000),
  accident_history boolean,
  flood_history boolean,
  status text not null default 'draft' check (status in ('draft','pending_review','approved','rejected','removed')),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text generated always as (lower(make || ' ' || model)) stored,
  constraint approved_listing_has_review check (status <> 'approved' or (approved_at is not null and published_at is not null))
);
create index vehicle_listings_recent_idx on public.vehicle_listings(published_at desc, id) where status = 'approved';
create index vehicle_listings_price_idx on public.vehicle_listings(price_minor, id) where status = 'approved';
create index vehicle_listings_year_idx on public.vehicle_listings(manufacture_year desc, id) where status = 'approved';
create index vehicle_listings_make_district_idx on public.vehicle_listings(make, district) where status = 'approved';
create trigger vehicle_listings_updated_at before update on public.vehicle_listings
for each row execute function public.set_updated_at();

create table public.vehicle_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.vehicle_listings(id) on delete cascade,
  storage_path text not null unique,
  alt_text text check (char_length(alt_text) between 1 and 160),
  position smallint not null check (position between 0 and 11),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (listing_id, position),
  constraint controlled_photo_path check (storage_path ~ ('^' || listing_id::text || '/[a-z0-9-]+\.(jpg|jpeg|png|webp)$'))
);

alter table public.vehicle_listings enable row level security;
alter table public.vehicle_media enable row level security;
revoke all on public.vehicle_listings, public.vehicle_media from public, anon, authenticated;
-- Explicit column grants prevent future private columns from becoming public by default.
grant select(id, slug, category, make, model, manufacture_year, registration_year, district, mileage_km, currency, price_minor, price_kind, fuel_type, transmission, engine_capacity_cc, body_type, condition_description, known_defects, accident_history, flood_history, status, approved_at, published_at, created_at, updated_at, search_text)
on public.vehicle_listings to anon, authenticated;
grant select(id, listing_id, storage_path, alt_text, position, approved_at) on public.vehicle_media to anon, authenticated;
grant all on public.vehicle_listings, public.vehicle_media to service_role;

create policy public_approved_listings on public.vehicle_listings for select to anon, authenticated
using (status = 'approved' and approved_at is not null and published_at is not null and published_at <= now());
create policy public_approved_vehicle_media on public.vehicle_media for select to anon, authenticated
using (approved_at is not null and exists (
  select 1 from public.vehicle_listings l where l.id = listing_id
    and l.status = 'approved' and l.approved_at is not null and l.published_at <= now()
));

-- Photos stay in a private bucket. Public delivery must still pass listing/media RLS.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', false, 10485760, array['image/jpeg','image/png','image/webp']);
create policy approved_vehicle_photo_read on storage.objects for select to anon, authenticated
using (bucket_id = 'vehicle-photos' and exists (
  select 1 from public.vehicle_media m join public.vehicle_listings l on l.id = m.listing_id
  where m.storage_path = name and m.approved_at is not null
    and l.status = 'approved' and l.approved_at is not null and l.published_at <= now()
));

-- Small filter suggestions, not an unbounded listing fetch. Invoker retains RLS.
create function public.marketplace_facets() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'makes', coalesce((select jsonb_agg(make) from (select distinct make from public.vehicle_listings
      where status = 'approved' and published_at <= now() order by make limit 100) x), '[]'::jsonb),
    'models', coalesce((select jsonb_agg(jsonb_build_object('make',make,'model',model)) from (
      select distinct make,model from public.vehicle_listings where status = 'approved' and published_at <= now()
      order by make,model limit 200) x), '[]'::jsonb)
  )
$$;
revoke all on function public.marketplace_facets() from public;
grant execute on function public.marketplace_facets() to anon, authenticated, service_role;

commit;
