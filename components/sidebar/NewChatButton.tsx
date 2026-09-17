'use client'

import { useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createConversation } from '@/lib/supabase/queries'

export function NewChatButton() {
  const [isPending, startTransition] = useTransition()

  const handleNewChat = () => {
    startTransition(async () => {
      await createConversation()
    })
  }

  return (
    <button 
      onClick={handleNewChat}
      disabled={isPending}
      className="w-full flex items-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg px-4 py-3 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
    >
      {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
      New Conversation
    </button>
  )
}
