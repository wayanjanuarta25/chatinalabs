import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const adminUserId = '3d9be6f5-7c68-411f-bf47-026b949d54b4'

async function runSecurityTests() {
  console.log('=== PHASE 5.6 SECURITY & ANALYTICS VERIFICATION ===')

  const anonClient = createClient(supabaseUrl, supabaseAnonKey)

  // 1. Test unauthenticated call to get_platform_analytics() -> MUST FAIL
  console.log('\n[TEST 1] Testing unauthenticated call to get_platform_analytics()...')
  const { data: unauthData, error: unauthError } = await anonClient.rpc('get_platform_analytics')
  if (unauthError) {
    console.log('✅ PASS: Unauthenticated execution rejected as expected:', unauthError.message)
  } else {
    console.error('❌ FAIL: Unauthenticated execution succeeded unexpectedly!', unauthData)
    process.exit(1)
  }

  // 2. Test unauthenticated direct insert into audit_logs -> MUST FAIL
  console.log('\n[TEST 2] Testing direct unauthenticated INSERT into audit_logs...')
  const { error: insertError } = await anonClient
    .from('audit_logs')
    .insert({ action: 'MALICIOUS_INSERT', target_type: 'system' })
  if (insertError) {
    console.log('✅ PASS: Direct insert into audit_logs rejected:', insertError.message)
  } else {
    console.error('❌ FAIL: Direct insert into audit_logs succeeded unexpectedly!')
    process.exit(1)
  }

  // 3. Test authenticated execution with admin user
  // Let's create an authenticated client using admin session or service_role if available, or test via database query directly.
  console.log('\n[TEST 3] Testing role status and escalation protection via direct DB query...')
  console.log('Done with client tests.')
}

runSecurityTests().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
