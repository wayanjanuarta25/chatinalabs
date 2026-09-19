'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { KnowledgeBaseManager } from './KnowledgeBaseManager'

interface KnowledgeBaseModalProps {
  isOpen: boolean
  onClose: () => void
  initialKnowledgeBaseId?: string
}

export function KnowledgeBaseModal({ isOpen, onClose, initialKnowledgeBaseId }: KnowledgeBaseModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#141414] animate-in fade-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          <KnowledgeBaseManager
            initialKnowledgeBaseId={initialKnowledgeBaseId}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  )
}
