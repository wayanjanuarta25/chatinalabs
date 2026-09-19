import { AIRequest, AIResponse, AIStreamChunk } from './types'
import { createStreamFromText } from './stream'
import { generateSimulatedReply } from '@/lib/store/dummyData'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { KelontongAIProvider } from './kelontongai'

/**
 * Standard AI Provider Interface
 */
export interface AIProvider {
  readonly name: string
  generate(request: AIRequest): Promise<AIResponse>
  stream(request: AIRequest): AsyncIterable<AIStreamChunk>
}

/**
 * Simulated / Internal Provider (Default Fallback)
 * Keeps the existing high-quality interactive demo simulation working smoothly.
 */
export class SimulatedProvider implements AIProvider {
  readonly name = 'simulated'

  async generate(request: AIRequest): Promise<AIResponse> {
    const lastMessage = request.messages[request.messages.length - 1]
    const prompt = lastMessage?.content || ''
    const content = generateSimulatedReply(prompt)

    return {
      id: `sim-${Date.now()}`,
      model: request.model,
      content,
      finishReason: 'stop',
      createdAt: new Date(),
    }
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const lastMessage = request.messages[request.messages.length - 1]
    const prompt = lastMessage?.content || ''
    const fullReply = generateSimulatedReply(prompt)

    yield* createStreamFromText(fullReply, 2, 15)
  }
}

/**
 * AI Service Registry & Abstraction Layer
 */
export class AIServiceManager {
  private providers = new Map<string, AIProvider>()
  private defaultProvider: AIProvider

  constructor() {
    this.defaultProvider = new SimulatedProvider()
    this.registerProvider('simulated', this.defaultProvider)
    this.registerProvider('internal', this.defaultProvider)
    this.registerProvider('kelontongai', new KelontongAIProvider())
    this.registerProvider('openai', new OpenAIProvider())
    this.registerProvider('anthropic', new AnthropicProvider())
  }

  registerProvider(name: string, provider: AIProvider): void {
    this.providers.set(name.toLowerCase(), provider)
  }

  /**
   * Resolves default provider based on AI_PROVIDER environment variable or default 'kelontongai'.
   */
  getDefaultProvider(): AIProvider {
    const configured = process.env.AI_PROVIDER?.toLowerCase()
    if (configured && this.providers.has(configured)) {
      return this.providers.get(configured)!
    }
    return this.providers.get('kelontongai') || this.providers.get('openai') || this.defaultProvider
  }

  getProvider(identifier?: string): AIProvider {
    if (!identifier) return this.getDefaultProvider()

    const lower = identifier.toLowerCase()

    if (this.providers.has(lower)) {
      return this.providers.get(lower)!
    }

    if (lower.includes('kelontong') || lower.includes('sol') || lower.includes('gpt-5.6')) {
      return this.providers.get('kelontongai') || this.defaultProvider
    }

    if (lower.includes('claude') || lower.includes('anthropic')) {
      return this.providers.get('anthropic') || this.defaultProvider
    }

    if (lower.includes('openai')) {
      return this.providers.get('openai') || this.defaultProvider
    }

    // If explicit AI_PROVIDER is set, respect it for generic models
    const configured = process.env.AI_PROVIDER?.toLowerCase()
    if (configured && this.providers.has(configured)) {
      return this.providers.get(configured)!
    }

    // Explicit OpenAI models if requested
    if (lower.startsWith('o1') || lower.startsWith('o3') || lower.includes('gpt-4')) {
      return this.providers.get('openai') || this.defaultProvider
    }

    // Default to kelontongai as target chat generation provider
    return this.providers.get('kelontongai') || this.providers.get('openai') || this.defaultProvider
  }

  /**
   * Generates a non-streaming AI response with fallback handling.
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    try {
      const provider = this.getProvider(request.model)
      return await provider.generate(request)
    } catch (err) {
      console.warn('[AIService] Provider failed, falling back to simulated response:', err)
      return await this.defaultProvider.generate(request)
    }
  }

  /**
   * Generates a streaming AI response with fallback handling.
   */
  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const provider = this.getProvider(request.model)
    try {
      for await (const chunk of provider.stream(request)) {
        yield chunk
      }
    } catch (err) {
      console.warn('[AIService] Stream provider failed, falling back to simulated stream:', err)
      yield* this.defaultProvider.stream(request)
    }
  }
}

export const aiService = new AIServiceManager()
