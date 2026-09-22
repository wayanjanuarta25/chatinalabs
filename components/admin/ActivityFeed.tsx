import { MessageSquare, Shield, Clock, Building2 } from 'lucide-react'

interface ActivityItem {
  id: string
  title: string | null
  updated_at: string
  user_email: string | null
  user_name: string | null
  workspace_name: string | null
}

interface AuditItem {
  id: string
  action: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor_email: string | null
}

export function ActivityFeed({
  activities,
  audits,
}: {
  activities: ActivityItem[]
  audits: AuditItem[]
}) {
  const formatTimeAgo = (iso: string) => {
    if (!iso) return ''
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Live Activity Feed</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Recent conversations & platform events</p>
        </div>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[360px] overflow-y-auto">
        {activities.length === 0 && audits.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No recent activity recorded
          </div>
        ) : (
          <>
            {/* Audits */}
            {audits.map((audit) => (
              <div key={audit.id} className="p-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors flex items-start gap-3 text-xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                  <Shield size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {audit.action}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {formatTimeAgo(audit.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    Actor: <span className="font-mono text-zinc-600 dark:text-zinc-400">{audit.actor_email || 'System'}</span>
                  </p>
                </div>
              </div>
            ))}

            {/* Conversations Activity */}
            {activities.map((act) => (
              <div key={act.id} className="p-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors flex items-start gap-3 text-xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                  <MessageSquare size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {act.title || 'Untitled Conversation'}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {formatTimeAgo(act.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                    <span className="truncate">{act.user_name || act.user_email}</span>
                    {act.workspace_name && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-zinc-400 truncate">
                          <Building2 size={10} />
                          {act.workspace_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
