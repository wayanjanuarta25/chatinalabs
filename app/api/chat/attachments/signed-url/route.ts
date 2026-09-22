import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Login required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const storagePath = searchParams.get('path')

    if (!storagePath) {
      return NextResponse.json({ error: 'Missing "path" query parameter' }, { status: 400 })
    }

    // Extract workspace_id from canonical storage path: {workspace_id}/{conversation_id}/{message_id}/{filename}
    const parts = storagePath.split('/')
    if (parts.length < 4) {
      return NextResponse.json({ error: 'Malformed storage path' }, { status: 400 })
    }

    const workspaceId = parts[0]

    // Verify workspace membership
    const { data: isMember, error: memberErr } = await supabase.rpc('is_workspace_member', {
      _workspace_id: workspaceId,
    })

    if (memberErr || !isMember) {
      return NextResponse.json(
        { error: 'Forbidden: Access denied to workspace attachments' },
        { status: 403 }
      )
    }

    // Generate signed URL (expires in 1 hour) via verified server admin client
    const adminSupabase = createAdminClient()
    const { data: signedData, error: signErr } = await adminSupabase.storage
      .from('chat-attachments')
      .createSignedUrl(storagePath, 3600)

    if (signErr || !signedData) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL: ' + (signErr?.message || 'Not found') },
        { status: 404 }
      )
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('[SignedUrl API] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
