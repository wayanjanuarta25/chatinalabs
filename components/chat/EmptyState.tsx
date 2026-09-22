'use client'

import { Briefcase, FileSearch, Sparkles, PenLine } from 'lucide-react'
import { MessageInput } from './MessageInput'
import { SUGGESTION_CARDS, SuggestionCard } from '@/lib/store/dummyData'
import { useChatStore } from '@/lib/store/useChatStore'

interface EmptyStateProps {
  onSendMessage: (content: string) => void
  isLoading?: boolean
}

export function EmptyState({ onSendMessage, isLoading }: EmptyStateProps) {
  const sendMessage = useChatStore(s => s.sendMessage)
  const stopGeneration = useChatStore(s => s.stopGeneration)
  const isGenerating = useChatStore(s => s.isGenerating)
  const chatState = useChatStore(s => s.chatState)

  const handleCardClick = (card: SuggestionCard) => {
    sendMessage(card.prompt)
  }

  const renderCardIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Briefcase size={16} className="text-zinc-500 shrink-0" />
      case 1:
        return <FileSearch size={16} className="text-zinc-500 shrink-0" />
      case 2:
        return <Sparkles size={16} className="text-zinc-500 shrink-0" />
      case 3:
      default:
        return <PenLine size={16} className="text-zinc-500 shrink-0" />
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col items-center justify-center px-4 pb-12 -mt-24 sm:-mt-28 text-center animate-in fade-in duration-150">
      <div className="w-full max-w-[680px] flex flex-col items-center">
        {/* Minimal ChatGPT Headline */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            How can I help you today?
          </h1>
        </div>

        {/* Centered Composer */}
        <div className="w-full mb-4">
          <MessageInput 
            onSendMessage={onSendMessage} 
            onStopGenerate={stopGeneration}
            isLoading={isLoading || chatState === 'thinking' || chatState === 'streaming' || isGenerating} 
            isCentered={true} 
          />
        </div>

        {/* 4 Suggestion Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
          {SUGGESTION_CARDS.map((card, idx) => (
            <button
              key={card.title}
              type="button"
              onClick={() => handleCardClick(card)}
              className="group flex items-center justify-between rounded-2xl border border-zinc-200/90 bg-white/60 p-3.5 shadow-xs transition-all hover:border-zinc-300 hover:bg-white hover:shadow-sm dark:border-zinc-800/80 dark:bg-[#212121]/60 dark:hover:border-zinc-700 dark:hover:bg-[#262626] cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="rounded-lg bg-zinc-100 p-1.5 dark:bg-zinc-800">
                  {renderCardIcon(idx)}
                </div>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors truncate">
                  {card.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
