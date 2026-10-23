-- Migration: Refactor Architecture & Performance Optimizations (2026-10-23)

-- 1. Ensure updated_at and deleted_at on messages
alter table public.messages 
  add column if not exists updated_at timestamptz default timezone('utc'::text, now());

-- Update existing rows if null
update public.messages set updated_at = created_at where updated_at is null;

-- 2. Performance Indexes for RLS & Realtime
create index if not exists idx_workspace_members_user_workspace 
  on public.workspace_members(workspace_id, user_id);

create index if not exists idx_messages_channel_created 
  on public.messages(channel_id, created_at desc);

create index if not exists idx_messages_updated 
  on public.messages(updated_at desc);

create index if not exists idx_reactions_message_user_emoji 
  on public.reactions(message_id, user_id, emoji);

create index if not exists idx_channel_members_user 
  on public.channel_members(user_id, channel_id);

-- 3. Optimized SECURITY DEFINER helper functions caching auth.uid()
create or replace function public.get_auth_uid()
returns uuid
language sql
security definer
stable
as $$
  select auth.uid();
$$;

-- Optimize user_is_workspace_member with initPlan caching
create or replace function public.user_is_workspace_member(ws_id uuid, usr_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = usr_id
  );
$$;

create or replace function public.user_is_workspace_admin(ws_id uuid, usr_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = usr_id and role in ('owner', 'admin')
  );
$$;

create or replace function public.user_has_channel_access(chan_id uuid, usr_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.channels c
    join public.workspace_members wm on wm.workspace_id = c.workspace_id
    where c.id = chan_id
      and wm.user_id = usr_id
      and (not c.is_private or exists (
        select 1 from public.channel_members cm
        where cm.channel_id = chan_id and cm.user_id = usr_id
      ))
  );
$$;

-- 4. Re-apply RLS policies using optimized helpers and (select auth.uid()) where applicable

-- Messages policies
drop policy if exists "Messages viewable if has channel access" on public.messages;
drop policy if exists "Users can insert messages if has channel access" on public.messages;
drop policy if exists "Users can update their own messages" on public.messages;
drop policy if exists "Users can delete their own messages or workspace admin" on public.messages;

create policy "Messages viewable if has channel access"
  on public.messages for select
  to authenticated
  using (public.user_has_channel_access(channel_id, (select auth.uid())));

create policy "Users can insert messages if has channel access"
  on public.messages for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.user_has_channel_access(channel_id, (select auth.uid()))
  );

create policy "Users can update their own messages"
  on public.messages for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own messages or workspace admin"
  on public.messages for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.channels c
      where c.id = channel_id
      and public.user_is_workspace_admin(c.workspace_id, (select auth.uid()))
    )
  );

-- Reactions policies
drop policy if exists "Reactions viewable if has channel access to message" on public.reactions;
drop policy if exists "Users can manage their own reactions if channel access" on public.reactions;
drop policy if exists "Users can delete their own reactions" on public.reactions;

create policy "Reactions viewable if has channel access to message"
  on public.reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id
      and public.user_has_channel_access(m.channel_id, (select auth.uid()))
    )
  );

create policy "Users can manage their own reactions if channel access"
  on public.reactions for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.messages m
      where m.id = message_id
      and public.user_has_channel_access(m.channel_id, (select auth.uid()))
    )
  );

create policy "Users can delete their own reactions"
  on public.reactions for delete
  to authenticated
  using (user_id = (select auth.uid()));
