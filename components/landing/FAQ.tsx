'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'Apakah ChatLabs.id resmi OpenAI?',
    answer: 'ChatLabs.id adalah platform workspace AI independen yang memanfaatkan API resmi dari OpenAI dan model bahasa canggih berstandar industri. Kami bukan entitas OpenAI, melainkan SaaS pihak ketiga berlisensi resmi yang mengintegrasikan model GPT-5.5 dan GPT-5.6 ke dalam antarmuka kerja produktivitas, manajemen dokumen, dan knowledge base terisolasi.',
  },
  {
    question: 'Bagaimana cara mendapatkan akses?',
    answer: 'Anda dapat langsung berlangganan melalui tombol "Beli Sekarang" atau halaman registrasi. Kami menyediakan paket langganan tunggal ChatLabs.id Pro seharga Rp 50.000 / bulan atau Rp 300.000 / tahun (hemat 50%) dengan akses penuh ke seluruh model AI, analisis dokumen, dan generator gambar tanpa batas.',
  },
  {
    question: 'Apakah percakapan saya private?',
    answer: 'Ya, 100% private. Kami menerapkan arsitektur Multi-Tenant dengan Row-Level Security (RLS) di Supabase. Data riwayat obrolan, dokumen lampiran, dan embedding Knowledge Base Anda terisolasi ketat per akun dan tidak pernah digunakan untuk melatih model AI publik mana pun.',
  },
  {
    question: 'Apakah bisa upload dokumen?',
    answer: 'Tentu saja. ChatLabs.id mendukung unggahan file PDF, DOCX (Microsoft Word), dan TXT. Sistem kami mengekstrak teks secara instan, menyusun ringkasan, dan memungkinkan Anda menanyakan pertanyaan mendalam terkait isi dokumen dengan sitasi sumber terverifikasi.',
  },
  {
    question: 'Apakah bisa generate gambar?',
    answer: 'Bisa. ChatLabs.id memiliki integrasi generator visual AI. Cukup ketikkan instruksi pembuatan gambar di dalam obrolan, dan asisten AI akan menghasilkan karya visual beresolusi tinggi langsung pada bubble percakapan Anda.',
  },
  {
    question: 'Model AI apa saja yang saat ini didukung?',
    answer: 'Kami mendukung keluarga model OpenAI GPT generasi terbaru termasuk GPT-5.5, GPT-5.6-sol, GPT-5.6-terra, GPT-5.6-luna, GPT-5.4-mini, dan GPT-6-astra. Anda dapat dengan bebas mengganti model melalui Model Selector di dalam composer percakapan.',
  },
  {
    question: 'Di mana saya bisa melihat batasan kuota dan rate limit?',
    answer: 'Rincian batasan token, kuota file lampiran, dan frekuensi permintaan dapat dilihat secara transparan di halaman Layanan & Batasan kami.',
  },
]

export function FAQ() {
  const [openIndices, setOpenIndices] = useState<number[]>([0, 2]) // first & privacy open by default

  const toggleIndex = (idx: number) => {
    setOpenIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  return (
    <section id="faq" className="py-20 sm:py-28 border-t border-zinc-200/70 dark:border-white/[0.07] bg-white dark:bg-[#121212]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Pusat Bantuan
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
            Semua hal yang perlu Anda ketahui tentang ChatLabs.id, privasi data, dan kapabilitas sistem.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 divide-y divide-zinc-200/80 rounded-2xl border border-zinc-200/80 bg-zinc-50/40 dark:divide-white/[0.07] dark:border-white/[0.08] dark:bg-[#181818]/50 overflow-hidden">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndices.includes(idx)
            return (
              <div key={idx} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-sm sm:text-base font-semibold text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white cursor-pointer"
                >
                  <span className="pr-4">{item.question}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-zinc-800 dark:text-white' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-0 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 animate-in fade-in duration-150">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Extra Help Card */}
        <div className="mt-10 rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/[0.08] dark:bg-[#181818] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <HelpCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Masih memiliki pertanyaan lain?
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kunjungi halaman rincian teknis batasan layanan atau hubungi tim dukungan kami.
              </p>
            </div>
          </div>
          <Link
            href="/limits"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer shrink-0"
          >
            <span>Pelajari Batasan Layanan</span>
            <ArrowRight size={13} />
          </Link>
        </div>

      </div>
    </section>
  )
}
