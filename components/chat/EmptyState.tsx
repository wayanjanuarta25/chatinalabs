'use client'

import { Sparkles } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700 h-full">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200 dark:border-emerald-800/50">
        <Sparkles className="text-emerald-600 dark:text-emerald-400" size={32} />
      </div>
      <h2 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">How can I help you today?</h2>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
        I am your advanced AI assistant. Start typing a message below to begin a new conversation.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full max-w-2xl">
        <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left group">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Explain quantum computing</p>
          <p className="text-xs text-zinc-500 mt-1">in simple terms for a 5 year old</p>
        </div>
        <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left group">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Write a React component</p>
          <p className="text-xs text-zinc-500 mt-1">that implements a draggable list</p>
        </div>
      </div>
    </div>
  )
}
