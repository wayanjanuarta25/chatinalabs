-- ==============================================================================
-- chatINALabs AI — Phase 5.5 Vector Search Engine
-- Version: 202609190004_vector_search.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(1536),
  match_count integer DEFAULT 5,
  target_workspace uuid DEFAULT NULL,
  similarity_threshold float DEFAULT 0.0
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND target_workspace IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = target_workspace
        AND wm.user_id = auth.uid()
    ) THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    (1 - (dc.embedding <=> query_embedding))::float AS similarity,
    dc.metadata
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  LEFT JOIN public.knowledge_bases kb ON kb.id = dc.knowledge_base_id
  WHERE (target_workspace IS NULL OR COALESCE(d.workspace_id, kb.workspace_id) = target_workspace)
    AND dc.embedding IS NOT NULL
    AND (1 - (dc.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_document_chunks(vector(1536), integer, uuid, float) TO authenticated;
GRANT EXECUTE ON FUNCTION match_document_chunks(vector(1536), integer, uuid, float) TO service_role;
GRANT EXECUTE ON FUNCTION match_document_chunks(vector(1536), integer, uuid, float) TO anon;
