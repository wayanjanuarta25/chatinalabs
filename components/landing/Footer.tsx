'use client'

import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 bg-zinc-50/80 dark:border-white/[0.08] dark:bg-[#111111] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer" aria-label="ChatLabs.id Beranda">
              <div className="flex h-7 w-7 items-center justify-center">
                <Image
                  src="/logo-ci.png"
                  alt="ChatLabs.id"
                  width={24}
                  height={24}
                  className="object-contain dark:invert transition-transform group-hover:scale-105"
                />
              </div>
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                ChatLabs.id
              </span>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-sm">
              Platform AI workspace terpadu untuk profesional dan organisasi: percakapan cerdas, pemrosesan dokumen, pembuatan visual, dan knowledge base terisolasi.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Seluruh sistem beroperasi normal (Operational)</span>
            </div>
          </div>

          {/* Col 1: Produk */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              Produk
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Fitur
                </Link>
              </li>
              <li>
                <Link href="/limits" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Layanan & Batasan
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Perusahaan */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              Perusahaan
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/#faq" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              Legal
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200/70 dark:border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p>© 2026 ChatLabs.id. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Beranda
            </Link>
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/security" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Security
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
