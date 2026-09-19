import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import {
  KnowledgeBase,
  KBDocument,
  DocumentChunk,
  ProcessingJob,
  KnowledgeRetrievalQuery,
  KnowledgeRetrievalResult,
  KnowledgeContextItem,
  AIContextAugmentation,
  DocumentStatus,
  ProcessingStatus,
  DocumentSourceType,
} from './types'
import { deleteKnowledgeFile } from './storage'

/**
 * Knowledge Base Service
 * Handles knowledge base hierarchies, document management, chunking storage, and AI context augmentation.
 */
export class KnowledgeBaseService {
  /**
   * Create a new knowledge base within a workspace.
   */
  async createKnowledgeBase(
    supabase: SupabaseClient<Database>,
    params: {
      workspaceId: string
      name: string
      description?: string
      metadata?: Record<string, unknown>
    }
  ): Promise<KnowledgeBase | null> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('knowledge_bases')
      .insert({
        workspace_id: params.workspaceId,
        created_by: user?.id || null,
        name: params.name.trim(),
        description: params.description?.trim() || null,
        metadata: (params.metadata as Database['public']['Tables']['knowledge_bases']['Insert']['metadata']) || {},
        is_active: true,
      })
      .select()
      .single()

    if (error || !data) {
      console.error('[KnowledgeBaseService] createKnowledgeBase error:', error?.message)
      return null
    }

    return {
      id: data.id,
      workspaceId: data.workspace_id,
      createdBy: data.created_by,
      name: data.name,
      description: data.description,
      isActive: data.is_active,
      metadata: (data.metadata as Record<string, unknown>) || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Get a knowledge base by ID.
   */
  async getKnowledgeBase(
    supabase: SupabaseClient<Database>,
    id: string
  ): Promise<KnowledgeBase | null> {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      workspaceId: data.workspace_id,
      createdBy: data.created_by,
      name: data.name,
      description: data.description,
      isActive: data.is_active,
      metadata: (data.metadata as Record<string, unknown>) || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * List all knowledge bases for a workspace.
   */
  async listKnowledgeBases(
    supabase: SupabaseClient<Database>,
    workspaceId: string
  ): Promise<KnowledgeBase[]> {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('[KnowledgeBaseService] listKnowledgeBases error:', error?.message)
      return []
    }

    return data.map(kb => ({
      id: kb.id,
      workspaceId: kb.workspace_id,
      createdBy: kb.created_by,
      name: kb.name,
      description: kb.description,
      isActive: kb.is_active,
      metadata: (kb.metadata as Record<string, unknown>) || {},
      createdAt: kb.created_at,
      updatedAt: kb.updated_at,
    }))
  }

  /**
   * Update knowledge base details.
   */
  async updateKnowledgeBase(
    supabase: SupabaseClient<Database>,
    id: string,
    updates: Partial<{
      name: string
      description: string | null
      isActive: boolean
      metadata: Record<string, unknown>
    }>
  ): Promise<boolean> {
    const payload: Database['public']['Tables']['knowledge_bases']['Update'] = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) payload.name = updates.name.trim()
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.isActive !== undefined) payload.is_active = updates.isActive
    if (updates.metadata !== undefined) payload.metadata = updates.metadata as Database['public']['Tables']['knowledge_bases']['Update']['metadata']

    const { error } = await supabase
      .from('knowledge_bases')
      .update(payload)
      .eq('id', id)

