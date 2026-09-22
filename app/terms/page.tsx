import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { FileCheck, ShieldAlert, KeyRound, Wrench, Copyright, AlertTriangle, UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Terms of Service | ChatLabs.id',
  description: 'Syarat dan ketentuan resmi penggunaan platform workspace AI ChatLabs.id.',
}

export default async function TermsOfServicePage() {
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
              <FileCheck size={13} className="text-emerald-500" />
              Ketentuan Hukum Layanan
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Syarat dan ketentuan yang mengatur penggunaan seluruh fitur, perangkat lunak, dan layanan yang disediakan oleh ChatLabs.id.
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Terakhir diperbarui: 22 September 2026
            </p>
          </div>
        </section>

        {/* Content Body */}
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
          
          {/* 1. Acceptance */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <FileCheck size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                1. Acceptance (Penerimaan Ketentuan)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Dengan membuat akun, mengakses, atau menggunakan layanan ChatLabs.id, Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui untuk terikat secara hukum oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui salah satu bagian dari ketentuan ini, Anda tidak diperkenankan untuk menggunakan platform ChatLabs.id.
            </p>
          </section>

          {/* 2. Account Responsibility */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <KeyRound size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                2. Account Responsibility (Tanggung Jawab Akun)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Pengguna bertanggung jawab penuh terhadap integritas dan keamanan akun masing-masing:
            </p>
            <ul className="space-y-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 pl-4 list-disc">
              <li>
                <strong className="text-zinc-900 dark:text-white">Keamanan Akun:</strong> Anda bertanggung jawab untuk menjaga kerahasiaan kata sandi dan kredensial login Anda, serta seluruh aktivitas yang terjadi di bawah akun Anda.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Informasi yang Benar:</strong> Anda setuju untuk memberikan data profil dan informasi pendaftaran yang akurat, valid, dan terkini.
              </li>
            </ul>
          </section>

          {/* 3. Acceptable Usage */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <ShieldAlert size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                3. Acceptable Usage (Kebijakan Penggunaan yang Diperbolehkan)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Untuk memastikan lingkungan operasional yang aman bagi seluruh pengguna, Anda dilarang keras melakukan hal-hal berikut:
            </p>
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-5 sm:p-6 dark:border-rose-900/40 dark:bg-rose-950/20 space-y-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
              <div className="flex items-start gap-2.5">
                <span className="font-semibold text-rose-600 dark:text-rose-400">Aktivitas Ilegal:</span>
                <span>Menggunakan layanan untuk memfasilitasi, menghasilkan konten, atau mendukung tindakan yang melanggar hukum dan regulasi yang berlaku.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-semibold text-rose-600 dark:text-rose-400">Penyalahgunaan (Abuse):</span>
                <span>Menjalankan scraping otomatis berskala masif, reverse engineering, atau tindakan yang membebani infrastruktur secara tidak wajar.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-semibold text-rose-600 dark:text-rose-400">Unauthorized Access:</span>
                <span>Mencoba menerobos sistem otentikasi, mengakses data milik akun/workspace lain, atau memanipulasi celah keamanan.</span>
              </div>
            </div>
          </section>

          {/* 4. Service Availability */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <Wrench size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                4. Service Availability (Ketersediaan Layanan & Pemeliharaan)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Kami berupaya mempertahankan ketersediaan layanan yang tinggi. Namun, Anda memahami dan menyetujui bahwa layanan dapat mengalami gangguan sesaat karena pemeliharaan terjadwal (maintenance), peningkatan sistem (updates), atau kendala operasional penyedia infrastruktur pihak ketiga. ChatLabs.id berhak memodifikasi, memperbarui, atau menghentikan fitur tertentu secara berkala untuk peningkatan kualitas layanan.
            </p>
          </section>

          {/* 5. Intellectual Property */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <Copyright size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                5. Intellectual Property (Hak Kekayaan Intelektual)
              </h2>
            </div>
            <div className="space-y-3 text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              <p>
                <strong className="text-zinc-900 dark:text-white">Kepemilikan Platform:</strong> Seluruh kode sumber, desain grafis, antarmuka pengguna, merek dagang, dan aset perangkat lunak ChatLabs.id adalah milik eksklusif pengembang platform.
              </p>
              <p>
                <strong className="text-zinc-900 dark:text-white">User Generated Content:</strong> Anda tetap memegang hak kepemilikan atas prompt yang Anda masukkan, file yang Anda unggah, dan hasil keluaran (output) yang dihasilkan oleh akun Anda, sejauh diizinkan oleh hukum yang berlaku.
              </p>
            </div>
          </section>

          {/* 6. Limitation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <AlertTriangle size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                6. Limitation (Batasan Tanggung Jawab)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Layanan disediakan &quot;sebagaimana adanya&quot; (as is) dan &quot;sebagaimana tersedia&quot; (as available). Keluaran model kecerdasan buatan bersifat probabilistik. Pengguna disarankan untuk melakukan verifikasi independen terhadap fakta atau keputusan penting. ChatLabs.id tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan bisnis, atau kerusakan yang timbul dari ketergantungan semata-mata pada hasil keluaran AI.
            </p>
          </section>

          {/* 7. Termination */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <UserX size={16} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                7. Termination (Penghentian Akun)
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              ChatLabs.id berhak menangguhkan atau menghentikan akses akun Anda secara sepihak apabila ditemukan indikasi pelanggaran terhadap Syarat dan Ketentuan ini, aktivitas penipuan, pelanggaran keamanan, atau tindakan yang membahayakan integritas sistem pengguna lain. Pengguna juga dapat sewaktu-waktu mengakhiri penggunaan layanan dengan meminta penutupan akun.
            </p>
          </section>

        </article>
      </main>

      <Footer />
    </div>
  )
}
