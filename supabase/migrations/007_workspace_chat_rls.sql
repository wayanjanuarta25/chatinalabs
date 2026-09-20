-- ==============================================================================
-- chatINALabs AI
-- Phase 5: Workspace-based Chat RLS Hardening
-- Migration: 007_workspace_chat_rls.sql
--
-- Purpose:
-- Replace user-only isolation with workspace isolation.
--
-- Architecture:
--
-- User
--   |
--   v
-- Workspace
--   |
--   v
-- Conversations
--   |
--   v
-- Messages
--
-- ==============================================================================


-- ==============================================================================
-- 1. Remove old conversations policies
-- ==============================================================================

DROP POLICY IF EXISTS
"Users can view their own conversations."
ON public.conversations;

DROP POLICY IF EXISTS
"Users can insert their own conversations."
ON public.conversations;

DROP POLICY IF EXISTS
"Users can update their own conversations."
ON public.conversations;

DROP POLICY IF EXISTS
"Users can delete their own conversations."
ON public.conversations;


-- ==============================================================================
-- 2. Create workspace-aware conversation policies
-- ==============================================================================


CREATE POLICY
"Workspace members can view conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);


CREATE POLICY
"Workspace members can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_workspace_member(workspace_id)
);


CREATE POLICY
"Workspace members can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
)
WITH CHECK (
  public.is_workspace_member(workspace_id)
);


CREATE POLICY
"Workspace members can delete conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);



-- ==============================================================================
-- 3. Remove old messages policies
-- ==============================================================================


DROP POLICY IF EXISTS
"Users can view messages of their conversations."
ON public.messages;


DROP POLICY IF EXISTS
"Users can insert messages into their conversations."
ON public.messages;


DROP POLICY IF EXISTS
"Users can update messages of their conversations."
ON public.messages;


DROP POLICY IF EXISTS
"Users can delete messages of their conversations."
ON public.messages;



-- ==============================================================================
-- 4. Create workspace-aware message policies
-- ==============================================================================


CREATE POLICY
"Workspace members can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND public.is_workspace_member(c.workspace_id)
  )
);



CREATE POLICY
"Workspace members can create messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND public.is_workspace_member(c.workspace_id)
  )
);



CREATE POLICY
"Workspace members can update messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND public.is_workspace_member(c.workspace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND public.is_workspace_member(c.workspace_id)
  )
);



CREATE POLICY
"Workspace members can delete messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND public.is_workspace_member(c.workspace_id)
  )
);



-- ==============================================================================
-- 5. Verification comments
-- ==============================================================================

COMMENT ON TABLE public.conversations IS
'Chat conversations isolated by workspace membership.';

COMMENT ON TABLE public.messages IS
'Messages inherit workspace isolation through parent conversations.';