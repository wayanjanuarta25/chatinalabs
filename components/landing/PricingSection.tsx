'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles, ArrowRight, Zap, ShieldCheck, FileText, ImageIcon, Database, Lock } from 'lucide-react'

export function PricingSection({ isFullPage = false }: { isFullPage?: boolean }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')

  const isYearly = billingCycle === 'yearly'

  const HIGHLIGHTS = [
    { icon: Zap, label: 'Model AI GPT-5.5 & GPT-5.6', desc: 'Respon cepat tanpa antrean' },
    { icon: Sparkles, label: 'Unlimited Chat', desc: 'Tanpa batas kuota pesan harian' },
    { icon: FileText, label: 'Upload Dokumen hingga 25 MB', desc: 'Dukungan PDF, DOCX, & TXT' },
    { icon: ImageIcon, label: 'Generator Gambar AI HD', desc: 'Format 1:1, 9:16, & 16:9' },
    { icon: Database, label: 'Knowledge Base & RAG', desc: 'Pencarian semantik cerdas' },
    { icon: Lock, label: 'Data 100% Privat & Aman', desc: 'Isolasi Row-Level Security' },
  ]

  return (
    <section id="pricing" className={`py-16 sm:py-24 ${isFullPage ? '' : 'border-t border-zinc-200/70 dark:border-white/[0.07] bg-zinc-50/40 dark:bg-black/20'}`}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Compact Section Header */}
        <div className="mx-auto max-w-xl text-center mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50/80 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-xs">
            <Sparkles size={12} className="fill-current" />
            Paket Berlangganan Tunggal
          </span>
          <h2 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Satu Akses, Seluruh Fitur AI
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Tanpa batas tersembunyi. Dapatkan seluruh kapabilitas workspace chat, dokumen, dan gambar.
          </p>
        </div>

        {/* Compact, High-End Membership Card */}
        <div className="mx-auto max-w-[440px]">
          {/* Ambient Glow Aura */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-emerald-500/25 via-sky-500/20 to-purple-500/25 blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 dark:opacity-50 dark:group-hover:opacity-75" />

            <div className="relative rounded-3xl border border-zinc-200/90 bg-white/95 p-6 sm:p-7 shadow-xl backdrop-blur-xl dark:border-white/12 dark:bg-[#161616]/95 transition-all">
              
              {/* Header inside card: Name & Plan Switcher */}
              <div className="flex items-center justify-between gap-3 pb-5 border-b border-zinc-100 dark:border-white/[0.06]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white whitespace-nowrap">
                      Chat<span className="text-emerald-600 dark:text-emerald-400">Labs</span>
                    </h3>
                    <span className="whitespace-nowrap shrink-0 rounded-md bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 px-2 py-0.5 text-[10px] font-bold">
                      Paling Populer
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Akses penuh personal & profesional</p>
                </div>

                {/* Integrated Segmented Pill Switcher */}
                <div className="flex items-center rounded-xl bg-zinc-100/90 p-1 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-white/[0.06] shrink-0">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                      !isYearly
                        ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                      isYearly
                        ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    <span>Tahunan</span>
                    <span className="text-[9px] font-black tracking-wider uppercase opacity-90">-50%</span>
                  </button>
                </div>
              </div>

              {/* Price Hero Section */}
              <div className="pt-5 pb-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                    {isYearly ? 'Rp 300.000' : 'Rp 50.000'}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {isYearly ? '/ tahun' : '/ bulan'}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {isYearly ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                      <Sparkles size={11} />
                      Setara <strong>Rp 25.000/bln</strong> (Hemat Rp 300.000)
                    </span>
                  ) : (
                    <span className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                      Fleksibel bayar bulanan, batalkan kapan saja
                    </span>
                  )}
                </div>
              </div>

              {/* Curated Feature Highlights */}
              <div className="space-y-2.5 pt-4 pb-5 border-t border-zinc-100 dark:border-white/[0.06]">
                {HIGHLIGHTS.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:inline truncate">
                          · {item.desc}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  href="/register"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 py-3 text-xs sm:text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] dark:from-white dark:via-zinc-100 dark:to-white dark:text-zinc-900 cursor-pointer"
                >
                  <span>Mulai Berlangganan Sekarang</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Micro Guarantees Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-center gap-4 text-[10.5px] text-zinc-400 dark:text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Aktivasi Instan
                </span>
                <span>•</span>
                <span>Bebas Batalkan</span>
                <span>•</span>
                <span>Privasi Terisolasi</span>
              </div>

            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-8 text-center text-[11.5px] text-zinc-500 dark:text-zinc-400">
          Ingin melihat perincian teknis batasan kuota?{' '}
          <Link href="/limits" className="font-semibold text-zinc-800 dark:text-zinc-200 hover:underline">
            Pelajari Layanan & Batasan →
          </Link>
        </div>

      </div>
    </section>
  )
}
