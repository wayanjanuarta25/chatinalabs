import { Shield, ShieldAlert, ShieldCheck, User } from 'lucide-react'

interface UserItem {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin' | 'super_admin'
  created_at: string
  conversations_count?: number
}

export function RecentUsersTable({ users }: { users: UserItem[] }) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-500/20">
            <ShieldAlert size={10} />
            Super Admin
          </span>
        )
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-500/20">
            <ShieldCheck size={10} />
            Admin
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <User size={10} />
            User
          </span>
        )
    }
  }

  const formatDate = (iso: string) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Registered Users</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Platform user directory and roles</p>
        </div>
        <span className="text-xs font-medium text-zinc-500">{users.length} displayed</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50/70 text-zinc-500 dark:bg-zinc-950/40 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
            <tr>
              <th className="py-2.5 px-4 font-medium">User</th>
              <th className="py-2.5 px-3 font-medium">Role</th>
              <th className="py-2.5 px-3 font-medium text-center">Chats</th>
              <th className="py-2.5 px-4 font-medium text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-zinc-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const initial = (u.full_name?.charAt(0) || u.email?.charAt(0) || 'U').toUpperCase()

                return (
                  <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[11px] font-semibold text-white">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {u.full_name || 'No Name'}
                          </p>
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">{getRoleBadge(u.role)}</td>
                    <td className="py-3 px-3 text-center font-semibold text-zinc-700 dark:text-zinc-300">
                      {u.conversations_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400 text-[11px]">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
