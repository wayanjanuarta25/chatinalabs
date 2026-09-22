import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnkbknbrnatodvkfekyt.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

async function runTests() {
  console.log('=== Phase 6.1 Knowledge Base Foundation Verification ===\n')

  let passCount = 0
  let failCount = 0

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`)
      passCount++
    } else {
      console.error(`[FAIL] ${message}`)
      failCount++
    }
  }

  // 1. Check Tables Exist in Schema
  console.log('--- 1. Verification of Tables in Schema ---')
  const expectedTables = ['knowledge_bases', 'documents', 'document_chunks', 'embeddings']
  for (const table of expectedTables) {
    const { data, error } = await supabase.from(table as any).select('id').limit(1)
    assert(!error, `Table "public.${table}" exists and is accessible (error: ${error?.message || 'none'})`)
  }

  // 2. Check Storage Bucket
  console.log('\n--- 2. Storage Bucket Verification ---')
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets()
  assert(!bucketErr, `Storage listBuckets successful`)
  const kbBucket = buckets?.find(b => b.id === 'knowledge-files')
  assert(Boolean(kbBucket), `Bucket "knowledge-files" exists`)
  assert(kbBucket?.public === false, `Bucket "knowledge-files" is private (not public)`)

  // 3. Multi-Tenant Isolation Data Verification
  console.log('\n--- 3. Multi-Tenant Data Setup & CRUD Verification ---')
  
  // Get an existing workspace or create test ones
  const { data: workspaces, error: wsErr } = await supabase
    .from('workspaces')
    .select('id, owner_id')
    .limit(2)

  assert(Boolean(workspaces && workspaces.length > 0), `At least one workspace found: ${workspaces?.[0]?.id}`)
  const primaryWorkspaceId = workspaces![0].id
  const testUserId = workspaces![0].owner_id

  // Create Knowledge Base in Workspace
  const kbInsertPayload = {
    workspace_id: primaryWorkspaceId,
    name: `Test KB ${Date.now()}`,
    description: 'Knowledge Base for Phase 6.1 verification',
    created_by: testUserId,
  }

  const { data: kbData, error: kbErr } = await supabase
    .from('knowledge_bases')
    .insert(kbInsertPayload)
    .select()
    .single()

  assert(!kbErr && Boolean(kbData), `Created Knowledge Base "${kbData?.name}" in workspace ${primaryWorkspaceId}`)

  if (kbData) {
    // Create Document in KB
    const docInsertPayload = {
      workspace_id: primaryWorkspaceId,
      knowledge_base_id: kbData.id,
      title: 'Manual Kebijakan AI 2026.pdf',
      filename: 'manual-kebijakan-ai.pdf',
      mime_type: 'application/pdf',
      file_size: 1048576,
      storage_path: `${primaryWorkspaceId}/${kbData.id}/doc-1/manual-kebijakan-ai.pdf`,
      status: 'pending',
      uploaded_by: testUserId,
      metadata: { department: 'Engineering', version: '1.0' },
    }

    const { data: docData, error: docErr } = await supabase
      .from('documents')
      .insert(docInsertPayload)
      .select()
      .single()

    if (docErr) {
      console.error('docErr details:', docErr)
    }
    assert(!docErr && Boolean(docData), `Created Document "${docData?.title}" with status: "${docData?.status}"`)

    if (docData) {
      // Create Document Chunk
      const chunkInsertPayload = {
        workspace_id: primaryWorkspaceId,
        document_id: docData.id,
        knowledge_base_id: kbData.id,
        chunk_index: 0,
        content: 'chatINALabs AI Knowledge Base Architecture memisahkan dokumen, chunk, dan vektor embeddings.',
        token_count: 18,
        metadata: { chunkIndex: 0 },
      }

      const { data: chunkData, error: chunkErr } = await supabase
        .from('document_chunks')
        .insert(chunkInsertPayload)
        .select()
        .single()

      assert(!chunkErr && Boolean(chunkData), `Created Document Chunk index: ${chunkData?.chunk_index}`)

      if (chunkData) {
        // Create Embedding in public.embeddings (vector 1536)
        const mockEmbedding = Array(1536).fill(0.01).map((v, i) => (i === 0 ? 0.99 : v))
        const embeddingString = `[${mockEmbedding.join(',')}]`

        const embeddingPayload = {
          workspace_id: primaryWorkspaceId,
          chunk_id: chunkData.id,
          embedding: embeddingString,
          model: 'text-embedding-3-small',
        }

        const { data: embData, error: embErr } = await supabase
          .from('embeddings')
          .insert(embeddingPayload)
          .select()
          .single()

        assert(!embErr && Boolean(embData), `Created Embedding in public.embeddings for chunk: ${embData?.chunk_id}`)

        // Verify relationships and query traversal
        const { data: queriedDoc, error: qErr } = await supabase
          .from('documents')
          .select(`
            id,
            title,
            workspace_id,
            knowledge_bases ( id, name ),
            document_chunks ( id, content, chunk_index, embeddings ( id, model ) )
          `)
          .eq('id', docData.id)
          .single()

        assert(!qErr && Boolean(queriedDoc), `Queried document hierarchy (Doc -> KB -> Chunks -> Embeddings)`)
        const docChunks = (queriedDoc as any)?.document_chunks || []
        assert(docChunks.length > 0, `Traversed chunk relationship successfully (found ${docChunks.length} chunks)`)
        assert(docChunks[0]?.embeddings?.length > 0, `Traversed embedding relationship successfully (found ${docChunks[0]?.embeddings?.length} embeddings)`)

        // Clean up test records
        await supabase.from('embeddings').delete().eq('id', embData!.id)
        await supabase.from('document_chunks').delete().eq('id', chunkData.id)
      }

      await supabase.from('documents').delete().eq('id', docData.id)
    }

    await supabase.from('knowledge_bases').delete().eq('id', kbData.id)
  }

  console.log(`\n=== Verification Complete: ${passCount} passed, ${failCount} failed ===`)
  if (failCount > 0) {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
