-- ==============================================================================
-- chatINALabs AI — Phase 5.4 Embedding Pipeline & pgvector Foundation
-- Version: 202609190003_embedding_foundation.sql
-- ==============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Update document_chunks table with pgvector embedding column and metadata
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'embedding'
  ) THEN
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'embedding') != 'USER-DEFINED' THEN
      ALTER TABLE public.document_chunks DROP COLUMN embedding;
      ALTER TABLE public.document_chunks ADD COLUMN embedding vector(1536);
    END IF;
  ELSE
    ALTER TABLE public.document_chunks ADD COLUMN embedding vector(1536);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'embedding_model'
  ) THEN
    ALTER TABLE public.document_chunks ADD COLUMN embedding_model TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'embedded_at'
  ) THEN
    ALTER TABLE public.document_chunks ADD COLUMN embedded_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create Vector Index using Cosine Similarity
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_cosine
      ON public.document_chunks
      USING hnsw (embedding vector_cosine_ops);
  EXCEPTION WHEN OTHERS THEN
    CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_cosine
      ON public.document_chunks
      USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_document_chunks_embedded_at ON public.document_chunks(embedded_at);
