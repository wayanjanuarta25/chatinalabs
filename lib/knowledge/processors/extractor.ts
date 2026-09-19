import { pdfExtractor } from './pdf'
import { textExtractor, markdownExtractor, docxExtractor, structuredExtractor } from './text'
import { ChunkingOptions, DocumentExtractor, ExtractionResult, ProcessedChunk } from './types'

const EXTRACTORS: DocumentExtractor[] = [
  pdfExtractor,
  docxExtractor,
  markdownExtractor,
  textExtractor,
  structuredExtractor,
]

/**
 * Robust token estimation heuristic.
 * Balances character length (~3.8 chars per token) and whitespace word count (~1.3 tokens per word).
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.trim().length === 0) return 0
  const charTokens = Math.ceil(text.length / 3.8)
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const wordTokens = Math.ceil(words * 1.3)
  return Math.max(1, Math.round((charTokens + wordTokens) / 2))
}

/**
 * Unified document text extraction dispatcher.
 * Selects the appropriate extractor based on filename and MIME type.
 */
export async function extractDocumentText(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<ExtractionResult> {
  for (const extractor of EXTRACTORS) {
    if (extractor.canHandle(filename, mimeType)) {
      const result = await extractor.extract(buffer, filename, mimeType)
      return {
        ...result,
        text: sanitizeText(result.text),
      }
    }
  }

  // Fallback: if not binary/executable, attempt UTF-8 string decoding
  const ext = filename.toLowerCase().split('.').pop()
  const binaryExtensions = ['exe', 'zip', 'tar', 'gz', 'bin', 'png', 'jpg', 'jpeg', 'gif', 'mp4']
  if (!binaryExtensions.includes(ext || '')) {
    const text = buffer.toString('utf-8').trim()
    if (text && text.length > 0) {
      return {
        text: sanitizeText(text),
        metadata: { filename, parser: 'generic-utf8-fallback' },
      }
    }
  }

  throw new Error(
    `Unsupported document format for "${filename}". Supported: PDF, DOCX, TXT, Markdown, CSV, JSON.`
  )
}

/**
 * Normalizes text content: strips null bytes, regularizes line breaks and whitespace.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Breaks long document text into semantic chunks with bounded token sizes.
 * Respects paragraph and sentence boundaries, with configurable overlap.
 */
export function chunkText(
  text: string,
  options?: ChunkingOptions
): ProcessedChunk[] {
  const maxTokens = options?.maxTokens || 500
  const overlapTokens = options?.overlapTokens || 50
  const minChunkChars = options?.minChunkChars || 30

  if (!text || text.trim().length === 0) {
    return []
  }

  const cleanText = sanitizeText(text)
  const totalTokens = estimateTokenCount(cleanText)

  // If entire text fits in one chunk, return single chunk
  if (totalTokens <= maxTokens) {
    return [
      {
        chunkIndex: 0,
        content: cleanText,
        tokenCount: totalTokens,
        metadata: {
          startChar: 0,
          endChar: cleanText.length,
          chunkType: 'single',
        },
      },
    ]
  }

  // 1. Break into paragraphs
  const rawParagraphs = cleanText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  const segments: string[] = []

  for (const p of rawParagraphs) {
    const pTokens = estimateTokenCount(p)
    if (pTokens <= maxTokens) {
      segments.push(p)
    } else {
      // Split large paragraph into sentences
      const sentences = p.split(/(?<=[.?!])\s+/).filter(Boolean)
      let currentSentenceGroup = ''

      for (const sentence of sentences) {
        const candidate = currentSentenceGroup ? `${currentSentenceGroup} ${sentence}` : sentence
        if (estimateTokenCount(candidate) <= maxTokens) {
          currentSentenceGroup = candidate
        } else {
          if (currentSentenceGroup) {
            segments.push(currentSentenceGroup.trim())
          }
          currentSentenceGroup = sentence
        }
      }
      if (currentSentenceGroup) {
        segments.push(currentSentenceGroup.trim())
      }
    }
  }

  // 2. Aggregate segments into chunks with overlap
  const chunks: ProcessedChunk[] = []
  let currentChunkText = ''
  let chunkIndex = 0

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const candidateText = currentChunkText ? `${currentChunkText}\n\n${segment}` : segment
    const candidateTokens = estimateTokenCount(candidateText)

    if (candidateTokens <= maxTokens) {
      currentChunkText = candidateText
    } else {
      // Chunk capacity reached; push existing chunk if valid
      if (currentChunkText && currentChunkText.length >= minChunkChars) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: currentChunkText.trim(),
          tokenCount: estimateTokenCount(currentChunkText),
          metadata: {
            chunkNumber: chunkIndex,
          },
        })

        // Build overlap from the tail of current chunk
        if (overlapTokens > 0) {
          const words = currentChunkText.split(/\s+/)
          const overlapWordCount = Math.min(
            Math.round(overlapTokens * 0.8),
            Math.floor(words.length / 2)
          )
          const overlapText = words.slice(-overlapWordCount).join(' ')
          currentChunkText = `${overlapText}\n\n${segment}`
        } else {
          currentChunkText = segment
        }
      } else {
        currentChunkText = segment
      }
    }
  }

  // Push remainder
  if (currentChunkText && currentChunkText.trim().length >= minChunkChars) {
    chunks.push({
      chunkIndex: chunkIndex++,
      content: currentChunkText.trim(),
      tokenCount: estimateTokenCount(currentChunkText),
      metadata: {
        chunkNumber: chunkIndex,
      },
    })
  }

  return chunks
}
