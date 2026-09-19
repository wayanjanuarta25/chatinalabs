import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { searchKnowledge } from '../search'
import { buildKnowledgeContext } from './context'
import { createRAGPrompt } from './prompt'
import { RAGChatOptions, RAGPreparationResult } from './types'

export class RAGService {
  /**
   * Prepares a RAG-augmented chat prompt by querying the workspace knowledge base,
   * building context, citing sources, and falling back gracefully to normal chat
   * if no relevant knowledge is found.
   */
  async prepareRAGChat(
    supabase: SupabaseClient<Database>,
    params: RAGChatOptions
  ): Promise<RAGPreparationResult> {
    const { workspaceId, query, history = [], options } = params

    if (!workspaceId) {
      throw new Error('Workspace ID is required for RAG chat preparation.')
    }

    const cleanQuery = query.trim()
    const maxChunks = options?.maxChunks || 5
    const similarityThreshold = options?.similarityThreshold ?? 0.2
    const maxContextTokens = options?.maxContextTokens || 2000

    // 1. If query is empty, return standard history without retrieval
    if (!cleanQuery) {
      const fallbackPrompt = createRAGPrompt({
        context: { contextBlock: '', sources: [], hasKnowledge: false },
        userQuery: cleanQuery,
        history,
        systemPrompt: options?.systemPrompt,
      })
      return {
        messages: fallbackPrompt,
        sources: [],
        hasKnowledge: false,
        contextBlock: '',
      }
    }

    try {
      // 2. Perform vector search in target workspace
      const searchResult = await searchKnowledge(supabase, {
        workspaceId,
        query: cleanQuery,
        limit: maxChunks,
        similarityThreshold,
      })

      const relevantChunks = searchResult.chunks

      // 3. Fallback: If no matching chunks exceed the threshold, fall back to normal chat
      if (relevantChunks.length === 0) {
        const fallbackPrompt = createRAGPrompt({
          context: { contextBlock: '', sources: [], hasKnowledge: false },
          userQuery: cleanQuery,
          history,
          systemPrompt: options?.systemPrompt,
        })
        return {
          messages: fallbackPrompt,
          sources: [],
          hasKnowledge: false,
          contextBlock: '',
        }
      }

      // 4. Resolve document titles for clean citations if not already in chunk metadata
      const docIds = Array.from(new Set(relevantChunks.map(c => c.documentId)))
      const titlesByDocId = new Map<string, string>()

      if (docIds.length > 0) {
        const { data: docs } = await supabase
          .from('documents')
          .select('id, title, filename')
          .in('id', docIds)

        if (docs) {
          for (const doc of docs) {
            titlesByDocId.set(doc.id, doc.filename || doc.title || 'Document')
          }
        }
      }

      // 5. Build structured knowledge context with source citations
      const context = buildKnowledgeContext(relevantChunks, {
        maxTokens: maxContextTokens,
        titlesByDocId,
      })

      // 6. Create RAG prompt messages for AI provider
      const augmentedMessages = createRAGPrompt({
        context,
        userQuery: cleanQuery,
        history,
        systemPrompt: options?.systemPrompt,
      })

      return {
        messages: augmentedMessages,
        sources: context.sources,
        hasKnowledge: context.hasKnowledge,
        contextBlock: context.contextBlock,
      }
    } catch (err) {
      // Security: Do not mask unauthorized workspace access errors
      if (err instanceof Error && err.message.toLowerCase().includes('unauthorized')) {
        throw err
      }

      console.warn('[RAGService] Knowledge search failed, falling back to normal chat mode:', err)

      // Graceful fallback to normal conversation on standard search/RPC errors
      const fallbackPrompt = createRAGPrompt({
        context: { contextBlock: '', sources: [], hasKnowledge: false },
        userQuery: cleanQuery,
        history,
        systemPrompt: options?.systemPrompt,
      })

      return {
        messages: fallbackPrompt,
        sources: [],
        hasKnowledge: false,
        contextBlock: '',
      }
    }
  }
}

export const ragService = new RAGService()
