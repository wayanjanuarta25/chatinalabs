import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/database.types'

export interface ImageGenerationIntent {
  isImageRequest: boolean
  englishPrompt?: string
  caption?: string
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4'
  width?: number
  height?: number
  suggestedFileName?: string
}

export interface GeneratedImageResult {
  buffer: Buffer
  mimeType: string
  width: number
  height: number
  model: string
  englishPrompt: string
  caption: string
  suggestedFileName: string
}

export interface PersistedGeneratedAttachment {
  id: string
  message_id: string
  workspace_id: string
  file_name: string
  mime_type: string
  file_size: number
  storage_path: string
  attachment_type: 'image'
  signedUrl: string
  metadata: Record<string, unknown>
  created_at: string
}

/**
 * Fast-path regex to detect image generation intent in Indonesian & English.
 */
export function fastCheckImageIntent(text: string): boolean {
  const clean = text.trim().toLowerCase()

  // Explicit slash commands
  if (clean.startsWith('/image') || clean.startsWith('/img') || clean.startsWith('/generate')) {
    return true
  }

  // Indonesian triggers
  const idPatterns = [
    /\b(generate|buatkan|buat|bikin|gambarkan|lukiskan|tolong buatkan|tolong generate|tolong gambarkan)\s+(gambar|foto|cover|banner|ilustrasi|poster|wallpaper|avatar|art)\b/i,
    /\bgambar\s+(cover|poster|ilustrasi|pemandangan|produk|makanan|karakter|vektor)\b/i,
    /\b(desain|buatkan|generate)\s+cover\s+(tiktok|youtube|reels|feed|instagram|buku)\b/i,
  ]

  // English triggers
  const enPatterns = [
    /\b(generate|create|draw|make|paint|design)\s+(an?\s+)?(image|picture|photo|cover|illustration|drawing|art|artwork|poster|wallpaper|banner)\b/i,
    /\bcover\s+(for\s+)?(tiktok|youtube|reels|instagram|video)\b/i,
  ]

  // Filter out programming / question keywords
  const isCodingQuestion = /\b(python|javascript|typescript|code|coding|script|tutorial|library|api|npm|function|cara koding|cara bikin bot)\b/i.test(clean)
  if (isCodingQuestion) return false

  return idPatterns.some(p => p.test(clean)) || enPatterns.some(p => p.test(clean))
}

/**
 * Detect aspect ratio preferences from text.
 */
export function parseAspectRatio(text: string): { aspectRatio: '1:1' | '9:16' | '16:9' | '4:3' | '3:4', width: number, height: number } {
  const clean = text.toLowerCase()

  if (clean.includes('9:16') || clean.includes('9/16') || clean.includes('tiktok') || clean.includes('story') || clean.includes('reels') || clean.includes('shorts') || clean.includes('vertikal') || clean.includes('portrait')) {
    return { aspectRatio: '9:16', width: 1024, height: 1792 }
  }

  if (clean.includes('16:9') || clean.includes('16/9') || clean.includes('youtube') || clean.includes('landscape') || clean.includes('horizontal') || clean.includes('wallpaper')) {
    return { aspectRatio: '16:9', width: 1792, height: 1024 }
  }

  if (clean.includes('4:3') || clean.includes('4/3')) {
    return { aspectRatio: '4:3', width: 1024, height: 768 }
  }

  if (clean.includes('3:4') || clean.includes('3/4')) {
    return { aspectRatio: '3:4', width: 768, height: 1024 }
  }

  // Default square
  return { aspectRatio: '1:1', width: 1024, height: 1024 }
}

/**
 * Detects image generation intent and crafts an enhanced prompt using KelontongAI (gpt-5.6-sol) or fallback.
 */