    return !error
  }

  /**
   * Delete knowledge base (cascades to documents and chunks).
   */
  async deleteKnowledgeBase(
    supabase: SupabaseClient<Database>,
    id: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('knowledge_bases')
      .delete()
      .eq('id', id)

    return !error
  }

  /**
   * Create a document under a knowledge base with status & processing tracking.
   */
  async createDocument(
    supabase: SupabaseClient<Database>,
    params: {
      knowledgeBaseId: string
      title: string
      content?: string
      sourceType?: DocumentSourceType
      sourceUrl?: string
      metadata?: Record<string, unknown>
    }
  ): Promise<KBDocument | null> {
    const content = params.content || ''
    const tokenEstimate = Math.ceil(content.length / 4)

    const { data, error } = await supabase
      .from('documents')
      .insert({
        knowledge_base_id: params.knowledgeBaseId,
        title: params.title.trim(),
        content,
        source_type: params.sourceType || 'text',
        source_url: params.sourceUrl || null,
        document_status: 'active',
        processing_status: 'pending',
        token_count: tokenEstimate,
        chunk_count: 0,
        metadata: (params.metadata as Database['public']['Tables']['documents']['Insert']['metadata']) || {},
      })
      .select()
      .single()

    if (error || !data) {
      console.error('[KnowledgeBaseService] createDocument error:', error?.message)
      return null
    }

    return {
      id: data.id,
      workspaceId: data.workspace_id,
      knowledgeBaseId: data.knowledge_base_id,
      title: data.title,
      filename: data.filename,
      storagePath: data.storage_path,
      sourceType: data.source_type as DocumentSourceType,
      sourceUrl: data.source_url,
      content: data.content,
      documentStatus: data.document_status as DocumentStatus,
      processingStatus: data.processing_status as ProcessingStatus,
      errorMessage: data.error_message,
      tokenCount: data.token_count,
      chunkCount: data.chunk_count,
      fileSizeBytes: data.file_size_bytes,
      mimeType: data.mime_type,
      metadata: (data.metadata as Record<string, unknown>) || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Coordinated Document & Processing Job Creation Flow:
   * 1. Creates document record in documents table with storage metadata
   * 2. Automatically creates pending processing_job record
   */
  async createDocumentFromFile(
    supabase: SupabaseClient<Database>,
    params: {
      documentId?: string
      workspaceId: string
      knowledgeBaseId: string
      filename: string
      storagePath: string
      mimeType: string
      fileSizeBytes: number
      metadata?: Record<string, unknown>
    }
  ): Promise<{ document: KBDocument; job: ProcessingJob } | null> {
    const documentId = params.documentId || crypto.randomUUID()

    // 1. Insert into documents table
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        workspace_id: params.workspaceId,
        knowledge_base_id: params.knowledgeBaseId,
        title: params.filename,
        filename: params.filename,
        storage_path: params.storagePath,
        mime_type: params.mimeType,
        file_size_bytes: params.fileSizeBytes,
        source_type: 'file',
        processing_status: 'pending',
        document_status: 'draft',
        token_count: 0,
        chunk_count: 0,
        metadata: (params.metadata as Database['public']['Tables']['documents']['Insert']['metadata']) || {},
      })
      .select()
      .single()

    if (docError || !docData) {
      console.error('[KnowledgeBaseService] createDocumentFromFile error:', docError?.message)
      return null
    }

    // 2. Insert into processing_jobs table
    const { data: jobData, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        document_id: docData.id,
        workspace_id: params.workspaceId,
        job_type: 'extraction',
        status: 'pending',
        progress: 0,
        metadata: {},
      })
      .select()
      .single()

    if (jobError || !jobData) {
      console.error('[KnowledgeBaseService] createProcessingJob error:', jobError?.message)
    }

    const document: KBDocument = {
      id: docData.id,
      workspaceId: docData.workspace_id,
      knowledgeBaseId: docData.knowledge_base_id,
      title: docData.title,
      filename: docData.filename,
      storagePath: docData.storage_path,
      sourceType: docData.source_type as DocumentSourceType,
      sourceUrl: docData.source_url,
      content: docData.content,
      documentStatus: docData.document_status as DocumentStatus,
      processingStatus: docData.processing_status as ProcessingStatus,
      errorMessage: docData.error_message,
      tokenCount: docData.token_count,
      chunkCount: docData.chunk_count,
      fileSizeBytes: docData.file_size_bytes,
      mimeType: docData.mime_type,
      metadata: (docData.metadata as Record<string, unknown>) || {},
      createdAt: docData.created_at,
      updatedAt: docData.updated_at,
    }

    const job: ProcessingJob = jobData
      ? {
          id: jobData.id,
          documentId: jobData.document_id,
          workspaceId: jobData.workspace_id,
          jobType: jobData.job_type as 'extraction' | 'chunking' | 'embedding',
          status: jobData.status as ProcessingStatus,
          progress: jobData.progress,
          errorMessage: jobData.error_message,
          metadata: (jobData.metadata as Record<string, unknown>) || {},
          createdAt: jobData.created_at,
          updatedAt: jobData.updated_at,
        }
      : {
          id: `job-${Date.now()}`,
          documentId: docData.id,
          workspaceId: params.workspaceId,
          jobType: 'extraction',
          status: 'pending',
          progress: 0,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

    return { document, job }
  }

  /**
   * List all documents in a knowledge base.
   */
  async listDocuments(
    supabase: SupabaseClient<Database>,
    knowledgeBaseId: string
  ): Promise<KBDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map(doc => ({
      id: doc.id,
      workspaceId: doc.workspace_id,
      knowledgeBaseId: doc.knowledge_base_id,
      title: doc.title,
      filename: doc.filename,
      storagePath: doc.storage_path,
      sourceType: doc.source_type as DocumentSourceType,
      sourceUrl: doc.source_url,
      content: doc.content,
      documentStatus: doc.document_status as DocumentStatus,
      processingStatus: doc.processing_status as ProcessingStatus,
      errorMessage: doc.error_message,
      tokenCount: doc.token_count,
      chunkCount: doc.chunk_count,
      fileSizeBytes: doc.file_size_bytes,
      mimeType: doc.mime_type,
      metadata: (doc.metadata as Record<string, unknown>) || {},
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    }))
  }

  /**
   * List documents along with their latest processing job.
   */
  async listDocumentsWithJobs(
    supabase: SupabaseClient<Database>,
    knowledgeBaseId: string
  ): Promise<Array<KBDocument & { latestJob?: ProcessingJob | null }>> {
    const docs = await this.listDocuments(supabase, knowledgeBaseId)
    if (docs.length === 0) return []

    const docIds = docs.map(d => d.id)

    const { data: jobs } = await supabase
      .from('processing_jobs')
      .select('*')
      .in('document_id', docIds)
      .order('created_at', { ascending: false })

    const jobsByDocId = new Map<string, ProcessingJob>()
    if (jobs) {
      for (const j of jobs) {
        if (!jobsByDocId.has(j.document_id)) {
          jobsByDocId.set(j.document_id, {
            id: j.id,
            documentId: j.document_id,
            workspaceId: j.workspace_id,
            jobType: j.job_type as 'extraction' | 'chunking' | 'embedding',
            status: j.status as ProcessingStatus,
            progress: j.progress,
            errorMessage: j.error_message,
            metadata: (j.metadata as Record<string, unknown>) || {},
            createdAt: j.created_at,
            updatedAt: j.updated_at,
          })
        }
      }
    }

    return docs.map(doc => ({
      ...doc,
      latestJob: jobsByDocId.get(doc.id) || null,
    }))
  }

  /**
   * Delete a document and its corresponding file in Supabase Storage.
   */
  async deleteDocumentWithFile(
    supabase: SupabaseClient<Database>,
    documentId: string
  ): Promise<boolean> {
    // 1. Fetch document to check storage_path
    const { data: doc } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', documentId)
      .single()

    if (doc?.storage_path) {
      // 2. Remove file from storage bucket
      await deleteKnowledgeFile(supabase, doc.storage_path)
    }

    // 3. Delete document row (cascades to processing_jobs & chunks)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      console.error('[KnowledgeBaseService] deleteDocument error:', error.message)
      return false
    }

    return true
  }

  /**
   * Update document status and processing state.
   */
  async updateDocumentStatus(
    supabase: SupabaseClient<Database>,
    id: string,
    params: {
      documentStatus?: DocumentStatus
      processingStatus?: ProcessingStatus
      errorMessage?: string | null
      chunkCount?: number
    }
  ): Promise<boolean> {
    const payload: Database['public']['Tables']['documents']['Update'] = {
      updated_at: new Date().toISOString(),
    }

    if (params.documentStatus) payload.document_status = params.documentStatus
    if (params.processingStatus) payload.processing_status = params.processingStatus
    if (params.errorMessage !== undefined) payload.error_message = params.errorMessage
    if (params.chunkCount !== undefined) payload.chunk_count = params.chunkCount

    const { error } = await supabase
      .from('documents')
      .update(payload)
      .eq('id', id)

    return !error
  }

  /**
   * Delete a document.
   */
  async deleteDocument(
    supabase: SupabaseClient<Database>,
    id: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    return !error
  }

  /**
   * Store document chunks with metadata and prepared structure for future vector embeddings.
   */
  async createDocumentChunks(
    supabase: SupabaseClient<Database>,
    documentId: string,
    knowledgeBaseId: string,
    chunks: Array<{
      chunkIndex: number
      content: string
      tokenCount?: number
      embedding?: number[] | null
      embeddingModel?: string | null
      metadata?: Record<string, unknown>
    }>
  ): Promise<DocumentChunk[]> {
    if (chunks.length === 0) return []

    const rows = chunks.map(c => ({
      document_id: documentId,
      knowledge_base_id: knowledgeBaseId,
      chunk_index: c.chunkIndex,
      content: c.content,
      token_count: c.tokenCount || Math.ceil(c.content.length / 4),
      embedding: c.embedding ? (c.embedding as unknown as Database['public']['Tables']['document_chunks']['Insert']['embedding']) : null,
      embedding_model: c.embeddingModel || null,
      metadata: (c.metadata as Database['public']['Tables']['document_chunks']['Insert']['metadata']) || {},
    }))

    const { data, error } = await supabase
      .from('document_chunks')
      .insert(rows)
      .select()

    if (error || !data) {
      console.error('[KnowledgeBaseService] createDocumentChunks error:', error?.message)
      return []
    }

    // Update chunk count on parent document
    await supabase
      .from('documents')
      .update({
        chunk_count: chunks.length,
        processing_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    return data.map(d => ({
      id: d.id,
      documentId: d.document_id,
      knowledgeBaseId: d.knowledge_base_id,
      chunkIndex: d.chunk_index,
      content: d.content,
      tokenCount: d.token_count,
      embedding: Array.isArray(d.embedding) ? (d.embedding as number[]) : null,
      embeddingModel: d.embedding_model,
      metadata: (d.metadata as Record<string, unknown>) || {},
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }))
  }

  /**
   * Retrieve relevant chunks for a user query.
   * Currently performs lexical & text keyword matching foundation, structured for seamless pgvector cosine search in Phase 5.2.
   */
  async retrieveRelevantChunks(
    supabase: SupabaseClient<Database>,
    query: KnowledgeRetrievalQuery
  ): Promise<KnowledgeRetrievalResult> {
    const startTime = Date.now()
    const limit = query.limit || 5
    const cleanQuery = query.query.toLowerCase().trim()
    const terms = cleanQuery.split(/\s+/).filter(t => t.length > 2)

    // Fetch chunks belonging to active documents in this knowledge base
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('id, document_id, content, metadata, chunk_index, documents!inner(title, document_status)')
      .eq('knowledge_base_id', query.knowledgeBaseId)
      .limit(50)

    if (error || !chunks) {
      console.error('[KnowledgeBaseService] retrieveRelevantChunks error:', error?.message)
      return { items: [], totalFound: 0, queryTimeMs: Date.now() - startTime }
    }

    // Score chunks by keyword frequency & overlap
    const scoredItems: KnowledgeContextItem[] = chunks
      .map(c => {
        const text = c.content.toLowerCase()
        let matchScore = 0

        for (const term of terms) {
          if (text.includes(term)) {
            matchScore += 1
          }
        }

        const docTitle = (c.documents as unknown as { title: string })?.title || 'Untitled Document'

        return {
          chunkId: c.id,
          documentId: c.document_id,
          documentTitle: docTitle,
          content: c.content,
          score: matchScore > 0 ? matchScore / Math.max(terms.length, 1) : 0.1,
          metadata: (c.metadata as Record<string, unknown>) || {},
        }
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit)

    return {
      items: scoredItems,
      totalFound: scoredItems.length,
      queryTimeMs: Date.now() - startTime,
    }
  }

  /**
   * Formats retrieved knowledge context items into an augmentation payload ready to feed into AI provider context.
   */
  buildKnowledgeContext(
    items: KnowledgeContextItem[],
    maxTokens: number = 2000
  ): AIContextAugmentation {
    if (items.length === 0) {
      return { contextBlock: '', sources: [] }
    }

    let tokenBudget = maxTokens
    const formattedSnippets: string[] = []
    const sources: AIContextAugmentation['sources'] = []

    for (const item of items) {
      const estimatedTokens = Math.ceil(item.content.length / 4)
      if (tokenBudget <= 0) break

      const snippet = item.content.slice(0, tokenBudget * 4)
      tokenBudget -= estimatedTokens

      formattedSnippets.push(`[Source: ${item.documentTitle}]\n${snippet}`)
      sources.push({
        id: item.documentId,
        title: item.documentTitle,
        snippet: snippet.slice(0, 150) + (snippet.length > 150 ? '...' : ''),
        score: item.score,
      })
    }

    const contextBlock = [
      '# Relevant Knowledge Base Context',
      'The following excerpts have been retrieved from the user workspace knowledge base to inform your response:',
      '',
      formattedSnippets.join('\n\n---\n\n'),
      '',
      'Use the above knowledge base information whenever relevant to answer accurately.',
    ].join('\n')

    return {
      contextBlock,
      sources,
    }
  }

  /**
   * Helper to augment a system prompt with knowledge base context.
   */
  injectKnowledgeIntoPrompt(
    baseSystemPrompt: string,
    augmentation: AIContextAugmentation
  ): string {
    if (!augmentation.contextBlock) {
      return baseSystemPrompt
    }

    return `${baseSystemPrompt}\n\n${augmentation.contextBlock}`
  }
}

export const knowledgeService = new KnowledgeBaseService()
