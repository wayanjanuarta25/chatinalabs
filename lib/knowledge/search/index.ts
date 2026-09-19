import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { SearchKnowledgeParams, SearchKnowledgeResult } from './types'
import { knowledgeSearchService } from './service'

export * from './types'
export * from './vector'
export * from './service'

/**
 * Convenience function to search knowledge base chunks by semantic vector similarity.
 */
export async function searchKnowledge(
  supabase: SupabaseClient<Database>,
  params: SearchKnowledgeParams
): Promise<SearchKnowledgeResult> {
  return knowledgeSearchService.searchKnowledge(supabase, params)
}
