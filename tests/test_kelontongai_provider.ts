import { KelontongAIProvider, mapToKelontongAIModel } from '../lib/ai/kelontongai'
import { aiService } from '../lib/ai/provider'
import { AIRequest } from '../lib/ai/types'

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

async function runKelontongAITests() {
  console.log('=== Starting KelontongAI Provider Tests ===\n')

  // Save original globals and env vars
  const originalFetch = global.fetch
  const originalApiKey = process.env.KELONTONGAI_API_KEY
  const originalBaseUrl = process.env.KELONTONGAI_BASE_URL
  const originalAiProvider = process.env.AI_PROVIDER

  try {
    // -------------------------------------------------------------------------
    // 1. Provider Initialization & Properties
    // -------------------------------------------------------------------------
    const defaultProvider = new KelontongAIProvider()
    assert(defaultProvider.name === 'kelontongai', 'Provider initializes with name "kelontongai"')
    assert(defaultProvider.getBaseUrl() === 'https://api.kelontongai.id/v1', 'Default base URL is https://api.kelontongai.id/v1')

    const customProvider = new KelontongAIProvider('custom-key', 'https://custom.api.kelontongai.id/v1/')
    assert(customProvider.getBaseUrl() === 'https://custom.api.kelontongai.id/v1', 'Correct base URL used and trailing slashes stripped')

    // -------------------------------------------------------------------------
    // 2. API Key Validation
    // -------------------------------------------------------------------------
    const unconfiguredProvider = new KelontongAIProvider('')
    let threwApiKeyError = false
    try {
      unconfiguredProvider.getEffectiveApiKey()
    } catch (err: unknown) {
      threwApiKeyError = true
      const msg = err instanceof Error ? err.message : String(err)
      assert(msg.includes('KelontongAI'), 'Error message mentions KelontongAI on missing key')
      assert(msg.includes('KELONTONGAI_API_KEY'), 'Error message mentions KELONTONGAI_API_KEY')
    }
    assert(threwApiKeyError, 'API key validation throws on empty key')

    const placeholderProvider = new KelontongAIProvider('your_kelontongai_api_key')
    let threwPlaceholderError = false
    try {
      placeholderProvider.getEffectiveApiKey()
    } catch {
      threwPlaceholderError = true
    }
    assert(threwPlaceholderError, 'API key validation throws on placeholder key')

    const validKeyProvider = new KelontongAIProvider('sk-kelontong-real-test-key')
    assert(validKeyProvider.getEffectiveApiKey() === 'sk-kelontong-real-test-key', 'Valid API key returned by getEffectiveApiKey')

    // -------------------------------------------------------------------------
    // 3. Model Mapping
    // -------------------------------------------------------------------------
    assert(mapToKelontongAIModel() === 'gpt-5.6-sol', 'Default model maps to gpt-5.6-sol')
    assert(mapToKelontongAIModel('chatinalabs-ai') === 'gpt-5.6-sol', 'chatinalabs-ai maps to gpt-5.6-sol')
    assert(mapToKelontongAIModel('chatinalabs-reasoning') === 'gpt-5.6-sol', 'chatinalabs-reasoning maps to gpt-5.6-sol')
    assert(mapToKelontongAIModel('chatinalabs-creative') === 'gpt-5.6-sol', 'chatinalabs-creative maps to gpt-5.6-sol')
    assert(mapToKelontongAIModel('chatinalabs-code') === 'gpt-5.6-sol', 'chatinalabs-code maps to gpt-5.6-sol')
    assert(mapToKelontongAIModel('gpt-5.6-sol') === 'gpt-5.6-sol', 'Direct gpt-5.6-sol maps to gpt-5.6-sol')
    assert(mapToKelontongAIModel('custom-model-x') === 'custom-model-x', 'Custom model name preserved')

    // -------------------------------------------------------------------------
    // 4. Non-Streaming Completion (generate) & Request Payload Verification
    // -------------------------------------------------------------------------
    let capturedUrl = ''
    let capturedHeaders: Record<string, string> = {}
    let capturedBody: Record<string, unknown> = {}

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url)
      capturedHeaders = (init?.headers as Record<string, string>) || {}
      capturedBody = init?.body ? JSON.parse(String(init.body)) : {}

      const mockResponse = {
        id: 'kelontong-gen-123',
        model: 'gpt-5.6-sol',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Halo dari KelontongAI!',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 6,
          total_tokens: 18,
        },
        created: 1710000000,
      }

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as unknown as typeof fetch

    const testProvider = new KelontongAIProvider('test-valid-key', 'https://api.kelontongai.id/v1')
    const reqPayload: AIRequest = {
      model: 'chatinalabs-ai',
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Halo Kelontong!' },
      ],
      temperature: 0.7,
      maxTokens: 1024,
    }

    const genResult = await testProvider.generate(reqPayload)
    assert(capturedUrl === 'https://api.kelontongai.id/v1/chat/completions', 'generate calls /chat/completions endpoint')
    assert(capturedHeaders['Authorization'] === 'Bearer test-valid-key', 'generate sets Bearer authorization header')
    assert(capturedBody['model'] === 'gpt-5.6-sol', 'Request payload contains mapped model gpt-5.6-sol')
    assert(Array.isArray(capturedBody['messages']) && (capturedBody['messages'] as unknown[]).length === 2, 'Messages mapped correctly')
    assert(capturedBody['stream'] === false, 'generate sets stream to false')
    assert(genResult.content === 'Halo dari KelontongAI!', 'generate returns assistant content')
    assert(genResult.finishReason === 'stop', 'generate returns finishReason stop')
    assert(genResult.usage?.totalTokens === 18, 'generate extracts token usage')

    // -------------------------------------------------------------------------
    // 5. Streaming (stream) & Server-Sent Events Parser
    // -------------------------------------------------------------------------
    const sseChunks = [
      'data: {"id":"kel-stream-1","choices":[{"delta":{"content":"Halo"}}]}\n\n',
      'data: {"id":"kel-stream-1","choices":[{"delta":{"content":" dunia"}}]}\n\n',
      'data: {"id":"kel-stream-1","choices":[{"delta":{"content":"!"},"finish_reason":"stop"}]}\n\n',
      'data: [DONE]\n\n',
    ]

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url)
      capturedBody = init?.body ? JSON.parse(String(init.body)) : {}

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of sseChunks) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        },
      })

      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    }) as unknown as typeof fetch

    const streamResult = testProvider.stream({
      model: 'gpt-5.6-sol',
      messages: [{ role: 'user', content: 'Testing stream' }],
    })

    let accumulatedText = ''
    let receivedChunksCount = 0
    let streamFinishReason = ''

    for await (const chunk of streamResult) {
      receivedChunksCount++
      if (chunk.delta) accumulatedText += chunk.delta
      if (chunk.finishReason) streamFinishReason = chunk.finishReason
    }

    assert(capturedBody['stream'] === true, 'stream sets stream payload to true')
    assert(accumulatedText === 'Halo dunia!', 'Streaming parser properly reassembles tokens (got "Halo dunia!")')
    assert(receivedChunksCount >= 3, 'Streaming parser yields multiple chunks')
    assert(streamFinishReason === 'stop', 'Streaming parser captures finishReason "stop"')

    // -------------------------------------------------------------------------
    // 6. Error Handling
    // -------------------------------------------------------------------------
    // HTTP Error 401 with JSON message
    global.fetch = (async () => {
      return new Response(JSON.stringify({ error: { message: 'Invalid API key provided' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as unknown as typeof fetch

    let caughtHttpError = false
    try {
      await testProvider.generate(reqPayload)
    } catch (err: unknown) {
      caughtHttpError = true
      const msg = err instanceof Error ? err.message : String(err)
      assert(msg.includes('KelontongAI API Error (401)'), 'HTTP error includes KelontongAI API Error (401)')
      assert(msg.includes('Invalid API key provided'), 'HTTP error includes API error message')
    }
    assert(caughtHttpError, 'Error handling works for HTTP 401')

    // Streaming HTTP Error 500
    global.fetch = (async () => {
      return new Response('Gateway timeout', { status: 504 })
    }) as unknown as typeof fetch

    let caughtStreamError = false
    try {
      const failingStream = testProvider.stream(reqPayload)
      for await (const _chunk of failingStream) {
        // should throw
      }
    } catch (err: unknown) {
      caughtStreamError = true
      const msg = err instanceof Error ? err.message : String(err)
      assert(msg.includes('KelontongAI Streaming Error (504)'), 'Streaming error mentions KelontongAI Streaming Error (504)')
    }
    assert(caughtStreamError, 'Error handling works for streaming HTTP errors')

    // -------------------------------------------------------------------------
    // 7. Registry & Provider Selection
    // -------------------------------------------------------------------------
    const resolvedKelontong = aiService.getProvider('kelontongai')
    assert(resolvedKelontong.name === 'kelontongai', 'aiService resolves registered "kelontongai" provider')

    const resolvedSol = aiService.getProvider('gpt-5.6-sol')
    assert(resolvedSol.name === 'kelontongai', 'aiService resolves "gpt-5.6-sol" model to kelontongai provider')

    // Test fallback behavior
    process.env.AI_PROVIDER = 'kelontongai'
    // Ensure invalid key triggers fallback to simulated provider
    const fallbackProvider = new KelontongAIProvider('')
    aiService.registerProvider('kelontongai', fallbackProvider)

    const fallbackResponse = await aiService.generate({
      model: 'gpt-5.6-sol',
      messages: [{ role: 'user', content: 'Test fallback' }],
    })
    assert(typeof fallbackResponse.content === 'string' && fallbackResponse.content.length > 0, 'AIServiceManager gracefully falls back to simulated response on provider failure')
    assert(fallbackResponse.finishReason === 'stop', 'Fallback response returns valid finishReason')

    // Re-register clean KelontongAIProvider
    aiService.registerProvider('kelontongai', new KelontongAIProvider())

  } finally {
    // Restore globals
    global.fetch = originalFetch
    process.env.KELONTONGAI_API_KEY = originalApiKey
    process.env.KELONTONGAI_BASE_URL = originalBaseUrl
    process.env.AI_PROVIDER = originalAiProvider
  }

  console.log(`\n=== Test Results: ${passCount} passed, ${failCount} failed ===\n`)
  if (failCount > 0) {
    process.exit(1)
  }
}

runKelontongAITests().catch(err => {
  console.error('Test suite uncaught error:', err)
  process.exit(1)
})
