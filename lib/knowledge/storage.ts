import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { StorageUploadResult } from './types'

export const KNOWLEDGE_FILES_BUCKET = 'knowledge-files'
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md', '.markdown', '.csv', '.json']
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
]

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates file type and size constraints for knowledge base uploads.
 */
export function validateKnowledgeFile(file: { name: string; size: number; type?: string }): FileValidationResult {
  if (!file.name || typeof file.name !== 'string') {
    return { valid: false, error: 'File name is missing or invalid.' }
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    return { valid: false, error: `File size exceeds the 50 MB limit (${sizeMb} MB).` }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(extension)
  const isMimeAllowed = file.type ? ALLOWED_MIME_TYPES.includes(file.type) : true

  if (!isExtensionAllowed && !isMimeAllowed) {
    return {
      valid: false,
      error: `Unsupported file type: "${extension}". Allowed formats: PDF, DOCX, TXT, Markdown, CSV, JSON.`,
    }
  }

  return { valid: true }
}

/**
 * Sanitizes a filename to prevent path traversal and special character issues.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 150)
}

/**
 * Uploads a file to Supabase Storage with workspace and knowledge base path isolation.
 * Path structure: {workspace_id}/{knowledge_base_id}/{document_id}/{filename}
 */
export async function uploadKnowledgeFile(
  supabase: SupabaseClient<Database>,
  params: {
    workspaceId: string
    knowledgeBaseId: string
    file: File | Blob
    filename?: string
    mimeType?: string
    documentId?: string
  }
): Promise<StorageUploadResult> {
  const filename = params.filename || (params.file instanceof File ? params.file.name : 'uploaded-document')
  const mimeType = params.mimeType || params.file.type || 'application/octet-stream'
  const size = params.file.size

  // 1. Validate file
  const validation = validateKnowledgeFile({ name: filename, size, type: mimeType })
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file')
  }

  // 2. Generate document ID
  const documentId = params.documentId || crypto.randomUUID()
  const cleanFilename = sanitizeFilename(filename)

  // 3. Build isolated storage path
  // Structure: {workspace_id}/{knowledge_base_id}/{document_id}/{filename}
  const storagePath = `${params.workspaceId}/${params.knowledgeBaseId}/${documentId}/${cleanFilename}`

  // 4. Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(KNOWLEDGE_FILES_BUCKET)
    .upload(storagePath, params.file, {
      contentType: mimeType,
      upsert: true,
    })

  if (error || !data) {
    console.error('[Storage] Upload error:', error?.message)
    throw new Error(`Failed to upload file to storage: ${error?.message || 'Unknown error'}`)
  }

  return {
    documentId,
    storagePath: data.path || storagePath,
    filename,
    mimeType,
    fileSizeBytes: size,
    bucket: KNOWLEDGE_FILES_BUCKET,
  }
}

/**
 * Deletes a file from Supabase Storage.
 */
export async function deleteKnowledgeFile(
  supabase: SupabaseClient<Database>,
  storagePath: string
): Promise<boolean> {
  if (!storagePath) return true

  const { error } = await supabase.storage
    .from(KNOWLEDGE_FILES_BUCKET)
    .remove([storagePath])

  if (error) {
    console.error('[Storage] Delete error:', error.message)
    return false
  }

  return true
}

/**
 * Generates a secure, expiring URL for accessing a knowledge file.
 */
export async function getKnowledgeFileUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string | null> {
  if (!storagePath) return null

  try {
    const { data, error } = await supabase.storage
      .from(KNOWLEDGE_FILES_BUCKET)
      .createSignedUrl(storagePath, expiresIn)

    if (!error && data?.signedUrl) {
      return data.signedUrl
    }
  } catch {
    // Fallback
  }

  // Fallback to public URL representation
  const { data: publicData } = supabase.storage
    .from(KNOWLEDGE_FILES_BUCKET)
    .getPublicUrl(storagePath)

  return publicData?.publicUrl || null
}

/**
 * Downloads a file buffer from Supabase Storage for server-side processing.
 */
export async function downloadKnowledgeFile(
  supabase: SupabaseClient<Database>,
  storagePath: string
): Promise<Buffer | null> {
  if (!storagePath) return null

  try {
    const { data, error } = await supabase.storage
      .from(KNOWLEDGE_FILES_BUCKET)
      .download(storagePath)

    if (error || !data) {
      console.error('[Storage] Download error:', error?.message)
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.error('[Storage] Download exception:', err)
    return null
  }
}
