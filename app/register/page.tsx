import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, ArrowRight, UserX, ArrowLeft } from 'lucide-react'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f8] px-4 py-12 dark:bg-[#121212] sm:px-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-3 flex items-center justify-center">
            <Image
              src="/logo-ci.png"
              alt="ChatLabs.id"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            ChatLabs.id
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Platform AI & Workspace Knowledge
          </p>
        </div>

        {/* Message Alert if provided */}
        {message && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="leading-relaxed">{message}</div>
          </div>
        )}

        {/* Disabled State Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-[#1a1a1a] text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <UserX size={24} />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300">
            Pendaftaran Sementara Ditutup
          </span>

          <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Registrasi Akun Baru Dinonaktifkan
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Mohon maaf atas ketidaknyamanannya. Pendaftaran akun baru di ChatLabs.id saat ini sedang ditutup sementara untuk peningkatan infrastruktur dan pemeliharaan sistem.
          </p>

          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Bagi Anda yang sudah memiliki akun, Anda tetap dapat masuk dan mengakses seluruh fitur seperti biasa.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-black active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer"
            >
              <span>Masuk ke Akun Anda</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200/80 py-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:text-zinc-300 dark:hover:bg-zinc-800/60 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Sudah memiliki akun terdaftar?{' '}
          <Link 
            href="/login" 
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-200"
          >
            Login di sini
          </Link>
        </div>
      </div>
    </div>
  )
}
