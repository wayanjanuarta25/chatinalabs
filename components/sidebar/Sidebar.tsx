'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { 
  Menu, 
  LogOut, 
  Search, 
  BookMarked, 
  Pencil,
  User,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  Sun,
  Moon,
  PanelLeftOpen
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { ConversationList } from './ConversationList'
import { SearchModal } from './SearchModal'
import { KnowledgeBaseModal } from '@/components/knowledge/KnowledgeBaseModal'
import { useSidebar } from './SidebarContext'
import { useChatStore } from '@/lib/store/useChatStore'
import { signout } from '@/app/login/actions'

interface SidebarProps {
  userEmail?: string
  userFullName?: string
  userRole?: string
  appName?: string
}

export function Sidebar({ 
  userEmail = 'user@chatinalabs.id',
  userFullName = '',
  userRole = 'user',
  appName = 'ChatLabs.id'
}: SidebarProps) {
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const isDark = mounted ? (resolvedTheme === 'dark' || theme === 'dark') : true

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

  // Extract display username
  const displayUsername = userFullName || (userEmail ? userEmail.split('@')[0] : 'user_70')
  const userInitial = (displayUsername.charAt(0) || 'U').toUpperCase()

  return (
    <>
      {/* Search Modal */}
      <SearchModal />

      {/* Knowledge Base & Notes Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
      />

      {/* Mobile Menu Toggle (Visible only on mobile when sidebar is closed) */}
      {!isOpen && (
        <button 
          className="fixed left-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-[#171717]/90 dark:text-zinc-300 cursor-pointer"
          aria-label="Open navigation"
          onClick={toggleSidebar}
        >
          <Menu size={16} />
        </button>
      )}

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container - Responsive to Light & Dark Theme */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-zinc-200/80 bg-[#f7f7f8] text-zinc-800 transition-all duration-200 ease-in-out md:static select-none dark:border-zinc-800/80 dark:bg-[#171717] dark:text-zinc-200 ${
          isOpen 
            ? 'w-[250px] translate-x-0' 
            : '-translate-x-full md:translate-x-0 md:w-[48px]'
        }`}
      >
        {/* COLLAPSED MINI-RAIL VIEW (When closed on desktop) */}
        {!isOpen ? (
          <div className="flex h-full w-full flex-col items-center justify-between py-2.5">
            {/* Top Rail Actions */}
            <div className="flex flex-col items-center gap-2.5">
              {/* Logo / Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="group relative flex h-7 w-7 items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <Image
                  src="/logo-ci.png"
                  alt="ChatLabs.id"
                  width={18}
                  height={18}
                  className="object-contain dark:invert"
                  priority
                />
              </button>

              {/* New Chat */}
              <button
                type="button"
                onClick={() => createNewChat()}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 cursor-pointer"
                title="New Chat"
                aria-label="New Chat"
              >
                <Pencil size={15} strokeWidth={1.8} />
              </button>

              {/* Search */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 cursor-pointer"
                title="Search"
                aria-label="Search"
              >
                <Search size={15} strokeWidth={1.8} />
              </button>

              {/* Notes */}
              <button
                type="button"
                onClick={() => setIsKnowledgeModalOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 cursor-pointer"
                title="Notes"
                aria-label="Notes"
              >
                <BookMarked size={15} strokeWidth={1.8} />
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 cursor-pointer"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle theme"
              >
                {mounted && isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-500" />}
              </button>
            </div>

            {/* Bottom: User Avatar with Green Online Dot */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#f59e0b] text-[11px] font-bold text-white shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
                title={displayUsername}
                aria-label="User profile"
              >
                {userInitial}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#10a37f] ring-2 ring-[#f7f7f8] dark:ring-[#171717]" />
              </button>

              {/* User Dropdown for Collapsed Mode */}
              {isUserMenuOpen && (
                <div className="absolute bottom-10 left-2 z-50 w-52 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-2xl text-zinc-900 dark:border-zinc-800 dark:bg-[#1c1c1c] dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-medium text-zinc-400">Signed in as</p>
                    <p className="truncate text-[11.5px] font-semibold">{displayUsername}</p>
                    <p className="truncate text-[10px] text-zinc-500">{userEmail}</p>
                  </div>
                  <div className="pt-1 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        setIsOpen(true)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.25 text-[11.5px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <PanelLeftOpen size={13} />
                      <span>Expand sidebar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.25 text-[11.5px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <User size={13} />
                      <span>Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.25 text-[11.5px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <Settings size={13} />
                      <span>Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme(isDark ? 'light' : 'dark')}
                      className="flex w-full items-center justify-between rounded-xl px-2 py-1.25 text-[11.5px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {mounted && isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-indigo-500" />}
                        <span>{mounted && isDark ? 'Light Mode' : 'Dark Mode'}</span>
                      </div>
                    </button>
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                    <form action={signout}>
                      <button 
                        type="submit" 
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-1.25 text-[11.5px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        <LogOut size={13} />
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
          <div className="flex h-full w-[250px] flex-col overflow-hidden">
            {/* Header / Brand: [logo-ci.png] ChatLabs.id   [Theme Toggle] [Toggle Panel] */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-2 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <Image
                    src="/logo-ci.png"
                    alt="ChatLabs.id"
                    width={18}
                    height={18}
                    className="object-contain dark:invert"
                    priority
                  />
                </div>
                <h1 className="text-[12.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                  {appName}
                </h1>
              </div>

              {/* Right Header Actions: Light/Dark Theme Toggle & Panel Collapse Toggle */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Theme Toggle Button (Light/Dark) */}
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label="Toggle theme"
                  title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  {mounted && isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-500" />}
                </button>

                {/* Panel Collapse Toggle Icon [ |] */}
                <button 
                  type="button" 
                  onClick={toggleSidebar}
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-4 w-4"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="3" />
                    <path d="M15 3v18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Top Action Items: New Chat, Search, Notes */}
            <div className="flex flex-col gap-0.5 px-2 pb-1">
              {/* New Chat */}
              <button
                type="button"
                onClick={() => createNewChat()}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[12px] font-normal text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors cursor-pointer group"
                title="New Chat"
              >
                <Pencil size={14} strokeWidth={1.8} className="text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
                <span>New Chat</span>
              </button>

              {/* Search */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[12px] font-normal text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors cursor-pointer group"
                title="Search"
              >
                <Search size={14} strokeWidth={1.8} className="text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
                <span>Search</span>
              </button>

              {/* Notes */}
              <button
                type="button"
                onClick={() => setIsKnowledgeModalOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[12px] font-normal text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors cursor-pointer group"
                title="Notes"
              >
                <BookMarked size={14} strokeWidth={1.8} className="text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
                <span>Notes</span>
              </button>
            </div>

            {/* Scrollable Conversation List & Groups */}
            <div className="flex-1 overflow-y-auto px-1.5 custom-scrollbar">
              <ConversationList onSelect={() => {
                if (window.innerWidth < 768) setIsOpen(false)
              }} />
            </div>

            {/* Bottom User Profile Section: (U) user_70 */}
            <div className="relative border-t border-zinc-200/80 dark:border-zinc-800/80 p-1.5" ref={userMenuRef}>
              <div 
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                {/* Yellow/Orange Avatar with Green Dot */}
                <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-[11px] font-bold text-white shadow-xs">
                  {userInitial}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#10a37f] ring-2 ring-[#f7f7f8] dark:ring-[#171717]" />
                </div>
                
                {/* Username */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-zinc-800 dark:text-zinc-300">{displayUsername}</p>
                </div>
              </div>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute bottom-12 left-2 right-2 z-50 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-2xl text-zinc-900 dark:border-zinc-800 dark:bg-[#1c1c1c] dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-medium text-zinc-400">Signed in as</p>
                    <p className="truncate text-[11.5px] font-semibold">{displayUsername}</p>
                    <p className="truncate text-[10px] text-zinc-500">{userEmail}</p>
                    <div className="mt-1 flex items-center gap-1 text-[9.5px] text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={10} />
                      <span>ChatLabs Pro · Active</span>
                    </div>
                  </div>
                  <div className="pt-1 flex flex-col gap-0.5">
                    {(userRole === 'admin' || userRole === 'super_admin') && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-1.25 text-[11.5px] font-semibold text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/40 cursor-pointer transition-colors"
                      >
                        <LayoutDashboard size={13} className="text-purple-500 dark:text-purple-400" />
                        <span>Admin Dashboard</span>
                        <span className="ml-auto rounded-md bg-purple-100 px-1.5 py-0.5 text-[8.5px] font-bold uppercase text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                          {userRole === 'super_admin' ? 'Super' : 'Admin'}
                        </span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.25 text-[11.5px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <User size={13} />
                      <span>Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.25 text-[11.5px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <Settings size={13} />
                      <span>Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme(isDark ? 'light' : 'dark')}
                      className="flex w-full items-center justify-between rounded-xl px-2 py-1.25 text-[11.5px] text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {mounted && isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-indigo-500" />}
                        <span>{mounted && isDark ? 'Light Mode' : 'Dark Mode'}</span>
                      </div>
                      <span className="text-[9.5px] text-zinc-400 capitalize">{mounted ? (resolvedTheme || theme) : 'theme'}</span>
                    </button>
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                    <form action={signout}>
                      <button 
                        type="submit" 
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-1.25 text-[11.5px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        <LogOut size={13} />
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
