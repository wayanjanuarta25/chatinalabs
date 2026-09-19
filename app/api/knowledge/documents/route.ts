import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { knowledgeService } from '@/lib/knowledge/service'
import { getKnowledgeFileUrl } from '@/lib/knowledge/storage'
import { getOrCreateUserWorkspace } from '@/lib/supabase/queries'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    let knowledgeBaseId = searchParams.get('knowledgeBaseId')

    if (!knowledgeBaseId) {
      // Find workspace and resolve default knowledge base
      const workspaceId = await getOrCreateUserWorkspace(supabase, user.id, user.email || '')
      const bases = await knowledgeService.listKnowledgeBases(supabase, workspaceId)
      if (bases.length > 0) {
        knowledgeBaseId = bases[0].id
      } else {
        return NextResponse.json({ documents: [], knowledgeBase: null })
      }
    }

    const kb = await knowledgeService.getKnowledgeBase(supabase, knowledgeBaseId)
    const documents = await knowledgeService.listDocumentsWithJobs(supabase, knowledgeBaseId)

    // Optionally include file access URLs
    const docsWithUrls = await Promise.all(
      documents.map(async doc => {
        let fileUrl: string | null = null
        if (doc.storagePath) {
          fileUrl = await getKnowledgeFileUrl(supabase, doc.storagePath, 3600)
        }
        return {
          ...doc,
          fileUrl,
        }
      })
    )

    return NextResponse.json({
      documents: docsWithUrls,
      knowledgeBase: kb,
    })
  } catch (error) {
    console.error('[API/Knowledge/Documents GET] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 })
    }

    // Verify document exists and belongs to a workspace user is a member of
    const { data: doc } = await supabase
      .from('documents')
      .select('id, workspace_id')
      .eq('id', documentId)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (doc.workspace_id) {
      const { data: member } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', doc.workspace_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Delete document row and corresponding file in Supabase Storage
    const deleted = await knowledgeService.deleteDocumentWithFile(supabase, documentId)

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/Knowledge/Documents DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
