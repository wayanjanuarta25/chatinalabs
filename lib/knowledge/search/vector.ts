import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { VectorSearchOptions, VectorSearchResultChunk } from './types'

/**
 * Calculates cosine similarity between two numeric vectors.
 * Returns a value between -1.0 and 1.0 (or 0.0 to 1.0 for positive unit vectors).
 */
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

/**
 * Executes vector similarity search against Supabase using the match_document_chunks RPC.
 * Fallback to in-memory cosine ranking if RPC is not available in local mock/test environment.
 */
export async function executeVectorSearch(
  supabase: SupabaseClient<Database>,
  queryEmbedding: number[],
  workspaceId: string,
  options?: VectorSearchOptions
): Promise<VectorSearchResultChunk[]> {
  const limit = options?.limit || 5
  const threshold = options?.similarityThreshold ?? 0.0

  try {
    // 1. Primary path: pgvector RPC call in PostgreSQL
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_count: limit,
      target_workspace: workspaceId,
      similarity_threshold: threshold,
    })

    if (!error && Array.isArray(data)) {
      return data.map(item => ({
        id: item.id,
        documentId: item.document_id,
        content: item.content,
        similarity: Number(item.similarity.toFixed(4)),
        metadata: (item.metadata as Record<string, unknown>) || {},
      }))
    }

    if (error) {
      console.warn('[VectorSearch] match_document_chunks RPC error, attempting fallback:', error.message)
    }
  } catch (rpcErr) {
    console.warn('[VectorSearch] RPC invocation exception, attempting fallback:', rpcErr)
  }

  // 2. Fallback path: In-memory vector calculation (for mock or non-RPC test environments)
  return await fallbackInMemorySearch(supabase, queryEmbedding, workspaceId, limit, threshold)
}

/**
 * In-memory fallback search for testing and environments where the pgvector RPC is not deployed.
 */
async function fallbackInMemorySearch(
  supabase: SupabaseClient<Database>,
  queryEmbedding: number[],
  workspaceId: string,
  limit: number,
  threshold: number
): Promise<VectorSearchResultChunk[]> {
  // Query document chunks belonging to this workspace
  const { data: chunks, error } = await supabase
    .from('document_chunks')
    .select('id, document_id, content, embedding, metadata, documents!inner(workspace_id)')
    .eq('documents.workspace_id', workspaceId)

  if (error || !chunks) {
    return []
  }

  const results: VectorSearchResultChunk[] = []

  for (const chunk of chunks) {
    if (!chunk.embedding) continue

    let chunkVec: number[] | null = null
    if (Array.isArray(chunk.embedding)) {
      chunkVec = chunk.embedding as number[]
    } else if (typeof chunk.embedding === 'string') {
      try {
        chunkVec = JSON.parse(chunk.embedding)
      } catch {
        // Not a JSON vector
      }
    }

    if (chunkVec && Array.isArray(chunkVec)) {
      const similarity = calculateCosineSimilarity(queryEmbedding, chunkVec)
      if (similarity >= threshold) {
        results.push({
          id: chunk.id,
          documentId: chunk.document_id,
          content: chunk.content,
          similarity: Number(similarity.toFixed(4)),
          metadata: (chunk.metadata as Record<string, unknown>) || {},
        })
      }
    }
  }

  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}
