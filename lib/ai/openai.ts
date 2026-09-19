import { AIProvider } from './provider'
import { AIRequest, AIResponse, AIStreamChunk, AIUsage, AIFinishReason } from './types'

export function mapToOpenAIModel(model: string): string {
  switch (model) {
    case 'chatinalabs-reasoning':
      return 'o3-mini'
    case 'chatinalabs-creative':
      return 'gpt-4o'
    case 'chatinalabs-code':
      return 'gpt-4o'
    case 'chatinalabs-ai':
      return 'gpt-4o-mini'
    default:
      return model || 'gpt-4o-mini'
  }
}

/**
 * Real OpenAI Provider Adapter
 * Supports full streaming, Server-Sent Events parsing, usage extraction, and robust error handling.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private apiKey?: string
  private baseURL: string

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY
    this.baseURL = (baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  }

  private getEffectiveApiKey(): string {
    const key = this.apiKey?.trim()
    if (!key || key === 'your_openai_api_key' || key.includes('placeholder')) {
      throw new Error('OpenAI API key is not configured or is a placeholder. Set a valid OPENAI_API_KEY.')
    }
    return key
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = this.getEffectiveApiKey()
    const targetModel = mapToOpenAIModel(request.model)
    const isReasoning = targetModel.startsWith('o1') || targetModel.startsWith('o3')

    const payload: Record<string, unknown> = {
      model: targetModel,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.name ? { name: m.name } : {}),
      })),
      stream: false,
    }

    if (!isReasoning) {
      if (request.temperature !== undefined) payload.temperature = request.temperature
      if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens
    } else {
      if (request.maxTokens !== undefined) payload.max_completion_tokens = request.maxTokens
    }

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
      let message = `OpenAI API Error (${response.status})`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error?.message) {
          message = `OpenAI API Error (${response.status}): ${errorJson.error.message}`
        }
      } catch {
        message = `OpenAI API Error (${response.status}): ${errorText}`
      }
      throw new Error(message)
    }

    const data = await response.json()
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
      id: data.id || `openai-${Date.now()}`,
      model: data.model || targetModel,
      content,
      finishReason: (choice?.finish_reason as AIFinishReason) || 'stop',
      usage,
      createdAt: new Date(data.created ? data.created * 1000 : Date.now()),
    }
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const apiKey = this.getEffectiveApiKey()
    const targetModel = mapToOpenAIModel(request.model)
    const isReasoning = targetModel.startsWith('o1') || targetModel.startsWith('o3')

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

    if (!isReasoning) {
      if (request.temperature !== undefined) payload.temperature = request.temperature
      if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens
    } else {
      if (request.maxTokens !== undefined) payload.max_completion_tokens = request.maxTokens
    }

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
      let message = `OpenAI Streaming Error (${response.status})`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error?.message) {
          message = `OpenAI Streaming Error (${response.status}): ${errorJson.error.message}`
        }
      } catch {
        message = `OpenAI Streaming Error (${response.status}): ${errorText}`
      }
      throw new Error(message)
    }

    if (!response.body) {
      throw new Error('OpenAI returned an empty response body.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let lastChunkId = `openai-${Date.now()}`
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

              // If choice has finish_reason and no subsequent chunk
              if (choice?.finish_reason && !deltaContent) {
                finishReason = choice.finish_reason as AIFinishReason
              }
            } catch {
              // Ignore partial JSON parse errors in SSE line
            }
          }
        }
      }

      // Flush any remaining line
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

      // Final closure chunk if stream ended without [DONE]
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
