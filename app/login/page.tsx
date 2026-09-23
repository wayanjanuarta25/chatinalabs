import Link from 'next/link'
import Image from 'next/image'
import { login } from './actions'
import { AlertCircle, ArrowRight } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f8] px-4 py-12 dark:bg-[#121212] sm:px-6">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center justify-center">
            <Image
              src="/logo-ci.png"
              alt="ChatLabs.id"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Welcome back
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Sign in to ChatLabs.id to continue
          </p>
        </div>

        {/* Error / Status Alert */}
        {message && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <div className="leading-relaxed">{message}</div>
          </div>
        )}

        {/* Form Container */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1a1a1a]">
          <form action={login} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label 
                htmlFor="email" 
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
                className="w-full rounded-xl border border-zinc-300/80 bg-transparent px-3.5 py-2 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password" 
                  className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-zinc-300/80 bg-transparent px-3.5 py-2 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
              />
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-black active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-[11px] text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
            Pendaftaran akun baru sedang dinonaktifkan sementara
          </span>
        </div>
      </div>
    </div>
  )
}
