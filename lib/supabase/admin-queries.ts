import { createClient } from '@/lib/supabase/server'

export interface PlatformAnalyticsData {
  overview: {
    total_users: number
    total_workspaces: number
    total_conversations: number
    total_messages: number
    ai_generations: number
    user_messages: number
    assistant_messages: number
    active_users_today: number
    active_users_7d: number
    active_users_30d: number
    kb_storage_bytes: number
    chat_storage_bytes: number
  }
  users: {
    growth_chart: Array<{
      month_key: string
      month_label: string
      new_users: number
    }>
    recent_users: Array<{
      id: string
      email: string | null
      full_name: string | null
      avatar_url: string | null
      role: 'user' | 'admin' | 'super_admin'
      created_at: string
      conversations_count: number
    }>
  }
  workspaces: {
    avg_members_per_workspace: number
    most_active_workspace: {
      id: string
      name: string
      slug: string
      conversation_count: number
    } | null
    top_workspaces: Array<{
      id: string
      name: string
      slug: string
      member_count: number
      conversation_count: number
      created_at: string
    }>
  }
  ai_usage: {
    status_breakdown: {
      completed: number
      stopped: number
      retry: number
      regenerated: number
      other: number
    }
    models_used: Array<{
      model_name: string
      count: number
    }>
  }
  recent_activity: Array<{
    id: string
    title: string | null
    updated_at: string
    user_email: string | null
    user_name: string | null
    workspace_name: string | null
  }>
  recent_audits: Array<{
    id: string
    action: string
    target_type: string
    target_id: string | null
    metadata: Record<string, unknown>
    created_at: string
    actor_email: string | null
  }>
}

/**
 * Fetch complete platform-wide analytics using the secure get_platform_analytics() RPC.
 */
export async function fetchPlatformAnalytics(): Promise<PlatformAnalyticsData | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_platform_analytics')

    if (error) {
      console.error('[fetchPlatformAnalytics] Error executing get_platform_analytics RPC:', error)
      return null
    }

    return data as unknown as PlatformAnalyticsData
  } catch (error) {
    console.error('[fetchPlatformAnalytics] Unexpected error:', error)
    return null
  }
}

/**
 * Record an audit log event using the SECURITY DEFINER function.
 */
export async function recordAuditEvent(
  action: string,
  targetType: string,
  targetId?: string | null,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId || null,
      p_metadata: (metadata || {}) as unknown as import('./database.types').Json,
    })

    if (error) {
      console.error('[recordAuditEvent] Error logging audit event:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[recordAuditEvent] Unexpected error:', error)
    return null
  }
}

/**
 * Fetch all users directory for admin users page.
 */
export async function fetchAdminUsers() {
  try {
    const supabase = await createClient()
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[fetchAdminUsers] Error fetching profiles:', error)
      return []
    }

    return profiles || []
  } catch (error) {
    console.error('[fetchAdminUsers] Unexpected error:', error)
    return []
  }
}

/**
 * Fetch all workspaces for admin workspaces page.
 */
export async function fetchAdminWorkspaces() {
  try {
    const supabase = await createClient()
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('id, name, slug, owner_id, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[fetchAdminWorkspaces] Error fetching workspaces:', error)
      return []
    }

    return workspaces || []
  } catch (error) {
    console.error('[fetchAdminWorkspaces] Unexpected error:', error)
    return []
  }
}

/**
 * Fetch audit logs list for admin settings/audit page.
 */
export async function fetchAdminAuditLogs() {
  try {
    const supabase = await createClient()
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('id, actor_id, action, target_type, target_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[fetchAdminAuditLogs] Error fetching audit logs:', error)
      return []
    }

    return logs || []
  } catch (error) {
    console.error('[fetchAdminAuditLogs] Unexpected error:', error)
    return []
  }
}
