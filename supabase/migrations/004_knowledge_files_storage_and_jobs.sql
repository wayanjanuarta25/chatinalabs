-- ==============================================================================
-- chatINALabs AI — Phase 5.2 Knowledge Base File Upload System
-- Version: 004_knowledge_files_storage_and_jobs.sql
-- ==============================================================================

-- 1. Create Storage Bucket for Knowledge Files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-files',
  'knowledge-files',
  false, -- private bucket with workspace isolation
  52428800, -- 50 MB file limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. Storage RLS Policies (Storage Object Isolation by Workspace)
-- Storage Path Structure: {workspace_id}/{knowledge_base_id}/{document_id}/{filename}

DROP POLICY IF EXISTS "Workspace members can view knowledge files" ON storage.objects;
CREATE POLICY "Workspace members can view knowledge files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'knowledge-files'
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = (SPLIT_PART(name, '/', 1))::uuid
        AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can upload knowledge files" ON storage.objects;
CREATE POLICY "Workspace members can upload knowledge files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'knowledge-files'
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = (SPLIT_PART(name, '/', 1))::uuid
        AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can update knowledge files" ON storage.objects;
CREATE POLICY "Workspace members can update knowledge files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'knowledge-files'
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = (SPLIT_PART(name, '/', 1))::uuid
        AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can delete knowledge files" ON storage.objects;
CREATE POLICY "Workspace members can delete knowledge files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'knowledge-files'
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = (SPLIT_PART(name, '/', 1))::uuid
        AND wm.user_id = auth.uid()
    )
  );

-- 3. Update Documents Table with Storage & Workspace Columns
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS filename TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON public.documents(storage_path);

-- 4. Processing Jobs Table
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'extraction', -- 'extraction' | 'chunking' | 'embedding'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.processing_jobs IS 'Background asynchronous document processing pipeline tasks.';
CREATE INDEX IF NOT EXISTS idx_processing_jobs_document_id ON public.processing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_workspace_id ON public.processing_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status);

-- Trigger for processing_jobs updated_at
DROP TRIGGER IF EXISTS trg_processing_jobs_updated_at ON public.processing_jobs;
CREATE TRIGGER trg_processing_jobs_updated_at
  BEFORE UPDATE ON public.processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 5. RLS for Processing Jobs
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can view processing jobs" ON public.processing_jobs;
CREATE POLICY "Workspace members can view processing jobs"
  ON public.processing_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = processing_jobs.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can insert processing jobs" ON public.processing_jobs;
CREATE POLICY "Workspace members can insert processing jobs"
  ON public.processing_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = processing_jobs.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can update processing jobs" ON public.processing_jobs;
CREATE POLICY "Workspace members can update processing jobs"
  ON public.processing_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = processing_jobs.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can delete processing jobs" ON public.processing_jobs;
CREATE POLICY "Workspace members can delete processing jobs"
  ON public.processing_jobs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = processing_jobs.workspace_id
        AND wm.user_id = auth.uid()
    )
  );
