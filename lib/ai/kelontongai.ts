import { AIProvider } from './provider'
import { AIRequest, AIResponse, AIStreamChunk, AIUsage, AIFinishReason } from './types'

/**
 * Model mapping for KelontongAI OpenAI-compatible API.
 * Maps application model aliases to KelontongAI models (default: gpt-5.6-sol).
 */
export function mapToKelontongAIModel(model?: string): string {
  if (!model) return 'gpt-5.6-sol'
  switch (model) {
    case 'chatinalabs-reasoning':
    case 'chatinalabs-creative':
    case 'chatinalabs-code':
    case 'chatinalabs-ai':
      return 'gpt-5.6-sol'
    default:
      return model || 'gpt-5.6-sol'
  }
}

/**
 * KelontongAI Provider Adapter
 * Implements standard AIProvider interface for OpenAI-compatible KelontongAI endpoint.
 * Supports non-streaming generation and Server-Sent Events (SSE) token streaming.
 */
export class KelontongAIProvider implements AIProvider {
  readonly name = 'kelontongai'
  private apiKey?: string
  private baseURL: string

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.KELONTONGAI_API_KEY
    this.baseURL = (baseURL || process.env.KELONTONGAI_BASE_URL || 'https://api.kelontongai.id/v1').replace(/\/+$/, '')
  }

  getEffectiveApiKey(): string {
    const key = this.apiKey?.trim()
    if (!key || key === 'your_kelontongai_api_key' || key.includes('placeholder')) {
      throw new Error('KelontongAI API key is not configured or is a placeholder. Set a valid KELONTONGAI_API_KEY.')
    }
    return key
  }

  getBaseUrl(): string {
    return this.baseURL
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = this.getEffectiveApiKey()
    const targetModel = mapToKelontongAIModel(request.model)

    const payload: Record<string, unknown> = {
      model: targetModel,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.name ? { name: m.name } : {}),
      })),
      stream: false,
    }

    if (request.temperature !== undefined) payload.temperature = request.temperature
    if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens
    if (request.topP !== undefined) payload.top_p = request.topP

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let message = `KelontongAI API Error (${response.status})`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error?.message) {
          message = `KelontongAI API Error (${response.status}): ${errorJson.error.message}`
        }
      } catch {
        message = `KelontongAI API Error (${response.status}): ${errorText}`
      }
      throw new Error(message)
    }

    const data = await response.json()
    if (!data || typeof data !== 'object') {
      throw new Error('KelontongAI returned an invalid response format.')
    }

    const choice = data.choices?.[0]
    const content = choice?.message?.content || ''

    let usage: AIUsage | undefined
    if (data.usage) {
      usage = {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      }
    }

    return {
      id: data.id || `kelontongai-${Date.now()}`,
      model: data.model || targetModel,
      content,
      finishReason: (choice?.finish_reason as AIFinishReason) || 'stop',
      usage,
      createdAt: new Date(data.created ? data.created * 1000 : Date.now()),
    }
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const apiKey = this.getEffectiveApiKey()
    const targetModel = mapToKelontongAIModel(request.model)

    const payload: Record<string, unknown> = {
      model: targetModel,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.name ? { name: m.name } : {}),
      })),
      stream: true,
      stream_options: {
        include_usage: true,
      },
    }

    if (request.temperature !== undefined) payload.temperature = request.temperature
    if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens
    if (request.topP !== undefined) payload.top_p = request.topP

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let message = `KelontongAI Streaming Error (${response.status})`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error?.message) {
          message = `KelontongAI Streaming Error (${response.status}): ${errorJson.error.message}`
        }
      } catch {
        message = `KelontongAI Streaming Error (${response.status}): ${errorText}`
      }
      throw new Error(message)
    }

    if (!response.body) {
      throw new Error('KelontongAI returned an empty response body.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let lastChunkId = `kelontongai-${Date.now()}`
    let finishReason: AIFinishReason | undefined

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue

          if (trimmed === 'data: [DONE]') {
            yield {
              id: lastChunkId,
              delta: '',
              isFinished: true,
              finishReason: finishReason || 'stop',
            }
            return
          }

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6)
            try {
              const parsed = JSON.parse(jsonStr)
              if (parsed.id) lastChunkId = parsed.id

              const choice = parsed.choices?.[0]
              const deltaContent = choice?.delta?.content || ''
              if (choice?.finish_reason) {
                finishReason = choice.finish_reason as AIFinishReason
              }

              if (deltaContent) {
                yield {
                  id: lastChunkId,
                  delta: deltaContent,
                  isFinished: false,
                  finishReason,
                }
              }

              if (choice?.finish_reason && !deltaContent) {
                finishReason = choice.finish_reason as AIFinishReason
              }
            } catch {
              // Ignore partial JSON parse errors in SSE line
            }
          }
        }
      }

      // Flush any remaining line in buffer
      if (buffer.trim().startsWith('data: ')) {
        const trimmed = buffer.trim()
        if (trimmed === 'data: [DONE]') {
          yield {
            id: lastChunkId,
            delta: '',
            isFinished: true,
            finishReason: finishReason || 'stop',
          }
          return
        }
      }

      // Final closure chunk if stream ended without explicit [DONE]
      yield {
        id: lastChunkId,
        delta: '',
        isFinished: true,
        finishReason: finishReason || 'stop',
      }
    } finally {
      reader.releaseLock()
    }
  }
}
