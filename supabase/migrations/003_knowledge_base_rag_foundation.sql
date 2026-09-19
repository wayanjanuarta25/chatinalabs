-- ==============================================================================
-- chatINALabs AI — Phase 5.1 Knowledge Base & RAG Architecture
-- Version: 003_knowledge_base_rag_foundation.sql
-- ==============================================================================

-- 1. Knowledge Bases Table
-- Parent container scoped to a workspace
CREATE TABLE IF NOT EXISTS public.knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.knowledge_bases IS 'Knowledge base repositories partitioned by workspace for RAG retrieval.';
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_workspace_id ON public.knowledge_bases(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_is_active ON public.knowledge_bases(is_active);

-- Trigger for knowledge_bases updated_at
DROP TRIGGER IF EXISTS trg_knowledge_bases_updated_at ON public.knowledge_bases;
CREATE TRIGGER trg_knowledge_bases_updated_at
  BEFORE UPDATE ON public.knowledge_bases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 2. Documents Table
-- Multiple documents per knowledge base with status, processing state, and metadata
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'text', -- 'text' | 'file' | 'url' | 'markdown'
  source_url TEXT,
  content TEXT,
  document_status TEXT NOT NULL DEFAULT 'active', -- 'draft' | 'active' | 'archived'
  processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  error_message TEXT,
  token_count INTEGER DEFAULT 0,
  chunk_count INTEGER DEFAULT 0,
  file_size_bytes BIGINT,
  mime_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.documents IS 'Individual source documents belonging to a knowledge base.';
CREATE INDEX IF NOT EXISTS idx_documents_knowledge_base_id ON public.documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON public.documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_document_status ON public.documents(document_status);

-- Trigger for documents updated_at
DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 3. Document Chunks Table
-- Granular document chunks prepared for token indexing and future vector embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER DEFAULT 0,
  embedding JSONB, -- JSON representation of vector embeddings (or pgvector in Phase 5.2)
  embedding_model TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_document_chunks_index UNIQUE(document_id, chunk_index)
);

COMMENT ON TABLE public.document_chunks IS 'Segmented text chunks from documents for vector embeddings and similarity search.';
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_knowledge_base_id ON public.document_chunks(knowledge_base_id);

-- Optional: If pgvector extension is supported in environment, add vector column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS vector;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'document_chunks' AND column_name = 'embedding_vec'
    ) THEN
      ALTER TABLE public.document_chunks ADD COLUMN embedding_vec vector(1536);
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Row Level Security (RLS)
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Knowledge Bases Policies
CREATE POLICY "Users can view knowledge bases in their workspaces"
  ON public.knowledge_bases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = knowledge_bases.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert knowledge bases in their workspaces"
  ON public.knowledge_bases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = knowledge_bases.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update knowledge bases in their workspaces"
  ON public.knowledge_bases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = knowledge_bases.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete knowledge bases in their workspaces"
  ON public.knowledge_bases FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = knowledge_bases.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- Documents Policies
CREATE POLICY "Users can view documents in their knowledge bases"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      JOIN public.workspace_members wm ON wm.workspace_id = kb.workspace_id
      WHERE kb.id = documents.knowledge_base_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents in their knowledge bases"
  ON public.documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      JOIN public.workspace_members wm ON wm.workspace_id = kb.workspace_id
      WHERE kb.id = documents.knowledge_base_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents in their knowledge bases"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      JOIN public.workspace_members wm ON wm.workspace_id = kb.workspace_id
      WHERE kb.id = documents.knowledge_base_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents in their knowledge bases"
  ON public.documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      JOIN public.workspace_members wm ON wm.workspace_id = kb.workspace_id
      WHERE kb.id = documents.knowledge_base_id
        AND wm.user_id = auth.uid()
    )
  );

-- Document Chunks Policies
CREATE POLICY "Users can view chunks in their knowledge bases"
  ON public.document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      JOIN public.workspace_members wm ON wm.workspace_id = kb.workspace_id
      WHERE kb.id = document_chunks.knowledge_base_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chunks in their knowledge bases"
  ON public.document_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      JOIN public.workspace_members wm ON wm.workspace_id = kb.workspace_id
      WHERE kb.id = document_chunks.knowledge_base_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chunks in their knowledge bases"
  ON public.document_chunks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      JOIN public.workspace_members wm ON wm.workspace_id = kb.workspace_id
      WHERE kb.id = document_chunks.knowledge_base_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chunks in their knowledge bases"
  ON public.document_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      JOIN public.workspace_members wm ON wm.workspace_id = kb.workspace_id
      WHERE kb.id = document_chunks.knowledge_base_id
        AND wm.user_id = auth.uid()
    )
  );
