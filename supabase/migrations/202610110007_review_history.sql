begin;
create function public.admin_review_history(p_input jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p integer:=coalesce((p_input->>'page')::integer,1); a text:=coalesce(p_input->>'action',''); s text:=coalesce(p_input->>'status',''); actor uuid:=nullif(p_input->>'actor','')::uuid; listing uuid:=nullif(p_input->>'listing','')::uuid; f date:=nullif(p_input->>'from','')::date; t date:=nullif(p_input->>'to','')::date; total integer; rows jsonb;
begin
 if not exists(select 1 from public.admin_grants where user_id=auth.uid()) then raise exception 'admin_required' using errcode='42501'; end if;
 if p not between 1 and 1000 or a not in ('','start','verification','approve','changes','reject','resubmit','document_access','document_upload','document_remove') or s not in ('','pending_review','under_review','changes_required','approved','rejected') or (f is not null and t is not null and f>t) then raise exception 'invalid_filters' using errcode='23514'; end if;
 select count(*) into total from public.listing_review_events e where (listing is null or e.listing_id=listing) and (actor is null or e.actor_id=actor) and (a='' or e.action=a) and (s='' or e.resulting_status=s) and (f is null or e.created_at>=(f::timestamp at time zone 'Asia/Colombo')) and (t is null or e.created_at<((t+1)::timestamp at time zone 'Asia/Colombo'));
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into rows from (select e.id,e.listing_id,e.actor_id,e.action,e.previous_status,e.resulting_status,e.public_reason,e.internal_note,e.metadata,e.created_at from public.listing_review_events e where (listing is null or e.listing_id=listing) and (actor is null or e.actor_id=actor) and (a='' or e.action=a) and (s='' or e.resulting_status=s) and (f is null or e.created_at>=(f::timestamp at time zone 'Asia/Colombo')) and (t is null or e.created_at<((t+1)::timestamp at time zone 'Asia/Colombo')) order by e.created_at desc,e.id desc limit 20 offset (p-1)*20) r;
 return jsonb_build_object('count',total,'rows',rows);
end; $$;
revoke all on function public.admin_review_history(jsonb) from public,anon,authenticated;
grant execute on function public.admin_review_history(jsonb) to authenticated;
commit;
