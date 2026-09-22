'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { EmptyState } from './EmptyState'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { ChevronDown, PanelLeft, Check, Sparkles, Brain, Palette, Code2 } from 'lucide-react'
import Image from 'next/image'
import { useSidebar } from '@/components/sidebar/SidebarContext'
import { useChatStore } from '@/lib/store/useChatStore'
import { AVAILABLE_MODELS } from '@/lib/store/dummyData'

interface ChatWindowProps {
  initialConversationId?: string
}

export function ChatWindow({ initialConversationId }: ChatWindowProps = {}) {
  const { isOpen, toggleSidebar } = useSidebar()
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    getActiveConversation,
    chatState,
    streamingContent,
    sendMessage,
    stopGeneration,
    isGenerating,
    regenerateResponse,
    retryFailedGeneration,
    editUserMessage,
    toggleFeedback,
    copyMessage,
    selectedModel,
    setSelectedModel,
    loadConversations,
    selectConversation
  } = useChatStore()

  const activeConversation = getActiveConversation()
  const messages = useMemo(() => activeConversation?.messages || [], [activeConversation?.messages])
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0]

  // Load conversations from Supabase on mount and select initial conversation if provided
  useEffect(() => {
    loadConversations().then(() => {
      if (initialConversationId) {
        selectConversation(initialConversationId)
      }
    })
  }, [loadConversations, selectConversation, initialConversationId])

  // Auto-scroll when messages update or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, chatState])

  // Close model dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const renderModelIcon = (id: string) => {
    switch (id) {
      case 'chatinalabs-reasoning':
        return <Brain size={14} className="text-purple-500 shrink-0" />
      case 'chatinalabs-creative':
        return <Palette size={14} className="text-amber-500 shrink-0" />
      case 'chatinalabs-code':
        return <Code2 size={14} className="text-sky-500 shrink-0" />
      case 'chatinalabs-ai':
      default:
        return <Sparkles size={14} className="text-emerald-500 shrink-0" />
    }
  }

  return (
    <div className="relative flex h-full flex-1 flex-col bg-[#f7f7f7] dark:bg-[#171717] overflow-hidden">
      {/* Top Header Bar */}
      <header className="absolute inset-x-0 top-0 z-10 flex h-13 items-center justify-between border-b border-transparent bg-[#f7f7f7]/85 px-3 sm:px-4 backdrop-blur-md dark:bg-[#171717]/85">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile Sidebar Toggle Button */}
          {!isOpen && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-[#252525] dark:hover:text-zinc-200 cursor-pointer md:hidden"
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <PanelLeft size={18} />
            </button>
          )}

          {/* Conversation Title in Header (Hidden on new chat / empty state) */}
          {activeConversation && messages.length > 0 && (
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[220px] sm:max-w-[360px] md:max-w-[480px]">
              {activeConversation.title}
            </h2>
          )}
        </div>

        {/* Header Right */}
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === 'development' && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              dev
            </span>
          )}
        </div>
      </header>

      {/* Main View: Empty State vs Conversation Thread */}
      {!activeConversation || messages.length === 0 ? (
        <EmptyState onSendMessage={sendMessage} isLoading={chatState !== 'idle'} />
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto pb-32 pt-16">
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1
            return (
              <MessageBubble
                key={message.id}
                id={message.id}
                role={message.role}
                content={message.content}
                model={message.model || selectedModel}
                feedback={message.feedback}
                sources={message.sources}
                hasKnowledge={message.hasKnowledge}
                attachments={message.attachments}
                isLast={isLast}
                onRegenerate={message.role === 'assistant' ? () => regenerateResponse(message.id) : undefined}
                onRetry={() => retryFailedGeneration(message.id)}
                onEdit={message.role === 'user' ? (newContent) => editUserMessage(message.id, newContent) : undefined}
                onFeedback={(type) => toggleFeedback(message.id, type)}
                onCopy={(text) => copyMessage(text)}
              />
            )
          })}

          {/* Thinking Animation */}
          {chatState === 'thinking' && (
            <div className="flex w-full justify-center px-4 py-3 sm:px-6 md:py-4">
              <div className="flex w-full max-w-[760px] flex-col justify-start">
                <div className="flex items-center gap-2 mb-2 select-none">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    <Image
                      src="/logo-ci.png"
                      alt="Inalabs AI"
                      width={18}
                      height={18}
                      className="object-contain dark:invert"
                      priority
                    />
                  </div>
                  <span className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Inalabs AI - {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" />
                  <span className="ml-1 text-xs">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Streaming Animation with Cursor */}
          {chatState === 'streaming' && (
            <MessageBubble
              role="assistant"
              content={`${streamingContent} ▍`}
              model={selectedModel}
              isLast={true}
            />
          )}

          <div ref={messagesEndRef} />

          {/* Bottom Floating Composer */}
          <MessageInput 
            onSendMessage={sendMessage} 
            onStopGenerate={stopGeneration}
            isLoading={chatState === 'thinking' || chatState === 'streaming' || isGenerating} 
          />
        </div>
      )}
    </div>
  )
}
