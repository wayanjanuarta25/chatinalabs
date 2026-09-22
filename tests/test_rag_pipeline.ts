import {
  buildKnowledgeContext,
  createRAGPrompt,
  ragService,
} from '../lib/knowledge/rag'
import { aiService } from '../lib/ai'
import { embeddingService } from '../lib/knowledge/embedding'

async function runRAGPipelineTests() {
  console.log('=== Starting Phase 5.6 RAG Chat Integration Tests ===\n')

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

  // 1. Test buildKnowledgeContext
  try {
    const mockChunks = [
      {
        id: 'chunk-1',
        documentId: 'doc-1',
        content: 'chatINALabs multi-tenant isolation ensures data segregation between workspaces.',
        similarity: 0.92,
        metadata: { filename: 'security-architecture.pdf' },
      },
      {
        id: 'chunk-2',
        documentId: 'doc-2',
        content: 'PostgreSQL pgvector uses cosine distance <=> for 1536-dimensional similarity searches.',
        similarity: 0.85,
        metadata: { filename: 'database-specs.md' },
      },
    ]

    const contextPayload = buildKnowledgeContext(mockChunks)
    assert(contextPayload.hasKnowledge === true, 'buildKnowledgeContext sets hasKnowledge to true')
    assert(contextPayload.sources.length === 2, 'buildKnowledgeContext generates 2 source citations')
    assert(contextPayload.sources[0].documentTitle === 'security-architecture.pdf', 'Extracts title from metadata')
    assert(contextPayload.sources[0].snippet.includes('chatINALabs'), 'Creates valid snippet for source')
    assert(contextPayload.contextBlock.includes('[Source 1]'), 'Context block contains [Source 1] marker')
    assert(contextPayload.contextBlock.includes('[Source 2]'), 'Context block contains [Source 2] marker')
  } catch (err) {
    console.error('[FAIL] buildKnowledgeContext test failed:', err)
    failed++
  }

  // 2. Test createRAGPrompt
  try {
    const mockContext = {
      contextBlock: '# Knowledge Base Context\n[Source 1]: "security.pdf"\nEncryption at rest.',
      sources: [
        {
          id: 'c1',
          documentId: 'd1',
          documentTitle: 'security.pdf',
          content: 'Encryption at rest.',
          snippet: 'Encryption at rest.',
          similarity: 0.95,
          metadata: {},
        },
      ],
      hasKnowledge: true,
    }

    // Augmented mode
    const augmentedMessages = createRAGPrompt({
      context: mockContext,
      userQuery: 'What encryption is used?',
      history: [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi there!' }],
    })

    assert(augmentedMessages.length >= 3, 'createRAGPrompt generates full conversation array')
    assert(augmentedMessages[0].role === 'system', 'First message is system message')
    assert((augmentedMessages[0].content as string).includes('Encryption at rest'), 'System message includes knowledge context')
    assert(augmentedMessages[augmentedMessages.length - 1].content === 'What encryption is used?', 'Latest user query appended')

    // Fallback mode (no knowledge)
    const fallbackMessages = createRAGPrompt({
      context: { contextBlock: '', sources: [], hasKnowledge: false },
      userQuery: 'Tell me a joke',
      history: [],
    })

    assert(fallbackMessages.length === 2, 'Fallback mode creates 2 messages (system + user)')
    assert(!(fallbackMessages[0].content as string).includes('Knowledge Base Context'), 'Fallback does not contain knowledge block')
  } catch (err) {
    console.error('[FAIL] createRAGPrompt test failed:', err)
    failed++
  }

  // 3. Test RAGService with Mock Supabase
  try {
    const workspaceA = 'ws-aaaa-1111'
    const workspaceB = 'ws-bbbb-2222'

    const docContentA = 'Company policy states annual leave is 20 working days with rollover.'
    const docEmbeddingA = (await embeddingService.embed(docContentA)).vector

    const mockSupabase = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: 'test-user-1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'workspace_members') {
          return {
            select: () => ({
              eq: (c1: string, v1: string) => ({
                eq: (c2: string, v2: string) => ({
                  maybeSingle: () => {
                    // User belongs to workspaceA only
                    if (v1 === workspaceA) return Promise.resolve({ data: { workspace_id: workspaceA }, error: null })
                    return Promise.resolve({ data: null, error: null })
                  },
                }),
              }),
            }),
          }
        }
        if (table === 'documents') {
          return {
            select: () => ({
              in: () =>
                Promise.resolve({
                  data: [{ id: 'doc-policy', title: 'HR Policy 2026', filename: 'leave-policy.pdf' }],
                  error: null,
                }),
            }),
          }
        }
        return {}
      },
      rpc: (name: string, params: any) => {
        if (name === 'match_document_chunks') {
          if (params.target_workspace === workspaceA) {
            return Promise.resolve({
              data: [
                {
                  id: 'chunk-policy-1',
                  document_id: 'doc-policy',
                  content: docContentA,
                  similarity: 0.8872,
                  metadata: { filename: 'leave-policy.pdf' },
                },
              ],
              error: null,
            })
          }
          return Promise.resolve({ data: [], error: null })
        }
        return Promise.resolve({ data: null, error: new Error('Unknown RPC') })
      },
    } as any

    // 3a. Successful RAG preparation with knowledge match
    const ragResult = await ragService.prepareRAGChat(mockSupabase, {
      workspaceId: workspaceA,
      query: 'How many days of annual leave are provided?',
    })

    assert(ragResult.hasKnowledge === true, 'RAG preparation found knowledge for user query')
    assert(ragResult.sources.length === 1, 'RAG preparation returned 1 source citation')
    assert(ragResult.sources[0].documentTitle === 'leave-policy.pdf', 'Source citation has document title')
    assert(ragResult.contextBlock.includes('20 working days'), 'Context block includes document knowledge')

    // 3b. AI Provider answer generation with RAG prompt
    const aiResponse = await aiService.generate({
      model: 'chatinalabs-ai',
      messages: ragResult.messages,
    })

    assert(typeof aiResponse.content === 'string' && aiResponse.content.length > 0, 'AI provider generates response')
    assert(aiResponse.finishReason === 'stop', 'AI response finishes with stop reason')

    // 3c. Workspace Isolation Security Check: Workspace B query must fail for User of Workspace A
    try {
      await ragService.prepareRAGChat(mockSupabase, {
        workspaceId: workspaceB,
        query: 'How many days of annual leave?',
      })
      assert(false, 'Should throw Unauthorized when accessing unauthorized workspace')
    } catch (secErr) {
      assert(
        (secErr as Error).message.includes('Unauthorized'),
        'Throws Unauthorized error when user does not belong to target workspace'
      )
    }

    // 3d. Fallback check: Unrelated question in workspace with no matching chunks
    const emptySupabase = {
      ...mockSupabase,
      rpc: () => Promise.resolve({ data: [], error: null }),
    }

    const fallbackResult = await ragService.prepareRAGChat(emptySupabase, {
      workspaceId: workspaceA,
      query: 'What is the speed of light in vacuum?',
    })

    assert(fallbackResult.hasKnowledge === false, 'Fallback triggered when no chunks match')
    assert(fallbackResult.sources.length === 0, 'No sources returned in fallback mode')
    assert(!(fallbackResult.messages[0].content as string).includes('Workspace Knowledge Base Context'), 'Prompt uses fallback mode')
  } catch (err) {
    console.error('[FAIL] RAGService test failed:', err)
    failed++
  }

  console.log(`\n=== Test Results: ${passed} passed, ${failed} failed ===\n`)
  if (failed > 0) {
    process.exit(1)
  }
}

runRAGPipelineTests().catch(err => {
  console.error('Fatal RAG test error:', err)
  process.exit(1)
})
