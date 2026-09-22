import { fetchPlatformAnalytics } from '@/lib/supabase/admin-queries'
import { checkPlatformAdmin } from '@/lib/auth/admin'
import { StatCard } from '@/components/admin/StatCard'
import { 
  ChatUsageChart, 
  AIStatusChart, 
  StorageUsageWidget,
  formatBytes 
} from '@/components/admin/AnalyticsCharts'
import { 
  MessageSquare, 
  Bot, 
  Sparkles, 
  Cpu, 
  Activity, 
  Layers,
  HardDrive
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const auth = await checkPlatformAdmin()
  if (!auth.isPlatformAdmin) {
    return null
  }

  const analytics = await fetchPlatformAnalytics()

  if (!analytics) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-500">
        Failed to load analytics data.
      </div>
    )
  }

  const { overview, ai_usage } = analytics

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Chat & AI Usage Analytics
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Deep telemetry on conversational throughput, streaming reliability, and AI model utilization.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Users (Today)"
          value={overview.active_users_today}
          icon={Activity}
          colorTheme="emerald"
          badge="24h Window"
          description={`${overview.active_users_7d} (7d) · ${overview.active_users_30d} (30d)`}
        />
        <StatCard
          title="User Prompts"
          value={overview.user_messages}
          icon={MessageSquare}
          colorTheme="blue"
          description="Inbound user query volume"
        />
        <StatCard
          title="AI Completions"
          value={overview.assistant_messages}
          icon={Bot}
          colorTheme="purple"
          description="Generated streaming completions"
        />
        <StatCard
          title="Total Multimodal Storage"
          value={formatBytes(overview.kb_storage_bytes + overview.chat_storage_bytes)}
          icon={HardDrive}
          colorTheme="cyan"
          description="KB Docs + Chat Attachments"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChatUsageChart
          userMessages={overview.user_messages}
          assistantMessages={overview.assistant_messages}
        />
        <AIStatusChart statusBreakdown={ai_usage.status_breakdown} />
      </div>

      {/* Model Distribution Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Models Deployed</h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Distribution of LLM models used in completions</p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            {ai_usage.models_used.length} active models
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-zinc-500 dark:bg-zinc-950/40 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="py-2.5 px-4 font-medium">Model Identifier</th>
                <th className="py-2.5 px-3 font-medium text-center">Generations</th>
                <th className="py-2.5 px-4 font-medium text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {ai_usage.models_used.map((m) => {
                const totalGenerations = overview.ai_generations || 1
                const pct = Math.round((m.count / totalGenerations) * 100)

                return (
                  <tr key={m.model_name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-purple-500" />
                        <span>{m.model_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                      {m.count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-purple-600 dark:text-purple-400">
                      {pct}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
