-- ==============================================================================
-- chatINALabs AI — Phase 5.4 Embedding Pipeline & pgvector Foundation
-- Version: 005_embedding_foundation.sql
-- ==============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Update document_chunks table with pgvector embedding column and metadata
DO $$
BEGIN
  -- If embedding column exists as jsonb or other type, alter/replace with vector(1536)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'embedding'
  ) THEN
    -- Check if it is not already USER-DEFINED / vector
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'embedding') != 'USER-DEFINED' THEN
      ALTER TABLE public.document_chunks DROP COLUMN embedding;
      ALTER TABLE public.document_chunks ADD COLUMN embedding vector(1536);
    END IF;
  ELSE
    ALTER TABLE public.document_chunks ADD COLUMN embedding vector(1536);
  END IF;

  -- Ensure embedding_model column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'embedding_model'
  ) THEN
    ALTER TABLE public.document_chunks ADD COLUMN embedding_model TEXT;
  END IF;

  -- Ensure embedded_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'document_chunks' AND column_name = 'embedded_at'
  ) THEN
    ALTER TABLE public.document_chunks ADD COLUMN embedded_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Create Vector Index using Cosine Similarity
-- Cosine distance operator in pgvector is <=> and operator class is vector_cosine_ops
DO $$
BEGIN
  BEGIN
    -- Prefer HNSW for high performance approximate nearest neighbor search
    CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_cosine
      ON public.document_chunks
      USING hnsw (embedding vector_cosine_ops);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to IVFFLAT if HNSW is not supported on older pgvector versions
    CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_cosine
      ON public.document_chunks
      USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END;
END $$;

-- 4. Create index on embedded_at for querying un-embedded / updated chunks
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedded_at ON public.document_chunks(embedded_at);
