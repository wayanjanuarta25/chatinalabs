import { getUserWorkspace } from '../lib/supabase/workspace'
import { createSupabaseConversation } from '../lib/supabase/queries'
import { ensureUserProfileAndWorkspace } from '../app/login/actions'

let passCount = 0
let failCount = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`)
    passCount++
  } else {
    console.error(`[FAIL] ${message}`)
    failCount++
  }
}

async function runAuthWorkspaceFlowTests() {
  console.log('=== Starting Supabase Auth & Workspace Flow Tests ===\n')

  const testUserId = 'user-uuid-1234'
  const testWorkspaceId = 'ws-uuid-5678'

  // ---------------------------------------------------------------------------
  // 1. getUserWorkspace - Scenario A: User has workspace_members row
  // ---------------------------------------------------------------------------
  const mockSupabaseWithMember = {
    auth: {
      getUser: async () => ({ data: { user: { id: testUserId } }, error: null }),
    },
    from: (table: string) => {
      if (table === 'workspace_members') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: { workspace_id: testWorkspaceId, role: 'owner' },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table query: ${table}`)
    },
  } as any

  const wsFromMember = await getUserWorkspace(mockSupabaseWithMember, testUserId)
  assert(wsFromMember === testWorkspaceId, 'getUserWorkspace returns workspace_id from workspace_members')

  // ---------------------------------------------------------------------------
  // 2. getUserWorkspace - Scenario B: Fallback to owned workspace
  // ---------------------------------------------------------------------------
  let upsertCalledOnHeal: any = false
  const mockSupabaseWithOwnershipFallback = {
    auth: {
      getUser: async () => ({ data: { user: { id: testUserId } }, error: null }),
    },
    from: (table: string) => {
      if (table === 'workspace_members') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          upsert: async () => {
            upsertCalledOnHeal = true
            return { error: null }
          },
        }
      }
      if (table === 'workspaces') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: { id: testWorkspaceId },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table query: ${table}`)
    },
  } as any

  const wsFromOwnership = await getUserWorkspace(mockSupabaseWithOwnershipFallback, testUserId)
  assert(wsFromOwnership === testWorkspaceId, 'getUserWorkspace falls back to workspaces.owner_id')
  assert(Boolean(upsertCalledOnHeal), 'getUserWorkspace auto-heals workspace_members on ownership fallback')

  // ---------------------------------------------------------------------------
  // 3. getUserWorkspace - Scenario C: Workspace missing -> returns null (NO blind insert)
  // ---------------------------------------------------------------------------
  let insertCalledOnMissing: boolean = false
  const mockSupabaseMissingWorkspace = {
    auth: {
      getUser: async () => ({ data: { user: { id: testUserId } }, error: null }),
    },
    from: (table: string) => {
      if (table === 'workspace_members') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'workspaces') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          insert: () => {
            insertCalledOnMissing = true
            return { select: () => ({ single: async () => ({ data: null, error: null }) }) }
          },
        }
      }
      throw new Error(`Unexpected table query: ${table}`)
    },
  } as any

  const wsMissing = await getUserWorkspace(mockSupabaseMissingWorkspace, testUserId)
  assert(wsMissing === null, 'getUserWorkspace returns null when no workspace exists')
  assert(insertCalledOnMissing === false, 'getUserWorkspace does NOT execute any blind insert into workspaces')

  // ---------------------------------------------------------------------------
  // 4. createSupabaseConversation - Unauthenticated user returns null
  // ---------------------------------------------------------------------------
  const mockSupabaseUnauth = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  } as any

  const unauthConvo = await createSupabaseConversation(mockSupabaseUnauth, 'Test Chat')
  assert(unauthConvo === null, 'createSupabaseConversation fails gracefully (returns null) if user is unauthenticated')

  // ---------------------------------------------------------------------------
  // 5. createSupabaseConversation - Missing workspace fails gracefully without throwing RLS error
  // ---------------------------------------------------------------------------
  const missingWsConvo = await createSupabaseConversation(mockSupabaseMissingWorkspace, 'Test Chat')
  assert(missingWsConvo === null, 'createSupabaseConversation fails gracefully (returns null) if workspace is missing')

  // ---------------------------------------------------------------------------
  // 6. createSupabaseConversation - Success scenario with existing workspace
  // ---------------------------------------------------------------------------
  let insertedPayload: any = null
  const mockSupabaseSuccess = {
    auth: {
      getUser: async () => ({ data: { user: { id: testUserId } }, error: null }),
    },
    from: (table: string) => {
      if (table === 'workspace_members') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: { workspace_id: testWorkspaceId, role: 'owner' },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'conversations') {
        return {
          insert: (payload: any) => {
            insertedPayload = payload
            return {
              select: () => ({
                single: async () => ({
                  data: { id: 'conv-123', ...payload },
                  error: null,
                }),
              }),
            }
          },
        }
      }
      throw new Error(`Unexpected table query: ${table}`)
    },
  } as any

  const successConvo = await createSupabaseConversation(mockSupabaseSuccess, 'Project Setup', 'chatINALabs AI')
  assert(successConvo !== null, 'createSupabaseConversation creates conversation successfully')
  assert(insertedPayload?.workspace_id === testWorkspaceId, 'conversation contains correct workspace_id')
  assert(insertedPayload?.user_id === testUserId, 'conversation contains correct user_id matching auth.uid()')

  // ---------------------------------------------------------------------------
  // 7. ensureUserProfileAndWorkspace fallback - Existing workspace skips insert
  // ---------------------------------------------------------------------------
  let wsInsertTriggered: boolean = false
  const mockSupabaseExistingForFallback = {
    auth: {
      getUser: async () => ({ data: { user: { id: testUserId } }, error: null }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          upsert: async () => ({ error: null }),
        }
      }
      if (table === 'workspace_members') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: { workspace_id: testWorkspaceId, role: 'owner' },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'workspaces') {
        return {
          insert: () => {
            wsInsertTriggered = true
            return { select: () => ({ single: async () => ({ data: null, error: null }) }) }
          },
        }
      }
      throw new Error(`Unexpected table query: ${table}`)
    },
  } as any

  const fallbackResult = await ensureUserProfileAndWorkspace(
    mockSupabaseExistingForFallback,
    testUserId,
    'test@chatinalabs.ai'
  )
  assert(fallbackResult === testWorkspaceId, 'ensureUserProfileAndWorkspace returns existing workspace')
  assert(wsInsertTriggered === false, 'ensureUserProfileAndWorkspace does NOT insert workspace if already present')

  console.log(`\n=== Test Results: ${passCount} passed, ${failCount} failed ===\n`)
  if (failCount > 0) {
    process.exit(1)
  }
  process.exit(0)
}

runAuthWorkspaceFlowTests().catch(err => {
  console.error('Test failed with unhandled error:', err)
  process.exit(1)
})
