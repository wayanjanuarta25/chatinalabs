'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Ensures a user's profile and default personal workspace exist.
 * Serves as an application-level guarantee in addition to database triggers.
 */
export async function ensureUserProfileAndWorkspace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userEmail: string,
  fullName?: string
) {
  try {
    const displayName = fullName?.trim() || userEmail.split('@')[0] || 'User'

    // 1. Automatic Profile Creation / Sync
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userEmail,
        full_name: displayName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('[auth] Failed to sync profile:', profileError.message)
    }

    // 2. Check if user already has a workspace
    const { data: memberships, error: memberQueryError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', userId)

    if (memberQueryError) {
      console.warn('[auth] Could not check workspace members:', memberQueryError.message)
    }

    // If no existing workspace membership, provision a default personal workspace
    if (!memberships || memberships.length === 0) {
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
        console.error('[auth] Failed to create personal workspace:', wsError.message)
      } else if (newWorkspace) {
        // Ensure owner membership in workspace_members
        const { error: memberInsertError } = await supabase
          .from('workspace_members')
          .upsert({
            workspace_id: newWorkspace.id,
            user_id: userId,
            role: 'owner',
          }, { onConflict: 'workspace_id,user_id' })

        if (memberInsertError) {
          console.error('[auth] Failed to insert workspace owner member:', memberInsertError.message)
        }
      }
    }
  } catch (err) {
    console.error('[auth] Error in ensureUserProfileAndWorkspace:', err)
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

  if (data.user) {
    await ensureUserProfileAndWorkspace(
      supabase,
      data.user.id,
      data.user.email || email,
      data.user.user_metadata?.full_name
    )
  }

  revalidatePath('/', 'layout')
  redirect('/chat')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const fullName = (formData.get('fullName') as string)?.trim() || ''

  if (!email || !password) {
    redirect('/register?message=' + encodeURIComponent('Please fill in all required fields.'))
  }

  if (password.length < 6) {
    redirect('/register?message=' + encodeURIComponent('Password must be at least 6 characters.'))
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    redirect('/register?message=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    await ensureUserProfileAndWorkspace(
      supabase,
      data.user.id,
      data.user.email || email,
      fullName
    )
  }

  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/chat')
  } else {
    redirect('/login?message=' + encodeURIComponent('Account created successfully! Please sign in with your credentials.'))
  }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
