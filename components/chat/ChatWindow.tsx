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
    regenerateResponse,
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
        <div className="flex items-center gap-2">
          {/* Mobile Sidebar Toggle Button */}
          {!isOpen && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-[#252525] dark:hover:text-zinc-200 cursor-pointer md:hidden"
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <PanelLeft size={18} />
            </button>
          )}

          {/* Model Selector Dropdown in Header */}
          <div className="relative" ref={modelDropdownRef}>
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-200/60 dark:text-zinc-100 dark:hover:bg-[#252525] cursor-pointer"
              title="Select Model"
            >
              <span>{currentModel.name}</span>
              <ChevronDown 
                size={14} 
                strokeWidth={2} 
                className={`text-zinc-400 dark:text-zinc-500 transition-transform duration-150 ${isModelDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-30 w-[245px] rounded-2xl border border-zinc-200/90 bg-white/95 p-1 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-[#1e1e1e]/95 text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex flex-col gap-0.5">
                  {AVAILABLE_MODELS.map(model => {
                    const isSelected = model.id === selectedModel
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model.id)
                          setIsModelDropdownOpen(false)
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-100 dark:bg-white/[0.08]' 
                            : 'hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-1">
                          <div className="shrink-0 text-zinc-500">
                            {renderModelIcon(model.id)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12.5px] font-medium text-zinc-900 dark:text-zinc-100">{model.name}</span>
                              {model.badge && model.badge !== 'Default' && (
                                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 text-[9px] font-normal text-zinc-500 border border-zinc-200/50 dark:border-zinc-700/50">
                                  {model.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500 truncate max-w-[155px]">{model.description}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check size={13} className="text-zinc-900 dark:text-white shrink-0 ml-1" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
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
                feedback={message.feedback}
                sources={message.sources}
                hasKnowledge={message.hasKnowledge}
                isLast={isLast}
                onRegenerate={isLast && message.role === 'assistant' ? regenerateResponse : undefined}
                onEdit={message.role === 'user' ? (newContent) => editUserMessage(message.id, newContent) : undefined}
                onFeedback={(type) => toggleFeedback(message.id, type)}
                onCopy={(text) => copyMessage(text)}
              />
            )
          })}

          {/* Thinking Animation */}
          {chatState === 'thinking' && (
            <div className="flex w-full justify-center px-4 py-3 sm:px-6 md:py-4">
              <div className="flex w-full max-w-[760px] gap-3 md:gap-4 justify-start">
                <div className="shrink-0 pt-0.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white p-0.5 shadow-xs border border-zinc-200/60 dark:border-white/[0.08] dark:bg-zinc-800 overflow-hidden">
                    <Image
                      src="/logo-ci.png"
                      alt="chatINALabs"
                      width={22}
                      height={22}
                      className="object-contain"
                    />
                  </div>
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
              isLast={true}
            />
          )}

          <div ref={messagesEndRef} />

          {/* Bottom Floating Composer */}
          <MessageInput 
            onSendMessage={sendMessage} 
            isLoading={chatState !== 'idle'} 
          />
        </div>
      )}
    </div>
  )
}
