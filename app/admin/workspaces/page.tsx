import { fetchAdminWorkspaces, fetchPlatformAnalytics } from '@/lib/supabase/admin-queries'
import { checkPlatformAdmin } from '@/lib/auth/admin'
import { StatCard } from '@/components/admin/StatCard'
import { Building2, Users2, Activity, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminWorkspacesPage() {
  const auth = await checkPlatformAdmin()
  if (!auth.isPlatformAdmin) {
    return null
  }

  const [workspaces, analytics] = await Promise.all([
    fetchAdminWorkspaces(),
    fetchPlatformAnalytics(),
  ])

  const mostActive = analytics?.workspaces.most_active_workspace
  const avgMembers = analytics?.workspaces.avg_members_per_workspace || 1.0

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Workspace Analytics
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Monitor tenant workspaces, member allocation, and workspace-level conversation activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Workspaces"
          value={workspaces.length}
          icon={Building2}
          colorTheme="purple"
          description="Isolated multi-tenant workspaces"
        />
        <StatCard
          title="Average Members / Workspace"
          value={avgMembers}
          icon={Users2}
          colorTheme="blue"
          description="Tenant team density"
        />
        <StatCard
          title="Most Active Workspace"
          value={mostActive?.name || 'None'}
          icon={Activity}
          colorTheme="emerald"
          badge={`${mostActive?.conversation_count || 0} chats`}
          description={`Slug: ${mostActive?.slug || '-'}`}
        />
      </div>

      {/* Workspaces List Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
        <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tenant Workspaces</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">All registered workspace organizations</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-zinc-500 dark:bg-zinc-950/40 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="py-2.5 px-4 font-medium">Workspace Name</th>
                <th className="py-2.5 px-3 font-medium">Slug</th>
                <th className="py-2.5 px-3 font-medium text-center">Isolation</th>
                <th className="py-2.5 px-4 font-medium text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {workspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-zinc-400" />
                      <span>{ws.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-500">{ws.slug}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/20">
                      RLS Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-400 text-[11px]">
                    {new Date(ws.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
