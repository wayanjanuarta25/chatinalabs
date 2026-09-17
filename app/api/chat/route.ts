import { streamText, generateText } from 'ai'
import { openai } from '@/lib/openai'
import { AI_CONFIG, getModelConfig } from '@/lib/ai/config'
import { SYSTEM_PROMPT } from '@/ai/prompts/system'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { saveMessage } from '@/lib/supabase/queries'
import { Database } from '@/lib/supabase/database.types'

export async function POST(req: Request) {
  try {
    const { conversationId, content, clientMessageId } = await req.json()
    
    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify conversation ownership
    const { data: conversation, error: convoError } = await (supabase as any)
      .from('conversations')
      .select('id, title')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convoError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or unauthorized' }, { status: 404 })
    }

    // 1. Save user message if provided (skips if regenerating)
    if (content) {
      await saveMessage(conversationId, 'user', content, clientMessageId)
    }

    // 2. Fetch previous messages
    const { data: rawMessagesData, error: msgsError } = await (supabase as any)
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      
    const messagesData = rawMessagesData as Database['public']['Tables']['messages']['Row'][]

    if (msgsError) {
      return NextResponse.json({ error: 'Failed to fetch conversation history' }, { status: 500 })
    }

    // 3. Context Windowing
    // We enforce a safe context limit to prevent unbounded payloads
    const MAX_CONTEXT_MESSAGES = 20;
    const historyToKeep = messagesData.slice(-MAX_CONTEXT_MESSAGES);

    const coreMessages = historyToKeep.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }))

    // 4. Stream Response
    const result = streamText({
      model: openai(AI_CONFIG.defaultModel),
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      ...getModelConfig(AI_CONFIG.defaultModel),
      async onFinish({ text, finishReason, usage }) {
        try {
          if (text.trim().length > 0) {
            // A. Save Assistant Message with usage metadata
            await saveMessage(
              conversationId, 
              'assistant', 
              text, 
              undefined, 
              { 
                finishReason, 
                promptTokens: (usage as any)?.promptTokens || 0, 
                completionTokens: (usage as any)?.completionTokens || 0, 
                status: (finishReason as string) === 'abort' ? 'aborted' : 'completed' 
              }
            )

            // B. Background Auto-Title Generation
            if (conversation.title === 'New Conversation') {
              const titleResult = await generateText({
                model: openai(AI_CONFIG.defaultModel),
                system: "You are a concise title generator. Summarize the user's prompt in 3 to 7 words. Do not use quotes or periods.",
                prompt: content,
                temperature: 0.5,
              })
              
              const newTitle = titleResult.text.trim().replace(/^["']|["']$/g, '');
              
              // We use the existing supabase client to update the title
              await (supabase as any)
                .from('conversations')
                .update({ title: newTitle })
                .eq('id', conversationId)
            }
          }
        } catch (err) {
          console.error("Error in onFinish background task:", err)
        }
      }
    })

    return result.toTextStreamResponse()
    
  } catch (error: unknown) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
