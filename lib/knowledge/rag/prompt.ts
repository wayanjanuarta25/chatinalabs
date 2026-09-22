import { AIMessage } from '@/lib/ai/types'
import { RAGContextPayload } from './types'

export const DEFAULT_RAG_SYSTEM_PROMPT = `You are chatINALabs AI, an intelligent pair programmer and workspace knowledge assistant.
Your goal is to provide accurate, comprehensive, and helpful answers.

When Knowledge Base Context is provided:
1. Base your answer primarily on the retrieved excerpts.
2. Cite the sources using [Source 1], [Source 2], etc., when referencing specific facts, figures, or code snippets.
3. If the provided context does not contain enough information to fully answer the question, supplement with your general knowledge while clearly indicating what came from the workspace documents and what is general knowledge.
4. Maintain a professional, concise, and structured tone with markdown formatting where appropriate.`

export const DEFAULT_FALLBACK_SYSTEM_PROMPT = `You are chatINALabs AI, an intelligent, helpful, and concise pair programmer and conversational assistant.
Answer the user's questions clearly, providing code examples and explanations where relevant.`

/**
 * Creates an augmented message history array ready for AI provider streaming.
 * Injects retrieved workspace knowledge context when available, or falls back to normal chat.
 */
export function createRAGPrompt(params: {
  context: RAGContextPayload
  userQuery: string
  history?: AIMessage[]
  systemPrompt?: string
}): AIMessage[] {
  const { context, userQuery, history = [], systemPrompt } = params

  // 1. Fallback: If no knowledge was retrieved or context is empty, return normal conversation messages
  if (!context.hasKnowledge || !context.contextBlock) {
    const baseSystem = systemPrompt || DEFAULT_FALLBACK_SYSTEM_PROMPT
    const cleanHistory = history.filter(m => m.role !== 'system')
    const lastMsg = cleanHistory[cleanHistory.length - 1]
    const lastContent = typeof lastMsg?.content === 'string' ? lastMsg.content : ''
    const isDuplicate = lastContent === userQuery || (lastMsg?.role === 'user' && typeof lastMsg?.content !== 'string')

    return [
      { role: 'system', content: baseSystem },
      ...cleanHistory,
      ...(isDuplicate ? [] : [{ role: 'user' as const, content: userQuery }]),
    ]
  }

  // 2. Knowledge-augmented mode: Combine system prompt with retrieved context
  const baseSystem = systemPrompt || DEFAULT_RAG_SYSTEM_PROMPT
  const augmentedSystemPrompt = `${baseSystem}\n\n${context.contextBlock}`

  const cleanHistory = history.filter(m => m.role !== 'system')
  const lastMsg = cleanHistory[cleanHistory.length - 1]
  const lastContent = typeof lastMsg?.content === 'string' ? lastMsg.content : ''
  const isDuplicate = lastContent === userQuery || (lastMsg?.role === 'user' && typeof lastMsg?.content !== 'string')

  return [
    { role: 'system', content: augmentedSystemPrompt },
    ...cleanHistory,
    ...(isDuplicate ? [] : [{ role: 'user' as const, content: userQuery }]),
  ]
}
