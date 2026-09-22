-- Test Multi-Tenant RLS for Phase 6.2.1 message_attachments
DO $$
DECLARE
  v_user_a UUID := '3d9be6f5-7c68-411f-bf47-026b949d54b4';
  v_ws_a UUID := '2b9a7649-4e8e-4b0c-b92f-b9f54e510ec7';
  v_ws_b UUID := gen_random_uuid();
  v_conv_a UUID := gen_random_uuid();
  v_conv_b UUID := gen_random_uuid();
  v_msg_a UUID := gen_random_uuid();
  v_msg_b UUID := gen_random_uuid();
  v_att_a UUID := gen_random_uuid();
  v_att_b UUID := gen_random_uuid();
  v_count_a INTEGER;
  v_count_b INTEGER;
  v_can_insert_b BOOLEAN := false;
BEGIN
  -- 1. Setup Workspace B (owned by user A for FK, but user A removed from membership)
  INSERT INTO public.workspaces (id, name, slug, owner_id)
  VALUES (v_ws_b, 'Workspace B', 'workspace-b-' || v_ws_b, v_user_a);

  DELETE FROM public.workspace_members WHERE workspace_id = v_ws_b AND user_id = v_user_a;

  -- 2. Setup Data in Workspace A (User A IS member)
  INSERT INTO public.conversations (id, workspace_id, user_id, title)
  VALUES (v_conv_a, v_ws_a, v_user_a, 'Conversation A');

  INSERT INTO public.messages (id, conversation_id, role, content)
  VALUES (v_msg_a, v_conv_a, 'user', 'Pesan A dengan lampiran A');

  INSERT INTO public.message_attachments (id, message_id, workspace_id, file_name, mime_type, storage_path, attachment_type)
  VALUES (v_att_a, v_msg_a, v_ws_a, 'doc_a.pdf', 'application/pdf', v_ws_a || '/' || v_conv_a || '/' || v_msg_a || '/doc_a.pdf', 'document');

  -- 3. Setup Data in Workspace B (User A is NOT member)
  INSERT INTO public.conversations (id, workspace_id, user_id, title)
  VALUES (v_conv_b, v_ws_b, v_user_a, 'Conversation B');

  INSERT INTO public.messages (id, conversation_id, role, content)
  VALUES (v_msg_b, v_conv_b, 'user', 'Pesan B dengan lampiran B');

  INSERT INTO public.message_attachments (id, message_id, workspace_id, file_name, mime_type, storage_path, attachment_type)
  VALUES (v_att_b, v_msg_b, v_ws_b, 'img_b.png', 'image/png', v_ws_b || '/' || v_conv_b || '/' || v_msg_b || '/img_b.png', 'image');

  -- 4. Switch context to authenticated User A
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);

  -- User A should only see Attachment A, NOT Attachment B
  SELECT COUNT(*) INTO v_count_a FROM public.message_attachments WHERE id = v_att_a;
  SELECT COUNT(*) INTO v_count_b FROM public.message_attachments WHERE id = v_att_b;
  IF v_count_a <> 1 OR v_count_b <> 0 THEN
    RAISE EXCEPTION 'RLS Violation on message_attachments: saw Att A: %, saw Att B: %', v_count_a, v_count_b;
  END IF;

  -- User A cannot insert attachment into Workspace B
  BEGIN
    INSERT INTO public.message_attachments (message_id, workspace_id, file_name, mime_type, storage_path, attachment_type)
    VALUES (v_msg_b, v_ws_b, 'illegal.pdf', 'application/pdf', 'illegal/path/illegal.pdf', 'document');
    v_can_insert_b := true;
  EXCEPTION WHEN OTHERS THEN
    v_can_insert_b := false;
  END;

  IF v_can_insert_b THEN
    RAISE EXCEPTION 'RLS Violation: User A was able to insert message_attachment into Workspace B!';
  END IF;

  RAISE NOTICE 'SUCCESS: Multi-tenant RLS isolation verified on message_attachments!';

  -- Reset role to postgres for cleanup
  PERFORM set_config('role', 'postgres', true);

  -- 5. Cleanup
  DELETE FROM public.message_attachments WHERE id IN (v_att_a, v_att_b);
  DELETE FROM public.messages WHERE id IN (v_msg_a, v_msg_b);
  DELETE FROM public.conversations WHERE id IN (v_conv_a, v_conv_b);
  DELETE FROM public.workspaces WHERE id = v_ws_b;
END $$;
