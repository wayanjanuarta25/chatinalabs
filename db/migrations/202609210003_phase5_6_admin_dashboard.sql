-- ==============================================================================
-- chatINALabs AI — Phase 5.6 Admin Dashboard Architecture & Analytics
-- Migration: 202609210003_phase5_6_admin_dashboard.sql
-- ==============================================================================

-- 1. Ensure columns exist on public.profiles: 'role' and 'created_at'
DO $$
BEGIN
  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
  END IF;

  -- Add role if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));
  END IF;
END $$;

-- Populate created_at from auth.users if available
DO $$
BEGIN
  UPDATE public.profiles p
  SET created_at = u.created_at
  FROM auth.users u
  WHERE p.id = u.id;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if auth.users is restricted in some contexts
  NULL;
END $$;

-- Index for role and created_at
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- 2. Security Function: is_platform_admin()
-- Checks profiles relationship first with SECURITY DEFINER and SET search_path = public
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authenticated user validation
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user has admin or super_admin role in public.profiles
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Revoke public execution and grant to authenticated
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- 3. Super Admin Migration (Conditional IF EXISTS)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = '3d9be6f5-7c68-411f-bf47-026b949d54b4') THEN
    UPDATE public.profiles
    SET role = 'super_admin'
    WHERE id = '3d9be6f5-7c68-411f-bf47-026b949d54b4';
  END IF;
END $$;

-- 4. Role Escalation Protection Trigger on public.profiles
CREATE OR REPLACE FUNCTION public.protect_profiles_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Only platform admins can change roles when initiated by an authenticated user
    IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can change platform roles'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profiles_role ON public.profiles;
CREATE TRIGGER trg_protect_profiles_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_role_escalation();

-- 5. Audit Logs Architecture
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Audit Logs RLS & Permissions
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- Disallow direct INSERT/UPDATE/DELETE from client
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;

-- Audit Logs Security DEFINER Logging Function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_actor_id UUID;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only platform admins can record audit events'
      USING ERRCODE = '42501';
  END IF;

  v_actor_id := auth.uid();

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    target_type,
    target_id,
    metadata,
    created_at
  ) VALUES (
    v_actor_id,
    p_action,
    p_target_type,
    p_target_id,
    p_metadata,
    NOW()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB) TO authenticated;

-- 6. RPC Function: get_platform_analytics()
CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users BIGINT := 0;
  v_total_workspaces BIGINT := 0;
  v_total_conversations BIGINT := 0;
  v_total_messages BIGINT := 0;
  v_ai_generations BIGINT := 0;
  v_user_messages BIGINT := 0;
  v_assistant_messages BIGINT := 0;
  
  v_active_today BIGINT := 0;
  v_active_7d BIGINT := 0;
  v_active_30d BIGINT := 0;
  
  v_kb_storage BIGINT := 0;
  v_chat_storage BIGINT := 0;
  
  v_avg_members NUMERIC := 0.0;
  v_most_active_ws JSONB := null;
  v_top_workspaces JSONB := '[]'::jsonb;
  
  v_user_growth JSONB := '[]'::jsonb;
  v_recent_users JSONB := '[]'::jsonb;
  v_status_breakdown JSONB := '{}'::jsonb;
  v_models_used JSONB := '[]'::jsonb;
  v_recent_activity JSONB := '[]'::jsonb;
  v_recent_audits JSONB := '[]'::jsonb;
