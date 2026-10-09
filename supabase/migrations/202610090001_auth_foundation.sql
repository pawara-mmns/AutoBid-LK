begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 2 and 80),
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'si', 'ta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dealer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(btrim(business_name)) between 2 and 120),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealer_verification_time check ((verification_status = 'verified') = (verified_at is not null))
);
create index dealer_profiles_verified_by_idx on public.dealer_profiles(verified_by) where verified_by is not null;

-- Admin membership is independent of all user-controlled metadata and profiles.
create table public.admin_grants (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  reason text not null check (char_length(btrim(reason)) between 2 and 200),
  created_at timestamptz not null default now()
);
create index admin_grants_granted_by_idx on public.admin_grants(granted_by) where granted_by is not null;

create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger dealer_profiles_updated_at before update on public.dealer_profiles
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, case
    when char_length(btrim(new.raw_user_meta_data ->> 'display_name')) between 2 and 80
    then btrim(new.raw_user_meta_data ->> 'display_name') else null end);
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Existing Auth accounts also receive a profile when this migration is applied.
insert into public.profiles(id) select id from auth.users on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.dealer_profiles enable row level security;
alter table public.admin_grants enable row level security;

revoke all on public.profiles, public.dealer_profiles, public.admin_grants from public, anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles, public.dealer_profiles, public.admin_grants to authenticated;
grant update(display_name, preferred_locale) on public.profiles to authenticated;
grant insert(user_id, business_name), update(business_name) on public.dealer_profiles to authenticated;
grant all on public.profiles, public.dealer_profiles, public.admin_grants to service_role;

create policy profiles_read_own on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy dealers_read_own on public.dealer_profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy dealers_request_own on public.dealer_profiles for insert to authenticated
with check ((select auth.uid()) = user_id and verification_status = 'pending' and verified_at is null and verified_by is null);
create policy dealers_edit_pending_own on public.dealer_profiles for update to authenticated
using ((select auth.uid()) = user_id and verification_status = 'pending')
with check ((select auth.uid()) = user_id and verification_status = 'pending' and verified_at is null and verified_by is null);
create policy admin_grants_read_own on public.admin_grants for select to authenticated
using ((select auth.uid()) = user_id);

commit;
