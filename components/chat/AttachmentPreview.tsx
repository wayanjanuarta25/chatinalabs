'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { FileText, FileCode, FileSpreadsheet, X, RotateCcw, AlertCircle, Loader2 } from 'lucide-react'
import { formatFileSize, getAttachmentType, AttachmentType } from '@/lib/attachments/validation'

export interface PendingAttachment {
  id: string
  file: File
  type: AttachmentType
  previewUrl?: string
  status?: 'idle' | 'uploading' | 'error' | 'success'
  errorMessage?: string
}

interface AttachmentPreviewProps {
  attachments: PendingAttachment[]
  onRemove: (id: string) => void
  onRetry?: (id: string) => void
  disabled?: boolean
}

export function AttachmentPreview({
  attachments,
  onRemove,
  onRetry,
  disabled = false,
}: AttachmentPreviewProps) {
  if (attachments.length === 0) return null

  const getDocIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    if (ext === 'csv') return <FileSpreadsheet size={16} className="text-emerald-500" />
    if (['json', 'md'].includes(ext)) return <FileCode size={16} className="text-amber-500" />
    return <FileText size={16} className="text-blue-500" />
  }

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1.5 animate-in fade-in-50 duration-150">
      {attachments.map((item) => {
        const isImage = item.type === 'image' && item.previewUrl
        const isError = item.status === 'error'
        const isUploading = item.status === 'uploading'

        return (
          <div
            key={item.id}
            className={`group relative flex items-center gap-2.5 rounded-2xl border p-1.5 pr-2.5 text-xs shadow-xs transition-all ${
              isError
                ? 'border-red-300 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/40'
                : 'border-zinc-200/90 bg-zinc-50/90 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-zinc-700'
            }`}
          >
            {isImage ? (
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="h-full w-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isError ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-zinc-200/60 dark:bg-zinc-800/80'
              }`}>
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin text-zinc-500" />
                ) : isError ? (
                  <AlertCircle size={18} className="text-red-500" />
                ) : (
                  getDocIcon(item.file.name)
                )}
              </div>
            )}

            <div className="min-w-0 max-w-[150px] sm:max-w-[200px]">
              <p className={`truncate font-medium ${isError ? 'text-red-700 dark:text-red-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
                {item.file.name}
              </p>
              {isError ? (
                <p className="text-[10px] text-red-500 truncate font-medium">
                  {item.errorMessage || 'Upload failed'}
                </p>
              ) : isUploading ? (
                <p className="text-[10px] text-blue-500 flex items-center gap-1 font-medium">
                  <span>Uploading...</span>
                </p>
              ) : (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {formatFileSize(item.file.size)}
                </p>
              )}
            </div>

            {/* Actions: Retry (if error) and Remove */}
            <div className="flex items-center gap-0.5 ml-1">
              {isError && onRetry && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRetry(item.id)}
                  className="rounded-full p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/60 transition-colors cursor-pointer disabled:opacity-50"
                  title="Retry upload"
                  aria-label="Retry upload"
                >
                  <RotateCcw size={13} />
                </button>
              )}

              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(item.id)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Remove attachment"
                aria-label="Remove attachment"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
