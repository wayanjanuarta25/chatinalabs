import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnkbknbrnatodvkfekyt.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

async function runAttachmentFoundationTests() {
  console.log('=== Phase 6.2.1 Attachment Architecture Verification ===\n')

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

  // 1. Table Verification
  console.log('--- 1. Table Verification ---')
  const { data: tableCheck, error: tableErr } = await supabase
    .from('message_attachments')
    .select('id')
    .limit(1)

  assert(!tableErr, `Table "public.message_attachments" exists and is queryable`)

  // 2. Storage Bucket Verification
  console.log('\n--- 2. Storage Bucket Verification ---')
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets()
  assert(!bucketErr, `Storage listBuckets successful`)
  const attachmentBucket = buckets?.find(b => b.id === 'chat-attachments')
  assert(Boolean(attachmentBucket), `Bucket "chat-attachments" exists`)
  assert(attachmentBucket?.public === false, `Bucket "chat-attachments" is private (not public)`)

  // 3. Multi-Tenant Data Setup & CRUD Verification
  console.log('\n--- 3. Multi-Tenant Attachment CRUD & Relationships ---')
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, owner_id')
    .limit(1)

  assert(Boolean(workspaces && workspaces.length > 0), `Found active workspace: ${workspaces?.[0]?.id}`)
  const workspaceId = workspaces![0].id
  const userId = workspaces![0].owner_id

  // Create a test conversation
  const { data: convData, error: convErr } = await supabase
    .from('conversations')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      title: `Attachment Test Conv ${Date.now()}`,
      model: 'chatinalabs-ai',
    })
    .select()
    .single()

  assert(!convErr && Boolean(convData), `Created test conversation: ${convData?.id}`)

  if (convData) {
    // Create a user message in conversation
    const { data: msgData, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: convData.id,
        role: 'user',
        content: 'Tolong analisis laporan keuangan pada dokumen terlampir.',
        metadata: { hasAttachments: true },
      })
      .select()
      .single()

    assert(!msgErr && Boolean(msgData), `Created message with attachment intent: ${msgData?.id}`)

    if (msgData) {
      // 1. Insert Document Attachment
      const docAttachmentPayload = {
        message_id: msgData.id,
        workspace_id: workspaceId,
        file_name: 'laporan-keuangan-q3.pdf',
        mime_type: 'application/pdf',
        file_size: 2097152, // 2MB
        storage_path: `${workspaceId}/${convData.id}/${msgData.id}/laporan-keuangan-q3.pdf`,
        attachment_type: 'document' as const,
        metadata: { pages: 12, parsed: false },
      }

      const { data: docAtt, error: docAttErr } = await supabase
        .from('message_attachments')
        .insert(docAttachmentPayload)
        .select()
        .single()

      assert(!docAttErr && Boolean(docAtt), `Inserted document attachment: ${docAtt?.file_name}`)
      assert(docAtt?.attachment_type === 'document', `Attachment type is "document"`)

      // 2. Insert Image Attachment
      const imgAttachmentPayload = {
        message_id: msgData.id,
        workspace_id: workspaceId,
        file_name: 'grafik-pendapatan.png',
        mime_type: 'image/png',
        file_size: 524288, // 512KB
        storage_path: `${workspaceId}/${convData.id}/${msgData.id}/grafik-pendapatan.png`,
        attachment_type: 'image' as const,
        metadata: { width: 1920, height: 1080 },
      }

      const { data: imgAtt, error: imgAttErr } = await supabase
        .from('message_attachments')
        .insert(imgAttachmentPayload)
        .select()
        .single()

      assert(!imgAttErr && Boolean(imgAtt), `Inserted image attachment: ${imgAtt?.file_name}`)
      assert(imgAtt?.attachment_type === 'image', `Attachment type is "image"`)

      // 3. Query relationship: Message -> Attachments
      const { data: msgWithAtts, error: relErr } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          message_attachments (
            id,
            file_name,
            mime_type,
            file_size,
            storage_path,
            attachment_type
          )
        `)
        .eq('id', msgData.id)
        .single()

      assert(!relErr && Boolean(msgWithAtts), `Queried Message with message_attachments relationship`)
      const attachments = (msgWithAtts as any)?.message_attachments || []
      assert(attachments.length === 2, `Traversed relationship successfully: found ${attachments.length} attachments`)
      assert(
        attachments.some((a: any) => a.attachment_type === 'document') &&
        attachments.some((a: any) => a.attachment_type === 'image'),
        `Both "document" and "image" attachments correctly attached to message`
      )

      // Clean up test data (cascade delete message -> attachments)
      await supabase.from('conversations').delete().eq('id', convData.id)
    }
  }

  console.log(`\n=== Verification Results: ${passCount} passed, ${failCount} failed ===`)
  if (failCount > 0) {
    process.exit(1)
  }
}

runAttachmentFoundationTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
