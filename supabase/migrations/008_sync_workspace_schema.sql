-- ==============================================================================
-- chatINALabs AI
-- Migration 008: Sync Existing Database to Workspace Architecture
-- ==============================================================================


-- ==============================================================================
-- 1. Add workspace_id to conversations
-- ==============================================================================

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS workspace_id UUID
REFERENCES public.workspaces(id)
ON DELETE CASCADE;


-- ==============================================================================
-- 2. Add model column if missing
-- ==============================================================================

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS model TEXT
DEFAULT 'chatINALabs AI';


-- ==============================================================================
-- 3. Backfill existing conversations workspace
--
-- Match conversation owner with workspace owner
-- ==============================================================================

UPDATE public.conversations c
SET workspace_id = w.id
FROM public.workspaces w
WHERE w.owner_id = c.user_id
AND c.workspace_id IS NULL;


-- ==============================================================================
-- 4. Verify no orphan conversations remain
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE workspace_id IS NULL
  ) THEN
    RAISE EXCEPTION 
    'Migration stopped: conversations without workspace detected';
  END IF;
END $$;


-- ==============================================================================
-- 5. Make workspace required
-- ==============================================================================

ALTER TABLE public.conversations
ALTER COLUMN workspace_id SET NOT NULL;


-- ==============================================================================
-- 6. Index
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id
ON public.conversations(workspace_id);


CREATE INDEX IF NOT EXISTS idx_conversations_workspace_updated
ON public.conversations(workspace_id, updated_at DESC);


COMMENT ON COLUMN public.conversations.workspace_id IS
'Parent workspace hosting this conversation.';