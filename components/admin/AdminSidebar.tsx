'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  ArrowLeft,
  Shield,
  ShieldCheck,
  Activity
} from 'lucide-react'
import { ThemeToggle } from '@/components/landing/ThemeToggle'

interface AdminSidebarProps {
  userEmail: string
  userFullName?: string
  role: 'admin' | 'super_admin'
}

export function AdminSidebar({ userEmail, userFullName = '', role }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Overview',
      href: '/admin',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      label: 'Workspaces',
      href: '/admin/workspaces',
      icon: Building2,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      label: 'Settings & Audits',
      href: '/admin/settings',
      icon: Settings,
    },
  ]

  const userInitial = (userFullName?.charAt(0) || userEmail?.charAt(0) || 'A').toUpperCase()

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-200/70 dark:border-zinc-800/80">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-zinc-900 shadow-md">
          <Image
            src="/logo-ci.png"
            alt="chatINALabs AI"
            width={28}
            height={28}
            className="object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
              chatINALabs
            </span>
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Admin
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Platform Management</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Core Metrics
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-current' : 'text-zinc-400 dark:text-zinc-500'} />
              <span>{item.label}</span>
              {item.href === '/admin' && (
                <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Back to Chat & Admin Profile */}
      <div className="p-3 border-t border-zinc-200/70 dark:border-zinc-800/80 space-y-2">
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft size={14} />
              <span>Chat Workspace</span>
            </div>
            <span className="text-[10px] text-zinc-400">Exit</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/40 p-2.5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-white">
            {userInitial}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white ring-2 ring-white dark:ring-zinc-950">
              ★
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {userFullName || userEmail}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck size={11} className="text-amber-500 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
