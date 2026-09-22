import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { ShieldCheck, Database, KeyRound, FileLock2, Server, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Data Security | ChatLabs.id',
  description: 'Arsitektur keamanan data, kontrol akses, dan isolasi multi-tenant di platform ChatLabs.id.',
}

export default async function DataSecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-[#121212] dark:text-zinc-100 transition-colors">
      <Navbar isAuthenticated={Boolean(user)} />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="py-14 sm:py-18 border-b border-zinc-200/70 dark:border-white/[0.07] bg-zinc-50/60 dark:bg-black/20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3.5 py-1 text-xs font-semibold text-zinc-700 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-300 shadow-xs mb-4">
              <ShieldCheck size={13} className="text-emerald-500" />
              Standar Keamanan Platform
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Keamanan Data
            </h1>
            <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Penjelasan arsitektur keamanan, isolasi data multi-tenant, dan proteksi berkas yang diterapkan di ChatLabs.id.
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Terakhir diperbarui: 22 September 2026
            </p>
          </div>
        </section>

        {/* Content Body */}
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
          
          {/* 1. Workspace Isolation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <ShieldCheck size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                1. Workspace Isolation (Isolasi Workspace)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Prinsip arsitektur dasar ChatLabs.id dibangun di atas model Multi-Tenant terisolasi:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 dark:border-white/[0.08] dark:bg-[#181818]/50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Multi-Tenant Architecture</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Setiap pengguna beroperasi di dalam ruang kerja (workspace) yang terpisah secara logis. Seluruh interaksi diikat pada identitas pengguna terverifikasi.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 dark:border-white/[0.08] dark:bg-[#181818]/50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Data Separation</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Pemisahan data diterapkan di seluruh layer: data percakapan, dokumen lampiran, dan embedding knowledge base tidak bercampur antar akun.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Authentication Security */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <KeyRound size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                2. Authentication Security (Keamanan Otentikasi)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Proses otentikasi akun dilindungi oleh mekanisme keamanan session modern:
            </p>
            <ul className="space-y-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 pl-4 list-disc">
              <li>
                <strong className="text-zinc-900 dark:text-white">Secure Authentication:</strong> Manajemen kredensial ditangani menggunakan infrastruktur otentikasi teruji dengan hashing kata sandi yang aman.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Session Protection:</strong> Token sesi disimpan menggunakan atribut cookie aman (HttpOnly, SameSite) dan dilakukan validasi berkala untuk mencegah pembajakan sesi (session hijacking).
              </li>
            </ul>
          </section>

          {/* 3. Database Security */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <Database size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                3. Database Security (Keamanan Basis Data)
              </h2>
            </div>
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 dark:border-white/[0.08] dark:bg-[#181818] space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Row Level Security (RLS)</h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Basis data PostgreSQL kami menerapkan Row-Level Security (RLS) secara ketat pada seluruh tabel pesan, sesi, workspace, dan lampiran file.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Access Policies</h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Kebijakan RLS membatasi eksekusi SELECT, INSERT, UPDATE, dan DELETE langsung pada level engine basis data, memastikan query hanya dapat mengembalikan baris yang menjadi hak milik akun pengguna yang telah terverifikasi.
                </p>
              </div>
            </div>
          </section>

          {/* 4. File Security */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <FileLock2 size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                4. File Security (Keamanan Berkas & Lampiran)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Perlindungan dokumen yang diunggah untuk analisis teks dan gambar:
            </p>
            <ul className="space-y-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 pl-4 list-disc">
              <li>
                <strong className="text-zinc-900 dark:text-white">Uploaded File Protection:</strong> Berkas disimpan pada bucket penyimpanan tertutup (private storage) yang tidak dapat diakses secara publik.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Controlled Access:</strong> Akses pengunduhan atau pratinjau dokumen hanya diberikan melalui URL bertanda tangan (signed URL) dengan masa kedaluwarsa singkat khusus untuk pemilik berkas.
              </li>
            </ul>
          </section>

          {/* 5. Infrastructure Security */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <Server size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                5. Infrastructure Security (Keamanan Infrastruktur)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Operasional sistem dijalankan di atas infrastruktur awan terpercaya dengan standar perlindungan berlapis:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="rounded-2xl border border-zinc-200/80 p-5 dark:border-white/[0.08]">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Secure Storage</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Penyimpanan data terlindungi dengan enkripsi standar industri saat transit (in-transit via TLS/HTTPS) dan saat disimpan di media penyimpanan (at-rest).
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 p-5 dark:border-white/[0.08]">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Monitoring</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Pemantauan kinerja berkelanjutan, audit jejak akses, serta deteksi anomali untuk menjaga integritas dan ketersediaan layanan secara optimal.
                </p>
              </div>
            </div>
          </section>

        </article>
      </main>

      <Footer />
    </div>
  )
}