export async function detectAndEnhanceImageIntent(userPrompt: string): Promise<ImageGenerationIntent> {
  const isLikelyImage = fastCheckImageIntent(userPrompt)
  const ratioInfo = parseAspectRatio(userPrompt)

  if (!isLikelyImage) {
    return { isImageRequest: false }
  }

  const apiKey = process.env.KELONTONGAI_API_KEY
  const baseURL = (process.env.KELONTONGAI_BASE_URL || 'https://api.kelontongai.id/v1').replace(/\/+$/, '')

  // If no KelontongAI key or placeholder, fallback to basic direct prompt
  if (!apiKey || apiKey.includes('placeholder') || apiKey === 'your_kelontongai_api_key') {
    const cleanPrompt = userPrompt
      .replace(/^(\/image|\/img|\/generate)\s+/i, '')
      .replace(/^(tolong\s+)?(buatkan|buat|bikin|generate|gambarkan|lukiskan)\s+(saya\s+)?(gambar|foto|cover|ilustrasi)?/i, '')
      .trim()

    return {
      isImageRequest: true,
      englishPrompt: `High quality detailed image of ${cleanPrompt || 'artwork'}, 4k, photorealistic, cinematic lighting`,
      caption: `Berikut adalah gambar yang telah dibuat sesuai permintaan Anda:`,
      aspectRatio: ratioInfo.aspectRatio,
      width: ratioInfo.width,
      height: ratioInfo.height,
      suggestedFileName: 'generated-image.jpg',
    }
  }

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.6-sol',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI prompt engineer for image generation (FLUX / SDXL).
Analyze if the user wants to generate/draw an image, artwork, cover, or photo.
If YES, respond with a JSON object:
{
  "isImageRequest": true,
  "englishPrompt": "A highly detailed, professional English descriptive prompt capturing subject, style, mood, composition, lighting, typography/text if requested, and details",
  "caption": "Short, natural, friendly Indonesian response message presenting the finished image (e.g. 'Berikut cover TikTok bertema TNI Bersama Rakyat yang telah dibuat: ')",
  "suggestedFileName": "slug-name.jpg"
}
If the user is asking a programming question, tutorial, general conversation, or NOT asking to generate an image, return:
{ "isImageRequest": false }

Strictly output raw valid JSON only. Do not wrap in markdown code blocks.`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.2,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      const rawContent = data.choices?.[0]?.message?.content?.trim() || ''
      const cleanJson = rawContent.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '')
      const parsed = JSON.parse(cleanJson)

      if (parsed && typeof parsed.isImageRequest === 'boolean') {
        if (!parsed.isImageRequest) {
          return { isImageRequest: false }
        }

        return {
          isImageRequest: true,
          englishPrompt: parsed.englishPrompt || userPrompt,
          caption: parsed.caption || 'Berikut adalah gambar yang telah digenerate:',
          aspectRatio: ratioInfo.aspectRatio,
          width: ratioInfo.width,
          height: ratioInfo.height,
          suggestedFileName: parsed.suggestedFileName || 'generated-image.jpg',
        }
      }
    }
  } catch (err) {
    console.warn('[ImageGeneration] Prompt enhancement LLM error, falling back to direct prompt:', err)
  }

  // Fallback if LLM call fails
  const cleanPrompt = userPrompt
    .replace(/^(\/image|\/img|\/generate)\s+/i, '')
    .replace(/^(tolong\s+)?(buatkan|buat|bikin|generate|gambarkan|lukiskan)\s+(saya\s+)?(gambar|foto|cover|ilustrasi)?/i, '')
    .trim()

  return {
    isImageRequest: true,
    englishPrompt: `High quality, highly detailed artwork: ${cleanPrompt}, 4k, masterpiece, cinematic lighting`,
    caption: `Berikut gambar yang telah digenerate:`,
    aspectRatio: ratioInfo.aspectRatio,
    width: ratioInfo.width,
    height: ratioInfo.height,
    suggestedFileName: 'generated-image.jpg',
  }
}

/**
 * Generates image binary buffer using OpenAI (gpt-image-1 / dall-e-3) or fallback engine.
 */
export async function generateImageBuffer(
  englishPrompt: string,
  width: number = 1024,
  height: number = 1024
): Promise<{ buffer: Buffer, mimeType: string, model: string }> {
  // 1. Check if OpenAI API Key is configured
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiApiKey && !openaiApiKey.includes('placeholder') && openaiApiKey !== 'your_openai_api_key') {
    const openaiBaseURL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')

    // Map dimensions to standard DALL-E / OpenAI format
    let size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024'
    if (height > width) {
      size = '1024x1792'
    } else if (width > height) {
      size = '1792x1024'
    }

    const imageModels = ['gpt-image-1', 'dall-e-3']

    for (const model of imageModels) {
      try {
        console.log(`[ImageGen] Calling OpenAI image generator (${model}, ${size})...`)
        const payload: Record<string, unknown> = {
          model,
          prompt: englishPrompt,
          size,
        }
        if (model === 'dall-e-3') {
          payload.quality = 'standard'
          payload.response_format = 'b64_json'
        }

        const res = await fetch(`${openaiBaseURL}/images/generations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

          const data = await res.json()
          if (res.ok && data?.data?.[0]) {
            const item = data.data[0]
            if (item.b64_json) {
              const buffer = Buffer.from(item.b64_json, 'base64')
              return {
                buffer,
                mimeType: 'image/png',
                model: `openai/${model}`,
              }
            } else if (item.url) {
              const imgRes = await fetch(item.url)
              if (imgRes.ok) {
                const arrayBuf = await imgRes.arrayBuffer()
                return {
                  buffer: Buffer.from(arrayBuf),
                  mimeType: 'image/png',
                  model: `openai/${model}`,
                }
              }
            }
          }

          if (data?.error) {
            const errCode = data.error.code
            const errMsg = data.error.message || 'Unknown OpenAI error'

            // If model doesn't exist on this key, try the next model candidate
            if (data.error.param === 'model' || errMsg.includes('does not exist')) {
              console.warn(`[ImageGen] OpenAI model ${model} not available on this key: ${errMsg}`)
              continue
            }

            console.warn(`[ImageGen] OpenAI ${model} returned error (${errCode || res.status}): ${errMsg}. Falling back to secondary engine...`)
            break
          }
        } catch (err) {
          console.warn(`[ImageGen] OpenAI ${model} attempt exception:`, err)
        }
      }
    }

  // 2. Fallback to FLUX / SDXL text-to-image engine
  const seed = Math.floor(Math.random() * 10000000)
  const encoded = encodeURIComponent(englishPrompt)

  const urlsToTry = [
    `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=${width}&height=${height}&seed=${seed}&nologo=true`,
    `https://image.pollinations.ai/prompt/${encoded}?model=turbo&width=${width}&height=${height}&seed=${seed}&nologo=true`,
    `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`,
  ]

  let lastError: Error | null = null

  for (let i = 0; i < urlsToTry.length; i++) {
    const url = urlsToTry[i]
    try {
      if (i > 0) {
        await new Promise(r => setTimeout(r, 2500))
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 35000)

      const resp = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        if (buffer.length > 3000) {
          const contentType = resp.headers.get('content-type') || 'image/jpeg'
          return {
            buffer,
            mimeType: contentType.includes('png') ? 'image/png' : 'image/jpeg',
            model: i === 0 ? 'flux.1' : (i === 1 ? 'turbo' : 'sdxl'),
          }
        }
      } else {
        const errText = await resp.text()
        lastError = new Error(`Image generator error (${resp.status}): ${errText.slice(0, 120)}`)
        console.warn(`[ImageGen] Engine attempt ${i + 1} status ${resp.status}:`, errText.slice(0, 100))
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`[ImageGen] Engine attempt ${i + 1} exception:`, lastError.message)
    }
  }

  throw lastError || new Error('Image generator failed on all available engines.')
}

