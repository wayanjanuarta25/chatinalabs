import { DocumentExtractor, ExtractionResult } from './types'

export class PdfExtractor implements DocumentExtractor {
  canHandle(filename: string, mimeType?: string): boolean {
    const ext = filename.toLowerCase().split('.').pop()
    return ext === 'pdf' || mimeType === 'application/pdf'
  }

  async extract(buffer: Buffer, filename: string): Promise<ExtractionResult> {
    try {
      // Dynamic require to prevent bundling issues with Next.js edge or client
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      let pdfParseFn: any
      try {
        pdfParseFn = require('pdf-parse/lib/pdf-parse.js')
      } catch {
        pdfParseFn = require('pdf-parse')
      }

      if (pdfParseFn?.default && typeof pdfParseFn.default === 'function') {
        pdfParseFn = pdfParseFn.default
      }

      let extractedText = ''
      let pageCount = 1

      if (typeof pdfParseFn === 'function') {
        const data = await pdfParseFn(buffer)
        extractedText = data.text || ''
        pageCount = data.numpages || 1
      } else if (pdfParseFn?.PDFParse) {
        const parser = new pdfParseFn.PDFParse({ data: buffer })
        const result = await parser.getText()
        pageCount = result.total || result.pages?.length || 1
        extractedText = typeof result.text === 'string' ? result.text : ''
        await parser.destroy()
      }

      const cleanedText = this.cleanPdfText(extractedText)
      if (!cleanedText) {
        // Attempt fallback extraction if parser returned empty text
        const fallback = this.fallbackStreamExtraction(buffer)
        if (fallback && fallback.trim().length > 10) {
          return {
            text: this.cleanPdfText(fallback),
            pageCount: 1,
            metadata: { filename, parser: 'pdf-stream-fallback' },
          }
        }
        throw new Error('No readable text could be extracted from this PDF document.')
      }

      return {
        text: cleanedText,
        pageCount,
        metadata: {
          filename,
          parser: 'pdf-parse',
          pageCount,
        },
      }
    } catch (err) {
      // Check fallback stream extraction before throwing
      const fallback = this.fallbackStreamExtraction(buffer)
      if (fallback && fallback.trim().length > 20) {
        return {
          text: this.cleanPdfText(fallback),
          pageCount: 1,
          metadata: { filename, parser: 'pdf-stream-fallback' },
        }
      }

      throw new Error(
        `Failed to extract text from PDF "${filename}": ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    }
  }

  private cleanPdfText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\u0000/g, '') // remove null characters
      .replace(/[ \t]+/g, ' ') // collapse multiple horizontal spaces
      .replace(/\n{3,}/g, '\n\n') // collapse excessive newlines
      .trim()
  }

  private fallbackStreamExtraction(buffer: Buffer): string {
    try {
      const raw = buffer.toString('latin1')
      const matches: string[] = []
      const btEtRegex = /BT[\s\S]*?ET/g
      let match: RegExpExecArray | null
      while ((match = btEtRegex.exec(raw)) !== null) {
        const textBlock = match[0]
        const tjRegex = /\((.*?)\)\s*T[jJ]/g
        let strMatch: RegExpExecArray | null
        while ((strMatch = tjRegex.exec(textBlock)) !== null) {
          matches.push(strMatch[1])
        }
      }
      return matches.join(' ').replace(/\\([()\\])/g, '$1')
    } catch {
      return ''
    }
  }
}

export const pdfExtractor = new PdfExtractor()
