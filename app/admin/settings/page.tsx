import { fetchAdminAuditLogs } from '@/lib/supabase/admin-queries'
import { checkPlatformAdmin } from '@/lib/auth/admin'
import { StatCard } from '@/components/admin/StatCard'
import { Shield, ShieldCheck, Lock, Terminal, Clock, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const auth = await checkPlatformAdmin()
  if (!auth.isPlatformAdmin) {
    return null
  }

  const auditLogs = await fetchAdminAuditLogs()

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Platform Settings & Audit Logs
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Review platform configuration, security posture, and administrator audit trails.
        </p>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={16} />
            <span>RLS Isolation</span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Enforced & Verified
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Workspaces, conversations, messages, and attachments are strictly isolated by <code className="text-zinc-600 dark:text-zinc-300 font-mono">is_workspace_member()</code>.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Lock size={16} />
            <span>Platform Role Guard</span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            is_platform_admin()
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Trigger-protected role elevation prevents privilege escalation from standard tenant members.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Terminal size={16} />
            <span>Audit Architecture</span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            SECURITY DEFINER
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Direct client inserts to audit logs are revoked. All logging is authenticated via server procedures.
          </p>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Security Audit Logs</h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Immutable ledger of administrative and system events</p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            {auditLogs.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-zinc-500 dark:bg-zinc-950/40 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="py-2.5 px-4 font-medium">Event Action</th>
                <th className="py-2.5 px-3 font-medium">Target Type</th>
                <th className="py-2.5 px-3 font-medium">Actor ID</th>
                <th className="py-2.5 px-3 font-medium">Metadata</th>
                <th className="py-2.5 px-4 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-400">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-amber-500" />
                        <span>{log.action}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-500">{log.target_type}</td>
                    <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                      {log.actor_id ? log.actor_id.substring(0, 8) + '...' : 'System'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-500 max-w-xs truncate">
                      {JSON.stringify(log.metadata)}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
