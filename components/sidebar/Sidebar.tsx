'use client'

import { useState, useMemo, useEffect } from 'react'
import { Menu, X, LogOut, Search } from 'lucide-react'
import { ConversationList } from './ConversationList'
import { NewChatButton } from './NewChatButton'
import { signout } from '@/app/login/actions'
import { Database } from '@/lib/supabase/database.types'

type Conversation = Database['public']['Tables']['conversations']['Row']

interface SidebarProps {
  userEmail: string
  initialConversations: Conversation[]
}

export function Sidebar({ userEmail, initialConversations }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredConversations = useMemo(() => {
    if (!debouncedSearch.trim()) return initialConversations
    const lowerQ = debouncedSearch.toLowerCase()
    return initialConversations.filter(c => c.title.toLowerCase().includes(lowerQ))
  }, [initialConversations, debouncedSearch])

  return (
    <>
      {/* Mobile Menu Toggle (Visible only on mobile) */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="font-semibold text-lg tracking-tight px-2">chatINALabs</h1>
          <button className="md:hidden p-2" onClick={() => setIsOpen(false)}>
            <X size={20} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <NewChatButton />
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg pl-9 pr-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-4">
          <ConversationList conversations={filteredConversations} onSelect={() => setIsOpen(false)} />
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium truncate flex-1">{userEmail}</span>
          </div>
          
          <form action={signout}>
            <button 
              type="submit" 
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              Log out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
