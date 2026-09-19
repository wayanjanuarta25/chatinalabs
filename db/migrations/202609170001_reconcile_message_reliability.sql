alter table public.messages
  add column if not exists client_message_id text,
  add column if not exists metadata jsonb;

drop index if exists public.messages_client_message_id_key;
create unique index messages_client_message_id_key
  on public.messages (conversation_id, client_message_id)
  where client_message_id is not null;

drop policy if exists "Users can update messages of their conversations." on public.messages;
create policy "Users can update messages of their conversations."
  on public.messages
  for update
  using (
    exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete messages of their conversations." on public.messages;
create policy "Users can delete messages of their conversations."
  on public.messages
  for delete
  using (
    exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );
