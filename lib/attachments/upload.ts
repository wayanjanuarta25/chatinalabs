import { MessageAttachment } from '@/lib/store/dummyData'

export interface UploadAttachmentOptions {
  file: File
  conversationId: string
  messageId: string
  onProgress?: (percent: number) => void
}

export interface UploadAttachmentResult {
  success: boolean
  attachment?: MessageAttachment
  error?: string
}

/**
 * Upload an attachment file via the secure server upload pipeline.
 */
export async function uploadAttachmentFile({
  file,
  conversationId,
  messageId,
  onProgress,
}: UploadAttachmentOptions): Promise<UploadAttachmentResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversationId', conversationId)
    formData.append('messageId', messageId)

    if (onProgress) {
      onProgress(20)
    }

    const response = await fetch('/api/chat/attachments/upload', {
      method: 'POST',
      body: formData,
    })

    if (onProgress) {
      onProgress(80)
    }

    let data: any = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || `Upload failed with status ${response.status}`,
      }
    }

    if (onProgress) {
      onProgress(100)
    }

    return {
      success: true,
      attachment: data.attachment,
    }
  } catch (error) {
    console.error('[uploadAttachmentFile] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed due to network error',
    }
  }
}

/**
 * Fetch on-demand signed URL for rendering a private attachment.
 */
export async function fetchAttachmentSignedUrl(storagePath: string): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/chat/attachments/signed-url?path=${encodeURIComponent(storagePath)}`
    )
    if (!response.ok) {
      console.warn(`[fetchAttachmentSignedUrl] Failed to fetch signed URL: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.signedUrl || null
  } catch (error) {
    console.error('[fetchAttachmentSignedUrl] Unexpected error:', error)
    return null
  }
}

/**
 * Requirement 2: Flow message_attachments -> storage_path -> getAttachmentSignedUrl() -> render attachment
 * Generates signed URL only on-demand when rendering/reading attachment.
 */
export async function getAttachmentSignedUrl(storagePath: string): Promise<string | null> {
  return fetchAttachmentSignedUrl(storagePath)
}
