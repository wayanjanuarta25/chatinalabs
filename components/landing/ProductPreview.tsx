'use client'

import Image from 'next/image'
import { FileText, Copy, ThumbsUp, Sparkles, Check, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'

export function ProductPreview() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Decorative Glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 opacity-40 blur-xl transition-all" />

      {/* Main Container Card */}
      <div className="relative rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/[0.1] dark:bg-[#181818]/95 overflow-hidden">
        
        {/* Mock Window Titlebar */}
        <div className="flex items-center justify-between border-b border-zinc-200/70 bg-zinc-50/80 px-4 py-2.5 dark:border-white/[0.07] dark:bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/80 dark:bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80 dark:bg-amber-500/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80 dark:bg-emerald-500/70" />
            <span className="ml-2 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              ChatLabs.id Workspace — Session #2026
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* Mock Conversation Area */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
          
          {/* User Message */}
          <div className="flex justify-end gap-3">
            <div className="flex max-w-[85%] sm:max-w-[75%] flex-col items-end">
              {/* Mock Document Attachment */}
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-zinc-100/90 px-3 py-1.5 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-200">
                <FileText size={14} className="text-blue-500" />
                <span className="font-medium">Laporan_Strategi_Q3_2026.pdf</span>
                <span className="text-[10px] text-zinc-400">(2.4 MB)</span>
              </div>

              {/* User Bubble */}
              <div className="rounded-2xl rounded-tr-sm bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-white dark:bg-white dark:text-zinc-900 shadow-sm">
                Ringkas dokumen ini dan highlight key insight bisnis beserta rekomendasi eksekusinya.
              </div>
            </div>
            
            {/* User Avatar */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-xs font-semibold text-white dark:bg-zinc-700">
              U
            </div>
          </div>

          {/* AI Response */}
          <div className="flex flex-col justify-start">
            
            {/* Assistant Header: Clean logo (no gray box) + Inalabs AI - GPT-5.5 */}
            <div className="flex items-center gap-2 mb-2 select-none">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Image
                  src="/logo-ci.png"
                  alt="Inalabs AI"
                  width={18}
                  height={18}
                  className="object-contain dark:invert"
                  priority
                />
              </div>
              <span className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Inalabs AI - GPT-5.5
              </span>
              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Dokumen Terverifikasi
              </span>
            </div>

            {/* AI Message Content */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 sm:p-5 text-sm leading-relaxed text-zinc-800 dark:border-white/[0.06] dark:bg-[#1f1f1f]/50 dark:text-zinc-200 space-y-3">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Saya telah menganalisa <span className="font-semibold text-zinc-900 dark:text-white">Laporan_Strategi_Q3_2026.pdf</span>. Berikut ringkasan eksekutif dan wawasan kunci:
              </p>

              {/* Highlights Bento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="rounded-xl border border-zinc-200/80 bg-white p-3 dark:border-white/[0.08] dark:bg-zinc-900/80">
                  <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Efisiensi Operasional
                  </div>
                  <div className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                    +42.8% Kecepatan Alur Kerja
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    Otomasi pemrosesan dokumen memangkas waktu kerja dari 6 jam menjadi 20 menit.
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200/80 bg-white p-3 dark:border-white/[0.08] dark:bg-zinc-900/80">
                  <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Adopsi Multi-Tenant
                  </div>
                  <div className="mt-1 text-base font-bold text-blue-600 dark:text-blue-400">
                    100% Data Isolation
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    Arsitektur RLS enterprise memastikan kerahasiaan data seluruh entitas bisnis.
                  </div>
                </div>
              </div>

              {/* Actionable points */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-start gap-2 text-xs sm:text-[13px]">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">1</span>
                  <span><strong>Skalabilitas Model AI:</strong> Terapkan GPT-5.5 untuk respons cepat dan GPT-5.6-terra untuk penalaran mendalam.</span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-[13px]">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">2</span>
                  <span><strong>Knowledge Retrieval:</strong> Hubungkan dokumen SOP langsung ke Knowledge Base agar tim selalu mendapatkan jawaban akurat.</span>
                </div>
              </div>

              {/* Mock AI Action Bar */}
              <div className="flex items-center justify-between border-t border-zinc-200/60 pt-3 dark:border-white/[0.06] text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-lg p-1.5 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <ThumbsUp size={13} />
                  </button>
                </div>
                <span className="text-[11px] text-zinc-400">
                  Dihasilkan dalam 0.8 detik • 482 tokens
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mock Bottom Input Bar */}
        <div className="border-t border-zinc-200/70 bg-white/70 px-4 py-3 dark:border-white/[0.07] dark:bg-zinc-900/60">
          <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3.5 py-2 dark:border-white/[0.08] dark:bg-[#222222]/80">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Ketik instruksi lanjutan atau upload file lainnya...
            </span>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-zinc-200/70 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                GPT-5.5
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <ArrowUpRight size={13} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
