-- Test Multi-Tenant RLS for Phase 6.1 Knowledge Base Architecture
DO $$
DECLARE
  v_user_a UUID := '3d9be6f5-7c68-411f-bf47-026b949d54b4';
  v_ws_a UUID := '2b9a7649-4e8e-4b0c-b92f-b9f54e510ec7';
  v_ws_b UUID := gen_random_uuid();
  v_kb_a UUID := gen_random_uuid();
  v_kb_b UUID := gen_random_uuid();
  v_doc_a UUID := gen_random_uuid();
  v_doc_b UUID := gen_random_uuid();
  v_chunk_a UUID := gen_random_uuid();
  v_chunk_b UUID := gen_random_uuid();
  v_emb_a UUID := gen_random_uuid();
  v_emb_b UUID := gen_random_uuid();
  v_count_a INTEGER;
  v_count_b INTEGER;
  v_can_insert_b BOOLEAN := false;
BEGIN
  -- 1. Setup Workspace B (owned by user A for workspace creation FK, but remove user A from workspace_members of B)
  INSERT INTO public.workspaces (id, name, slug, owner_id)
  VALUES (v_ws_b, 'Workspace B', 'workspace-b-' || v_ws_b, v_user_a);

  -- Ensure User A is member of Workspace A, but NOT member of Workspace B
  DELETE FROM public.workspace_members WHERE workspace_id = v_ws_b AND user_id = v_user_a;

  -- 2. Setup Data in Workspace A (User A IS member)
  INSERT INTO public.knowledge_bases (id, workspace_id, name, created_by)
  VALUES (v_kb_a, v_ws_a, 'Knowledge Base A', v_user_a);

  INSERT INTO public.documents (id, workspace_id, knowledge_base_id, filename, title, status, uploaded_by)
  VALUES (v_doc_a, v_ws_a, v_kb_a, 'doc-a.pdf', 'Document A', 'completed', v_user_a);

  INSERT INTO public.document_chunks (id, workspace_id, document_id, knowledge_base_id, chunk_index, content)
  VALUES (v_chunk_a, v_ws_a, v_doc_a, v_kb_a, 0, 'Content in Workspace A');

  INSERT INTO public.embeddings (id, workspace_id, chunk_id, embedding, model)
  VALUES (v_emb_a, v_ws_a, v_chunk_a, (SELECT array_fill(0.1::real, ARRAY[1536]))::vector, 'text-embedding-3-small');

  -- 3. Setup Data in Workspace B (User A is NOT member)
  INSERT INTO public.knowledge_bases (id, workspace_id, name, created_by)
  VALUES (v_kb_b, v_ws_b, 'Knowledge Base B', v_user_a);

  INSERT INTO public.documents (id, workspace_id, knowledge_base_id, filename, title, status, uploaded_by)
  VALUES (v_doc_b, v_ws_b, v_kb_b, 'doc-b.pdf', 'Document B', 'completed', v_user_a);

  INSERT INTO public.document_chunks (id, workspace_id, document_id, knowledge_base_id, chunk_index, content)
  VALUES (v_chunk_b, v_ws_b, v_doc_b, v_kb_b, 0, 'Content in Workspace B');

  INSERT INTO public.embeddings (id, workspace_id, chunk_id, embedding, model)
  VALUES (v_emb_b, v_ws_b, v_chunk_b, (SELECT array_fill(0.1::real, ARRAY[1536]))::vector, 'text-embedding-3-small');

  -- 4. Switch context to authenticated User A
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);

  -- User A should only see Knowledge Base A, NOT Knowledge Base B
  SELECT COUNT(*) INTO v_count_a FROM public.knowledge_bases WHERE id = v_kb_a;
  SELECT COUNT(*) INTO v_count_b FROM public.knowledge_bases WHERE id = v_kb_b;
  IF v_count_a <> 1 OR v_count_b <> 0 THEN
    RAISE EXCEPTION 'RLS Violation on knowledge_bases: saw KB A: %, saw KB B: %', v_count_a, v_count_b;
  END IF;

  -- User A should only see Document A, NOT Document B
  SELECT COUNT(*) INTO v_count_a FROM public.documents WHERE id = v_doc_a;
  SELECT COUNT(*) INTO v_count_b FROM public.documents WHERE id = v_doc_b;
  IF v_count_a <> 1 OR v_count_b <> 0 THEN
    RAISE EXCEPTION 'RLS Violation on documents: saw Doc A: %, saw Doc B: %', v_count_a, v_count_b;
  END IF;

  -- User A should only see Document Chunk A, NOT Document Chunk B
  SELECT COUNT(*) INTO v_count_a FROM public.document_chunks WHERE id = v_chunk_a;
  SELECT COUNT(*) INTO v_count_b FROM public.document_chunks WHERE id = v_chunk_b;
  IF v_count_a <> 1 OR v_count_b <> 0 THEN
    RAISE EXCEPTION 'RLS Violation on document_chunks: saw Chunk A: %, saw Chunk B: %', v_count_a, v_count_b;
  END IF;

  -- User A should only see Embedding A, NOT Embedding B
  SELECT COUNT(*) INTO v_count_a FROM public.embeddings WHERE id = v_emb_a;
  SELECT COUNT(*) INTO v_count_b FROM public.embeddings WHERE id = v_emb_b;
  IF v_count_a <> 1 OR v_count_b <> 0 THEN
    RAISE EXCEPTION 'RLS Violation on embeddings: saw Embedding A: %, saw Embedding B: %', v_count_a, v_count_b;
  END IF;

  -- User A cannot insert into Workspace B
  BEGIN
    INSERT INTO public.documents (workspace_id, knowledge_base_id, filename, title, status)
    VALUES (v_ws_b, v_kb_b, 'illegal.pdf', 'Illegal Doc', 'pending');
    v_can_insert_b := true;
  EXCEPTION WHEN OTHERS THEN
    v_can_insert_b := false;
  END;

  IF v_can_insert_b THEN
    RAISE EXCEPTION 'RLS Violation: User A was able to insert into Workspace B!';
  END IF;

  RAISE NOTICE 'SUCCESS: Multi-tenant RLS isolation verified across knowledge_bases, documents, document_chunks, and embeddings!';

  -- Reset role to postgres for cleanup
  PERFORM set_config('role', 'postgres', true);

  -- 5. Cleanup
  DELETE FROM public.embeddings WHERE id IN (v_emb_a, v_emb_b);
  DELETE FROM public.document_chunks WHERE id IN (v_chunk_a, v_chunk_b);
  DELETE FROM public.documents WHERE id IN (v_doc_a, v_doc_b);
  DELETE FROM public.knowledge_bases WHERE id IN (v_kb_a, v_kb_b);
  DELETE FROM public.workspaces WHERE id = v_ws_b;
END $$;
