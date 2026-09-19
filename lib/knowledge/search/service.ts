import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { SearchKnowledgeParams, SearchKnowledgeResult } from './types'
import { executeVectorSearch } from './vector'
import { embeddingService } from '../embedding'

export class KnowledgeSearchService {
  /**
   * Searches knowledge base document chunks using vector similarity and strict workspace isolation.
   *
   * Flow:
   * 1. Validate security & workspace membership
   * 2. Generate query embedding vector
   * 3. Execute vector similarity search via pgvector match_document_chunks RPC
   * 4. Return ranked chunks
   */
  async searchKnowledge(
    supabase: SupabaseClient<Database>,
    params: SearchKnowledgeParams
  ): Promise<SearchKnowledgeResult> {
    const startTime = Date.now()
    const { workspaceId, query, limit = 5, similarityThreshold = 0.0 } = params

    if (!workspaceId) {
      throw new Error('Workspace ID is required for knowledge search.')
    }

    const cleanQuery = query?.trim()
    if (!cleanQuery) {
      return {
        chunks: [],
        query: '',
        workspaceId,
        totalFound: 0,
        queryTimeMs: Date.now() - startTime,
      }
    }

    // 1. Security check: verify user belongs to the target workspace if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: membership, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberError || !membership) {
        throw new Error(`Unauthorized: User does not have access to workspace ${workspaceId}`)
      }
    }

    // 2. Generate query embedding vector (1536-dimensional)
    const embeddingResult = await embeddingService.embed(cleanQuery)
    const queryEmbedding = embeddingResult.vector

    // 3. Execute vector similarity search with pgvector cosine distance
    const chunks = await executeVectorSearch(supabase, queryEmbedding, workspaceId, {
      limit,
      similarityThreshold,
    })

    return {
      chunks,
      query: cleanQuery,
      workspaceId,
      totalFound: chunks.length,
      queryTimeMs: Date.now() - startTime,
    }
  }
}

export const knowledgeSearchService = new KnowledgeSearchService()
