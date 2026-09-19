'use client'

import { SquarePen } from 'lucide-react'
import { useChatStore } from '@/lib/store/useChatStore'

interface NewChatButtonProps {
  onClick?: () => void
}

export function NewChatButton({ onClick }: NewChatButtonProps) {
  const createNewChat = useChatStore(s => s.createNewChat)

  const handleClick = () => {
    createNewChat()
    onClick?.()
  }

  return (
    <button 
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-between rounded-xl border border-transparent bg-white/60 px-2.5 py-1.5 text-[12px] font-medium text-zinc-800 transition-colors hover:bg-white hover:shadow-xs dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08] cursor-pointer"
      title="Obrolan Baru"
    >
      <div className="flex items-center gap-2">
        <SquarePen size={14} className="text-zinc-500 dark:text-zinc-400" />
        <span>New Chat</span>
      </div>
      <kbd className="hidden rounded bg-zinc-200/60 px-1 py-0.5 text-[9px] font-medium text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500 sm:inline-block">
        Ctrl+K
      </kbd>
    </button>
  )
}
