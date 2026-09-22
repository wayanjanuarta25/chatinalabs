'use client'

import { Loader2 } from 'lucide-react'

interface UploadProgressProps {
  fileName: string
  percent: number
  isUploading: boolean
}

export function UploadProgress({ fileName, percent, isUploading }: UploadProgressProps) {
  if (!isUploading) return null

  return (
    <div className="mx-3 mb-2 rounded-2xl border border-blue-500/20 bg-blue-50/50 p-3 dark:border-blue-500/30 dark:bg-blue-950/30 text-xs animate-in fade-in-50 duration-150">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />
          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
            Uploading {fileName}...
          </span>
        </div>
        <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">
          {percent}%
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-blue-100 dark:bg-blue-900/40 overflow-hidden">
        <div
          style={{ width: `${percent}%` }}
          className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 rounded-full"
        />
      </div>
    </div>
  )
}
