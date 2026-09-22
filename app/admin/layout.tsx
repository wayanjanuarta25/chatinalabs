import { redirect } from 'next/navigation'
import { checkPlatformAdmin } from '@/lib/auth/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ForbiddenScreen } from '@/components/admin/ForbiddenScreen'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authResult = await checkPlatformAdmin()

  // 1. Unauthenticated -> Redirect to login
  if (!authResult.isAuthenticated || !authResult.user) {
    redirect('/login?next=/admin')
  }

  // 2. Authenticated but NOT platform admin -> 403 Forbidden screen
  if (!authResult.isPlatformAdmin || !authResult.role) {
    return (
      <ForbiddenScreen 
        userEmail={authResult.user.email || 'unknown'} 
        role={authResult.role} 
      />
    )
  }

  // 3. Authorized Platform Admin -> Render Admin Shell
  const userEmail = authResult.profile?.email || authResult.user.email || 'admin@chatinalabs.id'
  const userFullName = authResult.profile?.full_name || ''
  const role = authResult.role as 'admin' | 'super_admin'

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        userEmail={userEmail}
        userFullName={userFullName}
        role={role}
      />

      {/* Main Admin Viewport */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-8">
          {children}
        </div>
      </main>
    </div>
  )
}
