'use client'

import { useState, useEffect, useRef } from 'react'
import { EmptyState } from './EmptyState'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { Database } from '@/lib/supabase/database.types'
import { Bot, AlertCircle, Square, RefreshCcw } from 'lucide-react'
import { truncateConversationFrom } from '@/lib/supabase/queries'

type Message = Database['public']['Tables']['messages']['Row']
type ChatState = 'idle' | 'submitting' | 'streaming' | 'completed' | 'error'

interface ChatWindowProps {
  conversationId?: string
  initialMessages?: Message[]
}

export function ChatWindow({ conversationId, initialMessages = [] }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [chatState, setChatState] = useState<ChatState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const [streamingContent, setStreamingContent] = useState('')
  const [lastUserMessage, setLastUserMessage] = useState<{content: string, id: string} | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isGenerating = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, chatState])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (chatState === 'streaming' || chatState === 'submitting')) {
        handleStop()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [chatState])

  const handleSendMessage = async (content?: string, retryClientMessageId?: string) => {
    if (!conversationId || isGenerating.current) {
      console.warn('Blocked: No conversation ID or already generating')
      return
    }

    isGenerating.current = true
    setErrorMessage(null)
    setChatState('submitting')

    let clientMessageId = retryClientMessageId
    
    // If content is provided, we are sending a new user message
    if (content) {
      clientMessageId = retryClientMessageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      setLastUserMessage({ content, id: clientMessageId })

      if (!retryClientMessageId) {
        const tempUserMsg: Message = {
          id: clientMessageId,
          conversation_id: conversationId,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
          client_message_id: clientMessageId,
          metadata: null
        }
        setMessages(prev => [...prev, tempUserMsg])
      }
    }

    try {
      abortControllerRef.current = new AbortController()
      setChatState('streaming')
      setStreamingContent('')
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content, clientMessageId }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(Boolean)
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2))
              fullContent += text
              setStreamingContent(fullContent)
            } catch {
              // Ignore incomplete chunk parses
            }
          }
        }
      }

      setChatState('completed')
      
      // eslint-disable-next-line react-hooks/purity
      const optimisticAssistantMsg: Message = {
        id: `ast_${Date.now()}`, 
        conversation_id: conversationId,
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
        client_message_id: null,
        metadata: null
      }
      
      setMessages(prev => [...prev, optimisticAssistantMsg])
      setStreamingContent('')
      setChatState('idle')
      if (content) setLastUserMessage(null)

    } catch (error: unknown) {
      const err = error as Error
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user')
        setChatState('idle')
        if (streamingContent.trim().length > 0) {
           // eslint-disable-next-line react-hooks/purity
           const partialMsg: Message = {
            id: `ast_${Date.now()}`,
            conversation_id: conversationId,
            role: 'assistant',
            content: streamingContent,
            created_at: new Date().toISOString(),
            client_message_id: null,
            metadata: null
          }
          setMessages(prev => [...prev, partialMsg])
        }
        setStreamingContent('')
      } else {
        console.error('Chat error:', err)
        setChatState('error')
        setErrorMessage(err.message || "Failed to generate response. Please try again.")
      }
    } finally {
      isGenerating.current = false
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleRetry = () => {
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content, lastUserMessage.id)
    } else {
      handleSendMessage() // Regenerate
    }
  }

  const handleEdit = async (messageId: string, newContent: string) => {
    if (!conversationId || isGenerating.current) return
    
    const targetIndex = messages.findIndex(m => m.id === messageId)
    if (targetIndex === -1) return
    
    setMessages(prev => prev.slice(0, targetIndex))
    
    try {
      await truncateConversationFrom(conversationId, messageId)
      handleSendMessage(newContent)
    } catch (err) {
      console.error("Failed to edit:", err)
      setErrorMessage("Failed to edit message. Please refresh.")
    }
  }

  const handleRegenerate = async () => {
    if (!conversationId || isGenerating.current || messages.length === 0) return
    
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== 'assistant') return
    
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return

    setMessages(prev => prev.slice(0, -1))
    
    try {
      await truncateConversationFrom(conversationId, lastMsg.id)
      handleSendMessage() // Regenerate without adding new user text
    } catch (err) {
      console.error("Failed to regenerate:", err)
      setErrorMessage("Failed to regenerate. Please refresh.")
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 relative">
      <div className="flex-1 overflow-y-auto">
        {!conversationId || (messages.length === 0 && chatState === 'idle') ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col pb-24">
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={msg.id} 
                role={msg.role} 
                content={msg.content} 
                isLast={idx === messages.length - 1}
                onRegenerate={idx === messages.length - 1 && msg.role === 'assistant' ? handleRegenerate : undefined}
                onEdit={msg.role === 'user' ? (newContent) => handleEdit(msg.id, newContent) : undefined}
              />
            ))}
            
            {(chatState === 'submitting' || chatState === 'streaming') && (
              chatState === 'submitting' && !streamingContent ? (
                <div className="py-6 px-4 sm:px-8 w-full flex justify-center bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                   <div className="max-w-3xl w-full flex gap-4 md:gap-6">
                      <div className="shrink-0 pt-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-700/50">
                          <Bot size={18} />
                        </div>
                      </div>
                      <div className="flex-1 pt-1.5 flex gap-2 items-center text-sm text-zinc-500">
                         <div className="flex gap-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                           <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                           <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                         </div>
                         chatINALabs is thinking...
                      </div>
                   </div>
                </div>
              ) : (
                <MessageBubble role="assistant" content={streamingContent} />
              )
            )}
            
            {chatState === 'error' && errorMessage && (
              <div className="py-6 px-4 sm:px-8 w-full flex justify-center bg-red-50 dark:bg-red-950/20 border-y border-red-100 dark:border-red-900/50">
                <div className="max-w-3xl w-full flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-red-600 dark:text-red-400">
                   <div className="flex items-center gap-3">
                     <AlertCircle size={20} className="shrink-0" />
                     <p className="text-sm font-medium">{errorMessage}</p>
                   </div>
                   <button 
                     onClick={handleRetry}
                     className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/80 text-sm font-medium transition-colors"
                   >
                     <RefreshCcw size={14} />
                     Retry
                   </button>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {chatState === 'streaming' && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none z-10">
          <button
            onClick={handleStop}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full text-sm font-medium shadow-sm transition-all animate-in slide-in-from-bottom-2 fade-in"
          >
            <Square size={14} className="fill-current" />
            Stop generating
          </button>
        </div>
      )}

      <div className="mt-auto">
        <MessageInput 
          onSendMessage={(c) => handleSendMessage(c)} 
          isLoading={chatState === 'submitting' || chatState === 'streaming'} 
          disabled={!conversationId} 
        />
      </div>
    </div>
  )
}
