import { DocumentExtractor, ExtractionResult } from './types'

/**
 * Plain text extractor for .txt and raw text files.
 */
export class TextExtractor implements DocumentExtractor {
  canHandle(filename: string, mimeType?: string): boolean {
    const ext = filename.toLowerCase().split('.').pop()
    return ext === 'txt' || ext === 'text' || ext === 'log' || mimeType === 'text/plain'
  }

  async extract(buffer: Buffer, filename: string): Promise<ExtractionResult> {
    const text = buffer.toString('utf-8').trim()
    if (!text) {
      throw new Error(`Text file "${filename}" is empty.`)
    }
    return {
      text,
      metadata: { filename, parser: 'text-plain' },
    }
  }
}

/**
 * Markdown extractor for .md, .markdown files.
 */
export class MarkdownExtractor implements DocumentExtractor {
  canHandle(filename: string, mimeType?: string): boolean {
    const ext = filename.toLowerCase().split('.').pop()
    return ext === 'md' || ext === 'markdown' || mimeType === 'text/markdown'
  }

  async extract(buffer: Buffer, filename: string): Promise<ExtractionResult> {
    const text = buffer.toString('utf-8').trim()
    if (!text) {
      throw new Error(`Markdown file "${filename}" is empty.`)
    }
    return {
      text,
      metadata: { filename, parser: 'markdown' },
    }
  }
}

/**
 * DOCX extractor using mammoth.
 */
export class DocxExtractor implements DocumentExtractor {
  canHandle(filename: string, mimeType?: string): boolean {
    const ext = filename.toLowerCase().split('.').pop()
    return (
      ext === 'docx' ||
      ext === 'doc' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    )
  }

  async extract(buffer: Buffer, filename: string): Promise<ExtractionResult> {
    try {
      // Dynamic require to prevent bundling issues with Next.js edge or client
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      const text = (result.value || '').trim()

      if (!text) {
        throw new Error(`No readable text found in DOCX file "${filename}".`)
      }

      return {
        text,
        metadata: {
          filename,
          parser: 'mammoth-docx',
          messages: result.messages || [],
        },
      }
    } catch (err) {
      throw new Error(
        `Failed to extract text from DOCX "${filename}": ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    }
  }
}

/**
 * Structured text extractor for .csv and .json files.
 */
export class StructuredExtractor implements DocumentExtractor {
  canHandle(filename: string, mimeType?: string): boolean {
    const ext = filename.toLowerCase().split('.').pop()
    return ext === 'csv' || ext === 'json' || mimeType === 'text/csv' || mimeType === 'application/json'
  }

  async extract(buffer: Buffer, filename: string): Promise<ExtractionResult> {
    const text = buffer.toString('utf-8').trim()
    if (!text) {
      throw new Error(`Structured file "${filename}" is empty.`)
    }
    return {
      text,
      metadata: { filename, parser: 'structured-text' },
    }
  }
}

export const textExtractor = new TextExtractor()
export const markdownExtractor = new MarkdownExtractor()
export const docxExtractor = new DocxExtractor()
export const structuredExtractor = new StructuredExtractor()
