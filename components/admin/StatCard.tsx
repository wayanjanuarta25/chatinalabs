import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: string
    positive?: boolean
    neutral?: boolean
  }
  badge?: string
  colorTheme?: 'emerald' | 'blue' | 'purple' | 'amber' | 'cyan' | 'rose'
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  badge,
  colorTheme = 'blue',
}: StatCardProps) {
  const themeStyles = {
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      badgeBg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    },
  }[colorTheme]

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${themeStyles.iconBg}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        {badge && (
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${themeStyles.badgeBg}`}>
            {badge}
          </span>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trend.neutral
                  ? 'text-zinc-500'
                  : trend.positive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-zinc-400 dark:text-zinc-500 truncate">{description}</span>
          )}
        </div>
      )}
    </div>
  )
}
