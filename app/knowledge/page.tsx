import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KnowledgeBaseManager } from '@/components/knowledge/KnowledgeBaseManager'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Knowledge Base - chatINALabs',
  description: 'Manage workspace documents and knowledge files for AI retrieval.',
}

export default async function KnowledgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] p-4 sm:p-8 dark:bg-[#111111]">
      <div className="mx-auto max-w-4xl">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Chat</span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/[0.08] dark:bg-[#171717]">
          <KnowledgeBaseManager />
        </div>
      </div>
    </main>
  )
}
