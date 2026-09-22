import { useChatStore } from '../lib/store/useChatStore'
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

async function runRegenerateAndRetryTests() {
  console.log('=== Starting Regenerate & Retry Tests ===\n')

  const originalFetch = global.fetch
  const originalConsoleLog = console.log
  const loggedMessages: string[] = []

  console.log = (...args: any[]) => {
    loggedMessages.push(args.map(a => String(a)).join(' '))
    originalConsoleLog(...args)
  }

  try {
    // ---------------------------------------------------------------------------
    // Test Suite 1: Regenerate Response Flow
    // ---------------------------------------------------------------------------
    console.log('--- Test Suite 1: Regenerate Response Flow ---')
    const convId = 'test-conv-regen-1'

    useChatStore.setState({
      activeConversationId: convId,
      chatState: 'idle',
      abortController: null,
      isGenerating: false,
      streamingContent: '',
      conversations: [
        {
          id: convId,
          title: 'Regen Test Chat',
          category: 'Today',
          updatedAt: '12:00',
          messages: [
            { id: 'u-1', role: 'user', content: 'buatkan laporan penjualan Q3', createdAt: '12:00' },
            { id: 'a-1', role: 'assistant', content: 'ini draf laporan penjualan lama', createdAt: '12:01' },
          ],
          modelId: 'chatinalabs-ai',
        },
      ],
    })

    let capturedFetchBody: any = null

    global.fetch = async (url: any, options: any) => {
      capturedFetchBody = JSON.parse(options.body)
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('Laporan Penjualan Q3 Terbaru: Total omset naik 24%.'))
          controller.close()
        },
      })
      return new Response(stream, { status: 200 })
    }

    await useChatStore.getState().regenerateResponse('a-1')

    const stateAfterRegen = useChatStore.getState()
    const regenConv = stateAfterRegen.conversations.find(c => c.id === convId)

    assert(capturedFetchBody !== null, 'Fetch was called during regenerate')
    assert(capturedFetchBody.isRegenerate === true, 'isRegenerate flag was sent in payload')
    assert(capturedFetchBody.content === 'buatkan laporan penjualan Q3', 'Last user prompt was sent in payload')
    assert(capturedFetchBody.conversationId === convId, 'Target conversationId was sent in payload')
    assert(regenConv?.messages.length === 2, 'Old assistant message replaced by regenerated response (2 messages total)')
    assert(regenConv?.messages[1].role === 'assistant', 'Last message is assistant')
    assert(
      Boolean(regenConv?.messages[1]?.content?.includes('Laporan Penjualan Q3 Terbaru')),
      'New regenerated content present in state'
    )
    assert(stateAfterRegen.chatState === 'idle', 'chatState returned to idle')
    assert(stateAfterRegen.isGenerating === false, 'isGenerating is false')

    const hasRegenStartLog = loggedMessages.some(m => m.includes('[CHAT] Regeneration started'))
    const hasRegenDoneLog = loggedMessages.some(m => m.includes('[CHAT] Generation completed'))
    assert(hasRegenStartLog, 'Logged [CHAT] Regeneration started')
    assert(hasRegenDoneLog, 'Logged [CHAT] Generation completed')

    // ---------------------------------------------------------------------------
    // Test Suite 2: Retry Failed Generation Flow
    // ---------------------------------------------------------------------------
    console.log('\n--- Test Suite 2: Retry Failed Generation Flow ---')
    const retryConvId = 'test-conv-retry-1'
    const failedErrId = 'msg-err-failed-123'

    useChatStore.setState({
      activeConversationId: retryConvId,
      chatState: 'idle',
      abortController: null,
      isGenerating: false,
      streamingContent: '',
      lastFailedMessage: { conversationId: retryConvId, content: 'analisis performa AI' },
      lastFailedMessageId: failedErrId,
      error: 'Network timeout',
      conversations: [
        {
          id: retryConvId,
          title: 'Retry Test Chat',
          category: 'Today',
          updatedAt: '12:00',
          messages: [
            { id: 'u-retry', role: 'user', content: 'analisis performa AI', createdAt: '12:00' },
            { id: failedErrId, role: 'assistant', content: '⚠️ Error: Network timeout. You can try again or click retry.', createdAt: '12:01' },
          ],
          modelId: 'chatinalabs-ai',
        },
      ],
    })

    let capturedRetryBody: any = null

    global.fetch = async (url: any, options: any) => {
      capturedRetryBody = JSON.parse(options.body)
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('Analisis performa AI berhasil dievaluasi dengan latensi 120ms.'))
          controller.close()
        },
      })
      return new Response(stream, { status: 200 })
    }

    await useChatStore.getState().retryFailedGeneration(failedErrId)

    const stateAfterRetry = useChatStore.getState()
    const retriedConv = stateAfterRetry.conversations.find(c => c.id === retryConvId)

    assert(capturedRetryBody !== null, 'Fetch was called during retry')
    assert(capturedRetryBody.isRetry === true, 'isRetry flag was sent in payload')
    assert(capturedRetryBody.content === 'analisis performa AI', 'Failed prompt was resent')
    assert(retriedConv?.messages.some(m => m.id === failedErrId) === false, 'Failed error message was removed from chat list')
    assert(
      Boolean(retriedConv?.messages[retriedConv.messages.length - 1]?.content?.includes('latensi 120ms')),
      'Successful assistant response replaced the failed message'
    )
    assert(stateAfterRetry.lastFailedMessage === null, 'lastFailedMessage reset to null')
    assert(stateAfterRetry.lastFailedMessageId === null, 'lastFailedMessageId reset to null')
    assert(stateAfterRetry.error === null, 'error state cleared')

    const hasRetryStartLog = loggedMessages.some(m => m.includes('[CHAT] Retry generation'))
    assert(hasRetryStartLog, 'Logged [CHAT] Retry generation')

    // ---------------------------------------------------------------------------
    // Test Suite 3: Live Database Persistence for Regenerated & Retry Messages
    // ---------------------------------------------------------------------------
    console.log('\n--- Test Suite 3: Live Database Verification ---')
    global.fetch = originalFetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnkbknbrnatodvkfekyt.supabase.co'
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!serviceRoleKey) {
      console.log('[SKIP] SUPABASE_SERVICE_ROLE_KEY missing, skipping live DB test')
    } else {
      const liveClient = createClient<Database>(supabaseUrl, serviceRoleKey)
      let targetConversationId: string = ''
      const { data: existingConvs } = await liveClient.from('conversations').select('id').limit(1)
      if (existingConvs && existingConvs.length > 0) {
        targetConversationId = existingConvs[0].id
      } else {
        const { data: ws } = await liveClient.from('workspaces').select('id, owner_id').limit(1)
        const { data: newC } = await liveClient.from('conversations').insert({
          workspace_id: ws![0].id,
          user_id: ws![0].owner_id,
          title: 'Regen Test Conversation',
        }).select().single()
        targetConversationId = newC!.id
      }

      // Save Regenerated assistant message
      const regenMsg = await saveSupabaseMessage(
        liveClient,
        targetConversationId,
        'assistant',
        'Respons yang diperbarui setelah klik regenerate.',
        'gpt-5.6-sol',
        { status: 'regenerated' }
      )
      assert(regenMsg !== null, 'Live: Regenerated assistant message persisted')
      assert((regenMsg?.metadata as any)?.status === 'regenerated', 'Live: Metadata has status: "regenerated"')

      // Save Retry assistant message
      const retryMsg = await saveSupabaseMessage(
        liveClient,
        targetConversationId,
        'assistant',
        'Respons normal setelah klik retry.',
        'gpt-5.6-sol',
        { status: 'retry' }
      )
      assert(retryMsg !== null, 'Live: Retry assistant message persisted')
      assert((retryMsg?.metadata as any)?.status === 'retry', 'Live: Metadata has status: "retry"')

      // Fetch messages from conversation
      const allMsgs = await fetchConversationMessages(liveClient, targetConversationId)
      assert(allMsgs.length >= 2, `Live: Conversation has ${allMsgs.length} messages`)
      const foundRegen = allMsgs.find(m => m.id === regenMsg?.id)
      const foundRetry = allMsgs.find(m => m.id === retryMsg?.id)
      assert(Boolean(foundRegen), 'Live: Regenerated message retrieved from DB')
      assert(Boolean(foundRetry), 'Live: Retry message retrieved from DB')
    }

  } finally {
    global.fetch = originalFetch
    console.log = originalConsoleLog
  }

  console.log(`\n=== Test Results: ${passCount} passed, ${failCount} failed ===`)
  if (failCount > 0) {
    process.exit(1)
  }
}

runRegenerateAndRetryTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