/**
 * Uploads generated image to Supabase Storage bucket 'chat-attachments'
 * and inserts a row into 'public.message_attachments' linked to the assistant's message.
 */
export async function persistGeneratedImageAttachment(params: {
  workspaceId: string
  conversationId: string
  messageId: string
  buffer: Buffer
  mimeType: string
  suggestedFileName?: string
  prompt: string
  englishPrompt: string
  model: string
  aspectRatio: string
}): Promise<PersistedGeneratedAttachment> {
  const adminClient = createAdminClient()
  const timestamp = Date.now()
  const ext = params.mimeType.includes('png') ? 'png' : 'jpg'
  
  let cleanName = (params.suggestedFileName || 'generated-image')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!cleanName.endsWith(`.${ext}`)) {
    cleanName = `${cleanName}.${ext}`
  }

  const storagePath = `${params.workspaceId}/${params.conversationId}/${params.messageId}/generated-${timestamp}.${ext}`

  // 1. Upload to Supabase Storage 'chat-attachments'
  const { error: uploadError } = await adminClient.storage
    .from('chat-attachments')
    .upload(storagePath, params.buffer, {
      contentType: params.mimeType,
      upsert: true,
    })

  if (uploadError) {
    console.error('[ImageGen] Failed uploading generated image to storage:', uploadError)
    throw new Error(`Failed to persist generated image: ${uploadError.message}`)
  }

  // 2. Insert into message_attachments table
  const metadata = {
    source: 'generated_image',
    uploaded_from: 'chat_engine',
    original_name: cleanName,
    prompt: params.prompt,
    english_prompt: params.englishPrompt,
    model: params.model,
    aspect_ratio: params.aspectRatio,
  }

  const { data: attachmentRow, error: insertError } = await adminClient
    .from('message_attachments')
    .insert({
      message_id: params.messageId,
      workspace_id: params.workspaceId,
      file_name: cleanName,
      file_size: params.buffer.length,
      mime_type: params.mimeType,
      storage_path: storagePath,
      attachment_type: 'image',
      metadata,
    })
    .select()
    .single()

  if (insertError || !attachmentRow) {
    console.error('[ImageGen] Failed inserting attachment row:', insertError)
    throw new Error(`Failed to record generated image attachment: ${insertError?.message}`)
  }

  // 3. Generate a temporary signed URL for immediate client preview
  const { data: signedData } = await adminClient.storage
    .from('chat-attachments')
    .createSignedUrl(storagePath, 3600)

  return {
    id: attachmentRow.id,
    message_id: attachmentRow.message_id,
    workspace_id: attachmentRow.workspace_id,
    file_name: attachmentRow.file_name,
    mime_type: attachmentRow.mime_type,
    file_size: attachmentRow.file_size || params.buffer.length,
    storage_path: attachmentRow.storage_path,
    attachment_type: 'image',
    signedUrl: signedData?.signedUrl || '',
    metadata,
    created_at: attachmentRow.created_at,
  }
}
