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
  client_message_id text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index messages_client_message_id_key
  on public.messages (conversation_id, client_message_id)
  where client_message_id is not null;

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
create policy "Users can update messages of their conversations." on public.messages for update using (
  exists (select 1 from public.conversations where conversations.id = messages.conversation_id and conversations.user_id = auth.uid())
) with check (
  exists (select 1 from public.conversations where conversations.id = messages.conversation_id and conversations.user_id = auth.uid())
);
create policy "Users can delete messages of their conversations." on public.messages for delete using (
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

-- ==============================================================================
-- Phase 5.1: Knowledge Base & RAG Architecture
-- ==============================================================================

-- Knowledge Bases Table
create table public.knowledge_bases (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid not null,
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  is_active boolean default true not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_knowledge_bases_workspace_id on public.knowledge_bases(workspace_id);
create index idx_knowledge_bases_is_active on public.knowledge_bases(is_active);

-- Documents Table
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  knowledge_base_id uuid references public.knowledge_bases(id) on delete cascade not null,
  title text not null,
  filename text,
  storage_path text,
  source_type text default 'text' not null,
  source_url text,
  content text,
  document_status text default 'draft' not null,
  processing_status text default 'pending' not null,
  error_message text,
  token_count integer default 0,
  chunk_count integer default 0,
  file_size_bytes bigint,
  mime_type text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_documents_workspace_id on public.documents(workspace_id);
create index idx_documents_knowledge_base_id on public.documents(knowledge_base_id);
create index idx_documents_storage_path on public.documents(storage_path);
create index idx_documents_processing_status on public.documents(processing_status);
create index idx_documents_document_status on public.documents(document_status);

-- Processing Jobs Table
create table public.processing_jobs (
  id uuid default uuid_generate_v4() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  job_type text default 'extraction' not null,
  status text default 'pending' not null,
  progress integer default 0 not null,
  error_message text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_processing_jobs_document_id on public.processing_jobs(document_id);
create index idx_processing_jobs_workspace_id on public.processing_jobs(workspace_id);
create index idx_processing_jobs_status on public.processing_jobs(status);

-- Document Chunks Table
create table public.document_chunks (
  id uuid default uuid_generate_v4() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  knowledge_base_id uuid references public.knowledge_bases(id) on delete cascade not null,
  chunk_index integer not null,
  content text not null,
  token_count integer default 0,
  embedding vector(1536),
  embedding_model text,
  embedded_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_document_chunks_index unique(document_id, chunk_index)
);

create index idx_document_chunks_document_id on public.document_chunks(document_id);
create index idx_document_chunks_knowledge_base_id on public.document_chunks(knowledge_base_id);
create index idx_document_chunks_embedding_cosine on public.document_chunks using hnsw (embedding vector_cosine_ops);
create index idx_document_chunks_embedded_at on public.document_chunks(embedded_at);

-- Enable RLS for Knowledge Base tables
alter table public.knowledge_bases enable row level security;
alter table public.documents enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.document_chunks enable row level security;

-- ==============================================================================
-- Vector Search RPC Function
-- ==============================================================================
create or replace function match_document_chunks (
  query_embedding vector(1536),
  match_count integer default 5,
  target_workspace uuid default null,
  similarity_threshold float default 0.0
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is not null and target_workspace is not null then
    if not exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = target_workspace
        and wm.user_id = auth.uid()
    ) then
      return;
    end if;
  end if;

  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    (1 - (dc.embedding <=> query_embedding))::float as similarity,
    dc.metadata
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  left join public.knowledge_bases kb on kb.id = dc.knowledge_base_id
  where (target_workspace is null or coalesce(d.workspace_id, kb.workspace_id) = target_workspace)
    and dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) >= similarity_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;
