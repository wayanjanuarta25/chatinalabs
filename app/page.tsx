import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeatureGrid } from '@/components/landing/FeatureGrid'
import { WhyChatINALabs } from '@/components/landing/WhyChatINALabs'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import { PricingSection } from '@/components/landing/PricingSection'
import { FAQ } from '@/components/landing/FAQ'
import { Footer } from '@/components/landing/Footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'ChatLabs.id — AI Workspace untuk Chat, Dokumen, dan Produktivitas',
  description: 'AI assistant untuk bekerja lebih cepat: Chat dengan AI, analisa dokumen PDF/Word, buat gambar, dan kelola knowledge base dalam satu workspace modern.',
  keywords: [
    'ChatLabs.id',
    'AI Workspace',
    'Chat AI Indonesia',
    'Analisa Dokumen AI',
    'GPT-5.5',
    'GPT-5.6',
    'Knowledge Base AI',
    'SaaS AI Indonesia',
  ],
  openGraph: {
    title: 'ChatLabs.id — AI Workspace untuk Chat, Dokumen, dan Produktivitas',
    description: 'Chat dengan AI. Analisa dokumen. Buat gambar. Kelola knowledge base. Semua dalam satu workspace terisolasi dan aman.',
    url: 'https://chatinalabs.ai',
    siteName: 'ChatLabs.id',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChatLabs.id — AI Workspace untuk Chat, Dokumen, dan Produktivitas',
    description: 'AI assistant modern untuk profesional dan tim: chat, dokumen, gambar, dan knowledge base terpadu.',
  },
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // SEO Foundation: JSON-LD Schemas
  const jsonLdOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ChatLabs.id',
    url: 'https://chatinalabs.ai',
    logo: 'https://chatinalabs.ai/logo-ci.png',
    description: 'Platform AI workspace terpadu untuk profesional dan organisasi: percakapan cerdas, pemrosesan dokumen, dan knowledge base terisolasi.',
  }

  const jsonLdSoftwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ChatLabs.id',
    operatingSystem: 'All Modern Web Browsers',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
      description: 'Akses gratis dan paket Pro mulai Rp 50.000 / bulan',
    },
    description: 'AI assistant untuk bekerja lebih cepat: Chat dengan AI, analisa dokumen PDF/Word, buat gambar, dan kelola knowledge base.',
  }

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Apakah ChatLabs.id resmi OpenAI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ChatLabs.id adalah platform workspace AI independen yang memanfaatkan API resmi dari OpenAI dan model bahasa canggih berstandar industri. Kami mengintegrasikan model GPT-5.5 dan GPT-5.6 ke dalam antarmuka kerja produktivitas, manajemen dokumen, dan knowledge base terisolasi.',
        },
      },
      {
        '@type': 'Question',
        name: 'Bagaimana cara mendapatkan akses?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Anda dapat langsung berlangganan melalui tombol "Beli Sekarang" atau halaman registrasi. Kami menyediakan paket langganan tunggal ChatLabs.id Pro seharga Rp 50.000 / bulan atau Rp 300.000 / tahun dengan akses penuh ke seluruh model AI, analisis dokumen, dan generator gambar.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apakah percakapan saya private?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ya, 100% private. Kami menerapkan arsitektur Multi-Tenant dengan Row-Level Security (RLS) di database Supabase. Data riwayat obrolan, dokumen lampiran, dan embedding Knowledge Base Anda terisolasi ketat per akun dan tidak pernah digunakan untuk melatih model AI publik mana pun.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apakah bisa upload dokumen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tentu saja. ChatLabs.id mendukung unggahan file PDF, DOCX (Microsoft Word), dan TXT. Sistem kami mengekstrak teks secara instan, menyusun ringkasan, dan memungkinkan Anda menanyakan pertanyaan mendalam terkait isi dokumen.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apakah bisa generate gambar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bisa. ChatLabs.id memiliki integrasi generator visual AI. Cukup ketikkan instruksi pembuatan gambar di dalam obrolan, dan asisten AI akan menghasilkan karya visual beresolusi tinggi langsung pada bubble percakapan Anda.',
        },
      },
      {
        '@type': 'Question',
        name: 'Model AI apa saja yang saat ini didukung?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Kami mendukung keluarga model OpenAI GPT generasi terbaru termasuk GPT-5.5, GPT-5.6-sol, GPT-5.6-terra, GPT-5.6-luna, GPT-5.4-mini, dan GPT-6-astra.',
        },
      },
      {
        '@type': 'Question',
        name: 'Di mana saya bisa melihat batasan kuota dan rate limit?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Rincian batasan token, kuota file lampiran, dan frekuensi permintaan dapat dilihat secara transparan di halaman Layanan & Batasan kami.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-[#121212] dark:text-zinc-100 transition-colors selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      {/* Schema.org JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      {/* 1. Navbar */}
      <Navbar isAuthenticated={Boolean(user)} />

      <main className="flex-1">
        {/* 2. Hero Section (includes ProductPreview & ParticleBackground) */}
        <HeroSection isAuthenticated={Boolean(user)} />

        {/* 3. Feature Showcase */}
        <FeatureGrid />

        {/* 4. Why chatINALabs */}
        <WhyChatINALabs />

        {/* 5. How It Works */}
        <HowItWorks />

        {/* 6. Testimonials */}
        <Testimonials />

        {/* 7. Pricing Foundation */}
        <PricingSection />

        {/* 8. FAQ */}
        <FAQ />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  )
}
