import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type ProfileRole = 'user' | 'admin' | 'super_admin'

export interface PlatformAdminAuthResult {
  isAuthenticated: boolean
  isPlatformAdmin: boolean
  isSuperAdmin: boolean
  role: ProfileRole | null
  user: User | null
  profile: Database['public']['Tables']['profiles']['Row'] | null
}

/**
 * Server-side helper to check if the current requester is a platform admin.
 * Evaluates session and validates role in public.profiles.
 */
export async function checkPlatformAdmin(): Promise<PlatformAdminAuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        isAuthenticated: false,
        isPlatformAdmin: false,
        isSuperAdmin: false,
        role: null,
        user: null,
        profile: null,
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        isAuthenticated: true,
        isPlatformAdmin: false,
        isSuperAdmin: false,
        role: null,
        user,
        profile: null,
      }
    }

    const role = (profile.role as ProfileRole) || 'user'
    const isSuperAdmin = role === 'super_admin'
    const isPlatformAdmin = role === 'admin' || isSuperAdmin

    return {
      isAuthenticated: true,
      isPlatformAdmin,
      isSuperAdmin,
      role,
      user,
      profile,
    }
  } catch (error) {
    console.error('[checkPlatformAdmin] Unexpected error:', error)
    return {
      isAuthenticated: false,
      isPlatformAdmin: false,
      isSuperAdmin: false,
      role: null,
      user: null,
      profile: null,
    }
  }
}
