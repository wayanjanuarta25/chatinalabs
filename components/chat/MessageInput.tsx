'use client'

import { useRef, useState, useEffect } from 'react'
import { 
  ArrowUp, 
  Plus, 
  Square,
  AlertCircle,
  X,
  Mic,
  Sparkles
} from 'lucide-react'
import { AttachmentPicker } from './AttachmentPicker'
import { AttachmentPreview, PendingAttachment } from './AttachmentPreview'
import { UploadProgress } from './UploadProgress'
import { ModelSelectorDropdown } from './ModelSelectorDropdown'
import { validateAttachment } from '@/lib/attachments/validation'

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[]) => Promise<{ success: boolean; error?: string; failedFileName?: string } | void> | void
  onStopGenerate?: () => void
  isLoading?: boolean
  disabled?: boolean
  isCentered?: boolean
}

export function MessageInput({ 
  onSendMessage, 
  onStopGenerate,
  isLoading = false, 
  disabled = false, 
  isCentered = false 
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [content])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      pendingAttachments.forEach((att) => {
        if (att.previewUrl) {
          URL.revokeObjectURL(att.previewUrl)
        }
      })
    }
  }, [pendingAttachments])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFilesSelected = (files: File[]) => {
    setValidationError(null)
    const existing = pendingAttachments.map(p => ({ name: p.file.name, size: p.file.size }))
    const validNewAttachments: PendingAttachment[] = []

    for (const file of files) {
      const validation = validateAttachment(
        file,
        [...existing, ...validNewAttachments.map(v => ({ name: v.file.name, size: v.file.size }))]
      )

      if (!validation.valid || !validation.attachmentType) {
        setValidationError(validation.error || 'Invalid file format')
        continue
      }

      let previewUrl: string | undefined = undefined
      if (validation.attachmentType === 'image') {
        previewUrl = URL.createObjectURL(file)
      }

      validNewAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        type: validation.attachmentType,
        previewUrl,
        status: 'idle',
      })
    }

    if (validNewAttachments.length > 0) {
      setPendingAttachments(prev => [...prev, ...validNewAttachments])
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setPendingAttachments(prev => {
      const item = prev.find(p => p.id === id)
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return prev.filter(p => p.id !== id)
    })
  }

  const handleRetryAttachment = (id: string) => {
    setPendingAttachments(prev => prev.map(p => (p.id === id ? { ...p, status: 'idle', errorMessage: undefined } : p)))
    setValidationError(null)
    setTimeout(() => {
      handleSend()
    }, 50)
  }

  const handleSend = async () => {
    const trimmed = content.trim()
    const filesToSend = pendingAttachments.map(p => p.file)

    if ((trimmed || filesToSend.length > 0) && !isLoading && !disabled) {
      setValidationError(null)
      if (filesToSend.length > 0) {
        setPendingAttachments(prev => prev.map(p => ({ ...p, status: 'uploading' })))
      }

      try {
        const result = await onSendMessage(trimmed, filesToSend.length > 0 ? filesToSend : undefined)

        if (result && typeof result === 'object' && result.success === false) {
          // Upload or message creation failed: do not clear user content or files
          setValidationError(result.error || 'Failed to upload attachment')
          setPendingAttachments(prev => prev.map(p => {
            if (!result.failedFileName || p.file.name === result.failedFileName) {
              return { ...p, status: 'error', errorMessage: result.error || 'Upload failed' }
            }
            return { ...p, status: 'idle' }
          }))
          return
        }

        // Success: clear composer state
        setContent('')
        setPendingAttachments([])
        setValidationError(null)
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      } catch (err: any) {
        setValidationError(err?.message || 'Failed to upload attachment')
        setPendingAttachments(prev => prev.map(p => ({ ...p, status: 'error', errorMessage: err?.message || 'Upload failed' })))
      }
    }
  }

  return (
    <div className={isCentered ? "w-full max-w-[680px] mx-auto px-2" : "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#f7f7f7] via-[#f7f7f7] to-transparent px-3 pb-3 pt-6 dark:from-[#171717] dark:via-[#171717] sm:px-6 sm:pb-4"}>
      {/* Floating Rounded Composer */}
      <div className={`pointer-events-auto mx-auto max-w-[720px] rounded-[26px] border bg-white px-2 py-1.5 shadow-xs transition-all duration-200 dark:bg-[#212121] dark:shadow-xl ${!disabled ? 'border-zinc-200/90 focus-within:border-zinc-300 dark:border-zinc-800 dark:focus-within:border-zinc-700' : 'border-zinc-200 opacity-70 dark:border-transparent'}`}>
        
        {/* Validation & Upload Error Notice */}
        {validationError && (
          <div className="mx-2 mt-1 mb-1.5 flex items-center justify-between rounded-xl bg-red-50/90 px-3 py-1.5 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200/80 dark:border-red-900/60 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <AlertCircle size={13} className="shrink-0" />
              <span className="truncate font-medium">{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="rounded-full p-0.5 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
              title="Dismiss alert"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Attachment Previews */}
        <AttachmentPreview
          attachments={pendingAttachments}
          onRemove={handleRemoveAttachment}
          onRetry={handleRetryAttachment}
          disabled={isLoading || disabled}
        />

        {/* Multi-Row Composer Layout matching ChatGPT / Reference UI */}
        <div className="flex flex-col">
          {/* Top: Auto-resizing Text Area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Start a new conversation..." : "Send a Message..."}
            className="block w-full min-h-[36px] max-h-[160px] resize-none bg-transparent px-2.5 pt-1.5 pb-1 text-[14px] leading-5 text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            rows={1}
            disabled={isLoading || disabled}
          />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-1.5 px-0.5">
            {/* Left Actions: Attachment & Tools */}
            <div className="flex items-center gap-1">
              <div className="relative shrink-0">
                <button
                  type="button"
                  disabled={disabled || isLoading}
                  onClick={() => setIsPickerOpen(!isPickerOpen)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer disabled:opacity-50 ${isPickerOpen ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white' : ''}`}
                  title="Add document or image attachment"
                  aria-label="Add attachment"
                >
                  <Plus size={18} strokeWidth={2} className={`transition-transform duration-150 ${isPickerOpen ? 'rotate-45' : ''}`} />
                </button>

                {/* Attachment Picker Menu */}
                <AttachmentPicker
                  isOpen={isPickerOpen}
                  onClose={() => setIsPickerOpen(false)}
                  onFilesSelected={handleFilesSelected}
                  disabled={disabled || isLoading}
                />
              </div>
            </div>

            {/* Right Actions: Model Selector Pill, Mic, and Send/Stop Button */}
            <div className="flex items-center gap-2">
              <ModelSelectorDropdown placement={isCentered ? 'bottom' : 'top'} />

              {/* Microphone Button */}
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Voice dictation"
                aria-label="Voice dictation"
              >
                <Mic size={17} />
              </button>

              {/* Send or Stop Button */}
              {isLoading ? (
                <button
                  type="button"
                  onClick={onStopGenerate}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xs transition-all hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer animate-in fade-in zoom-in-90 duration-150"
                  title="Stop generation"
                  aria-label="Stop generation"
                >
                  <Square size={13} fill="currentColor" strokeWidth={0} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={(!content.trim() && pendingAttachments.length === 0) || disabled}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xs transition-all hover:bg-black disabled:opacity-20 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer transition-transform active:scale-95"
                  title="Send message (Enter)"
                  aria-label="Send message"
                >
                  <ArrowUp size={16} strokeWidth={2.4} />
                </button>
              )}
            </div>
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
