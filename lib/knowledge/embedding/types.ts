/**
 * chatINALabs AI — Phase 5.4 Embedding Infrastructure Types
 */

export interface EmbeddingResult {
  vector: number[]
  model: string
  tokens: number
}

export interface EmbeddingBatchResult {
  embeddings: number[][]
  model: string
  totalTokens: number
}

export interface EmbeddingProvider {
  readonly id: string
  readonly model: string
  readonly dimensions: number
  embed(text: string): Promise<EmbeddingResult>
  embedBatch(texts: string[]): Promise<EmbeddingBatchResult>
}

export interface ChunkEmbeddingPayload {
  chunkId: string
  content: string
}

export interface ChunkEmbeddingResult {
  chunkId: string
  vector: number[]
  model: string
  tokens: number
}

export interface EmbedDocumentResult {
  success: boolean
  embeddedCount: number
  model: string
  totalTokens: number
  errorMessage?: string | null
}
