-- ==============================================================================
-- chatINALabs AI — Phase 6.1 Knowledge Base Architecture
-- Migration: 202609210001_phase6_1_knowledge_base_foundation.sql
-- ==============================================================================

-- 0. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Knowledge Bases Table
CREATE TABLE IF NOT EXISTS public.knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure workspace_id is NOT NULL and references workspaces(id) if table already existed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_bases' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.knowledge_bases ADD COLUMN workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE;
  ELSE
    ALTER TABLE public.knowledge_bases ALTER COLUMN workspace_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_bases' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.knowledge_bases ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_knowledge_bases_workspace_id ON public.knowledge_bases(workspace_id);

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  filename TEXT,
  mime_type TEXT,
  file_size BIGINT,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure all required Phase 6.1 columns exist and have proper constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE;
  ELSE
    ALTER TABLE public.documents ALTER COLUMN workspace_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'filename'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN filename TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN mime_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN file_size BIGINT;
    -- Populate file_size from file_size_bytes if available
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_size_bytes'
    ) THEN
      UPDATE public.documents SET file_size = file_size_bytes WHERE file_size IS NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN storage_path TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    -- Populate status from processing_status if available
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'processing_status'
    ) THEN
      UPDATE public.documents SET status = processing_status WHERE status IS NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_knowledge_base_id ON public.documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- 3. Document Chunks Table
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure workspace_id and updated_at exist and are NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.document_chunks ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
    -- Backfill from documents table if any rows exist
    UPDATE public.document_chunks dc
    SET workspace_id = d.workspace_id
    FROM public.documents d
    WHERE dc.document_id = d.id AND dc.workspace_id IS NULL;
    -- Enforce NOT NULL
    ALTER TABLE public.document_chunks ALTER COLUMN workspace_id SET NOT NULL;
  ELSE
    ALTER TABLE public.document_chunks ALTER COLUMN workspace_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.document_chunks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_document_chunks_workspace_id ON public.document_chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);

-- 4. Embeddings Table
CREATE TABLE IF NOT EXISTS public.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES public.document_chunks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_embeddings_workspace_id ON public.embeddings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_id ON public.embeddings(chunk_id);

DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_embeddings_vector_hnsw
      ON public.embeddings USING hnsw (embedding vector_cosine_ops);
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      CREATE INDEX IF NOT EXISTS idx_embeddings_vector_ivfflat
        ON public.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;
END $$;

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Knowledge Bases RLS
DROP POLICY IF EXISTS "knowledge_bases_select_policy" ON public.knowledge_bases;
DROP POLICY IF EXISTS "knowledge_bases_insert_policy" ON public.knowledge_bases;
DROP POLICY IF EXISTS "knowledge_bases_update_policy" ON public.knowledge_bases;
DROP POLICY IF EXISTS "knowledge_bases_delete_policy" ON public.knowledge_bases;

CREATE POLICY "knowledge_bases_select_policy" ON public.knowledge_bases
  FOR SELECT TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "knowledge_bases_insert_policy" ON public.knowledge_bases
  FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "knowledge_bases_update_policy" ON public.knowledge_bases
  FOR UPDATE TO authenticated
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "knowledge_bases_delete_policy" ON public.knowledge_bases
  FOR DELETE TO authenticated
  USING (is_workspace_member(workspace_id));

-- Documents RLS
DROP POLICY IF EXISTS "documents_select_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_update_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON public.documents;

CREATE POLICY "documents_select_policy" ON public.documents
  FOR SELECT TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "documents_insert_policy" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "documents_update_policy" ON public.documents
  FOR UPDATE TO authenticated
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "documents_delete_policy" ON public.documents
  FOR DELETE TO authenticated
  USING (is_workspace_member(workspace_id));

-- Document Chunks RLS
DROP POLICY IF EXISTS "document_chunks_select_policy" ON public.document_chunks;
DROP POLICY IF EXISTS "document_chunks_insert_policy" ON public.document_chunks;
DROP POLICY IF EXISTS "document_chunks_update_policy" ON public.document_chunks;
DROP POLICY IF EXISTS "document_chunks_delete_policy" ON public.document_chunks;

CREATE POLICY "document_chunks_select_policy" ON public.document_chunks
  FOR SELECT TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "document_chunks_insert_policy" ON public.document_chunks
  FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "document_chunks_update_policy" ON public.document_chunks
  FOR UPDATE TO authenticated
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "document_chunks_delete_policy" ON public.document_chunks
  FOR DELETE TO authenticated
  USING (is_workspace_member(workspace_id));

-- Embeddings RLS
DROP POLICY IF EXISTS "embeddings_select_policy" ON public.embeddings;
DROP POLICY IF EXISTS "embeddings_insert_policy" ON public.embeddings;
DROP POLICY IF EXISTS "embeddings_update_policy" ON public.embeddings;
DROP POLICY IF EXISTS "embeddings_delete_policy" ON public.embeddings;

CREATE POLICY "embeddings_select_policy" ON public.embeddings
  FOR SELECT TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "embeddings_insert_policy" ON public.embeddings
  FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "embeddings_update_policy" ON public.embeddings
  FOR UPDATE TO authenticated
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "embeddings_delete_policy" ON public.embeddings
  FOR DELETE TO authenticated
  USING (is_workspace_member(workspace_id));

-- 6. Storage Bucket: knowledge-files (created and managed via Supabase Storage API)

