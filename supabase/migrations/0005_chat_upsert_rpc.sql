-- Lets the anon chat API upsert a conversation by session_id and get its id
-- back without granting broad SELECT on public.conversations. Also surfaces
-- the current lead_id so the route can decide whether to promote a lead on
-- email detection.

create or replace function public.chat_upsert_conversation(
  p_session_id text,
  p_user_agent text default null
)
returns table (id uuid, lead_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_session_id is null or length(p_session_id) < 8 then
    raise exception 'invalid session_id';
  end if;

  return query
  insert into public.conversations (session_id, user_agent)
  values (p_session_id, p_user_agent)
  on conflict (session_id) do update
    set last_message_at = now()
  returning public.conversations.id, public.conversations.lead_id;
end;
$$;

revoke all on function public.chat_upsert_conversation(text, text) from public;
grant execute on function public.chat_upsert_conversation(text, text) to anon, authenticated;


-- Links a conversation to a lead (used when email is detected mid-chat).
-- Same trust model as conversations_public_update: session_id is the bearer.
create or replace function public.chat_link_lead(
  p_conversation_id uuid,
  p_lead_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
     set lead_id = p_lead_id
   where id = p_conversation_id
     and lead_id is null;
end;
$$;

revoke all on function public.chat_link_lead(uuid, uuid) from public;
grant execute on function public.chat_link_lead(uuid, uuid) to anon, authenticated;
