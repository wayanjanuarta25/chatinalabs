import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAttachment, getAttachmentType } from '@/lib/attachments/validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to upload attachments' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string | null
    const messageId = formData.get('messageId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file payload' }, { status: 400 })
    }

    if (!conversationId || !messageId) {
      return NextResponse.json(
        { error: 'Missing conversationId or messageId' },
        { status: 400 }
      )
    }

    // 1. Validation layer
    const validation = validateAttachment(file)
    if (!validation.valid || !validation.attachmentType) {
      return NextResponse.json({ error: validation.error || 'Invalid file' }, { status: 400 })
    }

    // 2. Server-side Workspace Security
    // Verify conversation existence and retrieve its canonical workspace_id
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('id, workspace_id, user_id')
      .eq('id', conversationId)
      .single()

    if (convErr || !conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Verify workspace membership using is_workspace_member(workspace_id)
    const { data: isMember, error: memberErr } = await supabase.rpc('is_workspace_member', {
      _workspace_id: conv.workspace_id,
    })

    if (memberErr || !isMember) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this workspace' },
        { status: 403 }
      )
    }

    // Verify message existence
    const { data: msg, error: msgErr } = await supabase
      .from('messages')
      .select('id, conversation_id')
      .eq('id', messageId)
      .single()

    if (msgErr || !msg || msg.conversation_id !== conversationId) {
      return NextResponse.json(
        { error: 'Target message not found or does not belong to conversation' },
        { status: 404 }
      )
    }

    // 3. Generate Storage Path
    const lastDot = file.name.lastIndexOf('.')
    const fileExt = lastDot !== -1 ? file.name.slice(lastDot) : ''
    const baseName = lastDot !== -1 ? file.name.slice(0, lastDot) : file.name
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 50)
    const uniqueFileName = `${Date.now()}-${safeBaseName}${fileExt}`
    const storagePath = `${conv.workspace_id}/${conversationId}/${messageId}/${uniqueFileName}`

    // 4. Upload binary data to Supabase Storage bucket 'chat-attachments' via verified server admin client
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const adminSupabase = createAdminClient()

    const { error: uploadErr } = await adminSupabase.storage
      .from('chat-attachments')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadErr) {
      console.error('[Upload API] Storage upload error:', uploadErr)
      return NextResponse.json(
        { error: 'Failed to upload attachment to storage: ' + uploadErr.message },
        { status: 500 }
      )
    }

    // 5. Insert record into public.message_attachments
    const { data: attachmentRecord, error: dbErr } = await supabase
      .from('message_attachments')
      .insert({
        message_id: messageId,
        workspace_id: conv.workspace_id,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        storage_path: storagePath,
        attachment_type: validation.attachmentType,
        metadata: {
          source: 'chat_upload',
          uploaded_from: 'message_composer',
          original_name: file.name,
          vision_processing: null,
          generated_image: null,
          rag_document: null,
        },
      })
      .select()
      .single()

    // 6. Graceful rollback on DB insertion failure (Prevent orphan storage objects)
    if (dbErr || !attachmentRecord) {
      console.error('[Upload API] Database insertion failed, rolling back storage:', dbErr)
      await adminSupabase.storage.from('chat-attachments').remove([storagePath])
      return NextResponse.json(
        { error: 'Failed to record attachment in database: ' + (dbErr?.message || 'Unknown error') },
        { status: 500 }
      )
    }

    // 7. Generate temporary signed URL for immediate preview (3600s = 1 hour)
    const { data: signedData } = await adminSupabase.storage
      .from('chat-attachments')
      .createSignedUrl(storagePath, 3600)

    return NextResponse.json({
      success: true,
      attachment: {
        ...attachmentRecord,
        signedUrl: signedData?.signedUrl,
      },
    })
  } catch (error) {
    console.error('[Upload API] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
