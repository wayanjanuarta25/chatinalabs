/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Database } from '@/lib/supabase/database.types'
import { renameConversation, deleteConversation } from '@/lib/supabase/queries'

type Conversation = Database['public']['Tables']['conversations']['Row']

interface ConversationListProps {
  conversations: Conversation[]
  onSelect?: () => void
}

function groupConversationsByDate(conversations: Conversation[]) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const groups: Record<string, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': []
  }

  conversations.forEach(conv => {
    const d = new Date(conv.updated_at)
    if (d.toDateString() === today.toDateString()) {
      groups['Today'].push(conv)
    } else if (d.toDateString() === yesterday.toDateString()) {
      groups['Yesterday'].push(conv)
    } else if (d > sevenDaysAgo) {
      groups['Previous 7 Days'].push(conv)
    } else {
      groups['Older'].push(conv)
    }
  })

  return groups
}

export function ConversationList({ conversations, onSelect }: ConversationListProps) {
  const router = useRouter()
  const params = useParams()
  const currentId = params?.id as string

  const [optimisticConvs, setOptimisticConvs] = useState<Conversation[]>(conversations)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [, startTransition] = useTransition()
  
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setOptimisticConvs(conversations)
  }, [conversations])

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingId])

  const groups = groupConversationsByDate(optimisticConvs)

  const handleRename = async (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const newTitle = editTitle.trim().substring(0, 100)
    if (!newTitle) {
      setEditingId(null)
      return
    }

    // Optimistic Update
    setOptimisticConvs(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c))
    setEditingId(null)

    startTransition(async () => {
      try {
        await renameConversation(id, newTitle)
      } catch (err) {
        console.error("Failed to rename:", err)
        setOptimisticConvs(conversations) // Revert
      }
    })
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm("Are you sure you want to delete this conversation?")) return

    // Optimistic Update
    setOptimisticConvs(prev => prev.filter(c => c.id !== id))
    
    startTransition(async () => {
      try {
        await deleteConversation(id)
        if (currentId === id) {
          router.push('/chat')
        }
      } catch (err) {
        console.error("Failed to delete:", err)
        setOptimisticConvs(conversations) // Revert
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-1 pb-4 mt-2">
      {Object.entries(groups).map(([label, groupChats]) => {
        if (groupChats.length === 0) return null
        return (
          <div key={label} className="mb-4">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 px-2 uppercase tracking-wider">
              {label}
            </div>
            <div className="flex flex-col gap-1">
              {groupChats.map((chat) => (
                <div key={chat.id} className="relative group flex items-center">
                  {editingId === chat.id ? (
                    <form 
                      onSubmit={(e) => handleRename(chat.id, e)}
                      className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-emerald-500"
                    >
                      <MessageSquare size={16} className="text-emerald-500 shrink-0" />
                      <input 
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => handleKeyDown(e)}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-100 min-w-0"
                        maxLength={100}
                      />
                      <button type="submit" className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                        <Check size={14} />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="p-1 text-zinc-500 hover:text-zinc-700">
                        <X size={14} />
                      </button>
                    </form>
                  ) : (
                    <Link 
                      href={`/chat/${chat.id}`}
                      onClick={() => onSelect && onSelect()}
                      className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors min-w-0 ${
                        currentId === chat.id 
                          ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium' 
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <MessageSquare size={16} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0" />
                      <span className="truncate pr-12">{chat.title}</span>
                    </Link>
                  )}
                  
                  {/* Actions Dropdown / Icons */}
                  {!editingId && (
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEditTitle(chat.title)
                          setEditingId(chat.id)
                        }}
                        className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 bg-zinc-200/80 dark:bg-zinc-800"
                        title="Rename"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(chat.id, e)}
                        className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 bg-zinc-200/80 dark:bg-zinc-800"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
