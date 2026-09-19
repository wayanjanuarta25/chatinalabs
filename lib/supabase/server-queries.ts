import { createClient } from './server'
import { saveSupabaseMessage, type DBMessage } from './queries'

/**
 * Server-only helper to save a message using cookies-based Supabase server client.
 */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  clientMessageId?: string,
  metadata?: Record<string, unknown>
): Promise<DBMessage | null> {
  const supabase = await createClient()
  return saveSupabaseMessage(supabase, conversationId, role, content, null, {
    ...metadata,
    clientMessageId: clientMessageId || null,
  })
}
