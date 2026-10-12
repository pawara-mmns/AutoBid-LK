begin;
create table public.verification_intakes (
 listing_id uuid primary key references public.seller_listings(id) on delete cascade,
 legal_name text not null check(char_length(btrim(legal_name)) between 2 and 120),
 registration_number text not null check(char_length(btrim(registration_number)) between 1 and 30),
 chassis_number text not null check(char_length(btrim(chassis_number)) between 1 and 40),
 consent_version text not null check(consent_version='private-evidence-2026-10-11'),
 updated_at timestamptz not null default now()
);
create table public.verification_documents (
 id uuid primary key, listing_id uuid not null references public.seller_listings(id) on delete cascade,
 kind text not null check(kind in ('identity','registration','authority','finance')),
 storage_path text not null unique, format text not null check(format in ('jpg','png','webp','pdf')),
 uploaded_at timestamptz, created_at timestamptz not null default now()
);
create index verification_documents_listing_idx on public.verification_documents(listing_id,kind);
create table public.listing_verifications (
 listing_id uuid primary key references public.seller_listings(id) on delete cascade,
 identity_outcome text not null default 'not_reviewed' check(identity_outcome in ('not_reviewed','under_review','accepted','needs_information','rejected')),
 ownership_outcome text not null default 'not_reviewed' check(ownership_outcome in ('not_reviewed','under_review','accepted','needs_information','rejected')),
 finance_outcome text not null default 'not_reviewed' check(finance_outcome in ('not_reviewed','under_review','accepted','needs_information','rejected')),
 internal_note text not null default '' check(char_length(internal_note)<=1000),
 checked_revision integer, reviewer_id uuid references public.profiles(id) on delete set null,
 updated_at timestamptz not null default now()
);
-- Audit history cannot be edited or removed by customers or administrators.
create table public.listing_review_events (
 id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
 listing_id uuid not null references public.seller_listings(id) on delete restrict,
 actor_id uuid references public.profiles(id) on delete set null,
 action text not null check(action in ('start','verification','approve','changes','reject','resubmit','document_access','document_upload','document_remove')),
 previous_status text not null, resulting_status text not null,
 public_reason text check(char_length(public_reason)<=1000),
 internal_note text check(char_length(internal_note)<=1000),
 metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object' and octet_length(metadata::text)<=2000),
 created_at timestamptz not null default now()
);
create index review_events_listing_date_idx on public.listing_review_events(listing_id,created_at desc,id);
create index review_events_date_idx on public.listing_review_events(created_at desc,id);
alter table public.verification_intakes enable row level security;
alter table public.verification_documents enable row level security;
alter table public.listing_verifications enable row level security;
alter table public.listing_review_events enable row level security;
revoke all on public.verification_intakes,public.verification_documents,public.listing_verifications,public.listing_review_events from public,anon,authenticated;
grant select on public.verification_intakes,public.verification_documents,public.listing_verifications,public.listing_review_events to authenticated;
grant all on public.verification_intakes,public.verification_documents,public.listing_verifications,public.listing_review_events to service_role;
create policy evidence_intake_read on public.verification_intakes for select to authenticated using(exists(select 1 from public.seller_listings l where l.id=listing_id and (l.owner_id=(select auth.uid()) or (l.status<>'draft' and exists(select 1 from public.admin_grants g where g.user_id=(select auth.uid()))))));
create policy evidence_metadata_read on public.verification_documents for select to authenticated using(exists(select 1 from public.seller_listings l where l.id=listing_id and (l.owner_id=(select auth.uid()) or (l.status<>'draft' and exists(select 1 from public.admin_grants g where g.user_id=(select auth.uid()))))));
create policy evidence_outcomes_admin on public.listing_verifications for select to authenticated using(exists(select 1 from public.admin_grants g where g.user_id=(select auth.uid())) and exists(select 1 from public.seller_listings l where l.id=listing_id and l.status<>'draft'));
create policy review_events_admin on public.listing_review_events for select to authenticated using(exists(select 1 from public.admin_grants g where g.user_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('verification-documents','verification-documents',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy private_documents_read on storage.objects for select to authenticated using(bucket_id='verification-documents' and exists(select 1 from public.verification_documents d join public.seller_listings l on l.id=d.listing_id where d.storage_path=name and (l.owner_id=(select auth.uid()) or (l.status<>'draft' and exists(select 1 from public.admin_grants g where g.user_id=(select auth.uid()))))));
create policy private_documents_insert on storage.objects for insert to authenticated with check(bucket_id='verification-documents' and exists(select 1 from public.verification_documents d join public.seller_listings l on l.id=d.listing_id where d.storage_path=name and d.uploaded_at is null and l.owner_id=(select auth.uid()) and (l.status='pending_review' or (l.status='changes_required' and l.correction_scopes ? 'documents'))));
create policy private_documents_delete on storage.objects for delete to authenticated using(bucket_id='verification-documents' and exists(select 1 from public.verification_documents d join public.seller_listings l on l.id=d.listing_id where d.storage_path=name and l.owner_id=(select auth.uid()) and (l.status='pending_review' or (l.status='changes_required' and l.correction_scopes ? 'documents'))));

create function public.seller_verification_evidence(p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.seller_listings; d public.verification_documents; lim public.seller_upload_limits; a text:=p_input->>'action';
begin
 select * into l from public.seller_listings where id=(p_input->>'listing_id')::uuid and owner_id=auth.uid() for update;
 if not found or not (l.status='pending_review' or (l.status='changes_required' and l.correction_scopes ? 'documents')) then raise exception 'not_editable' using errcode='42501'; end if;
 if a='details' then
  insert into public.verification_intakes(listing_id,legal_name,registration_number,chassis_number,consent_version) values(l.id,btrim(p_input->>'legal_name'),btrim(p_input->>'registration_number'),btrim(p_input->>'chassis_number'),p_input->>'consent_version') on conflict(listing_id) do update set legal_name=excluded.legal_name,registration_number=excluded.registration_number,chassis_number=excluded.chassis_number,consent_version=excluded.consent_version,updated_at=now();
 elsif a='reserve' then
  if not exists(select 1 from public.verification_intakes where listing_id=l.id) then raise exception 'consent_required' using errcode='23514'; end if;
  insert into public.seller_upload_limits(owner_id) values(auth.uid()) on conflict do nothing;
  select * into lim from public.seller_upload_limits where owner_id=auth.uid() for update;
  if lim.window_started_at<now()-interval '1 hour' then update public.seller_upload_limits set attempts=0,window_started_at=now() where owner_id=auth.uid(); lim.attempts:=0; end if;
  if lim.attempts>=60 or (select count(*) from public.verification_documents where listing_id=l.id)>=8 then raise exception 'upload_limit' using errcode='23514'; end if;
  update public.seller_upload_limits set attempts=attempts+1 where owner_id=auth.uid();
  insert into public.verification_documents(id,listing_id,kind,format,storage_path) values((p_input->>'document_id')::uuid,l.id,p_input->>'kind',p_input->>'format',auth.uid()::text||'/'||l.id::text||'/'||(p_input->>'document_id')::uuid::text||'.'||(p_input->>'format')) returning * into d;
 else
  select * into d from public.verification_documents where id=(p_input->>'document_id')::uuid and listing_id=l.id;
  if not found then raise exception 'not_available' using errcode='42501'; end if;
  if a='complete' then
   if not exists(select 1 from storage.objects where bucket_id='verification-documents' and name=d.storage_path) then raise exception 'missing_document' using errcode='23514'; end if;
   if d.uploaded_at is not null then return to_jsonb(d); end if;
   update public.verification_documents set uploaded_at=now() where id=d.id returning * into d;
  elsif a='remove' then
   if exists(select 1 from storage.objects where bucket_id='verification-documents' and name=d.storage_path) then raise exception 'remove_object_first' using errcode='23514'; end if;
   delete from public.verification_documents where id=d.id;
  else raise exception 'invalid_action' using errcode='23514'; end if;
 end if;
 update public.seller_listings set revision=revision+1 where id=l.id;
 delete from public.listing_verifications where listing_id=l.id;
 if a in ('complete','remove','details') then
  insert into public.listing_review_events(request_id,listing_id,actor_id,action,previous_status,resulting_status,metadata) values(gen_random_uuid(),l.id,auth.uid(),case when a='remove' then 'document_remove' else 'document_upload' end,l.status,l.status,jsonb_build_object('kind',d.kind,'details_updated',a='details'));
 end if;
 return coalesce(to_jsonb(d),'{}'::jsonb);
end; $$;

create function public.admin_review_operation(p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.seller_listings; v public.listing_verifications; e public.listing_review_events; a text:=p_input->>'action'; s text; r text:=btrim(p_input->>'reason'); n text:=coalesce(p_input->>'internal_note',''); scopes jsonb:=coalesce(p_input->'scopes','[]'::jsonb); result jsonb; k text;
begin
 -- Lock the current grant as well as the listing: a committed revocation is authoritative.
 perform 1 from public.admin_grants where user_id=auth.uid() for share;
 if not found then raise exception 'admin_required' using errcode='42501'; end if;
 select * into l from public.seller_listings where id=(p_input->>'listing_id')::uuid and status<>'draft' for update;
 if not found then raise exception 'not_available' using errcode='42501'; end if;
 if l.owner_id=auth.uid() then raise exception 'self_review' using errcode='42501'; end if;
 select * into e from public.listing_review_events where request_id=(p_input->>'request_id')::uuid;
 if found then
  if e.actor_id is distinct from auth.uid() or e.listing_id<>l.id or e.action<>a then raise exception 'request_conflict' using errcode='23514'; end if;
  return e.metadata->'result';
 end if;
 if a='document_access' then
  if not exists(select 1 from public.verification_documents where listing_id=l.id and id=(p_input->>'document_id')::uuid and uploaded_at is not null) then raise exception 'not_available' using errcode='42501'; end if;
 else
  if l.revision is distinct from (p_input->>'revision')::integer then raise exception 'revision_conflict' using errcode='40001'; end if;
  if a='start' then
   if l.status<>'pending_review' then raise exception 'invalid_transition' using errcode='23514'; end if;
   s:='under_review';
  else
   if l.status<>'under_review' then raise exception 'invalid_transition' using errcode='23514'; end if;
   if char_length(n)>1000 then raise exception 'invalid_note' using errcode='23514'; end if;
   if a='verification' then
    if p_input->>'attested' is distinct from 'true' then raise exception 'attestation_required' using errcode='23514'; end if;
    foreach k in array array['identity','ownership','finance'] loop
     if p_input->>(k||'_outcome') is null or p_input->>(k||'_outcome') not in ('not_reviewed','under_review','accepted','needs_information','rejected') then raise exception 'invalid_outcome' using errcode='23514'; end if;
    end loop;
    -- Accepted outcomes require the corresponding available evidence, not just a checkbox.
    foreach k in array array['identity','registration','authority','finance'] loop
     if (k='identity' and p_input->>'identity_outcome'='accepted') or (k='registration' and p_input->>'ownership_outcome'='accepted') or (k='authority' and l.details->>'registeredOwner'='no' and p_input->>'ownership_outcome'='accepted') or (k='finance' and l.details->>'finance'<>'no' and p_input->>'finance_outcome'='accepted') then
      if not exists(select 1 from public.verification_documents d join storage.objects o on o.bucket_id='verification-documents' and o.name=d.storage_path where d.listing_id=l.id and d.kind=k and d.uploaded_at is not null) then raise exception 'required_evidence' using errcode='23514'; end if;
     end if;
    end loop;
    insert into public.listing_verifications(listing_id,identity_outcome,ownership_outcome,finance_outcome,internal_note,checked_revision,reviewer_id) values(l.id,p_input->>'identity_outcome',p_input->>'ownership_outcome',p_input->>'finance_outcome',n,l.revision+1,auth.uid()) on conflict(listing_id) do update set identity_outcome=excluded.identity_outcome,ownership_outcome=excluded.ownership_outcome,finance_outcome=excluded.finance_outcome,internal_note=excluded.internal_note,checked_revision=excluded.checked_revision,reviewer_id=excluded.reviewer_id,updated_at=now();
    s:=l.status;
   elsif a='approve' then
    select * into v from public.listing_verifications where listing_id=l.id;
    if not found or v.checked_revision is distinct from l.revision or v.identity_outcome<>'accepted' or v.ownership_outcome<>'accepted' or (l.details->>'finance'<>'no' and v.finance_outcome<>'accepted') or (l.details->>'finance'='no' and v.finance_outcome in ('needs_information','rejected')) then raise exception 'verification_required' using errcode='23514'; end if;
    if not exists(select 1 from public.verification_intakes where listing_id=l.id) then raise exception 'intake_required' using errcode='23514'; end if;
    foreach k in array array['identity','registration','authority','finance'] loop
     if k in ('identity','registration') or (k='authority' and l.details->>'registeredOwner'='no') or (k='finance' and l.details->>'finance'<>'no') then
      if not exists(select 1 from public.verification_documents d join storage.objects o on o.bucket_id='verification-documents' and o.name=d.storage_path where d.listing_id=l.id and d.kind=k and d.uploaded_at is not null) then raise exception 'required_evidence' using errcode='23514'; end if;
     end if;
    end loop;
    if (select count(distinct p.slot) from public.seller_listing_photos p join storage.objects o on o.bucket_id='seller-draft-photos' and o.name=p.storage_path where p.listing_id=l.id and p.uploaded_at is not null and p.slot in ('front','back','interior','dashboard'))<>4 then raise exception 'required_photos' using errcode='23514'; end if;
    s:='approved';
   elsif a in ('changes','reject') then
    if coalesce(char_length(r),0) not between 10 and 1000 then raise exception 'reason_required' using errcode='23514'; end if;
    if a='changes' then
     if jsonb_typeof(scopes)<>'array' or jsonb_array_length(scopes) not between 1 and 6 or exists(select 1 from jsonb_array_elements_text(scopes) x where x not in ('vehicle','condition','photos','pricing','contact','documents')) then raise exception 'invalid_scopes' using errcode='23514'; end if;
     s:='changes_required';
    else s:='rejected'; scopes:='[]'::jsonb; end if;
   else raise exception 'invalid_action' using errcode='23514'; end if;
  end if;
  update public.seller_listings set status=s,revision=revision+1,public_feedback=case when a in ('changes','reject') then r when a='approve' then null else public_feedback end,correction_scopes=case when a='changes' then scopes else '[]'::jsonb end where id=l.id;
 end if;
 result:=jsonb_build_object('status',coalesce(s,l.status),'revision',l.revision+case when a='document_access' then 0 else 1 end);
 insert into public.listing_review_events(request_id,listing_id,actor_id,action,previous_status,resulting_status,public_reason,internal_note,metadata) values((p_input->>'request_id')::uuid,l.id,auth.uid(),a,l.status,coalesce(s,l.status),case when a in ('changes','reject') then r end,case when a<>'document_access' then n end,jsonb_build_object('result',result,'scopes',case when a='changes' then scopes else '[]'::jsonb end,'identity',case when a='verification' then p_input->>'identity_outcome' when a='approve' then v.identity_outcome end,'ownership',case when a='verification' then p_input->>'ownership_outcome' when a='approve' then v.ownership_outcome end,'finance',case when a='verification' then p_input->>'finance_outcome' when a='approve' then v.finance_outcome end));
 return result;
end; $$;
revoke all on function public.seller_verification_evidence(jsonb),public.admin_review_operation(jsonb) from public,anon,authenticated;
grant execute on function public.seller_verification_evidence(jsonb),public.admin_review_operation(jsonb) to authenticated;
commit;
