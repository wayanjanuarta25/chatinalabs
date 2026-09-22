async function verifyLandingPage() {
  console.log('=== Verifying Phase 5.7 Landing Page & Public Website Architecture ===\n')

  // 1. Check Root Landing Page
  const homeRes = await fetch('http://localhost:3000/')
  console.log(`[STATUS] / -> ${homeRes.status} ${homeRes.statusText}`)
  if (homeRes.status !== 200) throw new Error('Home page failed to return 200 OK')
  const homeHtml = await homeRes.text()

  const requiredSections = [
    { name: 'Navbar & Brand', check: 'ChatLabs.id' },
    { name: 'Hero Headline', check: 'AI assistant untuk bekerja lebih cepat.' },
    { name: 'Hero Subtitle', check: 'Semua dalam satu workspace.' },
    { name: 'Product Preview', check: 'Inalabs AI - GPT-5.5' },
    { name: 'Feature: Upload Document', check: 'Upload Document' },
    { name: 'Feature: AI Chat', check: 'AI Chat' },
    { name: 'Feature: Generate Image', check: 'Generate Image' },
    { name: 'Feature: Knowledge Base', check: 'Knowledge Base' },
    { name: 'Why: Lebih Produktif', check: 'Lebih Produktif' },
    { name: 'Why: Private & Aman', check: 'Data pengguna terisolasi.' },
    { name: 'How It Works: Buat Akun', check: 'Buat Akun' },
    { name: 'Testimonials Card', check: 'Head of Operations' },
    { name: 'Pricing Foundation: Free/Pro/Enterprise', check: 'Paling Populer' },
    { name: 'FAQ Question 1', check: 'Apakah ChatLabs.id resmi OpenAI?' },
    { name: 'FAQ Question 3', check: 'Apakah percakapan saya private?' },
    { name: 'Footer', check: '2026 ChatLabs.id. All rights reserved.' },
  ]

  for (const s of requiredSections) {
    if (!homeHtml.includes(s.check)) {
      console.error(`[FAIL] Missing on landing page: ${s.name} ("${s.check}")`)
      process.exit(1)
    } else {
      console.log(`[PASS] Landing Section: ${s.name}`)
    }
  }

  // 2. Check Layanan & Batasan (/limits)
  console.log('\n--- Checking /limits ---')
  const limitsRes = await fetch('http://localhost:3000/limits')
  console.log(`[STATUS] /limits -> ${limitsRes.status}`)
  if (limitsRes.status !== 200) throw new Error('Limits page failed to return 200 OK')
  const limitsHtml = await limitsRes.text()
  const limitsChecks = [
    'Batasan Penggunaan',
    'Context Window',
    'GPT-5.5',
    'GPT-5.6-terra',
    'GPT-6-astra',
    'Maksimal Ukuran File',
    'Kebijakan Penggunaan Wajar',
  ]
  for (const c of limitsChecks) {
    if (!limitsHtml.includes(c)) {
      console.error(`[FAIL] Missing on /limits: "${c}"`)
      process.exit(1)
    } else {
      console.log(`[PASS] Limits Content: ${c}`)
    }
  }

  // 3. Check Pricing Foundation (/pricing)
  console.log('\n--- Checking /pricing ---')
  const pricingRes = await fetch('http://localhost:3000/pricing')
  console.log(`[STATUS] /pricing -> ${pricingRes.status}`)
  if (pricingRes.status !== 200) throw new Error('Pricing page failed to return 200 OK')
  const pricingHtml = await pricingRes.text()
  const pricingChecks = [
    'Pilihan paket transparan',
    'Tabel Perbandingan',
    'Model AI GPT-5.5 Standar',
    'GPT-5.6-terra',
    'GPT-6-astra',
    'SLA Ketersediaan Layanan',
  ]
  for (const c of pricingChecks) {
    if (!pricingHtml.includes(c)) {
      console.error(`[FAIL] Missing on /pricing: "${c}"`)
      process.exit(1)
    } else {
      console.log(`[PASS] Pricing Content: ${c}`)
    }
  }

  console.log('\n========================================================')
  console.log('Phase 5.7 Verification Complete: ALL CHECKS PASSED!')
  console.log('========================================================')
}

verifyLandingPage().catch(err => {
  console.error('[ERROR]', err)
  process.exit(1)
})
