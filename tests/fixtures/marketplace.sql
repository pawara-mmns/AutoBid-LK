-- TEST ONLY. Loaded by isolated PGlite suites/loopback E2E adapter, never by
-- Supabase seed configuration or the application. These are not real vehicles.
insert into public.vehicle_listings(id,slug,make,model,manufacture_year,district,mileage_km,price_minor,status,approved_at,published_at,condition_description,known_defects,accident_history,fuel_type,transmission)
select ('10000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  'fixture-car-' || n, case when n % 2 = 1 then 'Toyota' else 'Suzuki' end,
  case n when 1 then 'Aqua' when 2 then 'Swift' when 3 then 'Prius' else 'Fixture ' || n end,
  case when n = 1 then 2016 else 2010 + (n % 8) end,
  case when n % 2 = 1 then 'Colombo' else 'Kandy' end, 30000 + n * 1000,
  n::bigint * 100000000, 'approved', now() - interval '1 day', now() - n * interval '1 minute',
  'Test-only listing, not a real vehicle. Seller-declared condition fixture.',
  case when n = 1 then 'Test disclosure: scratch on rear door.' else null end,
  case when n = 1 then false else null end, 'hybrid', 'automatic'
from generate_series(1,15) n;

insert into public.vehicle_listings(id,slug,make,model,manufacture_year,district,price_minor,status,approved_at,published_at)
select ('10000000-0000-4000-8000-' || lpad((15+n)::text,12,'0'))::uuid,
  'hidden-fixture-' || n, 'Hidden fixture brand', 'Private fixture', 2020, 'Colombo', 100000000,
  case n when 1 then 'draft' when 2 then 'pending_review' when 3 then 'rejected' when 4 then 'removed' else 'approved' end,
  case when n = 5 then now() else null end, case when n = 5 then now() + interval '1 day' else null end
from generate_series(1,5) n;

insert into public.vehicle_media(id,listing_id,storage_path,alt_text,position,approved_at) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001/front.png','Test-only gallery photo 1',0,now()),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001/rear.png','Test-only gallery photo 2',1,now()),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001/unapproved.png','Unapproved test photo',2,null),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000016','10000000-0000-4000-8000-000000000016/draft.png','Draft test photo',0,now());
insert into storage.objects(bucket_id,name) select 'vehicle-photos',storage_path from public.vehicle_media;
