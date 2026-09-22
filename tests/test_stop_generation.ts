import { useChatStore } from '../lib/store/useChatStore'

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

async function runStopGenerationTests() {
  console.log('=== Starting Stop Generation Tests ===\n')

  // 1. Initial store state
  console.log('--- Test Suite 1: Initial Store State ---')
  const initialState = useChatStore.getState()
  assert(initialState.abortController === null, 'Initial abortController is null')
  assert(initialState.isGenerating === false, 'Initial isGenerating is false')
  assert(typeof initialState.stopGeneration === 'function', 'stopGeneration action exists on store')

  // 2. Calling stopGeneration when controller exists
  console.log('\n--- Test Suite 2: stopGeneration Action Logic ---')
  const testController = new AbortController()
  assert(!testController.signal.aborted, 'Test controller is initially not aborted')

  useChatStore.setState({
    abortController: testController,
    isGenerating: true,
  })

  useChatStore.getState().stopGeneration()

  assert(testController.signal.aborted, 'stopGeneration() successfully aborted controller')
  assert(useChatStore.getState().abortController === null, 'abortController is reset to null')
  assert(useChatStore.getState().isGenerating === false, 'isGenerating is reset to false')

  // 3. Simulating streaming abort and partial text preservation
  console.log('\n--- Test Suite 3: Streaming Abort & Partial Response Preservation ---')
  const convId = 'test-conv-stop-1'
  useChatStore.setState({
    activeConversationId: convId,
    chatState: 'idle',
    abortController: null,
    isGenerating: false,
    streamingContent: '',
    conversations: [
      {
        id: convId,
        title: 'Test Stop Chat',
        category: 'Today',
        updatedAt: '12:00',
        messages: [{ id: 'u1', role: 'user', content: 'buat artikel panjang tentang AI', createdAt: '12:00' }],
        modelId: 'chatinalabs-ai',
      },
    ],
  })

  // Mock global fetch to stream chunks and then reject on abort
  const abortTracker = { aborted: false }
  const originalFetch = global.fetch
  const originalConsoleLog = console.log
  const loggedMessages: string[] = []

  console.log = (...args: any[]) => {
    loggedMessages.push(args.map(a => String(a)).join(' '))
    originalConsoleLog(...args)
  }

  global.fetch = async (url: any, options: any) => {
    const signal: AbortSignal = options.signal
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        // Enqueue partial tokens
        controller.enqueue(encoder.encode('Berdasarkan dokumen perusahaan, strategi utama yang dapat dilakukan adalah...'))

        // Listen for abort
        signal.addEventListener('abort', () => {
          abortTracker.aborted = true
          controller.error(new DOMException('The user aborted a request', 'AbortError'))
        })
      },
    })

    return new Response(stream, { status: 200 })
  }

  // Trigger sendMessage
  const sendPromise = useChatStore.getState().sendMessage('buat artikel panjang tentang AI')

  // Wait a tick for stream to start and receive first chunk
  await new Promise(resolve => setTimeout(resolve, 50))

  assert(useChatStore.getState().chatState === 'streaming', 'Chat enters streaming state')
  assert(useChatStore.getState().isGenerating === true, 'isGenerating is true during stream')
  assert(useChatStore.getState().abortController !== null, 'abortController is active during stream')
  assert(useChatStore.getState().streamingContent.includes('Berdasarkan dokumen perusahaan'), 'Partial streaming content received')

  // Trigger stopGeneration
  useChatStore.getState().stopGeneration()

  await sendPromise

  // Restore fetch and console
  global.fetch = originalFetch
  console.log = originalConsoleLog

  const finalState = useChatStore.getState()
  const currentConv = finalState.conversations.find(c => c.id === convId)
  const assistantMessages = currentConv?.messages.filter(m => m.role === 'assistant') || []
  const lastAssistantMsg = assistantMessages[assistantMessages.length - 1]

  assert(abortTracker.aborted === true, 'Fetch received abort signal from stopGeneration')
  assert(finalState.chatState === 'idle', 'Chat state returned to idle')
  assert(finalState.isGenerating === false, 'isGenerating is false after stop')
  assert(finalState.abortController === null, 'abortController is null after stop')
  assert(finalState.error === null, 'No error state set on abort')
  assert(Boolean(lastAssistantMsg), 'Partial assistant message was saved to conversation')
  assert(
    lastAssistantMsg?.content.includes('Berdasarkan dokumen perusahaan') &&
    lastAssistantMsg?.content.endsWith('[stopped]'),
    `Partial content preserved with [stopped] suffix (got: "${lastAssistantMsg?.content}")`
  )

  // Verify logging
  const hasStartLog = loggedMessages.some(m => m.includes('[CHAT] Generation started'))
  const hasStopLog = loggedMessages.some(m => m.includes('[CHAT] Generation stopped by user') || m.includes('[CHAT] Generation aborted by user'))
  assert(hasStartLog, 'Logged [CHAT] Generation started')
  assert(hasStopLog, 'Logged [CHAT] Generation aborted/stopped by user')

  console.log(`\n=== Test Results: ${passCount} passed, ${failCount} failed ===`)
  if (failCount > 0) {
    process.exit(1)
  }
}

runStopGenerationTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
