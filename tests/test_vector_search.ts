import {
  calculateCosineSimilarity,
  executeVectorSearch,
  knowledgeSearchService,
  searchKnowledge,
} from '../lib/knowledge/search'
import { embeddingService } from '../lib/knowledge/embedding'

async function runVectorSearchTests() {
  console.log('=== Starting Phase 5.5 Vector Search Engine Tests ===\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] ${testName}`)
      failed++
    }
  }

  // 1. Test Cosine Similarity Math
  try {
    const v1 = [1, 0, 0, 0]
    const v2 = [1, 0, 0, 0]
    const v3 = [0, 1, 0, 0]
    const v4 = [-1, 0, 0, 0]

    assert(Math.abs(calculateCosineSimilarity(v1, v2) - 1.0) < 0.0001, 'Identical vectors have cosine similarity 1.0')
    assert(Math.abs(calculateCosineSimilarity(v1, v3) - 0.0) < 0.0001, 'Orthogonal vectors have cosine similarity 0.0')
    assert(Math.abs(calculateCosineSimilarity(v1, v4) - (-1.0)) < 0.0001, 'Opposite vectors have cosine similarity -1.0')
    assert(calculateCosineSimilarity([], []) === 0, 'Empty vectors return 0')
  } catch (err) {
    console.error('[FAIL] Cosine similarity test failed:', err)
    failed++
  }

  // 2. Test Query Generates 1536-Dimensional Embedding
  let queryEmbedding: number[] = []
  try {
    const query = 'How does multi-tenant workspace isolation work in chatINALabs?'
    const embedRes = await embeddingService.embed(query)
    queryEmbedding = embedRes.vector

    assert(Array.isArray(queryEmbedding), 'Query embedding is an array')
    assert(queryEmbedding.length === 1536, `Query embedding has 1536 dimensions (got ${queryEmbedding.length})`)
    assert(embedRes.tokens > 0, 'Query embedding returns positive token count')
  } catch (err) {
    console.error('[FAIL] Query embedding generation failed:', err)
    failed++
  }

  // 3. Test RPC Vector Search Execution Flow with Mock Supabase
  try {
    const workspaceId = 'ws-11111111-1111-1111-1111-111111111111'
    const otherWorkspaceId = 'ws-99999999-9999-9999-9999-999999999999'

    // Simulate pre-computed 1536-dim embeddings for document chunks
    const chunk1Embed = (await embeddingService.embed('Multi-tenant workspace isolation enforces boundary separation.')).vector
    const chunk2Embed = (await embeddingService.embed('Invoice billing and subscription pricing tiers.')).vector

    let rpcCalledWith: any = null

    const mockSupabase = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'workspace_members') {
          return {
            select: () => ({
              eq: (col1: string, val1: string) => ({
                eq: (col2: string, val2: string) => ({
                  maybeSingle: () => {
                    // Allow access to workspaceId, deny access to otherWorkspaceId
                    if (val1 === workspaceId) {
                      return Promise.resolve({ data: { workspace_id: workspaceId }, error: null })
                    }
                    return Promise.resolve({ data: null, error: null })
                  },
                }),
              }),
            }),
          }
        }
        return {}
      },
      rpc: (funcName: string, params: Record<string, unknown>) => {
        rpcCalledWith = { funcName, ...params }
        if (funcName === 'match_document_chunks') {
          // Return matched chunks in target workspace
          return Promise.resolve({
            data: [
              {
                id: 'chunk-uuid-1',
                document_id: 'doc-uuid-1',
                content: 'Multi-tenant workspace isolation enforces boundary separation.',
                similarity: 0.8954,
                metadata: { page: 1, source: 'architecture.pdf' },
              },
              {
                id: 'chunk-uuid-2',
                document_id: 'doc-uuid-2',
                content: 'Invoice billing and subscription pricing tiers.',
                similarity: 0.3211,
                metadata: { page: 3, source: 'billing.pdf' },
              },
            ],
            error: null,
          })
        }
        return Promise.resolve({ data: null, error: new Error('Unknown RPC') })
      },
    } as any

    const searchResult = await searchKnowledge(mockSupabase, {
      workspaceId,
      query: 'workspace isolation and multi-tenant security',
      limit: 5,
      similarityThreshold: 0.5,
    })

    assert(rpcCalledWith !== null, 'Supabase match_document_chunks RPC was executed')
    assert(rpcCalledWith?.target_workspace === workspaceId, 'RPC called with target_workspace isolation parameter')
    assert((rpcCalledWith?.query_embedding as number[]).length === 1536, 'RPC called with 1536-dimensional query vector')
    assert(searchResult.chunks.length === 2, 'Search returns matching chunks')
    assert(searchResult.chunks[0].documentId === 'doc-uuid-1', 'Most relevant chunk returned first')
    assert(searchResult.chunks[0].similarity === 0.8954, 'Chunk has calculated similarity score')
    assert(searchResult.chunks[0].content.includes('workspace isolation'), 'Chunk contains expected document content')
    assert(searchResult.totalFound === 2, 'Result reports totalFound count')
    assert(searchResult.queryTimeMs >= 0, 'Result reports queryTimeMs')

    // 4. Test Workspace Isolation Security Enforcement
    try {
      await searchKnowledge(mockSupabase, {
        workspaceId: otherWorkspaceId, // User does not belong to this workspace
        query: 'confidential information',
      })
      assert(false, 'Should throw unauthorized error when accessing unauthorized workspace')
    } catch (unauthErr) {
      assert(
        (unauthErr as Error).message.includes('Unauthorized'),
        'Throws descriptive Unauthorized error when user is not member of target workspace'
      )
    }
  } catch (err) {
    console.error('[FAIL] RPC vector search execution test failed:', err)
    failed++
  }

  // 5. Test In-Memory Vector Search Fallback (Verification of vector math ranking)
  try {
    const wsId = 'ws-local-test'
    const targetText = 'Quantum computing leverages superposition and entanglement.'
    const unrelatedText = 'A recipe for chocolate chip cookies with brown sugar.'

    const targetVec = (await embeddingService.embed(targetText)).vector
    const unrelatedVec = (await embeddingService.embed(unrelatedText)).vector

    const mockFallbackSupabase = {
      auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
      rpc: () => Promise.resolve({ data: null, error: new Error('RPC not installed in test environment') }),
      from: (table: string) => {
        if (table === 'document_chunks') {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 'chunk-target',
                      document_id: 'doc-quantum',
                      content: targetText,
                      embedding: targetVec,
                      metadata: { topic: 'quantum' },
                    },
                    {
                      id: 'chunk-unrelated',
                      document_id: 'doc-cookie',
                      content: unrelatedText,
                      embedding: unrelatedVec,
                      metadata: { topic: 'cooking' },
                    },
                  ],
                  error: null,
                }),
            }),
          }
        }
        return {}
      },
    } as any

    const result = await knowledgeSearchService.searchKnowledge(mockFallbackSupabase, {
      workspaceId: wsId,
      query: 'quantum superposition physics',
      limit: 2,
    })

    assert(result.chunks.length === 2, 'Fallback search returns evaluated chunks')
    assert(result.chunks[0].id === 'chunk-target', 'Quantum physics chunk is ranked #1 for quantum query')
    assert(result.chunks[0].similarity > result.chunks[1].similarity, 'Target chunk has higher similarity than unrelated chunk')
    assert(typeof result.chunks[0].metadata === 'object', 'Chunk metadata is preserved')
  } catch (err) {
    console.error('[FAIL] Fallback vector search test failed:', err)
    failed++
  }

  console.log(`\n=== Test Results: ${passed} passed, ${failed} failed ===\n`)
  if (failed > 0) {
    process.exit(1)
  }
}

runVectorSearchTests().catch(err => {
  console.error('Fatal vector search test error:', err)
  process.exit(1)
})
