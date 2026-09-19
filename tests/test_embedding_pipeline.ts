import {
  embeddingService,
  getEmbeddingProvider,
  SimulatedEmbeddingProvider,
  OpenAIEmbeddingProvider,
  EmbeddingWorker,
} from '../lib/knowledge/embedding'

async function runEmbeddingTests() {
  console.log('=== Starting Phase 5.4 Embedding Pipeline Tests ===\n')

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

  // 1. Test SimulatedEmbeddingProvider
  try {
    const provider = new SimulatedEmbeddingProvider()
    assert(provider.dimensions === 1536, 'Provider dimensions equals 1536')
    assert(typeof provider.model === 'string', 'Provider specifies model name')

    const res = await provider.embed('chatINALabs AI Knowledge Base test sentence.')
    assert(Array.isArray(res.vector), 'embed() returns vector array')
    assert(res.vector.length === 1536, `Vector has exactly 1536 dimensions (got ${res.vector.length})`)
    assert(res.tokens > 0, `Returns valid tokens count (${res.tokens})`)
    assert(typeof res.model === 'string', `Returns model identifier (${res.model})`)

    // Verify L2 normalization (unit length: sum of squares ≈ 1.0)
    const normSquared = res.vector.reduce((sum, v) => sum + v * v, 0)
    assert(Math.abs(normSquared - 1.0) < 0.01, `Vector is normalized unit vector (norm^2 = ${normSquared.toFixed(4)})`)
  } catch (err) {
    console.error('[FAIL] SimulatedEmbeddingProvider test failed:', err)
    failed++
  }

  // 2. Test Batch Embedding
  try {
    const provider = new SimulatedEmbeddingProvider()
    const texts = [
      'Document chunk 1: Introduction to system architecture',
      'Document chunk 2: Multi-tenant workspace isolation',
      'Document chunk 3: pgvector storage and cosine similarity',
    ]

    const batchRes = await provider.embedBatch(texts)
    assert(batchRes.embeddings.length === 3, 'embedBatch returns embeddings for all input texts')
    assert(batchRes.embeddings.every(e => e.length === 1536), 'All batch embeddings have 1536 dimensions')
    assert(batchRes.totalTokens > 0, `Batch totalTokens is positive (${batchRes.totalTokens})`)

    // Cosine similarity between chunk 1 and chunk 2
    function cosineSimilarity(a: number[], b: number[]) {
      return a.reduce((sum, val, idx) => sum + val * b[idx], 0)
    }

    const simSelf = cosineSimilarity(batchRes.embeddings[0], batchRes.embeddings[0])
    assert(Math.abs(simSelf - 1.0) < 0.01, `Self-similarity is ~1.0 (${simSelf.toFixed(4)})`)

    const simDifferent = cosineSimilarity(batchRes.embeddings[0], batchRes.embeddings[2])
    assert(simDifferent < 0.99, `Distinct texts have cosine similarity < 1.0 (${simDifferent.toFixed(4)})`)
  } catch (err) {
    console.error('[FAIL] Batch embedding test failed:', err)
    failed++
  }

  // 3. Test EmbeddingService embedChunks
  try {
    const chunks = [
      { chunkId: 'c1', content: 'First segment of document text.' },
      { chunkId: 'c2', content: 'Second segment with additional knowledge.' },
    ]

    const embeddedChunks = await embeddingService.embedChunks(chunks)
    assert(embeddedChunks.length === 2, 'embedChunks returns embedded chunk records')
    assert(embeddedChunks[0].chunkId === 'c1', 'Retains original chunkId')
    assert(embeddedChunks[0].vector.length === 1536, 'Embedded chunk vector has 1536 dimensions')
    assert(typeof embeddedChunks[0].model === 'string', 'Embedded chunk contains model')
    assert(embeddedChunks[0].tokens > 0, 'Embedded chunk contains token count')
  } catch (err) {
    console.error('[FAIL] EmbeddingService test failed:', err)
    failed++
  }

  // 4. Test Provider Abstraction Resolution
  try {
    const activeProvider = getEmbeddingProvider()
    assert(typeof activeProvider.embed === 'function', 'getEmbeddingProvider returns valid provider with embed()')
    assert(typeof activeProvider.embedBatch === 'function', 'Provider has embedBatch()')
    assert(activeProvider.dimensions === 1536, 'Provider dimensions is 1536')
  } catch (err) {
    console.error('[FAIL] Provider resolution test failed:', err)
    failed++
  }

  // 5. Test Mock EmbeddingWorker execution flow
  try {
    const mockWorker = new EmbeddingWorker()
    assert(typeof mockWorker.processJob === 'function', 'EmbeddingWorker has processJob')
    assert(typeof mockWorker.processDocumentEmbeddings === 'function', 'EmbeddingWorker has processDocumentEmbeddings')

    // Mock Supabase client to test embedDocumentChunks and worker update flow
    const fakeChunks = [
      { id: 'chunk-1', content: 'Supabase pgvector embedding chunk 1', chunk_index: 0 },
      { id: 'chunk-2', content: 'Supabase pgvector embedding chunk 2', chunk_index: 1 },
    ]

    const updatedRows: Record<string, unknown>[] = []

    const mockSupabase = {
      from: (table: string) => {
        if (table === 'document_chunks') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: fakeChunks, error: null }),
              }),
            }),
            update: (payload: Record<string, unknown>) => ({
              eq: (col: string, val: string) => {
                updatedRows.push({ ...payload, id: val })
                return Promise.resolve({ error: null })
              },
            }),
          }
        }
        if (table === 'processing_jobs') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: 'job-emb-1',
                      document_id: 'doc-1',
                      job_type: 'embedding',
                      status: 'pending',
                      progress: 0,
                    },
                    error: null,
                  }),
              }),
            }),
            update: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }
        }
        return {}
      },
    } as any

    const jobResult = await mockWorker.processJob(mockSupabase, 'job-emb-1')
    assert(jobResult.status === 'completed', 'Mock EmbeddingWorker successfully processes job to completed')
    assert(jobResult.chunkCount === 2, 'Embedded 2 chunks in test flow')
    assert(updatedRows.length === 2, 'Updated 2 rows in document_chunks table')
    assert(
      (updatedRows[0].embedding as number[]).length === 1536,
      'document_chunks.embedding populated with 1536 dimensions'
    )
    assert(typeof updatedRows[0].embedded_at === 'string', 'document_chunks.embedded_at populated with timestamp')
    assert(typeof updatedRows[0].embedding_model === 'string', 'document_chunks.embedding_model populated')
  } catch (err) {
    console.error('[FAIL] EmbeddingWorker mock flow test failed:', err)
    failed++
  }

  console.log(`\n=== Test Results: ${passed} passed, ${failed} failed ===\n`)
  if (failed > 0) {
    process.exit(1)
  }
}

runEmbeddingTests().catch(err => {
  console.error('Fatal embedding test error:', err)
  process.exit(1)
})
