import { ChatWindow } from '@/components/chat/ChatWindow'
import { getMessages } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  // Verify conversation exists and belongs to user
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !conversation) {
    return notFound()
  }

  // Fetch messages for this specific conversation
  const initialMessages = await getMessages(id)

  return <ChatWindow key={id} conversationId={id} initialMessages={initialMessages} />
}
