export type AIRole = 'system' | 'user' | 'assistant'

export type AIMessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }

export type AIMessageContent = string | AIMessageContentPart[]

export interface AIMessage {
  role: AIRole
  content: AIMessageContent
  name?: string
}

export interface AIRequest {
  model: string
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  metadata?: Record<string, unknown>
}

export interface AIUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export type AIFinishReason = 'stop' | 'length' | 'content_filter' | 'error'

export interface AIResponse {
  id: string
  model: string
  content: string
  finishReason?: AIFinishReason
  usage?: AIUsage
  createdAt: Date
}

export interface AIStreamChunk {
  id: string
  delta: string
  isFinished: boolean
  finishReason?: AIFinishReason
}
