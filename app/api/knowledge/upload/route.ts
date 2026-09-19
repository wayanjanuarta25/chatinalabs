import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadKnowledgeFile, validateKnowledgeFile } from '@/lib/knowledge/storage'
import { knowledgeService } from '@/lib/knowledge/service'
import { documentWorker } from '@/lib/knowledge/processors'
import { getOrCreateUserWorkspace } from '@/lib/supabase/queries'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    let knowledgeBaseId = formData.get('knowledgeBaseId') as string | null
    let workspaceId = formData.get('workspaceId') as string | null

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No valid file provided.' }, { status: 400 })
    }

    // 1. Validate file format and size
    const validation = validateKnowledgeFile({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 2. Resolve workspace ID if not provided
    if (!workspaceId) {
      workspaceId = await getOrCreateUserWorkspace(supabase, user.id, user.email || '')
    }

    // 3. Verify user membership in workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: 'Forbidden: You do not belong to this workspace.' }, { status: 403 })
    }

    // 4. Resolve or create knowledge base
    if (!knowledgeBaseId) {
      // Find existing knowledge base in this workspace or create default
      const existingBases = await knowledgeService.listKnowledgeBases(supabase, workspaceId)
      if (existingBases.length > 0) {
        knowledgeBaseId = existingBases[0].id
      } else {
        const newKb = await knowledgeService.createKnowledgeBase(supabase, {
          workspaceId,
          name: 'General Knowledge',
          description: 'Default knowledge base for uploaded files and documentation.',
        })
        if (!newKb) {
          return NextResponse.json({ error: 'Failed to provision knowledge base.' }, { status: 500 })
        }
        knowledgeBaseId = newKb.id
      }
    } else {
      // Verify knowledge base belongs to this workspace
      const kb = await knowledgeService.getKnowledgeBase(supabase, knowledgeBaseId)
      if (!kb || kb.workspaceId !== workspaceId) {
        return NextResponse.json({ error: 'Knowledge base not found in this workspace.' }, { status: 404 })
      }
    }

    // 5. Upload file to Supabase Storage: knowledge-files/{workspace_id}/{knowledge_base_id}/{document_id}/{filename}
    const documentId = crypto.randomUUID()
    const uploadResult = await uploadKnowledgeFile(supabase, {
      workspaceId,
      knowledgeBaseId,
      file,
      filename: file.name,
      mimeType: file.type,
      documentId,
    })

    // 6. Create document record and pending extraction processing_job
    const creationResult = await knowledgeService.createDocumentFromFile(supabase, {
      documentId: uploadResult.documentId,
      workspaceId,
      knowledgeBaseId,
      filename: uploadResult.filename,
      storagePath: uploadResult.storagePath,
      mimeType: uploadResult.mimeType,
      fileSizeBytes: uploadResult.fileSizeBytes,
      metadata: {
        originalName: file.name,
        bucket: uploadResult.bucket,
        uploadedAt: new Date().toISOString(),
      },
    })

    if (!creationResult) {
      return NextResponse.json({ error: 'Failed to record document metadata.' }, { status: 500 })
    }

    // 7. Trigger document processing pipeline (extraction -> chunking)
    const processResult = await documentWorker.processJob(supabase, creationResult.job.id)

    // 8. Fetch updated document with completed/failed status & token count
    const { data: updatedDoc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', creationResult.document.id)
      .single()

    return NextResponse.json({
      success: true,
      document: updatedDoc || creationResult.document,
      job: {
        ...creationResult.job,
        status: processResult.status,
        errorMessage: processResult.errorMessage,
        progress: processResult.status === 'completed' ? 100 : 0,
      },
      processing: processResult,
    })
  } catch (error) {
    console.error('[API/Knowledge/Upload] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
