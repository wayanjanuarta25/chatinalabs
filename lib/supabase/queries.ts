import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { getUserWorkspace } from './workspace'

export { getUserWorkspace }
export type DBConversation = Database['public']['Tables']['conversations']['Row']
export type DBMessage = Database['public']['Tables']['messages']['Row']

/**
 * Ensures the user has an active workspace ID.
 * First checks existing membership and ownership via getUserWorkspace().
 */
export async function getOrCreateUserWorkspace(
  supabase: SupabaseClient<Database>,
  userId: string,
  userEmail: string
): Promise<string> {
  // 1. Check existing workspace
  const existingWsId = await getUserWorkspace(supabase, userId)
  if (existingWsId) {
    return existingWsId
  }

  // 2. Safe fallback recovery only if user session matches
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    console.error('[AUTH] getOrCreateUserWorkspace: Aborted fallback insert. No active session matching user.id:', userId)
    throw new Error('Workspace missing and user session unverified.')
  }

  console.log('[AUTH] Fallback creating personal workspace for user.id:', userId)
  const slug = `personal-${userId.slice(0, 8)}`
  const displayName = userEmail.split('@')[0] || 'Personal'
  
  const { data: newWs, error } = await supabase
    .from('workspaces')
    .insert({
      owner_id: userId,
      name: `${displayName}'s Workspace`,
      slug,
    })
    .select('id')
    .single()

  if (error || !newWs) {
    console.error('[AUTH] getOrCreateUserWorkspace: Could not create workspace:', error?.message)
    throw new Error('Could not provision workspace for user.')
  }

  await supabase.from('workspace_members').upsert({
    workspace_id: newWs.id,
    user_id: userId,
    role: 'owner',
  }, { onConflict: 'workspace_id,user_id' })

  console.log('[AUTH] Fallback workspace created:', newWs.id, 'for user.id:', userId)
  return newWs.id
}

/**
 * Fetch all conversations accessible to the current user, ordered by updated_at descending.
 * Filters out conversations that have 0 messages (empty chats).
 */
export async function fetchUserConversations(
  supabase: SupabaseClient<Database>
): Promise<DBConversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, messages(count)')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error.message)
    return []
  }

  // Filter out conversations that have 0 messages (empty chats that were never started)
  const activeConversations = (data || []).filter(c => {
    const messagesCountArray = (c as unknown as { messages?: { count: number }[] }).messages
    const count = messagesCountArray && messagesCountArray.length > 0 ? messagesCountArray[0].count : 0
    return count > 0
  })

  return activeConversations as unknown as DBConversation[]
}

export type DBMessageWithAttachments = DBMessage & {
  message_attachments?: Database['public']['Tables']['message_attachments']['Row'][]
}

/**
 * Fetch all messages in a conversation ordered chronologically with attachments.
 */
export async function fetchConversationMessages(
  supabase: SupabaseClient<Database>,
  conversationId: string
): Promise<DBMessageWithAttachments[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, message_attachments(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error.message)
    return []
  }

  return (data as unknown as DBMessageWithAttachments[]) || []
}

/**
 * Create a new conversation row in Supabase.
 * Verifies authenticated user and active workspace before inserting.
 * Supports optional predefined conversation ID for optimistic UI.
 */
export async function createSupabaseConversation(
  supabase: SupabaseClient<Database>,
  title: string = 'New Chat',
  model: string = 'chatINALabs AI',
  id?: string
): Promise<DBConversation | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.warn('[AUTH] Cannot create conversation: User is not authenticated')
    return null
  }

  const workspaceId = await getUserWorkspace(supabase, user.id)
  if (!workspaceId) {
    console.error('[AUTH] Cannot create conversation: Workspace missing for user.id:', user.id)
    return null
  }

  console.log('[CHAT] Creating conversation', id || '(new generated)')
  console.log('[AUTH] Creating conversation. user.id:', user.id, 'workspace.id:', workspaceId)

  const insertPayload: Database['public']['Tables']['conversations']['Insert'] = {
    workspace_id: workspaceId,
    user_id: user.id,
    title: title.trim() || 'New Chat',
    model: model || 'chatINALabs AI',
    ...(id ? { id } : {}),
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    console.error('[AUTH] Error creating conversation:', error.message)
    return null
  }

  return data
}

/**
 * Insert a message into the messages table and update the parent conversation's updated_at timestamp.
 */
export async function saveSupabaseMessage(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  model?: string | null,
  metadata?: Record<string, unknown>,
  clientMessageId?: string | null,
  customMessageId?: string | null
): Promise<DBMessage | null> {
  const mergedMetadata: Record<string, unknown> = {
    ...(metadata || {}),
    ...(model ? { model } : {}),
  }

  const effectiveClientMsgId =
    clientMessageId ||
    (typeof metadata?.clientMessageId === 'string' ? (metadata.clientMessageId as string) : null) ||
    (typeof metadata?.client_message_id === 'string' ? (metadata.client_message_id as string) : null)

  const insertPayload: Database['public']['Tables']['messages']['Insert'] = {
    conversation_id: conversationId,
    role,
    content,
    metadata: mergedMetadata as Database['public']['Tables']['messages']['Insert']['metadata'],
    ...(effectiveClientMsgId ? { client_message_id: effectiveClientMsgId } : {}),
    ...(customMessageId ? { id: customMessageId } : {}),
  }

  const { data, error } = await supabase
    .from('messages')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    console.error('[saveSupabaseMessage] Error saving message to database:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      conversationId,
      role,
    })
    return null
  }

  // Update conversation updated_at
  const { error: convUpdateError } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (convUpdateError) {
    console.warn('[saveSupabaseMessage] Warning updating conversation updated_at:', {
      code: convUpdateError.code,
      message: convUpdateError.message,
      details: convUpdateError.details,
      hint: convUpdateError.hint,
      conversationId,
    })
  }

  return data
}

/**
 * Update conversation title or model.
 */
export async function updateSupabaseConversation(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  updates: { title?: string; model?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  if (error) {
    console.error('Error updating conversation:', error.message)
    return false
  }

  return true
}

/**
 * Delete a conversation from Supabase (cascades to messages).
 */
export async function deleteSupabaseConversation(
  supabase: SupabaseClient<Database>,
  conversationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    console.error('Error deleting conversation:', error.message)
    return false
  }

  return true
}

/**
 * Update message feedback in metadata.
 */
export async function updateMessageFeedback(
  supabase: SupabaseClient<Database>,
  messageId: string,
  feedback: 'like' | 'dislike' | null
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('messages')
    .select('metadata')
    .eq('id', messageId)
    .single()

  const currentMeta = (existing?.metadata as Record<string, unknown>) || {}
  const updatedMeta = { ...currentMeta, feedback }

  const { error } = await supabase
    .from('messages')
    .update({ metadata: updatedMeta })
    .eq('id', messageId)

  return !error
}


