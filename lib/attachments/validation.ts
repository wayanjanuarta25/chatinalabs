/**
 * Phase 6.2.2 Attachment Validation Layer
 */

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
] as const

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.csv',
  '.md',
  '.json',
] as const

export const ALLOWED_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
] as const

export type AttachmentType = 'document' | 'image'

export interface AttachmentMetadata {
  source: 'chat_upload' | 'rag_document' | 'generated_image' | string
  uploaded_from: 'message_composer' | string
  original_name: string
  vision_processing?: {
    status?: 'pending' | 'processed' | 'failed'
    model?: string
    extracted_text?: string
    tokens?: number
  } | null
  generated_image?: {
    prompt?: string
    model?: string
    aspect_ratio?: string
  } | null
  rag_document?: {
    knowledge_base_id?: string
    chunk_count?: number
    indexed?: boolean
  } | null
  [key: string]: unknown
}

export interface AttachmentValidationResult {
  valid: boolean
  error?: string
  attachmentType?: AttachmentType
}

/**
 * Determine attachment type based on MIME type and file extension fallback.
 */
export function getAttachmentType(file: { name: string; type?: string }): AttachmentType | null {
  const mime = file.type?.toLowerCase() || ''
  const ext = getFileExtension(file.name).toLowerCase()

  if (ALLOWED_IMAGE_MIME_TYPES.includes(mime as typeof ALLOWED_IMAGE_MIME_TYPES[number])) {
    return 'image'
  }
  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext as typeof ALLOWED_IMAGE_EXTENSIONS[number])) {
    return 'image'
  }

  if (ALLOWED_DOCUMENT_MIME_TYPES.includes(mime as typeof ALLOWED_DOCUMENT_MIME_TYPES[number])) {
    return 'document'
  }
  if (ALLOWED_DOCUMENT_EXTENSIONS.includes(ext as typeof ALLOWED_DOCUMENT_EXTENSIONS[number])) {
    return 'document'
  }

  return null
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.slice(lastDot) : ''
}

/**
 * Format bytes to readable string (e.g. 2.4 MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Validates a file against size, empty content, supported MIME/ext, and duplicate constraints.
 */
export function validateAttachment(
  file: { name: string; size: number; type?: string },
  existingFiles?: Array<{ name: string; size: number }>
): AttachmentValidationResult {
  // 1. Empty file check
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: `File "${file?.name || 'unknown'}" is empty (0 bytes).`,
    }
  }

  // 2. Max size check (50 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds maximum allowed size of 50 MB (${formatFileSize(file.size)}).`,
    }
  }

  // 3. Supported MIME/type check
  const attachmentType = getAttachmentType(file)
  if (!attachmentType) {
    return {
      valid: false,
      error: `Unsupported file type for "${file.name}". Supported formats: PDF, DOC, DOCX, TXT, CSV, MD, JSON, PNG, JPG, WEBP.`,
    }
  }

  // 4. Duplicate check
  if (existingFiles && existingFiles.length > 0) {
    const isDuplicate = existingFiles.some(
      (existing) => existing.name === file.name && existing.size === file.size
    )
    if (isDuplicate) {
      return {
        valid: false,
        error: `File "${file.name}" has already been attached.`,
      }
    }
  }

  return {
    valid: true,
    attachmentType,
  }
}
