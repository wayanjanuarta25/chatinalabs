export type DocumentStatus = 'draft' | 'active' | 'archived'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type DocumentSourceType = 'text' | 'file' | 'url' | 'markdown'

/**
 * Knowledge Base entity scoped to a workspace
 */
export interface KnowledgeBase {
  id: string
  workspaceId: string
  createdBy?: string | null
  name: string
  description?: string | null
  isActive: boolean
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  documentCount?: number
  chunkCount?: number
}

/**
 * Document entity within a knowledge base
 */
export interface KBDocument {
  id: string
  workspaceId?: string | null
  knowledgeBaseId: string
  title: string
  filename?: string | null
  storagePath?: string | null
  sourceType: DocumentSourceType
  sourceUrl?: string | null
  content?: string | null
  documentStatus: DocumentStatus
  processingStatus: ProcessingStatus
  errorMessage?: string | null
  tokenCount?: number | null
  chunkCount?: number | null
  fileSizeBytes?: number | null
  mimeType?: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/**
 * Background processing job for document ingestion pipeline
 */
export interface ProcessingJob {
  id: string
  documentId: string
  workspaceId: string
  jobType: 'extraction' | 'chunking' | 'embedding'
  status: ProcessingStatus
  progress: number
  errorMessage?: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/**
 * Result of uploading a file to storage
 */
export interface StorageUploadResult {
  documentId: string
  storagePath: string
  filename: string
  mimeType: string
  fileSizeBytes: number
  bucket: string
  url?: string
}

/**
 * Document chunk entity prepared for token indexing and vector embeddings
 */
export interface DocumentChunk {
  id: string
  documentId: string
  knowledgeBaseId: string
  chunkIndex: number
  content: string
  tokenCount?: number | null
  embedding?: number[] | string | null
  embeddingModel?: string | null
  embeddedAt?: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/**
 * Query parameters for knowledge retrieval
 */
export interface KnowledgeRetrievalQuery {
  knowledgeBaseId: string
  query: string
  limit?: number
  threshold?: number
  filter?: Record<string, unknown>
}

/**
 * An individual relevant chunk retrieved from knowledge base
 */
export interface KnowledgeContextItem {
  chunkId: string
  documentId: string
  documentTitle: string
  content: string
  score?: number
  metadata?: Record<string, unknown>
}

/**
 * Result of knowledge base retrieval
 */
export interface KnowledgeRetrievalResult {
  items: KnowledgeContextItem[]
  totalFound: number
  queryTimeMs: number
}

/**
 * AI Context Augmentation package ready for injection into AI provider prompts
 */
export interface AIContextAugmentation {
  contextBlock: string
  sources: Array<{
    id: string
    title: string
    snippet: string
    score?: number
  }>
}
