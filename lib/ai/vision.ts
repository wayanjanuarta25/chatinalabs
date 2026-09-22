import { createAdminClient } from '@/lib/supabase/admin'
import { AIMessageContent, AIMessageContentPart } from './types'
import { Database } from '@/lib/supabase/database.types'

type DBAttachment = Database['public']['Tables']['message_attachments']['Row']

/**
 * Downloads an image from the private 'chat-attachments' bucket and converts it
 * to a base64 Data URL (data:image/...;base64,...).
 */
export async function getImageBase64DataUrl(storagePath: string, mimeType: string): Promise<string | null> {
  try {
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase.storage
      .from('chat-attachments')
      .download(storagePath)

    if (error || !data) {
      console.error('[Vision] Failed to download image attachment from storage:', storagePath, error?.message)
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const cleanMime = mimeType || 'image/png'

    return `data:${cleanMime};base64,${base64}`
  } catch (err: unknown) {
    console.error('[Vision] Unexpected error converting image to base64:', err)
    return null
  }
}

/**
 * Builds multimodal content parts for an AIMessage from a text prompt and attachments.
 * If there are image attachments, returns AIMessageContentPart[] containing both text and image_url.
 * If there are no image attachments, returns the original text string.
 */
export async function buildMultimodalMessageContent(
  text: string,
  attachments?: DBAttachment[]
): Promise<AIMessageContent> {
  if (!attachments || attachments.length === 0) {
    return text
  }

  const imageAttachments = attachments.filter(a => a.attachment_type === 'image' && a.storage_path)
  if (imageAttachments.length === 0) {
    return text
  }

  const parts: AIMessageContentPart[] = []

  // Add the user's text prompt if present
  const trimmedText = text.trim()
  if (trimmedText) {
    parts.push({
      type: 'text',
      text: trimmedText,
    })
  } else {
    parts.push({
      type: 'text',
      text: 'Jelaskan gambar ini secara detail.',
    })
  }

  // Convert each image attachment to multimodal image_url part
  for (const att of imageAttachments) {
    const dataUrl = await getImageBase64DataUrl(att.storage_path, att.mime_type)
    if (dataUrl) {
      parts.push({
        type: 'image_url',
        image_url: {
          url: dataUrl,
          detail: 'auto',
        },
      })
    }
  }

  // If failed to load any images, fallback to text
  if (parts.length === 1 && parts[0].type === 'text') {
    return text
  }

  return parts
}

/**
 * Updates metadata.vision_processing status for processed image attachments.
 */
export async function markAttachmentsAsVisionProcessed(
  attachmentIds: string[],
  model: string
): Promise<void> {
  if (!attachmentIds || attachmentIds.length === 0) return

  try {
    const adminSupabase = createAdminClient()
    for (const id of attachmentIds) {
      const { data: record } = await adminSupabase
        .from('message_attachments')
        .select('metadata')
        .eq('id', id)
        .single()

      const currentMeta = (record?.metadata as Record<string, unknown>) || {}
      await adminSupabase
        .from('message_attachments')
        .update({
          metadata: {
            ...currentMeta,
            vision_processing: {
              status: 'processed',
              model,
              processed_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', id)
    }
  } catch (err) {
    console.warn('[Vision] Could not update vision_processing metadata:', err)
  }
}
