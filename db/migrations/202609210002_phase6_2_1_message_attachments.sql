-- ==============================================================================
-- chatINALabs AI — Phase 6.2.1 Attachment Architecture
-- Migration: 202609210002_phase6_2_1_message_attachments.sql
-- ==============================================================================

-- 1. Create message_attachments Table
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('image', 'document')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_message_attachments_workspace_id ON public.message_attachments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_attachment_type ON public.message_attachments(attachment_type);

-- 3. Row Level Security (RLS)
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_attachments_select_policy" ON public.message_attachments;
DROP POLICY IF EXISTS "message_attachments_insert_policy" ON public.message_attachments;
DROP POLICY IF EXISTS "message_attachments_update_policy" ON public.message_attachments;
DROP POLICY IF EXISTS "message_attachments_delete_policy" ON public.message_attachments;

CREATE POLICY "message_attachments_select_policy" ON public.message_attachments
  FOR SELECT TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "message_attachments_insert_policy" ON public.message_attachments
  FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "message_attachments_update_policy" ON public.message_attachments
  FOR UPDATE TO authenticated
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "message_attachments_delete_policy" ON public.message_attachments
  FOR DELETE TO authenticated
  USING (is_workspace_member(workspace_id));

-- 4. Storage Bucket: chat-attachments (created/managed via Supabase Storage API)
