import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Shield, Lock, Database, UserCheck, FileText, HardDrive } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Privacy Policy | ChatLabs.id',
  description: 'Kebijakan privasi ChatLabs.id mengenai penggunaan dan perlindungan data pengguna.',
}

export default async function PrivacyPolicyPage() {
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
              <Shield size={13} className="text-emerald-500" />
              Dokumen Hukum Resmi
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Kebijakan privasi ChatLabs.id mengenai tata kelola, penggunaan, dan perlindungan data pengguna di seluruh layanan platform.
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Terakhir diperbarui: 22 September 2026
            </p>
          </div>
        </section>

        {/* Content Body */}
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
          
          {/* 1. Pendahuluan */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <Shield size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                1. Pendahuluan
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              ChatLabs.id berkomitmen penuh untuk menghormati dan melindungi privasi setiap pengguna. Kami menyadari bahwa data percakapan, dokumen yang diunggah, serta informasi profil Anda adalah aset penting yang harus dijaga kerahasiaannya. Kebijakan Privasi ini menjelaskan prinsip pengumpulan, pengelolaan, penyimpanan, dan perlindungan informasi Anda saat mengakses atau menggunakan platform ChatLabs.id.
            </p>
          </section>

          {/* 2. Data yang Dikumpulkan */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <FileText size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                2. Data yang Dikumpulkan
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Untuk memberikan pengalaman asistensi AI yang optimal dan andal, kami mengumpulkan kategori data berikut:
            </p>
            <ul className="space-y-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 pl-4 list-disc">
              <li>
                <strong className="text-zinc-900 dark:text-white">Account Information:</strong> Alamat email, nama tampilan, kata sandi terenkripsi, serta preferensi akun yang Anda daftarkan.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Chat History:</strong> Riwayat pesan, instruksi prompt, serta respons AI yang tersimpan di dalam sesi obrolan Anda.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Uploaded Files:</strong> Berkas dokumen (seperti PDF, DOCX, TXT) yang Anda lampirkan untuk keperluan analisis atau ekstraksi informasi.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Usage Analytics:</strong> Metrik operasional seperti frekuensi penggunaan, durasi respons, serta log interaksi fitur untuk menjaga kestabilan performa.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Device Information:</strong> Informasi teknis dasar mencakup tipe peramban web (browser), sistem operasi, dan alamat protokol internet (IP address) untuk keperluan otentikasi dan audit keamanan.
              </li>
            </ul>
          </section>

          {/* 3. Penggunaan Data */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <UserCheck size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                3. Penggunaan Data
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Data yang dikumpulkan digunakan semata-mata untuk tujuan operasional berikut:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-white/[0.08] dark:bg-[#181818]/50">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Providing Service</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Menyediakan fungsionalitas workspace, mengeksekusi inferensi AI, dan mengelola dokumen sesuai instruksi Anda.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-white/[0.08] dark:bg-[#181818]/50">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Improving Reliability</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Mendeteksi kendala latensi, menangani error sistem, serta meningkatkan keandalan antarmuka platform.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-white/[0.08] dark:bg-[#181818]/50">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Security Monitoring</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Memantau aktivitas yang mencurigakan, mencegah akses tanpa izin, dan menolak upaya penyalahgunaan sistem.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Data Percakapan */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <Lock size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                4. Data Percakapan & Isolasi Workspace
              </h2>
            </div>
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 dark:border-white/[0.08] dark:bg-[#181818] space-y-3">
              <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                Seluruh data obrolan berada di dalam ruang kerja (workspace) masing-masing pengguna:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-4 list-disc">
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Conversation Scope:</strong> Percakapan Anda terikat secara spesifik pada sesi dan workspace pribadi.
                </li>
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Workspace Isolation:</strong> Platform menerapkan pemisahan data multi-tenant secara ketat sehingga percakapan satu pengguna tidak dapat diakses oleh pengguna lain.
                </li>
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Access Control:</strong> Akses ke konten percakapan dikendalikan oleh mekanisme otentikasi sesi dan kebijakan hak akses (access control).
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Penyimpanan Data */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <Database size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                5. Penyimpanan Data & Retensi
              </h2>
            </div>
            <div className="space-y-3 text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              <p>
                Kami menerapkan prinsip penyimpanan data yang aman dan terukur:
              </p>
              <ul className="space-y-2 pl-4 list-disc text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Secure Storage:</strong> Seluruh basis data dan penyimpanan file dikelola pada infrastruktur cloud terkelola dengan kontrol akses berlapis.
                </li>
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Controlled Access:</strong> Akses internal terhadap sistem penyimpanan dibatasi hanya untuk pemeliharaan teknis penting oleh personel berwenang.
                </li>
                <li>
                  <strong className="text-zinc-800 dark:text-zinc-200">Retention Policy:</strong> Data aktif disimpan selama akun Anda berstatus aktif atau sampai Anda memilih untuk menghapus riwayat obrolan atau dokumen terkait.
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Hak Pengguna */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <HardDrive size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                6. Hak Pengguna
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Sebagai pemilik data, Anda memiliki hak-hak penting berikut:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="rounded-2xl border border-zinc-200/80 p-4 dark:border-white/[0.08]">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Mengakses Data</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Melihat seluruh riwayat percakapan, dokumen tersimpan, serta informasi profil Anda kapan pun melalui antarmuka workspace.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 p-4 dark:border-white/[0.08]">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Menghapus Akun</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Mengajukan permintaan penutupan akun dan penghapusan data percakapan serta berkas lampiran yang diasosiasikan dengan akun Anda.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 p-4 dark:border-white/[0.08]">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Meminta Informasi</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Menanyakan rincian mengenai bagaimana data Anda diproses atau mengajukan pertanyaan seputar privasi ke tim ChatLabs.id.
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
