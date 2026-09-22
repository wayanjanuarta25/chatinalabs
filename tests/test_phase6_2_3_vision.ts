import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase/database.types'
import { 
  buildMultimodalMessageContent, 
  getImageBase64DataUrl, 
  markAttachmentsAsVisionProcessed 
} from '../lib/ai/vision'
import { aiService } from '../lib/ai/provider'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnkbknbrnatodvkfekyt.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

async function runVisionTests() {
  console.log('========================================================')
  console.log('   chatINALabs AI — Phase 6.2.3 Multimodal Vision AI')
  console.log('========================================================\n')

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

  // --- Suite 1: Multimodal Message Builder Unit Tests ---
  console.log('--- 1. Multimodal Message Builder Tests ---')

  // 1.1 Text-only fallback when no attachments
  const textOnly = await buildMultimodalMessageContent('Halo apa kabar?')
  assert(typeof textOnly === 'string' && textOnly === 'Halo apa kabar?', 'Text message without attachments returns plain string')

  // 1.2 Document attachments do not trigger image_url
  const docOnly = await buildMultimodalMessageContent('Ini file dokumen', [
    {
      id: 'doc-1',
      message_id: 'msg-1',
      workspace_id: 'ws-1',
      file_name: 'laporan.pdf',
      mime_type: 'application/pdf',
      file_size: 1024,
      storage_path: 'ws-1/conv-1/msg-1/laporan.pdf',
      attachment_type: 'document',
      metadata: {},
      created_at: new Date().toISOString(),
    }
  ])
  assert(typeof docOnly === 'string' && docOnly === 'Ini file dokumen', 'Document attachments are not converted to image_url parts')

  // --- Suite 2: Storage Upload & Multimodal Content Construction ---
  console.log('\n--- 2. Storage Image to Base64 Conversion ---')

  const { data: workspaces } = await supabase.from('workspaces').select('id, owner_id').limit(1)
  assert(Boolean(workspaces && workspaces.length > 0), `Active workspace found: ${workspaces?.[0]?.id}`)
  const workspaceId = workspaces![0].id
  const userId = workspaces![0].owner_id

  const { data: conv } = await supabase.from('conversations').insert({
    workspace_id: workspaceId,
    user_id: userId,
    title: 'Vision Test Conversation',
  }).select().single()
  const conversationId = conv!.id

  const testMessageId = crypto.randomUUID()
  const { data: msg } = await supabase.from('messages').insert({
    id: testMessageId,
    conversation_id: conversationId,
    role: 'user',
    content: 'Apa warna piksel gambar terlampir ini?',
  }).select().single()

  // 1x1 transparent PNG binary
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )
  const imgStoragePath = `${workspaceId}/${conversationId}/${testMessageId}/test-pixel.png`

  const { error: upErr } = await supabase.storage
    .from('chat-attachments')
    .upload(imgStoragePath, samplePngBuffer, { contentType: 'image/png', upsert: true })

  assert(!upErr, `Uploaded sample test PNG to storage: ${imgStoragePath}`)

  const { data: attRecord, error: attErr } = await supabase
    .from('message_attachments')
    .insert({
      message_id: testMessageId,
      workspace_id: workspaceId,
      file_name: 'test-pixel.png',
      mime_type: 'image/png',
      file_size: samplePngBuffer.length,
      storage_path: imgStoragePath,
      attachment_type: 'image',
      metadata: {
        source: 'chat_upload',
        uploaded_from: 'message_composer',
        original_name: 'test-pixel.png',
        vision_processing: null,
      },
    })
    .select()
    .single()

  assert(!attErr && Boolean(attRecord), `Recorded image attachment: ${attRecord?.id}`)

  // 2.2 Test Base64 Data URL generation
  const base64Url = await getImageBase64DataUrl(imgStoragePath, 'image/png')
  assert(Boolean(base64Url && base64Url.startsWith('data:image/png;base64,')), 'Generated valid Base64 Data URL from private storage')

  // 2.3 Test buildMultimodalMessageContent with active image attachment
  const multimodalContent = await buildMultimodalMessageContent(
    'Jelaskan warna piksel gambar ini.',
    [attRecord!]
  )

  assert(Array.isArray(multimodalContent), 'Multimodal content is structured as content parts array')
  const contentParts = multimodalContent as Array<{ type: string; [key: string]: unknown }>
  assert(contentParts.length === 2, `Contains 2 parts: text and image_url (got ${contentParts.length})`)
  assert(contentParts[0].type === 'text', 'First part is text prompt')
  assert(contentParts[1].type === 'image_url', 'Second part is image_url')

  // --- Suite 3: Live Multimodal Vision Analysis via AI Provider ---
  console.log('\n--- 3. Live Vision AI Inference Test ---')

  const aiResponse = await aiService.generate({
    model: 'chatinalabs-ai',
    messages: [
      {
        role: 'user',
        content: multimodalContent,
      },
    ],
  })

  console.log('[Vision AI Output]:', aiResponse.content)
  assert(Boolean(aiResponse.content && aiResponse.content.length > 0), 'AI Provider returned response for multimodal vision input')
  assert(!aiResponse.content.includes('unggah atau kirim gambarnya'), 'AI recognized image and did NOT claim lack of image input')

  // --- Suite 4: Vision Processing Metadata Update ---
  console.log('\n--- 4. Metadata Update on Completion ---')
  await markAttachmentsAsVisionProcessed([attRecord!.id], 'chatinalabs-ai')

  const { data: updatedAtt } = await supabase
    .from('message_attachments')
    .select('metadata')
    .eq('id', attRecord!.id)
    .single()

  const visionMeta = (updatedAtt?.metadata as any)?.vision_processing
  assert(visionMeta?.status === 'processed', 'Attachment metadata updated with status: "processed"')
  assert(Boolean(visionMeta?.processed_at), 'Attachment metadata recorded processed_at timestamp')

  // Clean up
  await supabase.storage.from('chat-attachments').remove([imgStoragePath])
  await supabase.from('conversations').delete().eq('id', conversationId)

  // --- Summary ---
  console.log('\n========================================================')
  console.log(`Phase 6.2.3 Test Results: ${passCount} passed, ${failCount} failed`)
  console.log('========================================================')

  if (failCount > 0) {
    process.exit(1)
  }
}

runVisionTests().catch(err => {
  console.error('Fatal vision test error:', err)
  process.exit(1)
})
