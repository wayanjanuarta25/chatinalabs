import { 
  Users, 
  MessageSquare, 
  Bot, 
  CheckCircle2, 
  Square, 
  RotateCcw, 
  RefreshCw, 
  HardDrive,
  Database
} from 'lucide-react'

// Helper to format bytes to human-readable size
export function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * 1. User Growth Monthly Chart
 */
export function UserGrowthChart({
  growthData,
}: {
  growthData: Array<{ month_key: string; month_label: string; new_users: number }>
}) {
  const maxVal = Math.max(...growthData.map(d => d.new_users), 1)

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">User Growth Trends</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Monthly new user registrations</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Users size={14} className="text-blue-500" />
          <span>New Registrations</span>
        </div>
      </div>

      <div className="flex items-end gap-3 h-44 pt-6 pb-2 px-2">
        {growthData.map((item, idx) => {
          const heightPercent = Math.max(Math.round((item.new_users / maxVal) * 100), 12)

          return (
            <div key={item.month_key || idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              {/* Tooltip / value */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded shadow-xs mb-1">
                {item.new_users}
              </div>

              {/* Bar */}
              <div className="w-full max-w-[48px] bg-zinc-100 dark:bg-zinc-800/80 rounded-t-lg overflow-hidden flex items-end h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-linear-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:from-blue-500 group-hover:to-indigo-400 relative"
                >
                  <div className="absolute top-1 inset-x-0 mx-auto w-3/4 h-1 bg-white/30 rounded-full" />
                </div>
              </div>

              {/* Label */}
              <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100 transition-colors whitespace-nowrap">
                {item.month_label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 2. Chat Usage Analytics: User vs Assistant Breakdown
 */
export function ChatUsageChart({
  userMessages,
  assistantMessages,
}: {
  userMessages: number
  assistantMessages: number
}) {
  const total = userMessages + assistantMessages
  const userPercent = total > 0 ? Math.round((userMessages / total) * 100) : 50
  const assistantPercent = total > 0 ? 100 - userPercent : 50

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Chat Composition</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">User prompts vs AI generated responses</p>
        </div>
        <div className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {total.toLocaleString()} total
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-4 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex my-4 p-0.5">
        <div
          style={{ width: `${userPercent}%` }}
          className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500"
          title={`User Messages: ${userMessages}`}
        />
        <div
          style={{ width: `${assistantPercent}%` }}
          className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-r-full transition-all duration-500"
          title={`Assistant Messages: ${assistantMessages}`}
        />
      </div>

      {/* Legend & Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <MessageSquare size={13} />
            <span>User Messages</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {userMessages.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {userPercent}%
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
            <Bot size={13} />
            <span>AI Responses</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {assistantMessages.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              {assistantPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 3. AI Generation Status Breakdown (Completed, Stopped, Retry, Regenerated)
 */
export function AIStatusChart({
  statusBreakdown,
}: {
  statusBreakdown: {
    completed: number
    stopped: number
    retry: number
    regenerated: number
    other: number
  }
}) {
  const items = [
    {
      label: 'Completed',
      count: statusBreakdown.completed,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/20',
      barColor: 'bg-emerald-500',
    },
    {
      label: 'Stopped',
      count: statusBreakdown.stopped,
      icon: Square,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/20',
      barColor: 'bg-amber-500',
    },
    {
      label: 'Retry',
      count: statusBreakdown.retry,
      icon: RefreshCw,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/20',
      barColor: 'bg-rose-500',
    },
    {
      label: 'Regenerated',
      count: statusBreakdown.regenerated,
      icon: RotateCcw,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-500/20',
      barColor: 'bg-blue-500',
    },
  ]

  const total = items.reduce((acc, curr) => acc + curr.count, 0) + (statusBreakdown.other || 0)

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Generation Health</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Lifecycle and status of AI stream sessions</p>
        </div>
        <span className="text-xs font-medium text-zinc-400">Phase 5.4 - 5.6</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                  <Icon size={13} className={item.color} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.count}</span>
                  <span className="text-zinc-400 text-[11px] w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  style={{ width: `${Math.max(pct, item.count > 0 ? 4 : 0)}%` }}
                  className={`h-full rounded-full ${item.barColor} transition-all duration-500`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 4. Storage Usage Widget
 */
export function StorageUsageWidget({
  kbStorageBytes,
  chatStorageBytes,
}: {
  kbStorageBytes: number
  chatStorageBytes: number
}) {
  const total = kbStorageBytes + chatStorageBytes

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Storage & Documents</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Knowledge Base & Chat Multimodal Files</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          <HardDrive size={13} />
          <span>{formatBytes(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Database size={13} className="text-cyan-500" />
            <span>Knowledge Base</span>
          </div>
          <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">
            {formatBytes(kbStorageBytes)}
          </p>
          <span className="text-[10px] text-zinc-400">RAG Documents</span>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <HardDrive size={13} className="text-purple-500" />
            <span>Chat Attachments</span>
          </div>
          <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">
            {formatBytes(chatStorageBytes)}
          </p>
          <span className="text-[10px] text-zinc-400">Images & Docs</span>
        </div>
      </div>
    </div>
  )
}
