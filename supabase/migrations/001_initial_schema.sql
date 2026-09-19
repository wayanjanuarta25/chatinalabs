-- ==============================================================================
-- chatINALabs AI — Production Database Schema & Migration
-- Version: 001_initial_schema.sql
-- Architecture: Multi-user, Workspace-based, Multi-model, RLS-secured
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Utility Functions & Triggers
-- ==============================================================================

-- Reusable timestamp updater
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. Profiles Table (Extended User Profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Extended profile information linked directly to Supabase Auth users.';
COMMENT ON COLUMN public.profiles.id IS 'Primary key referencing auth.users(id).';
COMMENT ON COLUMN public.profiles.email IS 'User primary email address.';
COMMENT ON COLUMN public.profiles.full_name IS 'User display name / full name.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Public URL to the user avatar image.';

-- Trigger for profiles updated_at
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Auto-provision profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. Workspaces Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.workspaces IS 'Organizational workspaces supporting multi-tenant isolation and future team features.';
COMMENT ON COLUMN public.workspaces.owner_id IS 'Profile ID of the workspace creator / primary owner.';
COMMENT ON COLUMN public.workspaces.slug IS 'Unique URL-friendly workspace identifier.';

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);

-- Trigger for workspaces updated_at
CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- 5. Workspace Members Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

COMMENT ON TABLE public.workspace_members IS 'Association table defining user membership and roles within workspaces.';
COMMENT ON COLUMN public.workspace_members.role IS 'User authorization level in workspace: owner, admin, or member.';

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_lookup ON public.workspace_members(workspace_id, user_id);

-- Auto-assign workspace creator as owner in workspace_members
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_workspace();

-- ==============================================================================
-- 6. Helper Security Function for RLS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_workspace_member(UUID) IS 'High-performance security definer check preventing RLS recursion on workspace queries.';

-- ==============================================================================
-- 7. Conversations Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  model TEXT NOT NULL DEFAULT 'chatINALabs AI',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.conversations IS 'Chat conversation threads organized under workspaces.';
COMMENT ON COLUMN public.conversations.workspace_id IS 'Parent workspace hosting this conversation.';
COMMENT ON COLUMN public.conversations.user_id IS 'Author profile who initiated the conversation.';
COMMENT ON COLUMN public.conversations.model IS 'Active AI model identifier for this conversation thread.';

CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON public.conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_updated ON public.conversations(workspace_id, updated_at DESC);

-- Trigger for conversations updated_at
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- 8. Messages Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT NOT NULL,
  model TEXT,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.messages IS 'Chronological messages exchanged inside conversations.';
COMMENT ON COLUMN public.messages.role IS 'Message sender type: system, user, or assistant.';
COMMENT ON COLUMN public.messages.model IS 'Specific AI model snapshot that generated an assistant response.';
COMMENT ON COLUMN public.messages.metadata IS 'Structured metadata (token usage, latency, citations, user feedback, etc.).';

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);

-- ==============================================================================
-- 9. Attachments Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('file', 'image', 'url')),
  filename TEXT,
  storage_path TEXT,
  mime_type TEXT,
  size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.attachments IS 'Files, images, and external reference links attached to messages.';
COMMENT ON COLUMN public.attachments.type IS 'Attachment category: file, image, or url.';
COMMENT ON COLUMN public.attachments.storage_path IS 'Object path in Supabase Storage bucket when applicable.';
COMMENT ON COLUMN public.attachments.size IS 'File size in bytes.';

CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_type ON public.attachments(type);

-- ==============================================================================
-- 10. AI Models Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.ai_models IS 'Registry of available AI models, providers, and capabilities.';
COMMENT ON COLUMN public.ai_models.name IS 'Internal technical identifier (e.g. chatinalabs-ai).';
COMMENT ON COLUMN public.ai_models.display_name IS 'Friendly consumer-facing label (e.g. chatINALabs AI).';
COMMENT ON COLUMN public.ai_models.provider IS 'Inference provider (internal, openai, anthropic, etc.).';

-- Seed initial models
INSERT INTO public.ai_models (name, display_name, provider, description, is_active)
VALUES
  (
    'chatinalabs-ai',
    'chatINALabs AI',
    'internal',
    'Versatile, fast, and balanced model for everyday productivity and conversation.',
    true
  ),
  (
    'chatinalabs-reasoning',
    'chatINALabs Reasoning',
    'internal',
    'Deep thought process optimized for complex problem solving, logic, and mathematics.',
    true
  ),
  (
    'chatinalabs-code',
    'chatINALabs Code',
    'internal',
    'Specialized syntax, code generation, debugging, and software architecture.',
    true
  )
ON CONFLICT (name) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  provider = EXCLUDED.provider,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ==============================================================================
-- 11. Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 11.1 Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 11.2 Workspaces Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view workspaces they belong to"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR public.is_workspace_member(id)
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Workspace owners and admins can update workspaces"
  ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Only workspace owners can delete workspaces"
  ON public.workspaces
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 11.3 Workspace Members Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view other members in their workspaces"
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Owners and admins can manage workspace members"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspace_members.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR
    -- Allow creator self-insert via trigger or onboarding
    (user_id = auth.uid())
  );

CREATE POLICY "Owners and admins can update workspace member roles"
  ON public.workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspace_members.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners, admins, or users leaving can delete membership"
  ON public.workspace_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspace_members.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ------------------------------------------------------------------------------
-- 11.4 Conversations Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view conversations inside their workspaces"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Users can create conversations inside their workspaces"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND public.is_workspace_member(workspace_id)
  );

CREATE POLICY "Users can update their own conversations"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND public.is_workspace_member(workspace_id)
  )
  WITH CHECK (
    auth.uid() = user_id AND public.is_workspace_member(workspace_id)
  );

CREATE POLICY "Users can delete their own conversations"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND public.is_workspace_member(workspace_id)
  );

-- ------------------------------------------------------------------------------
-- 11.5 Messages Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view messages inside accessible conversations"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND public.is_workspace_member(c.workspace_id)
    )
  );

CREATE POLICY "Users can insert messages into accessible conversations"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND public.is_workspace_member(c.workspace_id)
    )
  );

CREATE POLICY "Users can delete messages in accessible conversations"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_id = auth.uid() OR public.is_workspace_member(c.workspace_id))
    )
  );

-- ------------------------------------------------------------------------------
-- 11.6 Attachments Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view attachments in accessible conversations"
  ON public.attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = attachments.message_id
        AND public.is_workspace_member(c.workspace_id)
    )
  );

CREATE POLICY "Users can add attachments in accessible conversations"
  ON public.attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = attachments.message_id
        AND public.is_workspace_member(c.workspace_id)
    )
  );

CREATE POLICY "Users can delete attachments in accessible conversations"
  ON public.attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = attachments.message_id
        AND (c.user_id = auth.uid() OR public.is_workspace_member(c.workspace_id))
    )
  );

-- ------------------------------------------------------------------------------
-- 11.7 AI Models Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone authenticated can view active AI models"
  ON public.ai_models
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);
