'use client'

import { 
  FileText, 
  MessageSquare, 
  Image as ImageIcon, 
  Database, 
  ShieldCheck, 
  Cpu, 
  ArrowRight 
} from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  {
    icon: FileText,
    title: 'Upload Document',
    description: 'Analisa dokumen PDF, DOCX, dan TXT secara instan. Ajukan pertanyaan, cari ringkasan, dan ekstrak data tabel secara akurat.',
    badge: 'Multi-Format',
    gradient: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat',
    description: 'Percakapan natural dengan model GPT generasi terbaru. Nikmati streaming ultra-cepat, kemampuan stop generation, serta retry & regenerate.',
    badge: 'Ultra Fast',
    gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    icon: ImageIcon,
    title: 'Generate Image',
    description: 'Visualisasikan ide kreatif, konsep presentasi, atau cover konten secara instan dengan prompt teks langsung di dalam ruang obrolan.',
    badge: 'Creative AI',
    gradient: 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20',
    iconColor: 'text-purple-500',
  },
  {
    icon: Database,
    title: 'Knowledge Base',
    description: 'Simpan referensi, materi SOP, dan arsip perusahaan sebagai knowledge base terpusat untuk menjawab pertanyaan tim dengan presisi tinggi.',
    badge: 'RAG Ready',
    gradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    iconColor: 'text-amber-500',
  },
  {
    icon: ShieldCheck,
    title: 'Private Workspace',
    description: 'Data dan percakapan Anda tidak digunakan untuk melatih model publik. Setiap tenant diisolasi dengan Row Level Security enterprise.',
    badge: 'Enterprise Security',
    gradient: 'from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20',
    iconColor: 'text-cyan-500',
  },
  {
    icon: Cpu,
    title: 'Multimodal AI',
    description: 'Gabungkan teks, dokumen, gambar, dan kode dalam satu alur kerja terpadu. Berikan masukan apapun dan dapatkan wawasan terbaik.',
    badge: 'Full Spectrum',
    gradient: 'from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20',
    iconColor: 'text-rose-500',
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="py-20 sm:py-28 border-t border-zinc-200/70 dark:border-white/[0.07] bg-zinc-50/50 dark:bg-black/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Fitur Utama
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Satu platform untuk segala kebutuhan AI Anda.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
            Dirancang khusus untuk memadukan kecerdasan bahasa, pemrosesan dokumen, dan pembuatan aset visual dalam alur kerja yang rapi.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-white/[0.08] dark:bg-[#181818]"
              >
                {/* Icon & Badge */}
                <div className="flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 ${feature.iconColor} transition-transform group-hover:scale-110`}>
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full border border-zinc-200/60 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-white/[0.08] dark:bg-zinc-800/80 dark:text-zinc-300">
                    {feature.badge}
                  </span>
                </div>

                {/* Content */}
                <h3 className="mt-5 text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>

                {/* Subtle Hover Action Indicator */}
                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.05] flex items-center text-xs font-semibold text-zinc-900 dark:text-zinc-200 opacity-80 group-hover:opacity-100 transition-opacity">
                  <span>Pelajari kapabilitas</span>
                  <ArrowRight size={13} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Banner CTA */}
        <div className="mt-12 rounded-2xl border border-zinc-200/80 bg-white p-6 text-center shadow-xs dark:border-white/[0.08] dark:bg-[#181818] sm:flex sm:items-center sm:justify-between sm:text-left sm:p-8">
          <div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-white">
              Ingin tahu batasan penggunaan dan alokasi model?
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Cek dokumentasi lengkap mengenai kuota token, file size upload, dan rate limits.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/limits"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300/80 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              <span>Lihat Layanan & Batasan</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
