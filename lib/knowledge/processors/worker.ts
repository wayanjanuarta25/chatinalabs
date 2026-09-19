import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { ProcessingJobResult } from './types'
import { extractDocumentText, chunkText, estimateTokenCount } from './extractor'
import { downloadKnowledgeFile } from '../storage'
import { embeddingService, embeddingWorker } from '../embedding'

/**
 * Background worker service for asynchronous document extraction and chunking.
 */
export class DocumentProcessingWorker {
  /**
   * Process a single job by its ID.
   * Updates processing_jobs (pending -> processing -> completed / failed)
   * Updates documents (token_count, processing_status, error_message)
   * Inserts records into document_chunks and generates vector embeddings.
   */
  async processJob(
    supabase: SupabaseClient<Database>,
    jobId: string
  ): Promise<ProcessingJobResult> {
    // 1. Fetch processing job
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error(`[Worker] Job not found: ${jobId}`, jobError?.message)
      return {
        jobId,
        documentId: '',
        status: 'failed',
        totalTokens: 0,
        chunkCount: 0,
        errorMessage: jobError?.message || 'Processing job not found',
      }
    }

    // If job is specifically for generating embeddings
    if (job.job_type === 'embedding') {
      return embeddingWorker.processJob(supabase, jobId)
    }

    const documentId = job.document_id

