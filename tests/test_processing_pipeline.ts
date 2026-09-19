import {
  extractDocumentText,
  chunkText,
  estimateTokenCount,
  pdfExtractor,
  textExtractor,
  markdownExtractor,
  docxExtractor,
} from '../lib/knowledge/processors'

async function runTests() {
  console.log('=== Starting Document Processing Pipeline Tests ===\n')

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

  // 1. Test Text Extractor
  try {
    const textBuffer = Buffer.from('Hello chatINALabs Knowledge Base.\nThis is plain text content.')
    const result = await textExtractor.extract(textBuffer, 'sample.txt')
    assert(result.text.includes('chatINALabs'), 'TextExtractor extracts plain text')
    assert(textExtractor.canHandle('file.txt', 'text/plain'), 'TextExtractor canHandle detects .txt')
  } catch (err) {
    console.error('[FAIL] TextExtractor failed:', err)
    failed++
  }

  // 2. Test Markdown Extractor
  try {
    const mdBuffer = Buffer.from('# Architecture\n\n- Component A\n- Component B\n\n```ts\nconst x = 1;\n```')
    const result = await markdownExtractor.extract(mdBuffer, 'guide.md')
    assert(result.text.includes('# Architecture') && result.text.includes('Component A'), 'MarkdownExtractor extracts markdown')
    assert(markdownExtractor.canHandle('guide.markdown', 'text/markdown'), 'MarkdownExtractor canHandle detects .md/.markdown')
  } catch (err) {
    console.error('[FAIL] MarkdownExtractor failed:', err)
    failed++
  }

  // 3. Test PDF Extractor with a valid 1-page PDF
  try {
    const pdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n4 0 obj<</Length 44>>stream\nBT\n/F1 12 Tf\n72 712 Td\n(chatINALabs Automated PDF Document) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n308\n%%EOF'
    const pdfBuffer = Buffer.from(pdfContent)
    assert(pdfExtractor.canHandle('whitepaper.pdf', 'application/pdf'), 'PdfExtractor canHandle detects .pdf')

    const result = await pdfExtractor.extract(pdfBuffer, 'whitepaper.pdf')
    assert(typeof result.text === 'string' && result.text.length > 0, 'PdfExtractor extracts text or fallback stream from PDF')
    assert(result.pageCount! >= 1, 'PdfExtractor returns pageCount >= 1')
  } catch (err) {
    console.error('[FAIL] PdfExtractor failed:', err)
    failed++
  }

  // 4. Test Docx Extractor format detection & error handling
  try {
    assert(
      docxExtractor.canHandle('proposal.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      'DocxExtractor canHandle detects .docx'
    )
    // Invalid/corrupted buffer should throw cleanly
    try {
      await docxExtractor.extract(Buffer.from('not a docx'), 'corrupted.docx')
      assert(false, 'DocxExtractor should throw on invalid buffer')
    } catch {
      assert(true, 'DocxExtractor throws descriptive error on invalid buffer')
    }
  } catch (err) {
    console.error('[FAIL] DocxExtractor test error:', err)
    failed++
  }

  // 5. Test Unified Extractor Dispatcher
  try {
    const mdResult = await extractDocumentText(Buffer.from('# Dispatcher Test\nBody content'), 'test.md')
    assert(mdResult.text.includes('Dispatcher Test'), 'extractDocumentText dispatches markdown properly')
  } catch (err) {
    console.error('[FAIL] extractDocumentText failed:', err)
    failed++
  }

  // 6. Test Token Estimation
  try {
    const shortTokens = estimateTokenCount('Hello world')
    assert(shortTokens >= 1 && shortTokens <= 4, `estimateTokenCount returns realistic token count for short string (${shortTokens})`)

    const longSentence = 'The quick brown fox jumps over the lazy dog. '.repeat(20)
    const longTokens = estimateTokenCount(longSentence)
    assert(longTokens > 100 && longTokens < 300, `estimateTokenCount scales accurately for paragraphs (${longTokens})`)
  } catch (err) {
    console.error('[FAIL] estimateTokenCount failed:', err)
    failed++
  }

  // 7. Test Chunking
  try {
    // Single short text chunk
    const singleChunks = chunkText('Short note for the knowledge base.')
    assert(singleChunks.length === 1, 'chunkText produces single chunk for small texts')
    assert(singleChunks[0].chunkIndex === 0, 'First chunk has chunkIndex = 0')
    assert(singleChunks[0].tokenCount > 0, 'Chunk has calculated tokenCount')

    // Multi-paragraph long text chunking
    const paragraphs: string[] = []
    for (let i = 1; i <= 20; i++) {
      paragraphs.push(
        `Section ${i}: In chatINALabs AI workspace, documents are ingested into isolated buckets. ` +
        `Each document is segmented into semantic chunks to allow future vector search and RAG retrieval. ` +
        `This section explains paragraph ${i} in thorough detail with various examples and technical references.`
      )
    }
    const longDocument = paragraphs.join('\n\n')
    const chunks = chunkText(longDocument, { maxTokens: 120, overlapTokens: 25 })

    assert(chunks.length > 1, `chunkText splits long document into multiple chunks (produced ${chunks.length} chunks)`)
    
    // Check sequential indexes
    const sequential = chunks.every((c, idx) => c.chunkIndex === idx)
    assert(sequential, 'Chunks have consecutive 0-based chunkIndex')

    // Check all chunks have valid content and token counts
    const validContent = chunks.every(c => c.content.length > 20 && c.tokenCount > 0)
    assert(validContent, 'All chunks have non-empty content and positive token counts')
  } catch (err) {
    console.error('[FAIL] chunkText failed:', err)
    failed++
  }

  console.log(`\n=== Test Results: ${passed} passed, ${failed} failed ===\n`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
