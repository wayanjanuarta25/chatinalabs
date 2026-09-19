/**
 * chatINALabs AI — Phase 5.3 Document Processing Pipeline Types
 */

export interface ExtractionResult {
  text: string
  pageCount?: number
  metadata?: Record<string, unknown>
}

export interface ChunkingOptions {
  maxTokens?: number
  overlapTokens?: number
  minChunkChars?: number
}

export interface ProcessedChunk {
  chunkIndex: number
  content: string
  tokenCount: number
  metadata?: Record<string, unknown>
}

export interface ProcessingJobResult {
  jobId: string
  documentId: string
  status: 'completed' | 'failed'
  totalTokens: number
  chunkCount: number
  errorMessage?: string | null
}

export interface DocumentExtractor {
  canHandle(filename: string, mimeType?: string): boolean
  extract(buffer: Buffer, filename: string, mimeType?: string): Promise<ExtractionResult>
}
