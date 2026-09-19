'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Search, X, MessageSquare, ArrowRight } from 'lucide-react'
import { useChatStore } from '@/lib/store/useChatStore'

export function SearchModal() {
  const { isSearchModalOpen, setSearchModalOpen, conversations, selectConversation } = useChatStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchModalOpen(!isSearchModalOpen)
      } else if (e.key === 'Escape' && isSearchModalOpen) {
        setSearchModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchModalOpen, setSearchModalOpen])

  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isSearchModalOpen])

  const handleClose = () => {
    setQuery('')
    setSearchModalOpen(false)
  }

  const filteredResults = useMemo(() => {
    if (!query.trim()) return conversations.slice(0, 5)
    const q = query.toLowerCase()
    return conversations.filter(c => {
      const matchTitle = c.title.toLowerCase().includes(q)
      const matchMessage = c.messages.some(m => m.content.toLowerCase().includes(q))
      return matchTitle || matchMessage
    })
  }, [conversations, query])

  if (!isSearchModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden dark:border-zinc-800 dark:bg-[#1f1f1f] text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <Search size={18} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Esc
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
              No conversations found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="px-3 py-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {query ? 'Search Results' : 'Recent Conversations'}
              </div>
              {filteredResults.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => {
                    selectConversation(conv.id)
                    setSearchModalOpen(false)
                  }}
                  className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare size={16} className="text-zinc-400 shrink-0 group-hover:text-zinc-700 dark:group-hover:text-zinc-200" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                        {conv.title}
                      </p>
                      <p className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                        {conv.messages[conv.messages.length - 1]?.content.slice(0, 60)}...
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2 text-[11px] text-zinc-400 dark:border-zinc-800/80 dark:text-zinc-500">
          <span>Navigate with arrows</span>
          <span>Open with click</span>
        </div>
      </div>
    </div>
  )
}
