import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  fetchConversationMessages, 
  saveSupabaseMessage, 
  updateSupabaseConversation,
  getOrCreateUserWorkspace
} from '@/lib/supabase/queries'
import { aiService, AIMessage, AIFinishReason } from '@/lib/ai'
import { ragService, RAGSourceCitation } from '@/lib/knowledge/rag'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const conversationId = body.conversationId || body.conversation_id
    const content = typeof body.content === 'string' ? body.content.trim() : undefined
    const selectedModel = typeof body.model === 'string' && body.model ? body.model : 'chatinalabs-ai'
    const incomingMessages: AIMessage[] = Array.isArray(body.messages) ? body.messages : []
    const isKnowledgeEnabled = body.knowledgeMode !== false
    const clientMessageId = typeof body.clientMessageId === 'string' ? body.clientMessageId : undefined

    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid conversationId' }, { status: 400 })
    }

    // Verify conversation ownership
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('id, title, user_id, workspace_id')
      .eq('id', conversationId)
      .single()

    if (convoError || !conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Conversation not found or unauthorized' }, { status: 404 })
    }

    // Resolve workspace ID for strict multi-tenant isolation
    let workspaceId = conversation.workspace_id
    if (!workspaceId) {
      workspaceId = await getOrCreateUserWorkspace(supabase, user.id, user.email || '')
    }

    // 1. Save user message to database if new message content provided
    if (content) {
      const savedUserMsg = await saveSupabaseMessage(
        supabase,
        conversationId,
        'user',
        content,
        null,
        undefined,
        clientMessageId
      )
      if (!savedUserMsg) {
        console.error('[API/Chat] Failed to persist user message:', { conversationId, clientMessageId })
      }
    }

    // 2. Fetch recent conversation history for context
    const dbMessages = await fetchConversationMessages(supabase, conversationId)
    const MAX_CONTEXT = 20
    let contextMessages: AIMessage[] = dbMessages.slice(-MAX_CONTEXT).map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }))

    // Fallback if client passed raw messages array and db query returned empty
    if (contextMessages.length === 0 && incomingMessages.length > 0) {
      contextMessages = incomingMessages.slice(-MAX_CONTEXT)
    }

    // Ensure there is at least one message to send to the provider
    if (contextMessages.length === 0 && content) {
      contextMessages = [{ role: 'user', content }]
    }

    // 3. RAG Layer: Retrieve knowledge from workspace documents and augment prompt
    let ragSources: RAGSourceCitation[] = []
    let hasKnowledge = false
    let messagesToSend = contextMessages

    if (isKnowledgeEnabled && content && workspaceId) {
      const ragResult = await ragService.prepareRAGChat(supabase, {
        workspaceId,
        query: content,
        history: contextMessages,
        model: selectedModel,
      })

      if (ragResult.hasKnowledge) {
        messagesToSend = ragResult.messages
        ragSources = ragResult.sources
        hasKnowledge = true
      }
    }

    // 4. Call AI provider stream through service layer
    const stream = aiService.stream({
      model: selectedModel,
      messages: messagesToSend,
    })

    // 4. Stream tokens to frontend and save final response on completion
    let fullAssistantText = ''
    let finishReason: AIFinishReason | undefined
    let hasSavedAssistantMessage = false
    const encoder = new TextEncoder()
    const iterator = stream[Symbol.asyncIterator]()

    const readableStream = new ReadableStream({
      async pull(controller) {
        try {
          const { value, done } = await iterator.next()

          if (done) {
            controller.close()

            // Save assistant final response
            if (!hasSavedAssistantMessage && fullAssistantText.trim().length > 0) {
              hasSavedAssistantMessage = true
              const savedAiMsg = await saveSupabaseMessage(
                supabase,
                conversationId,
                'assistant',
                fullAssistantText,
                selectedModel,
                { 
                  finishReason: finishReason || 'stop', 
                  status: 'completed',
                  hasKnowledge,
                  sources: ragSources,
                }
              )
              if (!savedAiMsg) {
                console.error('[API/Chat] Failed to persist assistant message:', { conversationId, selectedModel })
              }

              // Background auto-title generation if new chat
              if (conversation.title === 'New Chat' || conversation.title === 'New Conversation') {
                try {
                  const titleResp = await aiService.generate({
                    model: selectedModel,
                    messages: [
                      {
                        role: 'system',
                        content: 'You are a concise title generator. Summarize the user message in 3 to 6 words. Do not use quotes, punctuation, or periods.',
                      },
                      {
                        role: 'user',
                        content: content || fullAssistantText.slice(0, 100),
                      },
                    ],
                  })
                  const cleanTitle = titleResp.content.trim().replace(/^["']|["']$/g, '')
                  if (cleanTitle) {
                    await updateSupabaseConversation(supabase, conversationId, { title: cleanTitle })
                  }
                } catch (titleErr) {
                  console.warn('[AutoTitle] Generation failed:', titleErr)
                }
              }
            }
          } else if (value) {
            if (value.delta) {
              fullAssistantText += value.delta
              controller.enqueue(encoder.encode(value.delta))
            }
            if (value.finishReason) {
              finishReason = value.finishReason
            }
          }
        } catch (streamErr) {
          console.error('[API/Chat] Streaming pull error:', streamErr)
          controller.error(streamErr)
        }
      },
      async cancel() {
        if (iterator.return) {
          await iterator.return()
        }
        if (!hasSavedAssistantMessage && fullAssistantText.trim().length > 0) {
          hasSavedAssistantMessage = true
          try {
            await saveSupabaseMessage(
              supabase,
              conversationId,
              'assistant',
              fullAssistantText,
              selectedModel,
              { status: 'aborted', hasKnowledge, sources: ragSources }
            )
          } catch (abortErr) {
            console.error('[API/Chat] Error saving aborted assistant message:', abortErr)
          }
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'X-Has-Knowledge': hasKnowledge ? 'true' : 'false',
        'X-Sources-Count': String(ragSources.length),
      },
    })
  } catch (error) {
    console.error('[API/Chat] Handler error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
