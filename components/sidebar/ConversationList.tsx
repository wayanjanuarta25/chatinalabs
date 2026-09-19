'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react'
import { useChatStore } from '@/lib/store/useChatStore'

interface ConversationListProps {
  onSelect?: () => void
}

export function ConversationList({ onSelect }: ConversationListProps) {
  const { 
    conversations, 
    activeConversationId, 
    selectConversation, 
    renameConversation, 
    deleteConversation,
    isLoadingConversations
  } = useChatStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null)
      }
    }
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeMenuId])

  // Group conversations by category
  const groups: Record<string, typeof conversations> = {
    'Today': conversations.filter(c => c.category === 'Today'),
    'Yesterday': conversations.filter(c => c.category === 'Yesterday'),
    'Previous 7 Days': conversations.filter(c => c.category === 'Previous 7 Days')
  }

  const handleRenameSubmit = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim())
    }
    setEditingId(null)
  }

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditTitle(currentTitle)
    setEditingId(id)
    setActiveMenuId(null)
  }

  const handleDelete = (id: string) => {
    deleteConversation(id)
    setActiveMenuId(null)
  }

  if (isLoadingConversations && conversations.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-2 py-4 animate-pulse">
        <div className="h-3 w-14 rounded bg-zinc-200/60 dark:bg-zinc-800" />
        <div className="h-7 w-full rounded-xl bg-zinc-200/40 dark:bg-zinc-800/40" />
        <div className="h-7 w-full rounded-xl bg-zinc-200/40 dark:bg-zinc-800/40" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-3 py-10 text-center">
        <p className="text-[12px] font-normal text-zinc-400 dark:text-zinc-500">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="mt-1 flex flex-col gap-1 pb-4">
      {Object.entries(groups).map(([category, items]) => {
        if (items.length === 0) return null
        return (
          <div key={category} className="mb-2.5">
            <div className="mb-1 px-2.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              {category}
            </div>
            <div className="flex flex-col gap-0.5">
              {items.map(chat => {
                const isActive = activeConversationId === chat.id
                const isMenuOpen = activeMenuId === chat.id

                return (
                  <div key={chat.id} className="group relative flex items-center">
                    {editingId === chat.id ? (
                      <form 
                        onSubmit={(e) => handleRenameSubmit(chat.id, e)}
                        className="flex flex-1 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2 py-1 shadow-sm dark:border-zinc-700 dark:bg-[#1e1e1e]"
                      >
                        <MessageSquare size={13} className="shrink-0 text-zinc-400" />
                        <input 
                          ref={inputRef}
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="flex-1 bg-transparent text-[11.5px] text-zinc-900 outline-none dark:text-zinc-100 min-w-0"
                          maxLength={80}
                        />
                        <button type="submit" className="p-0.5 text-emerald-600 hover:text-emerald-700 cursor-pointer">
                          <Check size={12} />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="p-0.5 text-zinc-400 hover:text-zinc-600 cursor-pointer">
                          <X size={12} />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          selectConversation(chat.id)
                          window.history.pushState(null, '', `/chat/${chat.id}`)
                          onSelect?.()
                        }}
                        className={`min-w-0 flex-1 flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[12.5px] text-left transition-colors duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-zinc-200/90 font-medium text-zinc-950 dark:bg-white/[0.08] dark:text-zinc-100'
                            : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center min-w-0 flex-1 gap-2.5 pr-6">
                          <MessageSquare 
                            size={14} 
                            strokeWidth={1.8} 
                            className={`shrink-0 transition-colors ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`} 
                          />
                          <span className="truncate block leading-snug">{chat.title}</span>
                        </div>
                      </button>
                    )}

                    {/* Three Dot Menu Button */}
                    {!editingId && (
                      <div className="absolute right-1 flex items-center">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuId(activeMenuId === chat.id ? null : chat.id)
                          }}
                          className={`rounded-md p-1 text-zinc-400 transition-opacity duration-150 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer ${
                            isMenuOpen ? 'opacity-100 bg-zinc-200 dark:bg-zinc-800 text-zinc-800' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          title="Options"
                          aria-label="Conversation options"
                        >
                          <MoreHorizontal size={13} />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 top-7 z-40 w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl backdrop-blur-lg dark:border-zinc-800 dark:bg-[#1a1a1a] text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartRename(chat.id, chat.title)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                            >
                              <Pencil size={13} className="text-zinc-400" />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(chat.id)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
