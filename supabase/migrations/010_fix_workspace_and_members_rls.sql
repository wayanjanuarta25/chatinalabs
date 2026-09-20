-- ==============================================================================
-- chatINALabs AI
-- Migration 010: Fix Missing Workspace and Workspace Members RLS Policies
--
-- Root Cause:
-- public.workspaces and public.workspace_members had RLS enabled, but were missing
-- SELECT policies for authenticated users. Under Postgres RLS, no SELECT policy
-- causes all client queries to return 0 rows (default deny).
-- Additionally, public.is_workspace_member() helper was missing on the remote DB.
-- ==============================================================================

-- 1. Helper function for workspace membership check
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_workspace_member(UUID) IS
'Security definer function to check workspace membership without triggering RLS recursion.';

-- 2. Workspace Members RLS Policies
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspace memberships" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can view other members in their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view their own workspace memberships" ON public.workspace_members;

CREATE POLICY "Users can view their own workspace memberships"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_workspace_member(workspace_id)
);

DROP POLICY IF EXISTS "Owners and admins can manage workspace members" ON public.workspace_members;
CREATE POLICY "Owners and admins can manage workspace members"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspace_members.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Owners and admins can update workspace member roles" ON public.workspace_members;
CREATE POLICY "Owners and admins can update workspace member roles"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspace_members.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Owners and admins can remove workspace members" ON public.workspace_members;
CREATE POLICY "Owners and admins can remove workspace members"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspace_members.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- 3. Workspaces RLS Policies
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;

CREATE POLICY "Users can view workspaces they belong to"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_workspace_member(id)
);

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspaces"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
);

DROP POLICY IF EXISTS "Workspace owners and admins can update workspaces" ON public.workspaces;
CREATE POLICY "Workspace owners and admins can update workspaces"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspaces.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Only workspace owners can delete workspaces" ON public.workspaces;
CREATE POLICY "Only workspace owners can delete workspaces"
ON public.workspaces
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
);

-- 4. Ensure Conversations RLS Policies are Active
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations." ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations." ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations." ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations." ON public.conversations;
DROP POLICY IF EXISTS "Workspace members can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Workspace members can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Workspace members can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Workspace members can delete conversations" ON public.conversations;

CREATE POLICY "Workspace members can view conversations"
ON public.conversations FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR public.is_workspace_member(workspace_id)
);

CREATE POLICY "Workspace members can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (public.is_workspace_member(workspace_id) OR workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()))
);

CREATE POLICY "Workspace members can update conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR public.is_workspace_member(workspace_id)
);

CREATE POLICY "Workspace members can delete conversations"
ON public.conversations FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR public.is_workspace_member(workspace_id)
);

-- 5. Ensure Messages RLS Policies are Active
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages of their conversations." ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages into their conversations." ON public.messages;
DROP POLICY IF EXISTS "Users can update messages of their conversations." ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages of their conversations." ON public.messages;
DROP POLICY IF EXISTS "Workspace members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Workspace members can create messages" ON public.messages;
DROP POLICY IF EXISTS "Workspace members can update messages" ON public.messages;
DROP POLICY IF EXISTS "Workspace members can delete messages" ON public.messages;

CREATE POLICY "Workspace members can view messages"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR public.is_workspace_member(c.workspace_id))
  )
);

CREATE POLICY "Workspace members can create messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR public.is_workspace_member(c.workspace_id))
  )
);

CREATE POLICY "Workspace members can update messages"
ON public.messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR public.is_workspace_member(c.workspace_id))
  )
);

CREATE POLICY "Workspace members can delete messages"
ON public.messages FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR public.is_workspace_member(c.workspace_id))
  )
);
