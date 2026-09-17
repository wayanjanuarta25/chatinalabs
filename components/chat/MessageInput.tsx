'use client'

import { useRef, useState, useEffect } from 'react'
import { Send, Paperclip } from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function MessageInput({ onSendMessage, isLoading = false, disabled = false }: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [content])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (content.trim() && !isLoading && !disabled) {
      onSendMessage(content.trim())
      setContent('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  return (
    <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
      <div className={`max-w-3xl mx-auto relative flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl p-2 shadow-sm transition-all ${!disabled ? 'focus-within:ring-1 focus-within:ring-emerald-500/50' : 'opacity-70'}`}>
        
        <button 
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full transition-colors mb-0.5 disabled:opacity-50"
          title="Attach file (coming soon)"
          disabled={disabled}
        >
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Start a new conversation to chat..." : "Message chatINALabs..."}
          className="flex-1 max-h-[200px] bg-transparent resize-none outline-none py-2.5 px-2 text-sm md:text-base placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 disabled:cursor-not-allowed"
          rows={1}
          disabled={isLoading || disabled}
        />

        <button
          onClick={handleSend}
          disabled={!content.trim() || isLoading || disabled}
          className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white rounded-xl transition-colors mb-0.5"
        >
          <Send size={18} className={content.trim() && !isLoading && !disabled ? "opacity-100" : "opacity-50"} />
        </button>
      </div>
      <div className="text-center mt-3">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-500">
          AI can make mistakes. Consider verifying important information.
        </span>
      </div>
    </div>
  )
}
