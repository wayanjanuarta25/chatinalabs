import assert from 'assert'
import fs from 'fs'

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

import { 
  fastCheckImageIntent, 
  parseAspectRatio, 
  detectAndEnhanceImageIntent,
  generateImageBuffer,
  persistGeneratedImageAttachment
} from '../lib/ai/image-generation'
import { createAdminClient } from '../lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

async function runTests() {
  console.log('\n======================================================')
  console.log('🧪 Starting Phase 6.2.4: AI Image Generation Tests')
  console.log('======================================================\n')

  const adminClient = createAdminClient()

  // 1. Fast Intent Detection
  console.log('[Test 1] Testing fastCheckImageIntent pattern matching...')
  assert.strictEqual(
    fastCheckImageIntent('tolong generate gambar ayam goreng renyah + nasi putih'),
    true,
    'Should detect "tolong generate gambar"'
  )
  assert.strictEqual(
    fastCheckImageIntent('buatkan saya gambar cover tiktok ukuran 9:16 untuk video saya berjudul "TNI Bersama Rakyat"'),
    true,
    'Should detect "buatkan saya gambar cover tiktok"'
  )
  assert.strictEqual(
    fastCheckImageIntent('/image neon cyberpunk city in 2077'),
    true,
    'Should detect /image command'
  )
  assert.strictEqual(
    fastCheckImageIntent('/img cute little red panda'),
    true,
    'Should detect /img command'
  )
  assert.strictEqual(
    fastCheckImageIntent('bagaimana cara membuat loop di python?'),
    false,
    'Should not classify coding question as image generation'
  )
  assert.strictEqual(
    fastCheckImageIntent('apa ibukota negara Indonesia saat ini?'),
    false,
    'Should not classify general knowledge question as image generation'
  )
  console.log('✅ Test 1 Passed: Fast intent detection accurately identifies image requests.\n')

  // 2. Aspect Ratio Parsing
  console.log('[Test 2] Testing aspect ratio and dimensions parsing...')
  const ratioTikTok = parseAspectRatio('cover tiktok ukuran 9:16 untuk video')
  assert.strictEqual(ratioTikTok.aspectRatio, '9:16', 'TikTok request should parse 9:16')
  assert.strictEqual(ratioTikTok.width, 1024)
  assert.strictEqual(ratioTikTok.height, 1792)

  const ratioYT = parseAspectRatio('buatkan thumbnail youtube landscape 16:9')
  assert.strictEqual(ratioYT.aspectRatio, '16:9', 'YouTube request should parse 16:9')
  assert.strictEqual(ratioYT.width, 1792)
  assert.strictEqual(ratioYT.height, 1024)

  const ratioDefault = parseAspectRatio('gambar kucing anggora putih')
  assert.strictEqual(ratioDefault.aspectRatio, '1:1', 'Default should be 1:1')
  assert.strictEqual(ratioDefault.width, 1024)
  assert.strictEqual(ratioDefault.height, 1024)
  console.log('✅ Test 2 Passed: Aspect ratio correctly parsed for 9:16, 16:9, and 1:1.\n')

  // 3. LLM Prompt Enhancement & Intent Analysis
  console.log('[Test 3] Testing detectAndEnhanceImageIntent with LLM prompt enhancer...')
  const userPrompt = 'buatkan saya gambar cover tiktok ukuran 9:16 untuk video saya berjudul "TNI Bersama Rakyat"'
  const intentResult = await detectAndEnhanceImageIntent(userPrompt)
  assert.strictEqual(intentResult.isImageRequest, true, 'Intent should be isImageRequest: true')
  assert(typeof intentResult.englishPrompt === 'string' && intentResult.englishPrompt.length > 20, 'Should generate rich English prompt')
  assert(typeof intentResult.caption === 'string' && intentResult.caption.length > 5, 'Should generate Indonesian friendly caption')
  assert.strictEqual(intentResult.aspectRatio, '9:16', 'Should preserve 9:16 aspect ratio')
  console.log('   Enhanced prompt:', intentResult.englishPrompt.slice(0, 80) + '...')
  console.log('   Generated caption:', intentResult.caption)
  console.log('✅ Test 3 Passed: LLM prompt enhancer created descriptive prompt and caption.\n')

  // 4. Image Binary Buffer Generation
  console.log('[Test 4] Testing generateImageBuffer (FLUX / fallback)...')
  const startTime = Date.now()
  const genResult = await generateImageBuffer('crispy fried chicken with white rice on a clean plate, studio photography', 512, 512)
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`   Generated in ${durationSec}s: ${genResult.buffer.length} bytes, model: ${genResult.model}, type: ${genResult.mimeType}`)
  assert(genResult.buffer.length > 5000, 'Image buffer must be greater than 5KB')
  assert(genResult.mimeType.startsWith('image/'), 'Mime type must be an image')
  console.log('✅ Test 4 Passed: Image generation buffer successfully generated.\n')

  // 5. Storage Persistence & message_attachments DB Insertion
  console.log('[Test 5] Testing storage persistence & message_attachments registration...')
  // Find an existing workspace & conversation to test against
  const { data: conv } = await adminClient
    .from('conversations')
    .select('id, workspace_id, user_id')
    .limit(1)
    .single()

  assert(conv, 'Must have at least one existing conversation for testing')

  // Create a temporary assistant message
  const testMsgId = crypto.randomUUID()
  const { data: createdMsg, error: msgErr } = await adminClient
    .from('messages')
    .insert({
      id: testMsgId,
      conversation_id: conv.id,
      role: 'assistant',
      content: 'Berikut adalah gambar yang telah digenerate:',
      metadata: { isGeneratedImage: true, test: true },
    })
    .select()
    .single()

  assert(!msgErr && createdMsg, 'Should insert assistant message row')

  const attachment = await persistGeneratedImageAttachment({
    workspaceId: conv.workspace_id,
    conversationId: conv.id,
    messageId: testMsgId,
    buffer: genResult.buffer,
    mimeType: genResult.mimeType,
    suggestedFileName: 'tni-bersama-rakyat.jpg',
    prompt: userPrompt,
    englishPrompt: intentResult.englishPrompt!,
    model: genResult.model,
    aspectRatio: '9:16',
  })

  assert(attachment.id, 'Attachment must have an ID')
  assert(attachment.storage_path.includes('chat-attachments') || attachment.storage_path.includes(testMsgId), 'Storage path must match pattern')
  assert(attachment.signedUrl.startsWith('http'), 'Signed URL must be generated')
  assert.strictEqual(attachment.attachment_type, 'image', 'Attachment type must be image')
  assert.strictEqual((attachment.metadata as any).source, 'generated_image', 'Source metadata must be generated_image')

  console.log('   Attachment ID:', attachment.id)
  console.log('   Storage Path:', attachment.storage_path)
  console.log('   Signed URL generated:', attachment.signedUrl.slice(0, 60) + '...')
  console.log('✅ Test 5 Passed: Image persisted to chat-attachments bucket and recorded in message_attachments.\n')

  // 6. Cleanup test records
  console.log('[Test 6] Cleaning up test message and attachment...')
  await adminClient.from('message_attachments').delete().eq('id', attachment.id)
  await adminClient.storage.from('chat-attachments').remove([attachment.storage_path])
  await adminClient.from('messages').delete().eq('id', testMsgId)
  console.log('✅ Test 6 Passed: Test records and storage objects cleanly removed.\n')

  console.log('======================================================')
  console.log('🎉 ALL PHASE 6.2.4 IMAGE GENERATION TESTS PASSED!')
  console.log('======================================================\n')
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
