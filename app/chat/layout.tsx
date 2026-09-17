import { Sidebar } from '@/components/sidebar/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { getConversations } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const conversations = await getConversations()

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white overflow-hidden">
      {/* Sidebar - hidden on mobile by default, handled inside the component */}
      <Sidebar userEmail={user.email || 'User'} initialConversations={conversations} />
      
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {children}
      </main>
    </div>
  )
}
