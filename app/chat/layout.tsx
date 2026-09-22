import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { SidebarProvider } from '@/components/sidebar/SidebarContext'
import { createClient } from '@/lib/supabase/server'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Protect chat route server-side
  if (!user) {
    redirect('/login')
  }

  // Retrieve user profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  const userEmail = profile?.email || user.email || 'user@chatinalabs.id'
  const userFullName = profile?.full_name || (user.user_metadata?.full_name as string) || ''
  const userRole = profile?.role || 'user'

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full overflow-hidden bg-[#f7f7f7] text-[#212121] dark:bg-[#171717] dark:text-[#ececec]">
        {/* Sidebar with dynamic authenticated user info */}
        <Sidebar 
          userEmail={userEmail} 
          userFullName={userFullName} 
          userRole={userRole} 
        />
        
        {/* Main Chat Area */}
        <main className="flex h-full min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
