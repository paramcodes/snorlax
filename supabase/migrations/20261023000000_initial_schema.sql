-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Workspaces table
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.workspaces enable row level security;

-- 3. Workspace members table
create table public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- Helper functions for RLS to avoid recursion
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

-- Workspaces policies
create policy "Workspaces viewable by members"
  on public.workspaces for select
  to authenticated
  using (public.user_is_workspace_member(id, auth.uid()));

create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Workspace admins can update workspaces"
  on public.workspaces for update
  to authenticated
  using (public.user_is_workspace_admin(id, auth.uid()))
  with check (public.user_is_workspace_admin(id, auth.uid()));

create policy "Workspace owner can delete workspace"
  on public.workspaces for delete
  to authenticated
  using (owner_id = auth.uid());

-- Workspace members policies
create policy "Workspace members viewable by members"
  on public.workspace_members for select
  to authenticated
  using (public.user_is_workspace_member(workspace_id, auth.uid()));

create policy "Workspace admins can insert members"
  on public.workspace_members for insert
  to authenticated
  with check (
    public.user_is_workspace_admin(workspace_id, auth.uid())
    or user_id = auth.uid()
  );

create policy "Workspace admins can update members"
  on public.workspace_members for update
  to authenticated
  using (public.user_is_workspace_admin(workspace_id, auth.uid()))
  with check (public.user_is_workspace_admin(workspace_id, auth.uid()));

create policy "Workspace admins can delete members or user leave"
  on public.workspace_members for delete
  to authenticated
  using (
    public.user_is_workspace_admin(workspace_id, auth.uid())
    or user_id = auth.uid()
  );

-- Trigger: auto-add owner as workspace member
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();

-- Trigger: auto-create profile on auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Channels table
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  topic text,
  is_private boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (workspace_id, name)
);

alter table public.channels enable row level security;

-- 5. Channel members table
create table public.channel_members (
  channel_id uuid references public.channels(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (channel_id, user_id)
);

alter table public.channel_members enable row level security;

-- Helper function: check channel access
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

-- Channels policies
create policy "Channels viewable if member of workspace and (public or channel member)"
  on public.channels for select
  to authenticated
  using (public.user_has_channel_access(id, auth.uid()));

create policy "Workspace members can create channels"
  on public.channels for insert
  to authenticated
  with check (public.user_is_workspace_member(workspace_id, auth.uid()));

create policy "Channel creator or workspace admin can update channels"
  on public.channels for update
  to authenticated
  using (
    created_by = auth.uid()
    or public.user_is_workspace_admin(workspace_id, auth.uid())
  )
  with check (
    created_by = auth.uid()
    or public.user_is_workspace_admin(workspace_id, auth.uid())
  );

create policy "Channel creator or workspace admin can delete channels"
  on public.channels for delete
  to authenticated
  using (
    created_by = auth.uid()
    or public.user_is_workspace_admin(workspace_id, auth.uid())
  );

-- Channel members policies
create policy "Channel members viewable if has channel access"
  on public.channel_members for select
  to authenticated
  using (public.user_has_channel_access(channel_id, auth.uid()));

create policy "Workspace members can join public channels or admins add members"
  on public.channel_members for insert
  to authenticated
  with check (
    (
      user_id = auth.uid()
      and exists (
        select 1 from public.channels c
        where c.id = channel_id and not c.is_private
        and public.user_is_workspace_member(c.workspace_id, auth.uid())
      )
    )
    or exists (
      select 1 from public.channels c
      where c.id = channel_id
      and public.user_is_workspace_admin(c.workspace_id, auth.uid())
    )
  );

create policy "Users can leave or admins remove channel members"
  on public.channel_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.channels c
      where c.id = channel_id
      and public.user_is_workspace_admin(c.workspace_id, auth.uid())
    )
  );

-- 6. Messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  parent_id uuid references public.messages(id) on delete cascade,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Messages viewable if has channel access"
  on public.messages for select
  to authenticated
  using (public.user_has_channel_access(channel_id, auth.uid()));

create policy "Users can insert messages if has channel access"
  on public.messages for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_has_channel_access(channel_id, auth.uid())
  );

create policy "Users can update their own messages"
  on public.messages for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own messages or workspace admin"
  on public.messages for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.channels c
      where c.id = channel_id
      and public.user_is_workspace_admin(c.workspace_id, auth.uid())
    )
  );

-- 7. Reactions table
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (message_id, user_id, emoji)
);

alter table public.reactions enable row level security;

create policy "Reactions viewable if has channel access to message"
  on public.reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id
      and public.user_has_channel_access(m.channel_id, auth.uid())
    )
  );

create policy "Users can manage their own reactions if channel access"
  on public.reactions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.messages m
      where m.id = message_id
      and public.user_has_channel_access(m.channel_id, auth.uid())
    )
  );

create policy "Users can delete their own reactions"
  on public.reactions for delete
  to authenticated
  using (user_id = auth.uid());

-- 8. Read markers table
create table public.read_markers (
  user_id uuid references public.profiles(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete cascade,
  last_read_message_id uuid references public.messages(id) on delete set null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (user_id, channel_id)
);

alter table public.read_markers enable row level security;

create policy "Users can view their own read markers"
  on public.read_markers for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can upsert their own read markers"
  on public.read_markers for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_has_channel_access(channel_id, auth.uid())
  );

create policy "Users can update their own read markers"
  on public.read_markers for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 9. Invitations table
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.invitations enable row level security;

create policy "Invitations viewable by workspace members"
  on public.invitations for select
  to authenticated
  using (public.user_is_workspace_member(workspace_id, auth.uid()));

create policy "Workspace admins can manage invitations"
  on public.invitations for insert
  to authenticated
  with check (public.user_is_workspace_admin(workspace_id, auth.uid()));

create policy "Workspace admins can delete invitations"
  on public.invitations for delete
  to authenticated
  using (public.user_is_workspace_admin(workspace_id, auth.uid()));

-- 10. Attachments table
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_size integer not null,
  content_type text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.attachments enable row level security;

create policy "Attachments viewable if channel access"
  on public.attachments for select
  to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id
      and public.user_has_channel_access(m.channel_id, auth.uid())
    )
  );

create policy "Users can insert attachments if channel access and message owner"
  on public.attachments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_id
      and m.user_id = auth.uid()
      and public.user_has_channel_access(m.channel_id, auth.uid())
    )
  );

create policy "Message owners or workspace admins can delete attachments"
  on public.attachments for delete
  to authenticated
  using (
    exists (
      select 1 from public.messages m
      join public.channels c on c.id = m.channel_id
      where m.id = message_id
      and (m.user_id = auth.uid() or public.user_is_workspace_admin(c.workspace_id, auth.uid()))
    )
  );
