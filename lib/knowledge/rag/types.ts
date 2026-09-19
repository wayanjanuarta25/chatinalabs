/**
 * chatINALabs AI — Phase 5.6 RAG Chat Integration Types
 */

import { AIMessage } from '@/lib/ai/types'
import { VectorSearchResultChunk } from '../search/types'

export interface RAGSourceCitation {
  id: string
  documentId: string
  documentTitle: string
  content: string
  snippet: string
  similarity: number
  metadata: Record<string, unknown>
}

export interface RAGContextPayload {
  contextBlock: string
  sources: RAGSourceCitation[]
  hasKnowledge: boolean
}

export interface RAGPromptOptions {
  systemPrompt?: string
  similarityThreshold?: number
  maxContextTokens?: number
  maxChunks?: number
}

export interface RAGChatOptions {
  workspaceId: string
  query: string
  history?: AIMessage[]
  model?: string
  options?: RAGPromptOptions
}

export interface RAGPreparationResult {
  messages: AIMessage[]
  sources: RAGSourceCitation[]
  hasKnowledge: boolean
  contextBlock: string
}
