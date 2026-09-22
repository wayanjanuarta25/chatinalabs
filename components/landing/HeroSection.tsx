'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap, FileSearch } from 'lucide-react'
import { ProductPreview } from './ProductPreview'
import { ParticleBackground } from './ParticleBackground'

export function HeroSection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <section className="relative overflow-hidden pt-14 pb-20 sm:pt-22 sm:pb-32">
      {/* 1. Particle Background Layer */}
      <ParticleBackground />

      {/* Subtle Background Radial Gradients */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[560px] w-[840px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-zinc-200/50 via-zinc-300/30 to-transparent blur-3xl dark:from-zinc-800/40 dark:via-zinc-700/20 dark:to-transparent" 
      />

      {/* 2. Hero Content Layer */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Header Text */}
        <div className="mx-auto max-w-3xl text-center">
          
          {/* Main Title with Gradient Accent */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl sm:leading-[1.14] bg-gradient-to-b from-zinc-950 via-zinc-800 to-zinc-600 bg-clip-text text-transparent dark:from-white dark:via-zinc-100 dark:to-zinc-400">
            AI assistant untuk bekerja lebih cepat.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto font-normal">
            Chat dengan AI. Analisa dokumen. Buat gambar. Kelola knowledge base.{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Semua dalam satu workspace.</span>
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            {isAuthenticated ? (
              <Link
                href="/chat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-black active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:outline-white cursor-pointer"
              >
                <span>Buka Workspace Anda</span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-black active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:outline-white cursor-pointer"
                >
                  <span>Beli Sekarang</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-zinc-200/90 bg-white/90 px-7 py-3.5 text-sm font-semibold text-zinc-800 shadow-xs transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:border-white/[0.12] dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-700/80 cursor-pointer"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Highlights Row */}
          <div className="mt-11 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" />
              <span>Model GPT Generasi Terbaru</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileSearch size={14} className="text-blue-500" />
              <span>Analisis PDF, DOCX, TXT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Private & Multi-Tenant Isolated</span>
            </div>
          </div>
        </div>

        {/* Product Preview Mockup */}
        <div className="mt-16 sm:mt-20">
          <ProductPreview />
        </div>

      </div>
    </section>
  )
}
