'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Menu, 
  LogOut, 
  Search, 
  Ellipsis, 
  BookMarked, 
  Plus, 
  PanelLeftClose, 
  PanelLeftOpen,
  Pencil,
  User,
  Settings,
  ShieldCheck,
  Database
} from 'lucide-react'
import Image from 'next/image'
import { ConversationList } from './ConversationList'
import { SearchModal } from './SearchModal'
import { KnowledgeBaseModal } from '@/components/knowledge/KnowledgeBaseModal'
import { useSidebar } from './SidebarContext'
import { useChatStore } from '@/lib/store/useChatStore'
import { signout } from '@/app/login/actions'

interface SidebarProps {
  userEmail?: string
  userFullName?: string
}

export function Sidebar({ 
  userEmail = 'user@chatinalabs.id',
  userFullName = ''
}: SidebarProps) {
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const createNewChat = useChatStore(s => s.createNewChat)
  const setSearchModalOpen = useChatStore(s => s.setSearchModalOpen)

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const userInitial = (userFullName?.charAt(0) || userEmail?.charAt(0) || 'U').toUpperCase()

  return (
    <>
      {/* Search Modal */}
      <SearchModal />

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
      />

      {/* Mobile Menu Toggle (Visible only on mobile when sidebar is closed) */}
      {!isOpen && (
        <button 
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200 cursor-pointer"
          aria-label="Open navigation"
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-zinc-200/60 bg-[#f7f7f8] transition-all duration-200 ease-in-out md:static dark:border-white/[0.04] dark:bg-[#121212] ${
          isOpen 
            ? 'w-[260px] translate-x-0' 
            : '-translate-x-full md:translate-x-0 md:w-[52px]'
        }`}
      >
        {/* COLLAPSED MINI-RAIL VIEW (When closed on desktop) */}
        {!isOpen ? (
          <div className="flex h-full w-full flex-col items-center justify-between py-3">
            {/* Top Icons */}
            <div className="flex flex-col items-center gap-3">
              {/* Logo / Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="group relative flex h-8 w-8 items-center justify-center rounded-xl bg-white p-1 shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer dark:bg-white overflow-hidden"
                title="Open sidebar"
                aria-label="Open sidebar"
              >
                <Image
                  src="/logo-ci.png"
                  alt="chatINALabs"
                  width={24}
                  height={24}
                  className="object-contain"
                  priority
                />
              </button>

              {/* New Chat Button */}
              <button
                type="button"
                onClick={() => {
                  createNewChat().then(() => {
                    window.history.pushState(null, '', '/chat')
                  })
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 cursor-pointer"
                title="New Chat"
                aria-label="New Chat"
              >
                <Pencil size={18} strokeWidth={1.8} />
              </button>

              {/* Search Button */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 cursor-pointer"
                title="Search (Ctrl+K)"
                aria-label="Search"
              >
                <Search size={18} strokeWidth={1.8} />
              </button>

              {/* Knowledge Base Button */}
              <button
                type="button"
                onClick={() => setIsKnowledgeModalOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 cursor-pointer"
                title="Knowledge Base & Files"
                aria-label="Knowledge Base & Files"
              >
                <Database size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Bottom: User Avatar with Green Online Dot */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-zinc-600 text-xs font-medium text-white dark:bg-zinc-700 shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
                title={userEmail}
                aria-label="User profile"
              >
                {userInitial}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#f7f7f8] dark:ring-[#121212]" />
              </button>

              {/* User Dropdown for Collapsed Mode */}
              {isUserMenuOpen && (
                <div className="absolute bottom-11 left-2 z-50 w-56 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl backdrop-blur-lg dark:border-zinc-800 dark:bg-[#1a1a1a] text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Signed in as</p>
                    <p className="truncate text-xs font-semibold">{userEmail}</p>
                  </div>
                  <div className="pt-1 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        setIsOpen(true)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <PanelLeftOpen size={14} />
                      <span>Expand sidebar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <User size={14} />
                      <span>Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <Settings size={14} />
                      <span>Settings</span>
                    </button>
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                    <form action={signout}>
                      <button 
                        type="submit" 
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Logout</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* EXPANDED FULL SIDEBAR VIEW */
          <div className="flex h-full w-[260px] flex-col overflow-hidden">
            {/* Header / Brand with Logo */}
            <div className="flex items-center justify-between px-3 pb-2 pt-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 shadow-xs dark:bg-zinc-800 overflow-hidden">
                  <Image
                    src="/logo-ci.png"
                    alt="chatINALabs Logo"
                    width={22}
                    height={22}
                    className="object-contain"
                    priority
                  />
                </div>
                <h1 className="font-display text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  chatINA<span className="text-zinc-600 dark:text-zinc-400">Labs</span>
                </h1>
              </div>
              <button 
                type="button" 
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                title="Collapse sidebar"
                onClick={toggleSidebar}
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* Action Buttons: + New Chat & Search */}
            <div className="flex flex-col gap-1 px-2 pb-2">
              {/* + New Chat Button */}
              <button
                type="button"
                onClick={() => {
                  createNewChat().then(() => {
                    window.history.pushState(null, '', '/chat')
                  })
                }}
                className="flex w-full items-center justify-between rounded-xl bg-zinc-200/70 hover:bg-zinc-200 px-3 py-2 text-xs font-medium text-zinc-900 transition-colors dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.1] cursor-pointer"
                title="New Chat"
              >
                <div className="flex items-center gap-2">
                  <Plus size={15} strokeWidth={2.2} />
                  <span>New Chat</span>
                </div>
              </button>

              {/* Search Button */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200 cursor-pointer"
                title="Search conversations"
              >
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-zinc-400" />
                  <span>Search</span>
                </div>
                <kbd className="rounded bg-zinc-200/60 px-1 py-0.5 text-[9px] font-medium text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500 font-sans">
                  Ctrl+K
                </kbd>
              </button>

              {/* Knowledge Base Button */}
              <button
                type="button"
                onClick={() => setIsKnowledgeModalOpen(true)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200 cursor-pointer"
                title="Knowledge Base & Files"
              >
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-zinc-400" />
                  <span>Knowledge Base</span>
                </div>
                <span className="rounded bg-zinc-200/60 px-1.5 py-0.2 text-[9px] font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400 font-sans">
                  Files
                </span>
              </button>
            </div>

            {/* Conversation List Groups */}
            <div className="flex-1 overflow-y-auto px-1.5">
              <ConversationList onSelect={() => {
                if (window.innerWidth < 768) setIsOpen(false)
              }} />
            </div>

            {/* Bottom User Section */}
            <div className="relative border-t border-zinc-200/60 p-2 dark:border-white/[0.06]" ref={userMenuRef}>
              <div 
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-zinc-200/60 dark:hover:bg-white/[0.04] cursor-pointer"
              >
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-xs font-medium text-white dark:bg-zinc-700 shadow-xs">
                  {userInitial}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#f7f7f8] dark:ring-[#121212]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">{userFullName || userEmail}</p>
                  {userFullName && (
                    <p className="truncate text-[10.5px] text-zinc-400 dark:text-zinc-500">{userEmail}</p>
                  )}
                </div>
                <button 
                  type="button" 
                  className="rounded-lg p-0.5 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer" 
                  title="Account menu" 
                  aria-label="Account menu"
                >
                  <Ellipsis size={14} />
                </button>
              </div>

              {/* User Dropdown Menu in Expanded Sidebar */}
              {isUserMenuOpen && (
                <div className="absolute bottom-14 left-2 right-2 z-50 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl backdrop-blur-lg dark:border-zinc-800 dark:bg-[#1a1a1a] text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Account</p>
                    <p className="truncate text-xs font-semibold">{userFullName || userEmail}</p>
                    {userFullName && (
                      <p className="truncate text-[10.5px] text-zinc-400 dark:text-zinc-500">{userEmail}</p>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                      <ShieldCheck size={11} className="text-emerald-500" />
                      <span>{process.env.NODE_ENV === 'development' ? 'Free Plan · Frontend Demo' : 'Free Plan'}</span>
                    </div>
                  </div>
                  <div className="pt-1 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <User size={14} />
                      <span>Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <Settings size={14} />
                      <span>Settings</span>
                    </button>
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                    <form action={signout}>
                      <button 
                        type="submit" 
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Logout</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
