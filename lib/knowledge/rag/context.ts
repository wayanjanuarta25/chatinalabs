import { VectorSearchResultChunk } from '../search/types'
import { RAGContextPayload, RAGSourceCitation } from './types'

/**
 * Builds a structured markdown context block and source citations list from retrieved chunks.
 */
export function buildKnowledgeContext(
  chunks: VectorSearchResultChunk[],
  options?: {
    maxTokens?: number
    titlesByDocId?: Map<string, string>
  }
): RAGContextPayload {
  if (!chunks || chunks.length === 0) {
    return {
      contextBlock: '',
      sources: [],
      hasKnowledge: false,
    }
  }

  const maxTokens = options?.maxTokens || 2000
  let tokenBudget = maxTokens
  const citations: RAGSourceCitation[] = []
  const contextParts: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const title =
      (chunk.metadata?.filename as string) ||
      (chunk.metadata?.title as string) ||
      options?.titlesByDocId?.get(chunk.documentId) ||
      'Workspace Document'

    const snippet = chunk.content.length > 200
      ? chunk.content.slice(0, 197).trim() + '...'
      : chunk.content.trim()

    const estimatedTokens = Math.max(1, Math.ceil(chunk.content.length / 4))
    if (tokenBudget <= 0 && i > 0) break

    tokenBudget -= estimatedTokens

    const sourceNumber = i + 1
    citations.push({
      id: chunk.id,
      documentId: chunk.documentId,
      documentTitle: title,
      content: chunk.content,
      snippet,
      similarity: chunk.similarity,
      metadata: chunk.metadata || {},
    })

    contextParts.push(
      `[Source ${sourceNumber}]: "${title}" (Relevance: ${(chunk.similarity * 100).toFixed(1)}%)\n${chunk.content.trim()}`
    )
  }

  const contextBlock = [
    '# Workspace Knowledge Base Context',
    'The following verified source excerpts have been retrieved from the user workspace knowledge base to inform your answer:',
    '',
    contextParts.join('\n\n---\n\n'),
    '',
    'Instructions: Use the above excerpts to answer accurately. Cite sources using [Source 1], [Source 2], etc. where appropriate.',
  ].join('\n')

  return {
    contextBlock,
    sources: citations,
    hasKnowledge: citations.length > 0,
  }
}
