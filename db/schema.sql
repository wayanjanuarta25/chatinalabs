-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Conversations Table
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages Table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Files Table
create table public.files (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  filename text not null,
  file_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Memories Table
create table public.memories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Usage Logs Table
create table public.usage_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  model text not null,
  tokens_used integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subscriptions Table
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  plan text not null,
  current_period_end timestamp with time zone not null
);

-- AI Models Table
create table public.ai_models (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  is_active boolean default true not null
);

-- Enable RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;
alter table public.memories enable row level security;
alter table public.usage_logs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_models enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

create policy "Users can view their own conversations." on public.conversations for select using (auth.uid() = user_id);
create policy "Users can insert their own conversations." on public.conversations for insert with check (auth.uid() = user_id);
create policy "Users can update their own conversations." on public.conversations for update using (auth.uid() = user_id);
create policy "Users can delete their own conversations." on public.conversations for delete using (auth.uid() = user_id);

create policy "Users can view messages of their conversations." on public.messages for select using (
  exists (select 1 from public.conversations where conversations.id = messages.conversation_id and conversations.user_id = auth.uid())
);
create policy "Users can insert messages into their conversations." on public.messages for insert with check (
  exists (select 1 from public.conversations where conversations.id = messages.conversation_id and conversations.user_id = auth.uid())
);

-- Policies for other tables
create policy "Users can view their own files." on public.files for select using (auth.uid() = user_id);
create policy "Users can insert their own files." on public.files for insert with check (auth.uid() = user_id);
create policy "Users can delete their own files." on public.files for delete using (auth.uid() = user_id);

create policy "Users can view their own memories." on public.memories for select using (auth.uid() = user_id);
create policy "Users can insert their own memories." on public.memories for insert with check (auth.uid() = user_id);
create policy "Users can update their own memories." on public.memories for update using (auth.uid() = user_id);
create policy "Users can delete their own memories." on public.memories for delete using (auth.uid() = user_id);

create policy "Users can view their own usage logs." on public.usage_logs for select using (auth.uid() = user_id);
create policy "Users can insert their own usage logs." on public.usage_logs for insert with check (auth.uid() = user_id);

create policy "Users can view their own subscriptions." on public.subscriptions for select using (auth.uid() = user_id);

create policy "AI models are viewable by everyone." on public.ai_models for select using (true);
