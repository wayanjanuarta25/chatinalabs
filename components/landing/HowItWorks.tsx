'use client'

import { UserPlus, LayoutDashboard, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Buat Akun',
    description: 'Daftar dalam waktu kurang dari satu menit. Tidak memerlukan kartu kredit untuk memulai paket Free.',
    badge: 'Langkah Pertama',
  },
  {
    step: '02',
    icon: LayoutDashboard,
    title: 'Masuk Workspace',
    description: 'Akses antarmuka kerja cerdas, tentukan model AI GPT yang Anda inginkan, dan siapkan dokumen referensi.',
    badge: 'Konfigurasi Cepat',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'Mulai Menggunakan AI',
    description: 'Ajukan pertanyaan, minta analisa dokumen mendalam, buat visualisasi gambar, dan simpan wawasan penting.',
    badge: 'Tingkatkan Produktivitas',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 border-t border-zinc-200/70 dark:border-white/[0.07] bg-zinc-50/50 dark:bg-black/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Cara Kerja
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Tiga langkah mudah menuju produktivitas maksimal.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
            Mulai dari registrasi instan hingga berkolaborasi dengan model AI tercanggih hanya dalam hitungan detik.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-white/[0.08] dark:bg-[#181818] transition-all hover:shadow-md"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-zinc-300 dark:text-zinc-700">
                      {item.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                      <Icon size={19} />
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {item.badge}
                    </span>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/[0.05] text-[11px] font-medium text-zinc-400">
                  Langkah {idx + 1} dari 3
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Link */}
        <div className="mt-12 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-black active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer"
          >
            <span>Masuk ke ChatLabs</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  )
}
