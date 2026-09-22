'use client'

import { Zap, Lock, FileSearch, Users, CheckCircle2 } from 'lucide-react'

const PILLARS = [
  {
    icon: Zap,
    title: 'Lebih Produktif',
    highlight: '10x Lebih Cepat',
    subtitle: 'Kerjakan tugas dengan bantuan AI.',
    description: 'Selesaikan riset, penyusunan draf, analisis data pasar, dan pemrograman dalam hitungan menit. Asisten AI kami memangkas pekerjaan repetitif sehingga Anda fokus pada keputusan penting.',
    bullets: [
      'Model GPT generasi terbaru dengan latensi rendah',
      'Kontrol penuh: Stop, retry, dan regenerate respons',
      'Format markdown kaya dengan visualisasi data tabel',
    ],
  },
  {
    icon: Lock,
    title: 'Private & Aman',
    highlight: 'Zero Data Training',
    subtitle: 'Data pengguna terisolasi.',
    description: 'Percakapan dan dokumen bisnis Anda adalah milik Anda sepenuhnya. Kami tidak menggunakan data Anda untuk melatih model AI publik. Didukung sistem Row-Level Security Supabase berstandar enterprise.',
    bullets: [
      'Isolasi data tenant yang ketat di level basis data',
      'Enkripsi data saat transmisi (TLS) dan saat disimpan',
      'Kepatuhan privasi sesuai regulasi proteksi data modern',
    ],
  },
  {
    icon: FileSearch,
    title: 'Analisa Dokumen Langsung',
    highlight: 'RAG Instant',
    subtitle: 'Analisa file langsung.',
    description: 'Tinggalkan cara manual membaca ratusan halaman laporan. Cukup unggah file PDF, Word, atau teks, lalu biarkan ChatLabs.id mengekstrak kutipan dan wawasan penting secara real-time.',
    bullets: [
      'Ekstraksi teks cerdas dengan penanganan multi-format',
      'Penyebutan sitasi sumber dokumen yang terverifikasi',
      'Dukungan lampiran berukuran hingga 25 MB per dokumen',
    ],
  },
  {
    icon: Users,
    title: 'Workspace Kolaboratif',
    highlight: 'Team Sync',
    subtitle: 'Kolaborasi dan knowledge management.',
    description: 'Kelola basis pengetahuan tim, buat arsip instruksi perusahaan, dan jaga konsistensi hasil kerja seluruh anggota organisasi dalam satu workspace yang rapi dan terpusat.',
    bullets: [
      'Knowledge Base terstruktur untuk referensi SOP',
      'Riwayat percakapan yang dapat diakses kembali sewaktu-waktu',
      'Manajemen peran dan analitik penggunaan berbasis platform',
    ],
  },
]

export function WhyChatINALabs() {
  return (
    <section className="py-20 sm:py-28 border-t border-zinc-200/70 dark:border-white/[0.07] bg-white dark:bg-[#121212]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Mengapa Memilih Kami
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Solusi AI yang dirancang untuk performa kerja nyata.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
            ChatLabs.id bukan sekadar alat chat biasa, melainkan pusat operasional cerdas untuk meningkatkan efektivitas individu dan tim.
          </p>
        </div>

        {/* Pillars 2x2 Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-[#181818]/60 transition-all hover:border-zinc-300 dark:hover:border-white/[0.15]"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                      <Icon size={20} />
                    </div>
                    <span className="rounded-full bg-zinc-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {pillar.highlight}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {pillar.subtitle}
                  </p>

                  {/* Description */}
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {pillar.description}
                  </p>
                </div>

                {/* Bullets */}
                <div className="mt-6 pt-5 border-t border-zinc-200/60 dark:border-white/[0.06] space-y-2">
                  {pillar.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2 text-xs sm:text-[13px] text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
