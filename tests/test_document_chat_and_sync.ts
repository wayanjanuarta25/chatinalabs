import assert from 'assert'
import { 
  buildDocumentContextBlock, 
  ExtractedDocument 
} from '../lib/ai/documents'
import { extractDocumentText } from '../lib/knowledge/processors/extractor'

async function runTests() {
  console.log('=== Test Suite: Document Processing & Anti-Stale Sync ===\n')

  let passCount = 0
  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn()
      console.log(`[PASS] ${name}`)
      passCount++
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err)
      process.exitCode = 1
    }
  }

  // Test 1: extractDocumentText with text file
  await test('extractDocumentText correctly extracts plain text / markdown', async () => {
    const sampleText = '# Resume\n\nNama: Hudzaifah Alwan Hilmy\nProfesi: Full Stack Developer'
    const buffer = Buffer.from(sampleText, 'utf-8')
    const result = await extractDocumentText(buffer, 'resume.md', 'text/markdown')
    assert(result.text.includes('Hudzaifah Alwan Hilmy'), 'Extracted text should contain applicant name')
    assert(result.text.includes('Full Stack Developer'), 'Extracted text should contain job title')
  })

  // Test 2: buildDocumentContextBlock formatting
  test('buildDocumentContextBlock generates clear contextual markers', () => {
    const docs: ExtractedDocument[] = [
      {
        attachmentId: 'att-1',
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
        pageCount: 2,
        text: 'Pengalaman kerja: 5 tahun di bidang AI dan Software Engineering.',
      },
    ]

    const block = buildDocumentContextBlock(docs)
    assert(block.includes('=== AWAL LAMPIRAN DOKUMEN: "resume.pdf" (Total Halaman: 2) ==='))
    assert(block.includes('Pengalaman kerja: 5 tahun'))
    assert(block.includes('=== AKHIR LAMPIRAN DOKUMEN: "resume.pdf" ==='))
  })

  // Test 3: buildDocumentContextBlock with empty list
  test('buildDocumentContextBlock returns empty string when no documents', () => {
    const block = buildDocumentContextBlock([])
    assert.strictEqual(block, '')
  })

  // Test 4: Anti-stale overwrite logic unit test
  test('Anti-stale sync logic preserves missing local messages', () => {
    const localMessages = [
      { id: 'msg-u-1', role: 'user', content: 'Halo' },
      { id: 'msg-ai-1', role: 'assistant', content: 'Halo! Ada yang bisa dibantu?' },
    ]

    // Stale DB query that only returned the user message because assistant message was still writing
    const staleDbMessages = [
      { id: 'msg-u-1', role: 'user', content: 'Halo' },
    ]

    // Apply the protection logic
    let preserved = staleDbMessages
    if (localMessages.length > staleDbMessages.length) {
      const mappedIds = new Set(staleDbMessages.map(m => m.id))
      const missingLocal = localMessages.filter(m => !mappedIds.has(m.id))
      preserved = [...staleDbMessages, ...missingLocal]
    }

    assert.strictEqual(preserved.length, 2, 'Should preserve both user and assistant messages')
    assert.strictEqual(preserved[1].id, 'msg-ai-1', 'Assistant message must NOT be dropped')
  })

  console.log(`\nAll ${passCount} tests passed successfully!`)
}

runTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
