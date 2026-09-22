'use client'

import { Star, CheckCircle2 } from 'lucide-react'

export interface TestimonialItem {
  name: string
  role: string
  company: string
  avatarInitial: string
  avatarBg: string
  content: string
  rating: number
  verifiedTag: string
}

export function TestimonialCard({ testimonial }: { testimonial: TestimonialItem }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-xs dark:border-white/[0.08] dark:bg-[#181818] transition-all hover:border-zinc-300 dark:hover:border-white/[0.15]">
      <div>
        {/* Rating Stars */}
        <div className="flex items-center gap-1 text-amber-400">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} size={14} fill="currentColor" />
          ))}
        </div>

        {/* Content Quote */}
        <p className="mt-4 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          &ldquo;{testimonial.content}&rdquo;
        </p>
      </div>

      {/* Author Info */}
      <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${testimonial.avatarBg} text-xs font-bold text-white shadow-xs`}>
            {testimonial.avatarInitial}
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1">
              <span className="truncate">{testimonial.name}</span>
              <span title="Verified User" className="inline-flex">
                <CheckCircle2 size={12} className="text-blue-500 shrink-0" />
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {testimonial.role} • {testimonial.company}
            </div>
          </div>
        </div>

        <span className="hidden sm:inline-block whitespace-nowrap shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 border border-emerald-200/60 dark:border-emerald-800/40">
          {testimonial.verifiedTag}
        </span>
      </div>
    </div>
  )
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    name: 'Budi Santoso',
    role: 'Head of Operations',
    company: 'Fintech Nusantara',
    avatarInitial: 'BS',
    avatarBg: 'bg-blue-600',
    content: 'Kemampuan membaca laporan regulasi dan SOP puluhan lembar dalam beberapa detik sangat mengubah ritme kerja tim kepatuhan kami. Sangat cepat dan akurat.',
    rating: 5,
    verifiedTag: 'Pro User',
  },
  {
    name: 'Sarah Wijaya',
    role: 'Lead Product Manager',
    company: 'SaaS Studio Jakarta',
    avatarInitial: 'SW',
    avatarBg: 'bg-emerald-600',
    content: 'Model GPT yang responsif dipadu antarmuka yang bersih seperti Linear dan ChatGPT. Tidak ada bloatware, langsung siap pakai untuk brainstorming dan drafting PRD.',
    rating: 5,
    verifiedTag: 'Team Lead',
  },
  {
    name: 'Dimas Pratama',
    role: 'Senior Data Scientist',
    company: 'Aero Analytics',
    avatarInitial: 'DP',
    avatarBg: 'bg-purple-600',
    content: 'Fitur isolasi data dan private workspace adalah alasan utama kami beralih ke ChatLabs.id. Keamanan data internal kami tetap terjamin 100%.',
    rating: 5,
    verifiedTag: 'Enterprise',
  },
  {
    name: 'Rina Kusuma',
    role: 'Creative Strategist',
    company: 'MediaLab Bali',
    avatarInitial: 'RK',
    avatarBg: 'bg-rose-600',
    content: 'Bisa langsung generate referensi gambar dan menyusun copy campaign dalam satu obrolan yang sama. Alur kerja tim kreatif kami jadi jauh lebih ringkas.',
    rating: 5,
    verifiedTag: 'Pro User',
  },
  {
    name: 'Farhan Maulana',
    role: 'Full-stack Engineer',
    company: 'CloudVentures',
    avatarInitial: 'FM',
    avatarBg: 'bg-amber-600',
    content: 'Sintaks kode terformat dengan rapi, tombol copy kode berfungsi instan, dan respons streaming tidak pernah macet. Pengalaman pair-programming yang menyenangkan.',
    rating: 5,
    verifiedTag: 'Developer',
  },
  {
    name: 'Jessica Tan',
    role: 'Academic Researcher',
    company: 'Institute of Innovation',
    avatarInitial: 'JT',
    avatarBg: 'bg-teal-600',
    content: 'Sitasi sumber dokumen pada jawaban AI sangat membantu saya memverifikasi data sebelum menyusun publikasi ilmiah. Luar biasa membantu!',
    rating: 5,
    verifiedTag: 'Researcher',
  },
]

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28 border-t border-zinc-200/70 dark:border-white/[0.07] bg-white dark:bg-[#121212]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Testimoni Pengguna
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Dipercaya oleh profesional dan tim inovatif.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
            Lihat bagaimana ChatLabs.id mempercepat pekerjaan ribuan praktisi setiap hari.
          </p>
        </div>

        {/* Testimonials 3-Column Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item, idx) => (
            <TestimonialCard key={idx} testimonial={item} />
          ))}
        </div>

      </div>
    </section>
  )
}
