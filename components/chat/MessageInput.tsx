'use client'

import { useRef, useState, useEffect } from 'react'
import { 
  ArrowUp, 
  Plus, 
  FileText,
  Image as ImageIcon,
  Link2,
  X
} from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  isLoading?: boolean
  disabled?: boolean
  isCentered?: boolean
}

export function MessageInput({ 
  onSendMessage, 
  isLoading = false, 
  disabled = false, 
  isCentered = false 
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<string[]>([])
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const plusMenuRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [content])

  // Close plus popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const fullContent = attachedFiles.length > 0 
      ? `[Attachment: ${attachedFiles.join(', ')}]\n\n${content}`.trim()
      : content.trim()

    if (fullContent && !isLoading && !disabled) {
      onSendMessage(fullContent)
      setContent('')
      setAttachedFiles([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleAddMockAttachment = (fileName: string) => {
    if (!attachedFiles.includes(fileName)) {
      setAttachedFiles(prev => [...prev, fileName])
    }
    setIsPlusMenuOpen(false)
  }

  const handleRemoveAttachment = (name: string) => {
    setAttachedFiles(prev => prev.filter(f => f !== name))
  }

  return (
    <div className={isCentered ? "w-full max-w-[680px] mx-auto px-2" : "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#f7f7f7] via-[#f7f7f7] to-transparent px-3 pb-3 pt-6 dark:from-[#171717] dark:via-[#171717] sm:px-6 sm:pb-4"}>
      {/* Floating Rounded Composer */}
      <div className={`pointer-events-auto mx-auto max-w-[720px] rounded-[26px] border bg-white px-2 py-1.5 shadow-xs transition-all duration-200 dark:bg-[#212121] dark:shadow-xl ${!disabled ? 'border-zinc-200/90 focus-within:border-zinc-300 dark:border-zinc-800 dark:focus-within:border-zinc-700' : 'border-zinc-200 opacity-70 dark:border-transparent'}`}>
        
        {/* Mock Attachment Previews */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2 pt-1 pb-1.5">
            {attachedFiles.map(file => (
              <div 
                key={file} 
                className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <FileText size={12} className="text-zinc-500" />
                <span className="max-w-[140px] truncate font-medium">{file}</span>
                <button 
                  type="button" 
                  onClick={() => handleRemoveAttachment(file)}
                  className="rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  title="Remove attachment"
                  aria-label="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Compact Single-Row Layout matching ChatGPT */}
        <div className="flex items-end gap-1.5">
          {/* Left: Plus (+) Attachment Button */}
          <div className="relative shrink-0 pb-0.5" ref={plusMenuRef}>
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer ${isPlusMenuOpen ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white' : ''}`}
              title="Add attachment"
              aria-label="Add attachment"
            >
              <Plus size={18} strokeWidth={2} className={`transition-transform duration-150 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* Attachment Popup */}
            {isPlusMenuOpen && (
              <div className="absolute bottom-11 left-0 z-30 w-48 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl backdrop-blur-lg dark:border-zinc-800 dark:bg-[#1a1a1a] text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleAddMockAttachment('document.pdf')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <FileText size={15} className="text-zinc-400" />
                  <span>Upload Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMockAttachment('image.png')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <ImageIcon size={15} className="text-zinc-400" />
                  <span>Add Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMockAttachment('reference-link.url')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <Link2 size={15} className="text-zinc-400" />
                  <span>Web Link</span>
                </button>
              </div>
            )}
          </div>

          {/* Center: Auto-resizing Text Area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Start a new conversation..." : "Message chatINALabs..."}
            className="block flex-1 min-h-[26px] max-h-[140px] w-full resize-none bg-transparent px-1.5 py-1 text-[14px] leading-5 text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            rows={1}
            disabled={isLoading || disabled}
          />

          {/* Right: Send Button */}
          <div className="shrink-0 pb-0.5">
            <button
              onClick={handleSend}
              disabled={(!content.trim() && attachedFiles.length === 0) || isLoading || disabled}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xs transition-all hover:bg-black disabled:opacity-20 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer"
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <ArrowUp size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      {/* Clean Subtle Footer Notice */}
      {!isCentered && (
        <div className="mt-1.5 text-center">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            chatINALabs can make mistakes. Verify important info.
            {process.env.NODE_ENV === 'development' && (
              <span className="ml-1.5 text-[10px] text-zinc-400/60 font-mono">[dev]</span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
