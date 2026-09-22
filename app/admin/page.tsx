import { fetchPlatformAnalytics } from '@/lib/supabase/admin-queries'
import { checkPlatformAdmin } from '@/lib/auth/admin'
import { StatCard } from '@/components/admin/StatCard'
import { 
  UserGrowthChart, 
  ChatUsageChart, 
  AIStatusChart, 
  StorageUsageWidget 
} from '@/components/admin/AnalyticsCharts'
import { RecentUsersTable } from '@/components/admin/RecentUsersTable'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { 
  Users, 
  Building2, 
  MessagesSquare, 
  MessageSquare, 
  Bot, 
  Sparkles,
  Zap,
  Activity
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const auth = await checkPlatformAdmin()
  if (!auth.isPlatformAdmin) {
    return null
  }

  const analytics = await fetchPlatformAnalytics()

  if (!analytics) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-500">
        Failed to load platform analytics. Please ensure your account has administrator privileges.
      </div>
    )
  }

  const { overview, users, workspaces, ai_usage, recent_activity, recent_audits } = analytics

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Admin Dashboard
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live System
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time platform insights, tenant metrics, and AI engine analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Activity size={14} className="text-emerald-500" />
          <span>Active Users: {overview.active_users_today} today · {overview.active_users_7d} (7d) · {overview.active_users_30d} (30d)</span>
        </div>
      </div>

      {/* 5 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={overview.total_users}
          icon={Users}
          colorTheme="blue"
          badge={`+${overview.active_users_today} active`}
          description={`${overview.active_users_7d} active in last 7 days`}
        />

        <StatCard
          title="Total Workspaces"
          value={overview.total_workspaces}
          icon={Building2}
          colorTheme="purple"
          badge={`${workspaces.avg_members_per_workspace} avg/ws`}
          description="Multi-tenant isolation active"
        />

        <StatCard
          title="Total Conversations"
          value={overview.total_conversations}
          icon={MessagesSquare}
          colorTheme="emerald"
          badge="Live"
          description="Across all user workspaces"
        />

        <StatCard
          title="Total Messages"
          value={overview.total_messages}
          icon={MessageSquare}
          colorTheme="cyan"
          description={`${overview.user_messages} user · ${overview.assistant_messages} assistant`}
        />

        <StatCard
          title="AI Generations"
          value={overview.ai_generations}
          icon={Bot}
          colorTheme="amber"
          badge={`${ai_usage.status_breakdown.completed} completed`}
          description={`${ai_usage.status_breakdown.regenerated} regenerated · ${ai_usage.status_breakdown.stopped} stopped`}
        />
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Trends */}
        <UserGrowthChart growthData={users.growth_chart} />

        {/* Chat Composition */}
        <ChatUsageChart
          userMessages={overview.user_messages}
          assistantMessages={overview.assistant_messages}
        />

        {/* AI Health & Lifecycle */}
        <AIStatusChart statusBreakdown={ai_usage.status_breakdown} />

        {/* Storage & Multimodal Files */}
        <StorageUsageWidget
          kbStorageBytes={overview.kb_storage_bytes}
          chatStorageBytes={overview.chat_storage_bytes}
        />
      </div>

      {/* Data Directory & Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentUsersTable users={users.recent_users} />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed
            activities={recent_activity}
            audits={recent_audits}
          />
        </div>
      </div>
    </div>
  )
}
