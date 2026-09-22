'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'
import { Menu, X, ArrowRight } from 'lucide-react'

interface NavbarProps {
  isAuthenticated?: boolean
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/70 bg-white/85 backdrop-blur-md dark:border-white/[0.07] dark:bg-[#121212]/85 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer" aria-label="ChatLabs.id Beranda">
          <div className="flex h-7 w-7 items-center justify-center">
            <Image
              src="/logo-ci.png"
              alt="ChatLabs.id"
              width={24}
              height={24}
              className="object-contain dark:invert transition-transform group-hover:scale-105"
              priority
            />
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
            ChatLabs.id
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          <Link 
            href="/#features" 
            className="text-[13.5px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
          >
            Fitur
          </Link>
          <Link 
            href="/limits" 
            className="text-[13.5px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
          >
            Layanan & Batasan
          </Link>
          <Link 
            href="/pricing" 
            className="text-[13.5px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link 
            href="/#faq" 
            className="text-[13.5px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
          >
            FAQ
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          
          {isAuthenticated ? (
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-black active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer"
            >
              <span>Buka Workspace</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Login
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-black active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer"
              >
                <span>Beli Sekarang</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-white/80 text-zinc-700 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200/80 bg-white/95 px-4 py-4 dark:border-white/[0.08] dark:bg-[#181818]/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-3">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              Fitur
            </Link>
            <Link
              href="/limits"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              Layanan & Batasan
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              FAQ
            </Link>
            
            <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
                >
                  <span>Buka Workspace</span>
                  <ArrowRight size={13} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 py-2 text-xs font-semibold text-zinc-800 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
                  >
                    <span>Beli Sekarang</span>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
