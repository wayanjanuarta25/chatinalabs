import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

/**
 * Validates and retrieves the active workspace ID for an authenticated user.
 * 
 * Logic:
 * 1. Resolves authenticated user ID
 * 2. Gets workspace_members by auth.uid()
 * 3. Returns workspace_id if exists
 * 4. Checks workspaces.owner_id as fallback
 * 5. Returns null if missing (does not blindly insert workspace)
 */
export async function getUserWorkspace(
  supabase: SupabaseClient<Database>,
  userId?: string
): Promise<string | null> {
  try {
    let resolvedUserId = userId

    if (!resolvedUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('[AUTH] getUserWorkspace: No authenticated user session found')
        return null
      }
      resolvedUserId = user.id
    }

    console.log('[AUTH] Resolving workspace for user.id:', resolvedUserId)

    // 1. Check workspace_members for user
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', resolvedUserId)
      .limit(1)
      .maybeSingle()

    if (memberError) {
      console.warn('[AUTH] Could not query workspace_members:', memberError.message)
    }

    if (member?.workspace_id) {
      console.log('[AUTH] Found workspace from membership. user.id:', resolvedUserId, 'workspace.id:', member.workspace_id)
      return member.workspace_id
    }

    // 2. Check workspaces owned by user as fallback
    const { data: owned, error: ownedError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', resolvedUserId)
      .limit(1)
      .maybeSingle()

    if (ownedError) {
      console.warn('[AUTH] Could not query owned workspaces:', ownedError.message)
    }

    if (owned?.id) {
      console.log('[AUTH] Found workspace from ownership fallback. user.id:', resolvedUserId, 'workspace.id:', owned.id)

      // Auto-heal missing workspace_members entry if session is active
      try {
        await supabase
          .from('workspace_members')
          .upsert({
            workspace_id: owned.id,
            user_id: resolvedUserId,
            role: 'owner',
          }, { onConflict: 'workspace_id,user_id' })
      } catch (healError) {
        console.warn('[AUTH] Could not auto-heal workspace_members entry:', healError)
      }

      return owned.id
    }

    // 3. Return null if missing
    console.warn('[AUTH] No workspace found for user.id:', resolvedUserId)
    return null
  } catch (error) {
    console.error('[AUTH] Unexpected error in getUserWorkspace:', error)
    return null
  }
}
