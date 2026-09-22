import { fetchAdminUsers, fetchPlatformAnalytics } from '@/lib/supabase/admin-queries'
import { checkPlatformAdmin } from '@/lib/auth/admin'
import { StatCard } from '@/components/admin/StatCard'
import { RecentUsersTable } from '@/components/admin/RecentUsersTable'
import { Users, UserCheck, ShieldCheck, UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const auth = await checkPlatformAdmin()
  if (!auth.isPlatformAdmin) {
    return null
  }

  const [users, analytics] = await Promise.all([
    fetchAdminUsers(),
    fetchPlatformAnalytics(),
  ])

  const totalUsers = users.length
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length
  const standardUsers = totalUsers - adminCount

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          User Analytics & Directory
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage platform roles, monitor user registrations, and view tenant participation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Registered Users"
          value={totalUsers}
          icon={Users}
          colorTheme="blue"
          description="Total authenticated accounts"
        />
        <StatCard
          title="Platform Administrators"
          value={adminCount}
          icon={ShieldCheck}
          colorTheme="purple"
          description="Users with admin/super_admin role"
        />
        <StatCard
          title="Standard Users"
          value={standardUsers}
          icon={UserCheck}
          colorTheme="emerald"
          description="Regular workspace members"
        />
      </div>

      <div className="space-y-4">
        <RecentUsersTable users={users.map(u => ({ ...u, role: u.role as 'user' | 'admin' | 'super_admin' }))} />
      </div>
    </div>
  )
}
