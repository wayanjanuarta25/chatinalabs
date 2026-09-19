import { AIProvider } from './provider'
import { AIRequest, AIResponse, AIStreamChunk } from './types'
import { createStreamFromText } from './stream'

/**
 * Anthropic Provider Adapter (Placeholder implementation for Phase 4.1)
 */
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const prompt = request.messages[request.messages.length - 1]?.content || ''
    const content = `[Anthropic Claude Adapter Placeholder: ${request.model}] Echo: ${prompt}`

    return {
      id: `anthropic-${Date.now()}`,
      model: request.model,
      content,
      finishReason: 'stop',
      usage: {
        promptTokens: prompt.length / 4,
        completionTokens: content.length / 4,
        totalTokens: (prompt.length + content.length) / 4,
      },
      createdAt: new Date(),
    }
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const prompt = request.messages[request.messages.length - 1]?.content || ''
    const content = `[Anthropic Claude Adapter Placeholder: ${request.model}] Echo: ${prompt}`
    yield* createStreamFromText(content, 3, 20)
  }
}
