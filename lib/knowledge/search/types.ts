/**
 * chatINALabs AI — Phase 5.5 Vector Search Engine Types
 */

export interface VectorSearchResultChunk {
  id: string
  documentId: string
  content: string
  similarity: number
  metadata: Record<string, unknown>
}

export interface SearchKnowledgeParams {
  workspaceId: string
  query: string
  limit?: number
  similarityThreshold?: number
}

export interface SearchKnowledgeResult {
  chunks: VectorSearchResultChunk[]
  query: string
  workspaceId: string
  totalFound: number
  queryTimeMs: number
}

export interface VectorSearchOptions {
  limit?: number
  similarityThreshold?: number
}