BEGIN
  -- Strict platform admin check
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: platform administrator access required'
      USING ERRCODE = '42501';
  END IF;

  -- 1. Totals
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_total_workspaces FROM public.workspaces;
  SELECT COUNT(*) INTO v_total_conversations FROM public.conversations;
  SELECT COUNT(*) INTO v_total_messages FROM public.messages;
  
  -- Message breakdown
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE role = 'user'), 0),
    COALESCE(COUNT(*) FILTER (WHERE role = 'assistant'), 0)
  INTO v_user_messages, v_assistant_messages
  FROM public.messages;
  
  v_ai_generations := v_assistant_messages;

  -- 2. Active Users (Users with activity in conversations / messages)
  SELECT COUNT(DISTINCT user_id) INTO v_active_today
  FROM public.conversations
  WHERE updated_at >= NOW() - INTERVAL '24 hours';

  SELECT COUNT(DISTINCT user_id) INTO v_active_7d
  FROM public.conversations
  WHERE updated_at >= NOW() - INTERVAL '7 days';

  SELECT COUNT(DISTINCT user_id) INTO v_active_30d
  FROM public.conversations
  WHERE updated_at >= NOW() - INTERVAL '30 days';

  -- 3. Storage Usage (Knowledge Base + Chat Attachments)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    SELECT COALESCE(SUM(file_size), 0) INTO v_kb_storage FROM public.documents;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'message_attachments') THEN
    SELECT COALESCE(SUM(file_size), 0) INTO v_chat_storage FROM public.message_attachments;
  END IF;

  -- 4. Workspace Analytics
  SELECT COALESCE(ROUND(COUNT(wm.id)::numeric / NULLIF(COUNT(DISTINCT w.id), 0), 1), 0.0)
  INTO v_avg_members
  FROM public.workspaces w
  LEFT JOIN public.workspace_members wm ON wm.workspace_id = w.id;

  -- Most active workspace & Top workspaces
  SELECT jsonb_build_object(
    'id', w.id,
    'name', w.name,
    'slug', w.slug,
    'conversation_count', COUNT(c.id)
  ) INTO v_most_active_ws
  FROM public.workspaces w
  LEFT JOIN public.conversations c ON c.workspace_id = w.id
  GROUP BY w.id, w.name, w.slug
  ORDER BY COUNT(c.id) DESC
  LIMIT 1;

  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_top_workspaces
  FROM (
    SELECT 
      w.id,
      w.name,
      w.slug,
      COUNT(DISTINCT wm.id) AS member_count,
      COUNT(DISTINCT c.id) AS conversation_count,
      w.created_at
    FROM public.workspaces w
    LEFT JOIN public.workspace_members wm ON wm.workspace_id = w.id
    LEFT JOIN public.conversations c ON c.workspace_id = w.id
    GROUP BY w.id, w.name, w.slug, w.created_at
    ORDER BY COUNT(DISTINCT c.id) DESC, COUNT(DISTINCT wm.id) DESC
    LIMIT 5
  ) sub;

  -- 5. User Growth (last 6 months)
  SELECT COALESCE(jsonb_agg(g), '[]'::jsonb) INTO v_user_growth
  FROM (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month_key,
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month_label,
      COUNT(*) AS new_users
    FROM public.profiles
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) ASC
  ) g;

  -- If user_growth is empty (e.g., all users created today), provide at least current month
  IF jsonb_array_length(v_user_growth) = 0 THEN
    v_user_growth := jsonb_build_array(
      jsonb_build_object(
        'month_key', TO_CHAR(NOW(), 'YYYY-MM'),
        'month_label', TO_CHAR(NOW(), 'Mon YYYY'),
        'new_users', v_total_users
      )
    );
  END IF;

  -- 6. Recent Users
  SELECT COALESCE(jsonb_agg(u), '[]'::jsonb) INTO v_recent_users
  FROM (
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.avatar_url,
      p.role,
      p.created_at,
      COUNT(DISTINCT c.id) AS conversations_count
    FROM public.profiles p
    LEFT JOIN public.conversations c ON c.user_id = p.id
    GROUP BY p.id, p.email, p.full_name, p.avatar_url, p.role, p.created_at
    ORDER BY p.created_at DESC
    LIMIT 8
  ) u;

  -- 7. AI Status Breakdown & Model Usage
  SELECT jsonb_build_object(
    'completed', COALESCE(COUNT(*) FILTER (WHERE metadata->>'status' = 'completed'), 0),
    'stopped', COALESCE(COUNT(*) FILTER (WHERE metadata->>'status' = 'stopped'), 0),
    'retry', COALESCE(COUNT(*) FILTER (WHERE metadata->>'status' = 'retry'), 0),
    'regenerated', COALESCE(COUNT(*) FILTER (WHERE metadata->>'status' = 'regenerated'), 0),
    'other', COALESCE(COUNT(*) FILTER (WHERE metadata->>'status' IS NULL OR metadata->>'status' NOT IN ('completed', 'stopped', 'retry', 'regenerated')), 0)
  ) INTO v_status_breakdown
  FROM public.messages
  WHERE role = 'assistant';

  SELECT COALESCE(jsonb_agg(m), '[]'::jsonb) INTO v_models_used
  FROM (
    SELECT 
      COALESCE(metadata->>'model', 'gpt-5.6-sol') AS model_name,
      COUNT(*) AS count
    FROM public.messages
    WHERE role = 'assistant'
    GROUP BY COALESCE(metadata->>'model', 'gpt-5.6-sol')
    ORDER BY count DESC
    LIMIT 5
  ) m;

  -- 8. Recent Activity (Conversations with user and workspace)
  SELECT COALESCE(jsonb_agg(act), '[]'::jsonb) INTO v_recent_activity
  FROM (
    SELECT 
      c.id,
      c.title,
      c.updated_at,
      p.email AS user_email,
      p.full_name AS user_name,
      w.name AS workspace_name
    FROM public.conversations c
    LEFT JOIN public.profiles p ON p.id = c.user_id
    LEFT JOIN public.workspaces w ON w.id = c.workspace_id
    ORDER BY c.updated_at DESC
    LIMIT 6
  ) act;

  -- 9. Recent Audits
  SELECT COALESCE(jsonb_agg(aud), '[]'::jsonb) INTO v_recent_audits
  FROM (
    SELECT 
      a.id,
      a.action,
      a.target_type,
      a.target_id,
      a.metadata,
      a.created_at,
      p.email AS actor_email
    FROM public.audit_logs a
    LEFT JOIN public.profiles p ON p.id = a.actor_id
    ORDER BY a.created_at DESC
    LIMIT 6
  ) aud;

  -- Final aggregated output
  RETURN jsonb_build_object(
    'overview', jsonb_build_object(
      'total_users', v_total_users,
      'total_workspaces', v_total_workspaces,
      'total_conversations', v_total_conversations,
      'total_messages', v_total_messages,
      'ai_generations', v_ai_generations,
      'user_messages', v_user_messages,
      'assistant_messages', v_assistant_messages,
      'active_users_today', v_active_today,
      'active_users_7d', v_active_7d,
      'active_users_30d', v_active_30d,
      'kb_storage_bytes', v_kb_storage,
      'chat_storage_bytes', v_chat_storage
    ),
    'users', jsonb_build_object(
      'growth_chart', v_user_growth,
      'recent_users', v_recent_users
    ),
    'workspaces', jsonb_build_object(
      'avg_members_per_workspace', v_avg_members,
      'most_active_workspace', v_most_active_ws,
      'top_workspaces', v_top_workspaces
    ),
    'ai_usage', jsonb_build_object(
      'status_breakdown', v_status_breakdown,
      'models_used', v_models_used
    ),
    'recent_activity', v_recent_activity,
    'recent_audits', v_recent_audits
  );
END;
$$;

-- Revoke public execution and grant to authenticated
REVOKE EXECUTE ON FUNCTION public.get_platform_analytics() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_platform_analytics() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics() TO authenticated;
