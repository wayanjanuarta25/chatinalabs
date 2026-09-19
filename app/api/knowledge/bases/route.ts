import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { knowledgeService } from '@/lib/knowledge/service'
import { getOrCreateUserWorkspace } from '@/lib/supabase/queries'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = await getOrCreateUserWorkspace(supabase, user.id, user.email || '')
    let bases = await knowledgeService.listKnowledgeBases(supabase, workspaceId)

    // If no knowledge base exists yet, auto-provision a default knowledge base
    if (bases.length === 0) {
      const defaultKb = await knowledgeService.createKnowledgeBase(supabase, {
        workspaceId,
        name: 'General Knowledge',
        description: 'Workspace documents, guides, and reference materials.',
      })
      if (defaultKb) {
        bases = [defaultKb]
      }
    }

    return NextResponse.json({
      workspaceId,
      knowledgeBases: bases,
    })
  } catch (error) {
    console.error('[API/Knowledge/Bases GET] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const name = body.name?.trim()
    const description = body.description?.trim()

    if (!name) {
      return NextResponse.json({ error: 'Knowledge base name is required.' }, { status: 400 })
    }

    const workspaceId = body.workspaceId || (await getOrCreateUserWorkspace(supabase, user.id, user.email || ''))

    const newKb = await knowledgeService.createKnowledgeBase(supabase, {
      workspaceId,
      name,
      description,
    })

    if (!newKb) {
      return NextResponse.json({ error: 'Failed to create knowledge base.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, knowledgeBase: newKb })
  } catch (error) {
    console.error('[API/Knowledge/Bases POST] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
