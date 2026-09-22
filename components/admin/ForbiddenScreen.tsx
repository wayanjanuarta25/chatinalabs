'use client'

import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react'

export function ForbiddenScreen({ userEmail, role }: { userEmail: string; role: string | null }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-6">
          <ShieldAlert size={36} />
        </div>
        
        <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 mb-3">
          <Lock size={12} />
          <span>403 Forbidden</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Platform Admin Access Required
        </h1>

        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          The chatINALabs Admin Dashboard is restricted to platform administrators. 
          Your account <span className="font-mono text-zinc-200 font-medium">({userEmail})</span> is currently registered with platform role: <span className="font-semibold text-amber-400 uppercase tracking-wider">{role || 'user'}</span>.
        </p>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-500 mb-6 text-left space-y-1">
          <div className="flex justify-between">
            <span>Identity:</span>
            <span className="text-zinc-400 font-mono">{userEmail}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Role:</span>
            <span className="text-zinc-400">{role || 'standard user'}</span>
          </div>
          <div className="flex justify-between">
            <span>Security Policy:</span>
            <span className="text-zinc-400">Strict is_platform_admin() enforcement</span>
          </div>
        </div>

        <Link
          href="/chat"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-all hover:bg-white cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Return to Chat Workspace</span>
        </Link>
      </div>
    </div>
  )
}
