import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { 
  fetchConversationMessages, 
  saveSupabaseMessage, 
  updateSupabaseConversation,
  getOrCreateUserWorkspace
} from '@/lib/supabase/queries'
import { 
  aiService, 
  AIMessage, 
  AIFinishReason, 
  buildRuntimeContext, 
  BASE_SYSTEM_PROMPT,
  buildMultimodalMessageContent,
  markAttachmentsAsVisionProcessed,
  fastCheckImageIntent,
  detectAndEnhanceImageIntent,
  generateImageBuffer,
  persistGeneratedImageAttachment,
  createStreamFromText,
  createReadableStream,
  processDocumentAttachments,
  buildDocumentContextBlock
} from '@/lib/ai'
import { ragService, RAGSourceCitation, DEFAULT_RAG_SYSTEM_PROMPT } from '@/lib/knowledge/rag'

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
    const isRegenerate = Boolean(body.isRegenerate)
    const isRetry = Boolean(body.isRetry)

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

    // Resolve workspace name and user display name for runtime context
    let workspaceName = 'chatINALabs'
    const { data: wsData } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .single()
    if (wsData?.name) {
      workspaceName = wsData.name
    }

    const userDisplayName = (user.user_metadata?.full_name as string) || (user.email ? user.email.split('@')[0] : 'User')

    const runtimeContext = buildRuntimeContext({
      user_id: user.id,
      userName: userDisplayName,
      workspace_id: workspaceId,
      workspace_name: workspaceName,
    })

    // 1. Save user message to database if new message content provided and not regenerating
    if (content && !isRegenerate) {
      let shouldSaveUserMsg = true
      if (isRetry) {
        const existingMessages = await fetchConversationMessages(supabase, conversationId)
        const lastUser = [...existingMessages].reverse().find(m => m.role === 'user')
        if (lastUser && lastUser.content === content) {
          shouldSaveUserMsg = false
        }
      }

      if (shouldSaveUserMsg && clientMessageId) {
        const { data: existingMsg } = await supabase
          .from('messages')
          .select('id')
          .eq('id', clientMessageId)
          .maybeSingle()
        if (existingMsg) {
          shouldSaveUserMsg = false
        }
      }

      if (shouldSaveUserMsg) {
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
    }

    // 1.5 Image Generation Request Interceptor
    if (content && fastCheckImageIntent(content)) {
      try {
        const intent = await detectAndEnhanceImageIntent(content)
        if (intent.isImageRequest && intent.englishPrompt) {
          console.log(`[CHAT] Image generation request detected\nconversation.id:\n${conversationId}\nprompt:\n${intent.englishPrompt}`)
          
          const assistantMessageId = crypto.randomUUID()
          const genResult = await generateImageBuffer(intent.englishPrompt, intent.width, intent.height)

          const attachment = await persistGeneratedImageAttachment({
            workspaceId,
            conversationId,
            messageId: assistantMessageId,
            buffer: genResult.buffer,
            mimeType: genResult.mimeType,
            suggestedFileName: intent.suggestedFileName || 'generated-image.png',
            prompt: content,
            englishPrompt: intent.englishPrompt,
            model: genResult.model,
            aspectRatio: intent.aspectRatio || '9:16',
          })

          const captionText = intent.caption || 'Berikut adalah gambar yang telah dibuat sesuai permintaan Anda:'

          await saveSupabaseMessage(
            supabase,
            conversationId,
            'assistant',
            captionText,
            genResult.model,
            {
              isGeneratedImage: true,
              generatedAttachmentId: attachment.id,
              attachment_url: attachment.signedUrl,
              aspect_ratio: intent.aspectRatio,
              status: 'completed',
            },
            assistantMessageId
          )

          const stream = createReadableStream(createStreamFromText(captionText, 4, 10))
          const attachmentPayload = {
            id: attachment.id,
            message_id: attachment.message_id,
            workspace_id: attachment.workspace_id,
            file_name: attachment.file_name,
            file_size: attachment.file_size,
            mime_type: attachment.mime_type,
            storage_path: attachment.storage_path,
            attachment_type: 'image',
            signedUrl: attachment.signedUrl,
            metadata: attachment.metadata,
          }

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'X-Generated-Attachment': encodeURIComponent(JSON.stringify(attachmentPayload)),
              'X-Generated-Attachment-Id': attachment.id,
            },
          })
        }
      } catch (imageErr) {
        console.error('[API/Chat] Image generation error:', imageErr)
        const errorMessage = imageErr instanceof Error ? imageErr.message : 'Gagal menghasilkan gambar.'
        const assistantMessageId = crypto.randomUUID()
        const userFriendlyMsg = `⚠️ ${errorMessage}`

        await saveSupabaseMessage(
          supabase,
          conversationId,
          'assistant',
          userFriendlyMsg,
          selectedModel,
          { status: 'error', error: errorMessage },
          assistantMessageId
        )

        const stream = createReadableStream(createStreamFromText(userFriendlyMsg, 4, 10))
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
          },
        })
      }
    }

    // 2. Fetch recent conversation history for context & build multimodal messages
    // Use admin client to reliably join message_attachments without RLS nested filter drops
    const adminSupabase = createAdminClient()
    const dbMessages = await fetchConversationMessages(adminSupabase, conversationId)
    const MAX_CONTEXT = 20
    const recentDbMessages = dbMessages.slice(-MAX_CONTEXT)

    const processedImageAttachmentIds: string[] = []
    let contextMessages: AIMessage[] = []

    for (let i = 0; i < recentDbMessages.length; i++) {
      const m = recentDbMessages[i]
      const hasImages = m.role === 'user' && m.message_attachments && m.message_attachments.some(a => a.attachment_type === 'image')
      const hasDocs = m.role === 'user' && m.message_attachments && m.message_attachments.some(a => a.attachment_type === 'document')
      const isRecentTurn = i >= recentDbMessages.length - 10

      let messageText = m.content

      // If message has document attachments, extract their text content and append context block
      if (hasDocs && isRecentTurn && m.message_attachments) {
        try {
          const docs = await processDocumentAttachments(m.message_attachments)
          if (docs.length > 0) {
            console.log(`[API/Chat] Successfully extracted ${docs.length} document(s) for message ${m.id}`)
            const docContext = buildDocumentContextBlock(docs)
            messageText = messageText ? `${messageText}\n\n${docContext}` : docContext
          }
        } catch (docErr) {
          console.warn('[API/Chat] Failed processing document attachments:', docErr)
        }
      }

      if (hasImages && isRecentTurn) {
        const multimodalContent = await buildMultimodalMessageContent(messageText, m.message_attachments)
        contextMessages.push({
          role: m.role as 'system' | 'user' | 'assistant',
          content: multimodalContent,
        })
        m.message_attachments?.forEach(a => {
          if (a.attachment_type === 'image') {
            processedImageAttachmentIds.push(a.id)
          }
        })
      } else {
        contextMessages.push({
          role: m.role as 'system' | 'user' | 'assistant',
          content: messageText,
        })
      }
    }

    // If regenerating, remove trailing assistant response from DB and context so AI generates a fresh reply
    if (isRegenerate) {
      if (contextMessages.length > 0 && contextMessages[contextMessages.length - 1].role === 'assistant') {
        contextMessages = contextMessages.slice(0, -1)
      }
      try {
        const lastAssistantMsg = [...recentDbMessages].reverse().find(m => m.role === 'assistant')
        if (lastAssistantMsg) {
          await supabase.from('messages').delete().eq('id', lastAssistantMsg.id)
        }
      } catch (err) {
        console.warn('[API/Chat] Failed cleaning up old assistant message during regenerate:', err)
      }
    }

    // Fallback if client passed raw messages array and db query returned empty
    if (contextMessages.length === 0 && incomingMessages.length > 0) {
      contextMessages = incomingMessages.slice(-MAX_CONTEXT)
    }

    // Ensure there is at least one message to send to the provider
    if (contextMessages.length === 0 && content) {
      contextMessages = [{ role: 'user', content }]
    }

    // 3. RAG Layer: Retrieve knowledge from workspace documents and augment prompt
    // Skip workspace RAG search if user already attached specific documents to this conversation
    const hasDocAttachmentsInTurn = recentDbMessages.some(
      m => m.role === 'user' && m.message_attachments?.some(a => a.attachment_type === 'document')
    )

    let ragSources: RAGSourceCitation[] = []
    let hasKnowledge = false
    let messagesToSend = contextMessages

    if (!hasDocAttachmentsInTurn && isKnowledgeEnabled && content && workspaceId) {
      const ragResult = await ragService.prepareRAGChat(supabase, {
        workspaceId,
        query: content,
        history: contextMessages,
        model: selectedModel,
        options: {
          systemPrompt: `${DEFAULT_RAG_SYSTEM_PROMPT}\n\n${runtimeContext}`,
        },
      })

      if (ragResult.hasKnowledge) {
        messagesToSend = ragResult.messages
        ragSources = ragResult.sources
        hasKnowledge = true
      }
    }

    // 4. Runtime Context Injection: ensure real-time awareness is always active
    const existingSystemIdx = messagesToSend.findIndex(m => m.role === 'system')
    if (existingSystemIdx !== -1) {
      const currentSystemContent = typeof messagesToSend[existingSystemIdx].content === 'string'
        ? messagesToSend[existingSystemIdx].content
        : ''
      if (!currentSystemContent.includes('RUNTIME INFORMATION')) {
        messagesToSend[existingSystemIdx].content = `${currentSystemContent}\n\n${runtimeContext}`
      }
    } else {
      messagesToSend = [
        {
          role: 'system',
          content: `${BASE_SYSTEM_PROMPT}\n\n${runtimeContext}`,
        },
        ...messagesToSend,
      ]
    }

    if (isRegenerate) {
      console.log(`[CHAT] Regeneration started\nconversation.id:\n${conversationId}`)
    } else if (isRetry) {
      console.log(`[CHAT] Retry generation\nconversation.id:\n${conversationId}`)
    } else {
      console.log(`[CHAT] Generation started\nconversation.id:\n${conversationId}`)
    }

    // 5. Call AI provider stream through service layer
    const stream = aiService.stream({
      model: selectedModel,
      messages: messagesToSend,
    })

    // 4. Stream tokens to frontend and save final response on completion
    let fullAssistantText = ''
    let finishReason: AIFinishReason | undefined
    let hasSavedAssistantMessage = false
    let isAborted = false
    const encoder = new TextEncoder()
    const iterator = stream[Symbol.asyncIterator]()

    // Track client disconnection / abort via request.signal
    const abortHandler = () => {
      if (!isAborted) {
        isAborted = true
        console.log(`[CHAT] Generation aborted by user\nconversation.id:\n${conversationId}`)
      }
    }
    req.signal.addEventListener('abort', abortHandler)

    const readableStream = new ReadableStream({
      async pull(controller) {
        try {
          if (req.signal.aborted || isAborted) {
            req.signal.removeEventListener('abort', abortHandler)
            if (iterator.return) {
              await iterator.return()
            }
            controller.close()
            return
          }

          const { value, done } = await iterator.next()

          if (done) {
            req.signal.removeEventListener('abort', abortHandler)

            // Save assistant final response BEFORE closing stream to prevent client sync race conditions
            if (!hasSavedAssistantMessage && fullAssistantText.trim().length > 0) {
              hasSavedAssistantMessage = true
              let assistantStatus = 'completed'
              if (isRegenerate) {
                assistantStatus = 'regenerated'
              } else if (isRetry) {
                assistantStatus = 'retry'
              }

              const savedAiMsg = await saveSupabaseMessage(
                supabase,
                conversationId,
                'assistant',
                fullAssistantText,
                selectedModel,
                { 
                  finishReason: finishReason || 'stop', 
                  status: assistantStatus,
                  hasKnowledge,
                  sources: ragSources,
                }
              )
              if (!savedAiMsg) {
                console.error('[API/Chat] Failed to persist assistant message:', { conversationId, selectedModel })
              }

              // Update metadata.vision_processing for processed images
              if (processedImageAttachmentIds.length > 0) {
                markAttachmentsAsVisionProcessed(processedImageAttachmentIds, selectedModel).catch(err => {
                  console.warn('[Vision] Could not update attachment vision metadata:', err)
                })
              }

              // Background auto-title generation if new chat
              if (conversation.title === 'New Chat' || conversation.title === 'New Conversation') {
                aiService.generate({
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
                }).then(async titleResp => {
                  const cleanTitle = titleResp.content.trim().replace(/^["']|["']$/g, '')
                  if (cleanTitle) {
                    await updateSupabaseConversation(supabase, conversationId, { title: cleanTitle })
                  }
                }).catch(titleErr => {
                  console.warn('[AutoTitle] Generation failed:', titleErr)
                })
              }
            }

            console.log('[CHAT] Generation completed')
            controller.close()
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
          req.signal.removeEventListener('abort', abortHandler)
          console.error('[API/Chat] Streaming pull error:', streamErr)
          controller.error(streamErr)
        }
      },
      async cancel() {
        if (!isAborted) {
          isAborted = true
          console.log(`[CHAT] Generation aborted by user\nconversation.id:\n${conversationId}`)
        }
        req.signal.removeEventListener('abort', abortHandler)
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
              `${fullAssistantText.trim()} [stopped]`,
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
