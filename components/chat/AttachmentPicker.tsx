'use client'

import { useRef, useEffect } from 'react'
import { FileText, Image as ImageIcon } from 'lucide-react'
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
} from '@/lib/attachments/validation'

interface AttachmentPickerProps {
  isOpen: boolean
  onClose: () => void
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function AttachmentPicker({
  isOpen,
  onClose,
  onFilesSelected,
  disabled = false,
}: AttachmentPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleDocumentClick = () => {
    onClose()
    docInputRef.current?.click()
  }

  const handleImageClick = () => {
    onClose()
    imgInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files)
      onFilesSelected(selected)
      // Reset input value so re-selecting same file triggers change
      e.target.value = ''
    }
  }

  return (
    <>
      {/* Hidden native file inputs */}
      <input
        ref={docInputRef}
        type="file"
        multiple
        accept={ALLOWED_DOCUMENT_EXTENSIONS.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={imgInputRef}
        type="file"
        multiple
        accept={ALLOWED_IMAGE_EXTENSIONS.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />

      {isOpen && (
        <div
          ref={containerRef}
          className="absolute bottom-12 left-0 z-50 min-w-[210px] rounded-2xl border border-zinc-200/90 bg-white p-1.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-[#1a1a1a] animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={handleDocumentClick}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100/80 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer transition-colors disabled:opacity-50"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FileText size={14} />
              </div>
              <span className="whitespace-nowrap">Upload Document</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={handleImageClick}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100/80 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer transition-colors disabled:opacity-50"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ImageIcon size={14} />
              </div>
              <span className="whitespace-nowrap">Upload Image</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
