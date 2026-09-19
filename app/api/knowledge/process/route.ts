import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { documentWorker } from '@/lib/knowledge/processors'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { jobId, documentId } = body

    if (!jobId && !documentId) {
      return NextResponse.json(
        { error: 'Either jobId or documentId is required.' },
        { status: 400 }
      )
    }

    let result
    if (jobId) {
      result = await documentWorker.processJob(supabase, jobId)
    } else {
      result = await documentWorker.processDocument(supabase, documentId)
    }

    if (result.status === 'failed') {
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || 'Processing failed',
          result,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('[API/Knowledge/Process] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
