'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, Check, X, Folder } from 'lucide-react'
import { useChatStore } from '@/lib/store/useChatStore'

interface ConversationListProps {
  onSelect?: () => void
}

function formatItemTime(chat: { updatedAt?: string; category?: string }, index: number): string {
  if (chat.updatedAt) {
    if (/^\d+[smhdwmy]$/.test(chat.updatedAt.trim())) {
      return chat.updatedAt.trim()
    }
    const parsed = new Date(chat.updatedAt)
    if (!isNaN(parsed.getTime())) {
      const diffMs = Date.now() - parsed.getTime()
      if (diffMs > 0) {
        const diffMin = Math.floor(diffMs / (1000 * 60))
        const diffHr = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHr / 24)
        if (diffMin < 60) return `${Math.max(1, diffMin)}m`
        if (diffHr < 24) return `${diffHr}h`
        return `${diffDay}d`
      }
    }
  }

  if (chat.category === 'Today') {
    const mins = ['15m', '34m', '45m', '1h', '2h']
    return mins[index % mins.length]
  }
  if (chat.category === 'Yesterday') {
    const hours = ['34m', '6h', '8h', '9h', '9h', '21h']
    return hours[index % hours.length]
  }
  const days = ['1d', '2d', '2d', '4d', '4d', '5d', '6d']
  return days[index % days.length]
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
  const [folders, setFolders] = useState<string[]>([])
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isChatsMenuOpen, setIsChatsMenuOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const chatsMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingId])

  useEffect(() => {
    if (isCreatingFolder && folderInputRef.current) {
      folderInputRef.current.focus()
    }
  }, [isCreatingFolder])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null)
      }
      if (chatsMenuRef.current && !chatsMenuRef.current.contains(e.target as Node)) {
        setIsChatsMenuOpen(false)
      }
    }
    if (activeMenuId || isChatsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeMenuId, isChatsMenuOpen])

  // Group conversations by category
  const groups: { key: string; label: string; items: typeof conversations }[] = [
    { key: 'Today', label: 'Today', items: conversations.filter(c => c.category === 'Today') },
    { key: 'Yesterday', label: 'Yesterday', items: conversations.filter(c => c.category === 'Yesterday') },
    { key: 'Previous 7 Days', label: 'Previous 7 days', items: conversations.filter(c => c.category === 'Previous 7 Days') },
  ]

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

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFolderName.trim()) {
      setFolders(prev => [...prev, newFolderName.trim()])
      setNewFolderName('')
      setIsCreatingFolder(false)
    }
  }

  return (
    <div className="flex flex-col pb-3 text-zinc-700 dark:text-zinc-200">
      {/* Folders Header */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 select-none">
        <span>Folders</span>
        <button 
          type="button"
          onClick={() => setIsCreatingFolder(prev => !prev)}
          className="rounded p-0.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="New Folder"
          aria-label="New Folder"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* New Folder Inline Form */}
      {isCreatingFolder && (
        <form onSubmit={handleCreateFolder} className="px-2 py-0.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-white/10 dark:bg-zinc-800/80">
            <Folder size={12} className="text-zinc-400 shrink-0" />
            <input
              ref={folderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="w-full bg-transparent text-[11.5px] text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-500"
            />
            <button type="submit" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 p-0.5 cursor-pointer">
              <Check size={11} />
            </button>
            <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer">
              <X size={11} />
            </button>
          </div>
        </form>
      )}

      {/* Folders List (if any created) */}
      {folders.length > 0 && (
        <div className="px-1 space-y-0.5 mb-1">
          {folders.map((folder, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-[11.5px] text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <Folder size={12} className="text-zinc-400 shrink-0" />
              <span className="truncate">{folder}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chats Header */}
      <div className="relative flex items-center justify-between px-2 pt-1.5 pb-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 select-none">
        <span>Chats</span>
        <button 
          type="button"
          onClick={() => setIsChatsMenuOpen(prev => !prev)}
          className="rounded p-0.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Chats Options"
          aria-label="Chats Options"
        >
          <MoreHorizontal size={13} />
        </button>

        {/* Chats Header Dropdown */}
        {isChatsMenuOpen && (
          <div 
            ref={chatsMenuRef}
            className="absolute right-2 top-6 z-50 w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-2xl text-zinc-800 dark:border-zinc-800 dark:bg-[#1c1c1c] dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              type="button"
              onClick={() => setIsChatsMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.08] cursor-pointer"
            >
              <span>Export All Chats</span>
            </button>
            <button
              type="button"
              onClick={() => setIsChatsMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.08] cursor-pointer"
            >
              <span>Archived Chats</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoadingConversations && conversations.length === 0 && (
        <div className="flex flex-col gap-1.5 px-2 py-2 animate-pulse">
          <div className="h-2.5 w-14 rounded bg-zinc-200/60 dark:bg-white/[0.06]" />
          <div className="h-6 w-full rounded-lg bg-zinc-200/40 dark:bg-white/[0.04]" />
          <div className="h-6 w-full rounded-lg bg-zinc-200/40 dark:bg-white/[0.04]" />
        </div>
      )}

      {/* Conversation Groups */}
      <div className="space-y-2 pt-0.5">
        {groups.map(({ key, label, items }) => {
          if (items.length === 0) return null
          return (
            <div key={key}>
              {/* Category Header */}
              <div className="px-2 pb-0.5 text-[10.5px] font-medium text-zinc-400 dark:text-zinc-400/90 select-none">
                {label}
              </div>

              {/* Items List */}
              <div className="space-y-0.5">
                {items.map((chat, idx) => {
                  const isActive = activeConversationId === chat.id
                  const isMenuOpen = activeMenuId === chat.id
                  const timeLabel = formatItemTime(chat, idx)

                  return (
                    <div key={chat.id} className="group relative flex items-center px-0.5">
                      {editingId === chat.id ? (
                        <form 
                          onSubmit={(e) => handleRenameSubmit(chat.id, e)}
                          className="flex flex-1 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2 py-1 shadow-sm dark:border-zinc-700 dark:bg-[#202020]"
                        >
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
                          <button type="submit" className="p-0.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer">
                            <Check size={12} />
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
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
                          className={`group/item flex w-full items-center justify-between rounded-lg px-2 py-1 text-[11.5px] text-left transition-colors cursor-pointer select-none ${
                            isActive
                              ? 'bg-zinc-200/80 font-medium text-zinc-950 shadow-xs dark:bg-[#202020] dark:text-white'
                              : 'text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-[#202020]/70 dark:hover:text-white'
                          }`}
                        >
                          {/* Chat Title */}
                          <span className="truncate pr-2 leading-snug flex-1">
                            {chat.title}
                          </span>

                          {/* Right Content: Timestamp or More Button on Hover/Active */}
                          <div className="relative shrink-0 flex items-center justify-end min-w-[24px]">
                            {/* Timestamp (hidden when hovered or active) */}
                            <span 
                              className={`text-[10px] text-zinc-400 dark:text-zinc-400/80 transition-opacity ${
                                isActive 
                                  ? 'hidden' 
                                  : 'group-hover/item:hidden'
                              }`}
                            >
                              {timeLabel}
                            </span>

                            {/* More Options Button (visible on hover or active) */}
                            <div 
                              className={`${
                                isActive || isMenuOpen
                                  ? 'flex' 
                                  : 'hidden group-hover/item:flex'
                              }`}
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenuId(activeMenuId === chat.id ? null : chat.id)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation()
                                    setActiveMenuId(activeMenuId === chat.id ? null : chat.id)
                                  }
                                }}
                                className="rounded p-0.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-300/50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                                title="Options"
                                aria-label="Conversation options"
                              >
                                <MoreHorizontal size={13} />
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Dropdown Menu for Conversation Item */}
                      {isMenuOpen && !editingId && (
                        <div 
                          ref={menuRef}
                          className="absolute right-2 top-7 z-50 w-32 rounded-xl border border-zinc-200 bg-white p-1 shadow-2xl text-zinc-800 dark:border-zinc-800 dark:bg-[#1c1c1c] dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartRename(chat.id, chat.title)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <Pencil size={12} className="text-zinc-400" />
                            <span>Rename</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(chat.id)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
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
    </div>
  )
}