    try {
      // 2. Mark job and document as processing (progress = 10%)
      await supabase
        .from('processing_jobs')
        .update({
          status: 'processing',
          progress: 10,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      await supabase
        .from('documents')
        .update({
          processing_status: 'processing',
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      // 3. Fetch document record
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (docError || !doc) {
        throw new Error(`Associated document not found: ${documentId}`)
      }

      // Check if file exists in storage
      if (!doc.storage_path) {
        // If it's a direct text document with existing content
        if (doc.content && doc.content.length > 0) {
          return await this.processTextDocument(supabase, jobId, doc)
        }
        throw new Error('Document has neither storage_path nor inline content to process.')
      }

      // 4. Update progress: Downloading file (30%)
      await supabase
        .from('processing_jobs')
        .update({ progress: 30 })
        .eq('id', jobId)

      const fileBuffer = await downloadKnowledgeFile(supabase, doc.storage_path)
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error(`Failed to download file from storage path: "${doc.storage_path}"`)
      }

      // 5. Update progress: Extracting text (50%)
      await supabase
        .from('processing_jobs')
        .update({ progress: 50 })
        .eq('id', jobId)

      const extraction = await extractDocumentText(
        fileBuffer,
        doc.filename || doc.title,
        doc.mime_type || undefined
      )

      if (!extraction.text || extraction.text.trim().length === 0) {
        throw new Error(`Extracted text from "${doc.filename || doc.title}" was empty.`)
      }

      // 6. Update progress: Chunking text (70%)
      await supabase
        .from('processing_jobs')
        .update({ progress: 70 })
        .eq('id', jobId)

      const chunks = chunkText(extraction.text, {
        maxTokens: 500,
        overlapTokens: 50,
      })

      const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0)

      // 7. Update progress: Saving chunks (85%)
      await supabase
        .from('processing_jobs')
        .update({ progress: 85 })
        .eq('id', jobId)

      // Clear any existing chunks for this document (e.g. during retries)
      await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId)

      // Insert new chunks in batches
      if (chunks.length > 0) {
        const chunkInserts = chunks.map(chunk => ({
          document_id: documentId,
          knowledge_base_id: doc.knowledge_base_id,
          chunk_index: chunk.chunkIndex,
          content: chunk.content,
          token_count: chunk.tokenCount,
          metadata: {
            ...(chunk.metadata || {}),
            filename: doc.filename,
            totalChunks: chunks.length,
          },
        }))

        const BATCH_SIZE = 50
        for (let i = 0; i < chunkInserts.length; i += BATCH_SIZE) {
          const batch = chunkInserts.slice(i, i + BATCH_SIZE)
          const { error: insertError } = await supabase
            .from('document_chunks')
            .insert(batch)

          if (insertError) {
            throw new Error(`Failed to save document chunks: ${insertError.message}`)
          }
        }
      }

      // 8. Generate vector embeddings for all document chunks (Flow: document_chunks -> generate embeddings -> update document_chunks)
      await supabase
        .from('processing_jobs')
        .update({ progress: 85 })
        .eq('id', jobId)

      const embedResult = await embeddingService.embedDocumentChunks(supabase, documentId)

      // 9. Update document: token_count, chunk_count, processing_status, document_status
      await supabase
        .from('documents')
        .update({
          content: extraction.text.slice(0, 50000), // Preview / cached text
          token_count: totalTokens,
          chunk_count: chunks.length,
          processing_status: 'completed',
          document_status: 'active',
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      // 10. Update processing_jobs: status = completed, progress = 100
      await supabase
        .from('processing_jobs')
        .update({
          status: 'completed',
          progress: 100,
          error_message: null,
          metadata: {
            totalTokens,
            chunkCount: chunks.length,
            embeddedCount: embedResult.embeddedCount,
            embeddingModel: embedResult.model,
            pageCount: extraction.pageCount,
            completedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      return {
        jobId,
        documentId,
        status: 'completed',
        totalTokens,
        chunkCount: chunks.length,
        errorMessage: null,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'
      console.error(`[Worker] Job ${jobId} failed:`, errorMessage)

      // Update document to failed
      await supabase
        .from('documents')
        .update({
          processing_status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      // Update processing_jobs to failed
      await supabase
        .from('processing_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      return {
        jobId,
        documentId,
        status: 'failed',
        totalTokens: 0,
        chunkCount: 0,
        errorMessage,
      }
    }
  }

  /**
   * Helper to process documents with direct text content (e.g. pasted or markdown source).
   */
  private async processTextDocument(
    supabase: SupabaseClient<Database>,
    jobId: string,
    doc: Database['public']['Tables']['documents']['Row']
  ): Promise<ProcessingJobResult> {
    const text = doc.content || ''
    const chunks = chunkText(text, { maxTokens: 500, overlapTokens: 50 })
    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0)

    // Clear existing chunks
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', doc.id)

    if (chunks.length > 0) {
      const chunkInserts = chunks.map(chunk => ({
        document_id: doc.id,
        knowledge_base_id: doc.knowledge_base_id,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        token_count: chunk.tokenCount,
        metadata: {
          ...(chunk.metadata || {}),
          totalChunks: chunks.length,
        },
      }))

      await supabase.from('document_chunks').insert(chunkInserts)
    }

    // Generate embeddings for direct text document chunks
    const embedResult = await embeddingService.embedDocumentChunks(supabase, doc.id)

    await supabase
      .from('documents')
      .update({
        token_count: totalTokens,
        chunk_count: chunks.length,
        processing_status: 'completed',
        document_status: 'active',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc.id)

    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        progress: 100,
        error_message: null,
        metadata: {
          totalTokens,
          chunkCount: chunks.length,
          embeddedCount: embedResult.embeddedCount,
          embeddingModel: embedResult.model,
          completedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return {
      jobId,
      documentId: doc.id,
      status: 'completed',
      totalTokens,
      chunkCount: chunks.length,
    }
  }

  /**
   * Process a document by its document ID.
   * Finds the latest job or creates a new one, then runs it.
   */
  async processDocument(
    supabase: SupabaseClient<Database>,
    documentId: string
  ): Promise<ProcessingJobResult> {
    // Check for existing pending or failed job
    const { data: job } = await supabase
      .from('processing_jobs')
      .select('id')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (job) {
      return this.processJob(supabase, job.id)
    }

    // Otherwise find document to create job
    const { data: doc, error } = await supabase
      .from('documents')
      .select('id, workspace_id')
      .eq('id', documentId)
      .single()

    if (error || !doc || !doc.workspace_id) {
      return {
        jobId: '',
        documentId,
        status: 'failed',
        totalTokens: 0,
        chunkCount: 0,
        errorMessage: 'Document or workspace not found',
      }
    }

    const { data: newJob, error: createError } = await supabase
      .from('processing_jobs')
      .insert({
        document_id: documentId,
        workspace_id: doc.workspace_id,
        job_type: 'extraction',
        status: 'pending',
        progress: 0,
      })
      .select('id')
      .single()

    if (createError || !newJob) {
      return {
        jobId: '',
        documentId,
        status: 'failed',
        totalTokens: 0,
        chunkCount: 0,
        errorMessage: createError?.message || 'Failed to create processing job',
      }
    }

    return this.processJob(supabase, newJob.id)
  }

  /**
   * Batch process all pending jobs for a workspace (or globally).
   */
  async processPendingJobs(
    supabase: SupabaseClient<Database>,
    workspaceId?: string,
    limit: number = 10
  ): Promise<ProcessingJobResult[]> {
    let query = supabase
      .from('processing_jobs')
      .select('id')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: jobs, error } = await query
    if (error || !jobs) {
      return []
    }

    const results: ProcessingJobResult[] = []
    for (const job of jobs) {
      const res = await this.processJob(supabase, job.id)
      results.push(res)
    }

    return results
  }
}

export const documentWorker = new DocumentProcessingWorker()
