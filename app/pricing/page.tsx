import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { PricingSection } from '@/components/landing/PricingSection'
import { FAQ } from '@/components/landing/FAQ'
import { createClient } from '@/lib/supabase/server'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Paket Harga & Langganan — ChatLabs.id',
  description: 'Informasi paket langganan lengkap ChatLabs.id: Rp 50.000 per bulan atau Rp 300.000 per tahun untuk seluruh fitur AI canggih.',
}

const PLAN_SPECIFICATIONS = [
  { feature: 'Model AI GPT-5.5 Standar', spec: 'Akses penuh ke GPT-5.5, GPT-5.6-sol, GPT-5.6-terra, & GPT-6-astra' },
  { feature: 'Batas Pesan Obrolan Harian', spec: 'Tak terbatas (Fair Usage Policy)' },
  { feature: 'Maksimal Ukuran File Dokumen', spec: 'Hingga 25 MB per dokumen' },
  { feature: 'Format Dokumen Didukung', spec: 'PDF, DOCX (Microsoft Word), TXT' },
  { feature: 'Jumlah Dokumen per Prompt', spec: 'Hingga 5 dokumen secara simultan' },
  { feature: 'Ekstraksi Sitasi & Tabel', spec: 'Analisis mendalam, kutipan akurat, dan ekstrasi data' },
  { feature: 'Generator Gambar AI Terintegrasi', spec: 'Rasio 1:1, 9:16, 16:9 beresolusi tinggi' },
  { feature: 'Penyimpanan Knowledge Base (RAG)', spec: 'Pencarian semantik cerdas berbasis vektor dokumen' },
  { feature: 'Riwayat Percakapan', spec: 'Tersimpan permanen & aman tanpa batas waktu' },
  { feature: 'Keamanan Data Multi-Tenant', spec: 'Enkripsi & isolasi Row-Level Security (RLS) di Supabase' },
  { feature: 'Dukungan Pelanggan', spec: 'Bantuan prioritas respon cepat' },
  { feature: 'SLA Ketersediaan Layanan', spec: '99.9% uptime andal' },
]

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-[#121212] dark:text-zinc-100 transition-colors">
      <Navbar isAuthenticated={Boolean(user)} />

      <main className="flex-1">
        {/* Main Single Pricing Card Component */}
        <div className="pt-8 sm:pt-12">
          <PricingSection isFullPage={true} />
        </div>

        {/* Feature Specifications Table */}
        <section className="py-16 sm:py-20 border-t border-zinc-200/70 dark:border-white/[0.07] bg-zinc-50/50 dark:bg-black/20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Pilihan paket transparan
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Tabel Perbandingan & Rincian Kapabilitas
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Semua kapabilitas premium di bawah ini sudah termasuk dalam paket Rp 50.000 / bulan atau Rp 300.000 / tahun.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181818] shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-zinc-200/80 bg-zinc-50/80 dark:border-white/[0.07] dark:bg-zinc-900/60 font-semibold text-zinc-800 dark:text-zinc-200">
                  <tr>
                    <th className="py-4 px-5 sm:px-6">Fitur & Kapabilitas</th>
                    <th className="py-4 px-5 sm:px-6">Kapasitas / Rincian Layanan</th>
                    <th className="py-4 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.05] text-zinc-600 dark:text-zinc-300">
                  {PLAN_SPECIFICATIONS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3.5 px-5 sm:px-6 font-semibold text-zinc-900 dark:text-white">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-5 sm:px-6 text-zinc-700 dark:text-zinc-300">
                        {row.spec}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <Check size={12} strokeWidth={2.5} />
                          Termasuk
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Register CTA Banner */}
            <div className="mt-10 rounded-2xl border border-zinc-200/80 bg-zinc-900 p-6 sm:p-8 text-white dark:border-white/[0.1] dark:bg-white dark:text-zinc-900 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 dark:text-amber-600">
                  <Sparkles size={14} />
                  <span>Akses Penuh Tanpa Batas</span>
                </div>
                <h3 className="mt-1 text-xl font-bold">Siap meningkatkan produktivitas Anda?</h3>
                <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">
                  Mulai berlangganan sekarang hanya Rp 50.000 / bulan atau Rp 300.000 / tahun.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-100 active:scale-[0.98] dark:bg-zinc-900 dark:text-white dark:hover:bg-black cursor-pointer shrink-0"
              >
                <span>Masuk & Berlangganan</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Link to Limits */}
            <div className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Perlu informasi teknis spesifik mengenai context window dan rate limits?{' '}
              <Link href="/limits" className="font-semibold text-zinc-900 dark:text-white hover:underline">
                Buka dokumentasi Layanan & Batasan →
              </Link>
            </div>
          </div>
        </section>

        {/* Embedded FAQ */}
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}
