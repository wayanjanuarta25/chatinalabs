async function verifyPhase5_7_1() {
  console.log('=== Verifying Phase 5.7.1 Landing Page Enhancement & Legal Pages ===\n')

  const baseUrl = 'http://localhost:3000'

  // 1. Check Root Landing Page (/)
  console.log('--- 1. Checking Root Landing Page (/) ---')
  const homeRes = await fetch(`${baseUrl}/`)
  console.log(`[STATUS] / -> ${homeRes.status}`)
  if (homeRes.status !== 200) throw new Error('Home page returned non-200 status')
  const homeHtml = await homeRes.text()

  const landingChecks = [
    { name: 'Branding: ChatLabs.id', test: homeHtml.includes('ChatLabs.id') },
    { name: 'Particle Background Canvas Rendered', test: homeHtml.includes('<canvas') },
    { name: 'Primary CTA: Beli Sekarang', test: homeHtml.includes('Beli Sekarang') },
    { name: 'Hero Badge Removed', test: !homeHtml.includes('Generasi Baru Workspace AI') },
    { name: 'Secondary CTA: Login', test: homeHtml.includes('Login') },
    { name: 'Navbar Clean Branding (No AI Badge)', test: !homeHtml.includes('>AI</span>') },
    { name: 'Footer Clean Branding (No SLA Enterprise)', test: !homeHtml.includes('SLA Enterprise') },
    { name: 'Footer Nav: Produk', test: homeHtml.includes('Produk') },
    { name: 'Footer Nav: Perusahaan', test: homeHtml.includes('Perusahaan') },
    { name: 'Footer Nav: Legal', test: homeHtml.includes('Legal') },
    { name: 'SEO: JSON-LD Organization', test: homeHtml.includes('"@type":"Organization"') },
    { name: 'SEO: JSON-LD SoftwareApplication', test: homeHtml.includes('"@type":"SoftwareApplication"') },
    { name: 'SEO: JSON-LD FAQPage', test: homeHtml.includes('"@type":"FAQPage"') },
  ]

  for (const c of landingChecks) {
    if (!c.test) {
      throw new Error(`Landing check failed: ${c.name}`)
    }
    console.log(`[PASS] ${c.name}`)
  }

  // 2. Check Privacy Policy (/privacy)
  console.log('\n--- 2. Checking Privacy Policy (/privacy) ---')
  const privacyRes = await fetch(`${baseUrl}/privacy`)
  console.log(`[STATUS] /privacy -> ${privacyRes.status}`)
  if (privacyRes.status !== 200) throw new Error('/privacy returned non-200 status')
  const privacyHtml = await privacyRes.text()

  const privacyChecks = [
    { name: 'SEO Title: Privacy Policy | ChatLabs.id', test: privacyHtml.includes('Privacy Policy | ChatLabs.id') },
    { name: 'SEO Description: Kebijakan privasi', test: privacyHtml.includes('Kebijakan privasi ChatLabs.id') },
    { name: 'Section 1: Pendahuluan', test: privacyHtml.includes('1. Pendahuluan') },
    { name: 'Section 2: Data yang Dikumpulkan', test: privacyHtml.includes('2. Data yang Dikumpulkan') },
    { name: 'Data: Account Information', test: privacyHtml.includes('Account Information') },
    { name: 'Data: Chat History', test: privacyHtml.includes('Chat History') },
    { name: 'Data: Uploaded Files', test: privacyHtml.includes('Uploaded Files') },
    { name: 'Data: Usage Analytics', test: privacyHtml.includes('Usage Analytics') },
    { name: 'Data: Device Information', test: privacyHtml.includes('Device Information') },
    { name: 'Section 3: Penggunaan Data', test: privacyHtml.includes('3. Penggunaan Data') },
    { name: 'Use: Providing Service', test: privacyHtml.includes('Providing Service') },
    { name: 'Use: Improving Reliability', test: privacyHtml.includes('Improving Reliability') },
    { name: 'Use: Security Monitoring', test: privacyHtml.includes('Security Monitoring') },
    { name: 'Section 4: Data Percakapan & Workspace Isolation', test: privacyHtml.includes('Data Percakapan') && privacyHtml.includes('Workspace Isolation') },
    { name: 'Section 5: Penyimpanan Data & Retensi', test: privacyHtml.includes('5. Penyimpanan Data') && privacyHtml.includes('Retention Policy') },
    { name: 'Section 6: Hak Pengguna', test: privacyHtml.includes('6. Hak Pengguna') },
  ]

  for (const c of privacyChecks) {
    if (!c.test) {
      throw new Error(`Privacy check failed: ${c.name}`)
    }
    console.log(`[PASS] ${c.name}`)
  }

  // 3. Check Terms of Service (/terms)
  console.log('\n--- 3. Checking Terms of Service (/terms) ---')
  const termsRes = await fetch(`${baseUrl}/terms`)
  console.log(`[STATUS] /terms -> ${termsRes.status}`)
  if (termsRes.status !== 200) throw new Error('/terms returned non-200 status')
  const termsHtml = await termsRes.text()

  const termsChecks = [
    { name: 'SEO Title: Terms of Service | ChatLabs.id', test: termsHtml.includes('Terms of Service | ChatLabs.id') },
    { name: 'Section 1: Acceptance', test: termsHtml.includes('1. Acceptance') },
    { name: 'Section 2: Account Responsibility', test: termsHtml.includes('2. Account Responsibility') },
    { name: 'Section 3: Acceptable Usage', test: termsHtml.includes('3. Acceptable Usage') },
    { name: 'Usage: Aktivitas Ilegal & Abuse', test: termsHtml.includes('Aktivitas Ilegal') && termsHtml.includes('Abuse') },
    { name: 'Section 4: Service Availability', test: termsHtml.includes('4. Service Availability') },
    { name: 'Section 5: Intellectual Property', test: termsHtml.includes('5. Intellectual Property') },
    { name: 'Section 6: Limitation', test: termsHtml.includes('6. Limitation') },
    { name: 'Section 7: Termination', test: termsHtml.includes('7. Termination') },
  ]

  for (const c of termsChecks) {
    if (!c.test) {
      throw new Error(`Terms check failed: ${c.name}`)
    }
    console.log(`[PASS] ${c.name}`)
  }

  // 4. Check Data Security (/security)
  console.log('\n--- 4. Checking Data Security (/security) ---')
  const secRes = await fetch(`${baseUrl}/security`)
  console.log(`[STATUS] /security -> ${secRes.status}`)
  if (secRes.status !== 200) throw new Error('/security returned non-200 status')
  const secHtml = await secRes.text()

  const secChecks = [
    { name: 'SEO Title: Data Security | ChatLabs.id', test: secHtml.includes('Data Security | ChatLabs.id') },
    { name: 'Section 1: Workspace Isolation', test: secHtml.includes('1. Workspace Isolation') },
    { name: 'Isolation: Multi-Tenant & Data Separation', test: secHtml.includes('Multi-Tenant') && secHtml.includes('Data Separation') },
    { name: 'Section 2: Authentication Security', test: secHtml.includes('2. Authentication Security') },
    { name: 'Section 3: Database Security (Row Level Security)', test: secHtml.includes('3. Database Security') && secHtml.includes('Row Level Security') },
    { name: 'Section 4: File Security', test: secHtml.includes('4. File Security') },
    { name: 'Section 5: Infrastructure Security', test: secHtml.includes('5. Infrastructure Security') },
  ]

  for (const c of secChecks) {
    if (!c.test) {
      throw new Error(`Security check failed: ${c.name}`)
    }
    console.log(`[PASS] ${c.name}`)
  }

  // 5. Check Sitemap & Robots
  console.log('\n--- 5. Checking Sitemap (/sitemap.xml) and Robots (/robots.txt) ---')
  const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`)
  console.log(`[STATUS] /sitemap.xml -> ${sitemapRes.status}`)
  if (sitemapRes.status !== 200) throw new Error('/sitemap.xml returned non-200')
  const sitemapContent = await sitemapRes.text()
  if (!sitemapContent.includes('/privacy') || !sitemapContent.includes('/terms') || !sitemapContent.includes('/security')) {
    throw new Error('Sitemap is missing legal page routes')
  }
  console.log('[PASS] Sitemap includes /privacy, /terms, and /security')

  const robotsRes = await fetch(`${baseUrl}/robots.txt`)
  console.log(`[STATUS] /robots.txt -> ${robotsRes.status}`)
  if (robotsRes.status !== 200) throw new Error('/robots.txt returned non-200')
  const robotsContent = (await robotsRes.text()).toLowerCase()
  if (!robotsContent.includes('user-agent') || !robotsContent.includes('sitemap.xml')) {
    throw new Error('Robots.txt missing expected directives')
  }
  console.log('[PASS] Robots.txt contains valid directives and sitemap reference')

  // 6. Regression: Check other public routes
  console.log('\n--- 6. Regression: Other Public Routes ---')
  const routes = ['/limits', '/pricing', '/login', '/register']
  for (const r of routes) {
    const res = await fetch(`${baseUrl}${r}`)
    console.log(`[STATUS] ${r} -> ${res.status}`)
    if (res.status !== 200) throw new Error(`Regression route ${r} failed`)
    console.log(`[PASS] Route ${r} OK`)
  }

  console.log('\n=============================================================')
  console.log('Phase 5.7.1 Verification: ALL CHECKS PASSED SUCCESSFULLY!')
  console.log('=============================================================')
}

verifyPhase5_7_1().catch(err => {
  console.error('[FAIL]', err)
  process.exit(1)
})
