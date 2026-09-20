import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase/database.types'
import { saveSupabaseMessage, fetchConversationMessages } from '../lib/supabase/queries'

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

async function runMessagePersistenceTests() {
  console.log('=== Starting Message Persistence Tests ===\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnkbknbrnatodvkfekyt.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  // 1. Unit Test: Ensure saveSupabaseMessage does NOT pass `model` top-level
  console.log('--- Test Suite 1: Insert Payload Structure ---')
  let capturedInsertPayload: any = null
  let updatedConvId: string | null = null

  const mockSupabase: any = {
    from: (table: string) => {
      if (table === 'messages') {
        return {
          insert: (payload: any) => {
            capturedInsertPayload = payload
            return {
              select: () => ({
                single: async () => ({
                  data: {
                    id: 'msg-mock-1',
                    ...payload,
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }
          },
        }
      }
      if (table === 'conversations') {
        return {
          update: (updates: any) => ({
            eq: async (col: string, val: string) => {
              updatedConvId = val
              return { error: null }
            },
          }),
        }
      }
      return {}
    },
  }

  const result = await saveSupabaseMessage(
    mockSupabase,
    'conv-123',
    'user',
    'halo test',
    'chatinalabs-ai',
    { customKey: 'val1' }
  )

  assert(result !== null, 'saveSupabaseMessage returns saved message')
  assert(capturedInsertPayload !== null, 'Insert payload was constructed')
  assert(!('model' in capturedInsertPayload), 'Top-level "model" column is NOT included in insert payload')
  assert(capturedInsertPayload.conversation_id === 'conv-123', 'conversation_id is correctly set')
  assert(capturedInsertPayload.role === 'user', 'role is correctly set')
  assert(capturedInsertPayload.content === 'halo test', 'content is correctly set')
  assert(capturedInsertPayload.metadata?.model === 'chatinalabs-ai', 'model is preserved inside metadata.model')
  assert(capturedInsertPayload.metadata?.customKey === 'val1', 'custom metadata is preserved')
  assert(updatedConvId === 'conv-123', 'Conversation updated_at was triggered')

  // 2. Unit Test: Detailed Error Logging on failure
  console.log('\n--- Test Suite 2: Error Logging ---')
  let loggedErrorData: any = null
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('[saveSupabaseMessage]')) {
      loggedErrorData = args[1]
    }
    originalConsoleError(...args)
  }

  const mockFailingSupabase: any = {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: null,
            error: {
              code: '42703',
              message: 'column "model" of relation "messages" does not exist',
              details: 'Table messages has no model column',
              hint: 'Verify column names',
            },
          }),
        }),
      }),
    }),
  }

  const failResult = await saveSupabaseMessage(mockFailingSupabase, 'conv-fail', 'user', 'test')
  console.error = originalConsoleError

  assert(failResult === null, 'saveSupabaseMessage returns null on DB failure')
  assert(loggedErrorData !== null, 'Detailed error was logged')
  assert(loggedErrorData.code === '42703', 'Error code logged correctly')
  assert(loggedErrorData.message.includes('column'), 'Error message logged correctly')
  assert(loggedErrorData.details === 'Table messages has no model column', 'Error details logged correctly')
  assert(loggedErrorData.hint === 'Verify column names', 'Error hint logged correctly')

  // 3. Live Integration Test against Supabase
  console.log('\n--- Test Suite 3: Live Supabase Database Persistence ---')
  if (!serviceRoleKey) {
    console.log('[SKIP] SUPABASE_SERVICE_ROLE_KEY missing, skipping live DB test')
  } else {
    const liveClient = createClient<Database>(supabaseUrl, serviceRoleKey)
    const targetConversationId = '636f50d9-44db-4dec-8288-c05dd849d88d'

    // Save User Message
    const userMsg = await saveSupabaseMessage(
      liveClient,
      targetConversationId,
      'user',
      'halo test',
      null
    )
    assert(userMsg !== null, 'Live: User message persisted successfully')
    assert(userMsg?.role === 'user', 'Live: User message has role "user"')
    assert(userMsg?.content === 'halo test', 'Live: User message has content "halo test"')

    // Save Assistant Message
    const assistantMsg = await saveSupabaseMessage(
      liveClient,
      targetConversationId,
      'assistant',
      'Halo! Ada yang bisa saya bantu terkait chatINALabs AI hari ini?',
      'gpt-5.6-sol',
      {
        finishReason: 'stop',
        status: 'completed',
      }
    )
    assert(assistantMsg !== null, 'Live: Assistant message persisted successfully')
    assert(assistantMsg?.role === 'assistant', 'Live: Assistant message has role "assistant"')
    assert(
      (assistantMsg?.metadata as any)?.model === 'gpt-5.6-sol',
      'Live: Assistant message preserved model in metadata'
    )

    // Fetch conversation messages to confirm order and retrieval
    const conversationMessages = await fetchConversationMessages(liveClient, targetConversationId)
    assert(conversationMessages.length >= 2, `Live: fetchConversationMessages returned ${conversationMessages.length} messages`)

    const foundUserMsg = conversationMessages.find(m => m.id === userMsg?.id)
    const foundAssistantMsg = conversationMessages.find(m => m.id === assistantMsg?.id)

    assert(Boolean(foundUserMsg), 'Live: Saved user message found in conversation message list')
    assert(Boolean(foundAssistantMsg), 'Live: Saved assistant message found in conversation message list')
  }

  console.log(`\n=== Test Results: ${passCount} passed, ${failCount} failed ===`)
  if (failCount > 0) {
    process.exit(1)
  }
}

runMessagePersistenceTests().catch(err => {
  console.error('Unhandled error in test:', err)
  process.exit(1)
})
