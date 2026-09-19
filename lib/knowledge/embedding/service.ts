import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import {
  ChunkEmbeddingPayload,
  ChunkEmbeddingResult,
  EmbedDocumentResult,
  EmbeddingBatchResult,
  EmbeddingProvider,
  EmbeddingResult,
} from './types'
import { getEmbeddingProvider, SimulatedEmbeddingProvider } from './provider'

export class EmbeddingService {
  private provider: EmbeddingProvider

  constructor(provider?: EmbeddingProvider) {
    this.provider = provider || getEmbeddingProvider()
  }

  /**
   * Set or override current embedding provider.
   */
  setProvider(provider: EmbeddingProvider) {
    this.provider = provider
  }

  /**
   * Generate an embedding vector for a single text.
   */
  async embed(text: string): Promise<EmbeddingResult> {
    try {
      return await this.provider.embed(text)
    } catch (err) {
      console.warn(`[EmbeddingService] Provider "${this.provider.id}" failed, falling back to simulated provider:`, err)
      const fallback = new SimulatedEmbeddingProvider()
      return await fallback.embed(text)
    }
  }

  /**
   * Generate embedding vectors for multiple texts in batch.
   */
  async embedBatch(texts: string[]): Promise<EmbeddingBatchResult> {
    if (texts.length === 0) {
      return { embeddings: [], model: this.provider.model, totalTokens: 0 }
    }

    try {
      return await this.provider.embedBatch(texts)
    } catch (err) {
      console.warn(`[EmbeddingService] Provider "${this.provider.id}" batch failed, falling back to simulated provider:`, err)
      const fallback = new SimulatedEmbeddingProvider()
      return await fallback.embedBatch(texts)
    }
  }

  /**
   * Embed an array of chunk payloads.
   */
  async embedChunks(chunks: ChunkEmbeddingPayload[]): Promise<ChunkEmbeddingResult[]> {
    if (chunks.length === 0) return []

    const texts = chunks.map(c => c.content)
    const batchResult = await this.embedBatch(texts)

    return chunks.map((chunk, index) => ({
      chunkId: chunk.chunkId,
      vector: batchResult.embeddings[index],
      model: batchResult.model,
      tokens: Math.ceil(chunk.content.length / 4),
    }))
  }

  /**
   * Generates and updates embeddings for all chunks belonging to a document in Supabase.
   * Flow: document_chunks -> generate embeddings -> update document_chunks
   */
  async embedDocumentChunks(
    supabase: SupabaseClient<Database>,
    documentId: string
  ): Promise<EmbedDocumentResult> {
    // 1. Fetch document chunks
    const { data: chunks, error: fetchError } = await supabase
      .from('document_chunks')
      .select('id, content, chunk_index')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })

    if (fetchError || !chunks) {
      console.error(`[EmbeddingService] Failed to fetch chunks for document ${documentId}:`, fetchError?.message)
      return {
        success: false,
        embeddedCount: 0,
        model: '',
        totalTokens: 0,
        errorMessage: fetchError?.message || 'Failed to fetch document chunks',
      }
    }

    if (chunks.length === 0) {
      return {
        success: true,
        embeddedCount: 0,
        model: this.provider.model,
        totalTokens: 0,
      }
    }

    // 2. Generate embeddings in chunks of 50 to respect API payload boundaries
    const BATCH_SIZE = 50
    let totalTokens = 0
    let embeddedCount = 0
    let activeModel = this.provider.model

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const slice = chunks.slice(i, i + BATCH_SIZE)
      const payloads: ChunkEmbeddingPayload[] = slice.map(c => ({
        chunkId: c.id,
        content: c.content,
      }))

      const results = await this.embedChunks(payloads)

      // 3. Update document_chunks with pgvector embedding and metadata
      for (const res of results) {
        activeModel = res.model
        totalTokens += res.tokens

        // Supabase postgREST accepts vector columns as arrays or stringified arrays '[0.1, 0.2, ...]'
        const { error: updateError } = await supabase
          .from('document_chunks')
          .update({
            embedding: res.vector,
            embedding_model: res.model,
            embedded_at: new Date().toISOString(),
            token_count: res.tokens,
            updated_at: new Date().toISOString(),
          })
          .eq('id', res.chunkId)

        if (updateError) {
          console.error(`[EmbeddingService] Failed to update chunk embedding for ${res.chunkId}:`, updateError.message)
        } else {
          embeddedCount++
        }
      }
    }

    return {
      success: true,
      embeddedCount,
      model: activeModel,
      totalTokens,
    }
  }
}

export const embeddingService = new EmbeddingService()
