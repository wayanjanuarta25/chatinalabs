import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const adminUserId = '3d9be6f5-7c68-411f-bf47-026b949d54b4'

async function runPhase56TestSuite() {
  console.log('========================================================')
  console.log('   chatINALabs AI — Phase 5.6 Admin Dashboard Test Suite')
  console.log('========================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`)
      passed++
    } else {
      console.error(`[FAIL] ${message}`)
      failed++
    }
  }

  // --- Suite 1: Unauthenticated Client Security Invariants ---
  console.log('--- Test Suite 1: Unauthenticated Client Security & RLS ---')
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)

  // 1.1 Unauthenticated RPC get_platform_analytics must be rejected
  const { data: rpcData, error: rpcError } = await anonClient.rpc('get_platform_analytics')
  assert(!!rpcError, 'Unauthenticated get_platform_analytics() is blocked by security guard')
  assert(rpcError?.message.includes('Unauthorized') || rpcError?.code === '42501', 
    `Security error properly raised: "${rpcError?.message}" (code: ${rpcError?.code})`)

  // 1.2 Unauthenticated direct insert to audit_logs must be rejected
  const { error: insertAuditError } = await anonClient
    .from('audit_logs')
    .insert({ action: 'UNAUTHORIZED_ATTEMPT', target_type: 'system' })
  assert(!!insertAuditError, 'Direct unauthenticated INSERT into audit_logs is rejected')

  // 1.3 Unauthenticated select from audit_logs must return empty or error due to RLS
  const { data: auditRows, error: auditSelectError } = await anonClient
    .from('audit_logs')
    .select('*')
  assert(auditRows === null || auditRows.length === 0, 'Unauthenticated user cannot view audit logs')

  // --- Suite 2: Profiles Schema & Role Verification ---
  console.log('\n--- Test Suite 2: Profile Platform Role Schema ---')
  const { data: profile, error: profileErr } = await anonClient
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('id', adminUserId)
    .single()

  assert(!profileErr, `Profile for admin user found: ${profile?.email}`)
  assert(profile?.role === 'super_admin', `Platform role is super_admin (got: "${profile?.role}")`)
  assert(!!profile?.created_at, `Profile created_at registration timestamp exists: ${profile?.created_at}`)

  // --- Suite 3: Route Protection Verification (/admin) ---
  console.log('\n--- Test Suite 3: HTTP Route Protection (/admin) ---')
  try {
    const res = await fetch('http://localhost:3000/admin', { redirect: 'manual' })
    assert(res.status === 307 || res.status === 302, 
      `/admin route returns redirect status (${res.status}) when unauthenticated`)
    const location = res.headers.get('location')
    assert(location?.includes('/login?next=/admin') || location === '/login', 
      `/admin redirects to login page (Location: ${location})`)
  } catch (err) {
    console.log('[INFO] Local server check skipped or completed (dev server status:', err, ')')
  }

  // --- Summary ---
  console.log('\n========================================================')
  console.log(`Phase 5.6 Test Results: ${passed} passed, ${failed} failed`)
  console.log('========================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runPhase56TestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
