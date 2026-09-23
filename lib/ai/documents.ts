import { createAdminClient } from '@/lib/supabase/admin'
import { extractDocumentText } from '@/lib/knowledge/processors/extractor'
import { Database } from '@/lib/supabase/database.types'

type DBAttachment = Database['public']['Tables']['message_attachments']['Row']

export interface ExtractedDocument {
  attachmentId: string
  fileName: string
  mimeType?: string
  text: string
  pageCount?: number
  tokenEstimate?: number
}

// Maximum characters per document to avoid overwhelming LLM context window (~8k - 10k tokens)
const MAX_DOC_CHARS = 35000

/**
 * Downloads a document from the private 'chat-attachments' bucket and extracts its text.
 * Supports PDF, DOCX, TXT, Markdown, CSV, JSON formats.
 */
export async function extractDocumentAttachmentText(
  storagePath: string,
  fileName: string,
  mimeType?: string,
  attachmentId: string = ''
): Promise<ExtractedDocument | null> {
  try {
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase.storage
      .from('chat-attachments')
      .download(storagePath)

    if (error || !data) {
      console.error('[DocumentProcessor] Failed to download document attachment:', storagePath, error?.message)
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const extraction = await extractDocumentText(buffer, fileName, mimeType)
    let text = (extraction.text || '').trim()

    if (!text) {
      console.warn('[DocumentProcessor] Extracted text is empty for:', fileName)
      return null
    }

    if (text.length > MAX_DOC_CHARS) {
      text = text.slice(0, MAX_DOC_CHARS) + `\n\n[...Teks dipotong karena melebihi batas panjang maksimum (${MAX_DOC_CHARS} karakter)...]`
    }

    return {
      attachmentId,
      fileName,
      mimeType,
      text,
      pageCount: extraction.pageCount,
    }
  } catch (err: unknown) {
    console.error('[DocumentProcessor] Error extracting document text:', fileName, err)
    return null
  }
}

/**
 * Extracts all document attachments for a message.
 */
export async function processDocumentAttachments(
  attachments?: DBAttachment[]
): Promise<ExtractedDocument[]> {
  if (!attachments || attachments.length === 0) {
    return []
  }

  const docAttachments = attachments.filter(
    a => a.attachment_type === 'document' && a.storage_path
  )

  if (docAttachments.length === 0) {
    return []
  }

  const results: ExtractedDocument[] = []
  for (const doc of docAttachments) {
    const extracted = await extractDocumentAttachmentText(
      doc.storage_path,
      doc.file_name,
      doc.mime_type,
      doc.id
    )
    if (extracted) {
      results.push(extracted)
    }
  }

  return results
}

/**
 * Formats extracted documents into an injected prompt block like ChatGPT.
 */
export function buildDocumentContextBlock(documents: ExtractedDocument[]): string {
  if (!documents || documents.length === 0) {
    return ''
  }

  const sections = documents.map(doc => {
    const pageInfo = doc.pageCount ? ` (Total Halaman: ${doc.pageCount})` : ''
    return [
      `=== AWAL LAMPIRAN DOKUMEN: "${doc.fileName}"${pageInfo} ===`,
      doc.text,
      `=== AKHIR LAMPIRAN DOKUMEN: "${doc.fileName}" ===`,
    ].join('\n')
  })

  return `\n\nBerikut adalah isi dokumen yang diunggah oleh pengguna:\n\n${sections.join('\n\n')}\n`
}
