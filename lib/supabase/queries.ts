/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Database } from './database.types'

type Conversation = Database['public']['Tables']['conversations']['Row']
type Message = Database['public']['Tables']['messages']['Row']

export async function createConversation() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: rawData, error } = await (supabase as any)
    .from('conversations')
    .insert({
      user_id: user.id,
      title: 'New Conversation',
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/chat')
  redirect(`/chat/${(rawData as Conversation).id}`)
}

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data: rawData, error } = await (supabase as any)
    .from('conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return rawData as Conversation[]
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient()
  
  // RLS will ensure user only sees messages for their own conversations
  const { data: rawData, error } = await (supabase as any)
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return rawData as Message[]
}

export async function saveMessage(
  conversationId: string, 
  role: 'user' | 'assistant' | 'system', 
  content: string,
  clientMessageId?: string,
  metadata?: Database['public']['Tables']['messages']['Row']['metadata']
): Promise<Message> {
  const supabase = await createClient()
  
  if (clientMessageId) {
    const { data: existingMessage } = await (supabase as any)
      .from('messages')
      .select('*')
      .eq('client_message_id', clientMessageId)
      .maybeSingle()

    if (existingMessage) {
      return existingMessage as Message
    }
  }

  const { data: rawData, error } = await (supabase as any)
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      client_message_id: clientMessageId || null,
      metadata: metadata || null
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Touch the updated_at timestamp on the conversation
  await (supabase as any)
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  revalidatePath(`/chat/${conversationId}`)
  revalidatePath('/chat')
  
  return rawData as Message
}

export async function renameConversation(conversationId: string, newTitle: string): Promise<void> {
  const title = newTitle.trim().substring(0, 100)
  if (!title) throw new Error("Title cannot be empty")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await (supabase as any)
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/chat')
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Hard delete for MVP
  const { error } = await (supabase as any)
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/chat')
}

export async function truncateConversationFrom(conversationId: string, messageId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Verify ownership
  const { data: conv } = await (supabase as any)
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conv) throw new Error("Conversation not found or unauthorized")

  // Find the created_at of the target message
  const { data: targetMessage, error: findError } = await (supabase as any)
    .from('messages')
    .select('created_at')
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .single()

  if (findError || !targetMessage) throw new Error("Target message not found")

  // Delete all messages created at or after the target message
  const { error: delError } = await (supabase as any)
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId)
    .gte('created_at', targetMessage.created_at)

  if (delError) throw new Error(delError.message)

  // Update conversation updated_at
  await (supabase as any)
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  revalidatePath(`/chat/${conversationId}`)
}
