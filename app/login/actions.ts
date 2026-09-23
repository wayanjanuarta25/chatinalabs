'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserWorkspace } from '@/lib/supabase/workspace'

/**
 * Fallback recovery function to ensure user profile and workspace exist.
 * Primary provisioning is handled atomically by database trigger `on_auth_user_created`.
 * This function only acts as an emergency recovery tool and will NEVER blindly insert workspaces.
 */
export async function ensureUserProfileAndWorkspace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userEmail: string,
  fullName?: string
) {
  try {
    console.log('[AUTH] Checking profile and workspace recovery for user.id:', userId)
    const displayName = fullName?.trim() || userEmail.split('@')[0] || 'User'

    // 1. Sync profile if needed
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userEmail,
        full_name: displayName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      console.warn('[AUTH] Profile sync notice:', profileError.message)
    }

    // 2. Check existing workspace first (do NOT blindly insert)
    const existingWsId = await getUserWorkspace(supabase, userId)
    if (existingWsId) {
      console.log('[AUTH] Workspace already exists for user.id:', userId, 'workspace.id:', existingWsId)
      return existingWsId
    }

    // 3. Fallback recovery: Only attempt insert if authenticated user session matches
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      console.warn('[AUTH] Aborting workspace fallback creation: No verified active session for user.id:', userId)
      return null
    }

    const slug = `personal-${userId.slice(0, 8)}`
    const { data: newWorkspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        owner_id: userId,
        name: `${displayName}'s Workspace`,
        slug: slug,
      })
      .select('id')
      .single()

    if (wsError) {
      console.error('[AUTH] Fallback workspace creation failed:', wsError.message)
      return null
    }

    if (newWorkspace) {
      console.log('[AUTH] Fallback workspace created for user.id:', userId, 'workspace.id:', newWorkspace.id)
      await supabase
        .from('workspace_members')
        .upsert({
          workspace_id: newWorkspace.id,
          user_id: userId,
          role: 'owner',
        }, { onConflict: 'workspace_id,user_id' })

      return newWorkspace.id
    }

    return null
  } catch (err) {
    console.error('[AUTH] Error in ensureUserProfileAndWorkspace fallback:', err)
    return null
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?message=' + encodeURIComponent('Please enter both email and password.'))
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  if (!data.user || !data.session) {
    redirect('/login?message=' + encodeURIComponent('Could not establish session.'))
  }

  console.log('[AUTH] Login successful for user.id:', data.user.id)

  revalidatePath('/', 'layout')
  redirect('/chat')
}

export async function signup(formData?: FormData) {
  // Pendaftaran dinonaktifkan untuk sementara
  redirect('/register?message=' + encodeURIComponent('Pendaftaran akun baru sedang dinonaktifkan untuk sementara. Silakan masuk jika Anda sudah memiliki akun.'))
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
