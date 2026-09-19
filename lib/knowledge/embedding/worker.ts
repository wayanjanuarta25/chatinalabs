import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { ProcessingJobResult } from '../processors/types'
import { embeddingService } from './service'

/**
 * Worker dedicated to processing embedding jobs for document chunks.
 */
export class EmbeddingWorker {
  /**
   * Process a single embedding job by its ID.
   * Updates job: pending -> processing -> completed / failed
   * Generates embeddings and updates document_chunks.
   */
  async processJob(
    supabase: SupabaseClient<Database>,
    jobId: string
  ): Promise<ProcessingJobResult> {
    // 1. Fetch job
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error(`[EmbeddingWorker] Job not found: ${jobId}`, jobError?.message)
      return {
        jobId,
        documentId: '',
        status: 'failed',
        totalTokens: 0,
        chunkCount: 0,
        errorMessage: jobError?.message || 'Processing job not found',
      }
    }

    const documentId = job.document_id

    try {
      // 2. Mark job as processing (progress = 10%)
      await supabase
        .from('processing_jobs')
        .update({
          status: 'processing',
          progress: 10,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      // 3. Mark progress: Reading chunks (30%)
      await supabase
        .from('processing_jobs')
        .update({ progress: 30 })
        .eq('id', jobId)

      // 4. Generate embeddings and persist to document_chunks
      const embedResult = await embeddingService.embedDocumentChunks(supabase, documentId)

      if (!embedResult.success) {
        throw new Error(embedResult.errorMessage || 'Failed to embed document chunks')
      }

      // 5. Update progress: (90%)
      await supabase
        .from('processing_jobs')
        .update({ progress: 90 })
        .eq('id', jobId)

      // 6. Complete job: progress = 100%, status = completed
      await supabase
        .from('processing_jobs')
        .update({
          status: 'completed',
          progress: 100,
          error_message: null,
          metadata: {
            embeddedCount: embedResult.embeddedCount,
            model: embedResult.model,
            totalTokens: embedResult.totalTokens,
            completedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      return {
        jobId,
        documentId,
        status: 'completed',
        totalTokens: embedResult.totalTokens,
        chunkCount: embedResult.embeddedCount,
        errorMessage: null,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown embedding error'
      console.error(`[EmbeddingWorker] Job ${jobId} failed:`, errorMessage)

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
   * Embed all chunks for a document and manage a corresponding 'embedding' job.
   */
  async processDocumentEmbeddings(
    supabase: SupabaseClient<Database>,
    params: {
      documentId: string
      workspaceId: string
    }
  ): Promise<ProcessingJobResult> {
    // Check if an existing pending or failed embedding job exists
    const { data: existingJob } = await supabase
      .from('processing_jobs')
      .select('id')
      .eq('document_id', params.documentId)
      .eq('job_type', 'embedding')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingJob) {
      return this.processJob(supabase, existingJob.id)
    }

    // Otherwise create a new embedding job
    const { data: newJob, error: createError } = await supabase
      .from('processing_jobs')
      .insert({
        document_id: params.documentId,
        workspace_id: params.workspaceId,
        job_type: 'embedding',
        status: 'pending',
        progress: 0,
      })
      .select('id')
      .single()

    if (createError || !newJob) {
      return {
        jobId: '',
        documentId: params.documentId,
        status: 'failed',
        totalTokens: 0,
        chunkCount: 0,
        errorMessage: createError?.message || 'Failed to create embedding job',
      }
    }

    return this.processJob(supabase, newJob.id)
  }
}

export const embeddingWorker = new EmbeddingWorker()
