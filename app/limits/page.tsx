import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { 
  Cpu, 
  FileText, 
  Image as ImageIcon, 
  Activity, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Layanan & Batasan Penggunaan — ChatLabs.id',
  description: 'Informasi transparan mengenai batas kuota token, ukuran dokumen, rate limits, dan alokasi model AI di ChatLabs.id.',
}

export default async function LimitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-[#121212] dark:text-zinc-100 transition-colors">
      <Navbar isAuthenticated={Boolean(user)} />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="py-14 sm:py-20 border-b border-zinc-200/70 dark:border-white/[0.07] bg-zinc-50/60 dark:bg-black/20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-300 shadow-xs mb-4">
              <Activity size={13} className="text-emerald-500" />
              Dokumentasi Resmi Layanan
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Layanan & Batasan Penggunaan
            </h1>
            <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Panduan lengkap mengenai kapasitas model AI, batasan kuota token, unggahan file lampiran, dan kebijakan Fair Usage Policy (FUP) di ChatLabs.id.
            </p>
          </div>
        </section>

        {/* Content Container */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          
          {/* Section 1: Model Allocation */}
          <section className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <Cpu size={18} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                1. Alokasi Model AI & Context Window
              </h2>
            </div>
            
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              ChatLabs.id mengintegrasikan seri model GPT tercanggih. Setiap model memiliki karakteristik penanganan konteks dan kecepatan yang dioptimalkan untuk berbagai kebutuhan.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181818] shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-zinc-200/80 bg-zinc-50/80 dark:border-white/[0.07] dark:bg-zinc-900/60 font-semibold text-zinc-800 dark:text-zinc-200">
                  <tr>
                    <th className="py-3 px-4 sm:px-5">Model</th>
                    <th className="py-3 px-4">Context Window</th>
                    <th className="py-3 px-4">Kecepatan</th>
                    <th className="py-3 px-4">Paket Tersedia</th>
                    <th className="py-3 px-4">Deskripsi Utama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.05] text-zinc-600 dark:text-zinc-300">
                  <tr>
                    <td className="py-3.5 px-4 sm:px-5 font-semibold text-zinc-900 dark:text-white">GPT-5.5</td>
                    <td className="py-3.5 px-4">128.000 tokens</td>
                    <td className="py-3.5 px-4"><span className="text-emerald-600 dark:text-emerald-400 font-medium">Ultra Cepat (~70 tps)</span></td>
                    <td className="py-3.5 px-4"><span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 text-[11px] font-semibold">Termasuk (Pro)</span></td>
                    <td className="py-3.5 px-4">Model serbaguna untuk percakapan harian, ringkasan, dan asistensi cepat.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-5 font-semibold text-zinc-900 dark:text-white">GPT-5.6-sol</td>
                    <td className="py-3.5 px-4">128.000 tokens</td>
                    <td className="py-3.5 px-4"><span className="text-blue-600 dark:text-blue-400 font-medium">Sangat Cepat (~55 tps)</span></td>
                    <td className="py-3.5 px-4"><span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 text-[11px] font-semibold">Termasuk (Pro)</span></td>
                    <td className="py-3.5 px-4">Didesain khusus untuk pemecahan masalah teknis dan ekstraksi data dokumen.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-5 font-semibold text-zinc-900 dark:text-white">GPT-5.6-terra</td>
                    <td className="py-3.5 px-4">200.000 tokens</td>
                    <td className="py-3.5 px-4"><span className="text-purple-600 dark:text-purple-400 font-medium">Mendalam (~40 tps)</span></td>
                    <td className="py-3.5 px-4"><span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 text-[11px] font-semibold">Termasuk (Pro)</span></td>
                    <td className="py-3.5 px-4">Penalaran kompleks, analisis dokumen tebal berpuluh halaman, dan riset mendalam.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-5 font-semibold text-zinc-900 dark:text-white">GPT-5.6-luna</td>
                    <td className="py-3.5 px-4">128.000 tokens</td>
                    <td className="py-3.5 px-4"><span className="text-teal-600 dark:text-teal-400 font-medium">Cepat (~50 tps)</span></td>
                    <td className="py-3.5 px-4"><span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 text-[11px] font-semibold">Termasuk (Pro)</span></td>
                    <td className="py-3.5 px-4">Gaya bahasa kreatif, copywriting pemasaran, dan penyusunan naskah konten.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-5 font-semibold text-zinc-900 dark:text-white">GPT-5.4-mini</td>
                    <td className="py-3.5 px-4">128.000 tokens</td>
                    <td className="py-3.5 px-4"><span className="text-emerald-600 dark:text-emerald-400 font-medium">Instant (~90 tps)</span></td>
                    <td className="py-3.5 px-4"><span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 text-[11px] font-semibold">Termasuk (Pro)</span></td>
                    <td className="py-3.5 px-4">Latensi terendah untuk tugas klasifikasi sederhana dan auto-title percakapan.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-5 font-semibold text-zinc-900 dark:text-white">GPT-6-astra</td>
                    <td className="py-3.5 px-4">256.000 tokens</td>
                    <td className="py-3.5 px-4"><span className="text-purple-600 dark:text-purple-400 font-medium">Flagship (~35 tps)</span></td>
                    <td className="py-3.5 px-4"><span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 text-[11px] font-semibold">Termasuk (Pro)</span></td>
                    <td className="py-3.5 px-4">Model reasoning tercanggih untuk coding tingkat tinggi dan pemecahan persoalan kompleks.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2: Document Attachments */}
          <section className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <FileText size={18} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                2. Batasan Upload Dokumen & File Lampiran
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181818]">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Format Didukung</div>
                <div className="mt-2 text-lg font-bold text-zinc-900 dark:text-white">PDF, DOCX, TXT</div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Mendukung dokumen teks, laporan bisnis, resume, artikel ilmiah, dan file kode mentah.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181818]">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Maksimal Ukuran File</div>
                <div className="mt-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">Hingga 25 MB</div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Seluruh pengguna paket langganan mendapatkan kapasitas upload file dokumen hingga 25 MB per berkas.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181818]">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Maksimal Lampiran</div>
                <div className="mt-2 text-lg font-bold text-blue-600 dark:text-blue-400">5 File / Pesan</div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Anda dapat menyertakan hingga 5 file secara bersamaan dalam satu prompt percakapan.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Image Generation */}
          <section className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <ImageIcon size={18} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                3. Ketentuan Pembuatan Gambar AI
              </h2>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 dark:border-white/[0.08] dark:bg-[#181818] space-y-4">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Pembuatan gambar didukung penuh pada paket langganan ChatLabs.id Pro menggunakan instruksi prompt natural. Gambar langsung diproses dan disimpan pada storage pribadi pengguna.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <strong>Rasio Aspek Fleksibel:</strong> Tersedia dalam format Square (1:1), Portrait (9:16 cocok untuk TikTok/Reels), dan Widescreen (16:9).
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <strong>Resolusi Tinggi:</strong> Dihasilkan hingga resolusi 1792px jernih untuk kebutuhan desain dan presentasi.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Rate Limits & Fair Usage Policy */}
          <section className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <Clock size={18} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                4. Rate Limits & Kebijakan Penggunaan Wajar (FUP)
              </h2>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 dark:border-white/[0.08] dark:bg-[#181818] space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30 text-xs sm:text-sm text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/50">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Fair Usage Policy bertujuan untuk mencegah penyalahgunaan otomatis (bot/scraping massal) dan memastikan seluruh pengguna mendapatkan respons AI dengan latensi prima.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                <div className="rounded-xl border border-zinc-200/80 p-4 dark:border-white/[0.06]">
                  <div className="text-xs text-zinc-500 font-semibold">Kecepatan Respons</div>
                  <div className="mt-1 text-base font-bold text-zinc-900 dark:text-white">60 Permintaan / menit</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Burst rate optimal tanpa antrean</div>
                </div>
                <div className="rounded-xl border border-zinc-200/80 p-4 dark:border-white/[0.06]">
                  <div className="text-xs text-zinc-500 font-semibold">Batas Percakapan Harian</div>
                  <div className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">Tak Terbatas (FUP)</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Akses obrolan penuh setiap saat</div>
                </div>
                <div className="rounded-xl border border-zinc-200/80 p-4 dark:border-white/[0.06]">
                  <div className="text-xs text-zinc-500 font-semibold">Dokumen per Prompt</div>
                  <div className="mt-1 text-base font-bold text-blue-600 dark:text-blue-400">Hingga 5 File</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Maksimal 25 MB per file</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Security & Privacy */}
          <section className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                <ShieldCheck size={18} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                5. Privasi & Proteksi Data Pengguna
              </h2>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-7 dark:border-white/[0.08] dark:bg-[#181818]/60 space-y-3">
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Kerahasiaan dan integritas data pengguna adalah prinsip fundamental ChatLabs.id:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span><strong>Zero Training Guarantee:</strong> Data masukan Anda tidak pernah digunakan untuk melatih kembali model publik.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span><strong>Database Row-Level Security:</strong> Setiap query dibatasi strictly per identitas user authenticated.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span><strong>Enkripsi End-to-End:</strong> Seluruh komunikasi menggunakan HTTPS TLS 1.3 dan enkripsi at-rest di storage cloud.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA Box */}
          <div className="rounded-3xl bg-zinc-900 p-8 sm:p-12 text-center text-white dark:bg-white dark:text-zinc-900 shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Siap meningkatkan kecepatan kerja Anda?
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-zinc-300 dark:text-zinc-600 max-w-xl mx-auto">
              Daftar sekarang dan nikmati kecerdasan ChatLabs.id untuk menganalisa dokumen dan mengelola pengetahuan tim.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:hover:bg-black cursor-pointer"
              >
                <span>Mulai Sekarang Gratis</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-zinc-700 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 dark:border-zinc-300 dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer"
              >
                Lihat Paket Harga
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
