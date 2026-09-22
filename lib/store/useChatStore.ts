'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { 
  Conversation, 
  Message, 
  AVAILABLE_MODELS 
} from './dummyData'
import {
  fetchUserConversations,
  fetchConversationMessages,
  createSupabaseConversation,
  saveSupabaseMessage,
  updateSupabaseConversation,
  deleteSupabaseConversation,
  updateMessageFeedback,
} from '@/lib/supabase/queries'
import { uploadAttachmentFile } from '@/lib/attachments/upload'
import type { MessageAttachment } from './dummyData'

import { consumeTextStream } from '@/lib/consume-text-stream'

export function getCategoryFromDate(dateString: string): 'Today' | 'Yesterday' | 'Previous 7 Days' {
  const date = new Date(dateString)
  const now = new Date()

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  if (date >= startOfToday) {
    return 'Today'
  } else if (date >= startOfYesterday) {
    return 'Yesterday'
  } else {
    return 'Previous 7 Days'
  }
}

export function formatDisplayTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface ChatStore {
  conversations: Conversation[]
  activeConversationId: string | null
  selectedModel: string
  chatState: 'idle' | 'thinking' | 'streaming' | 'error'
  streamingContent: string
  abortController: AbortController | null
  isGenerating: boolean
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  isSearchModalOpen: boolean
  isModelSelectorOpen: boolean
  error: string | null
  lastFailedMessage: { conversationId: string; content: string } | null
  lastFailedMessageId: string | null

  // Getters
  getActiveConversation: () => Conversation | undefined
  getCurrentMessages: () => Message[]

  // Supabase-backed actions
  loadConversations: () => Promise<void>
  createNewChat: () => Promise<void>
  selectConversation: (id: string | null) => Promise<void>
  sendMessage: (content: string, files?: File[]) => Promise<{ success: boolean; error?: string; failedFileName?: string } | void>
  stopGeneration: () => void
  regenerateResponse: (targetMessageId?: string) => Promise<void>
  retryLastMessage: () => Promise<void>
  retryFailedGeneration: (failedMessageId?: string) => Promise<void>
  renameConversation: (id: string, newTitle: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  toggleFeedback: (messageId: string, type: 'like' | 'dislike') => Promise<void>
  copyMessage: (content: string) => Promise<boolean>
  clearError: () => void

  // UI state toggles
  setSelectedModel: (modelId: string) => void
  setSearchModalOpen: (open: boolean) => void
  setModelSelectorOpen: (open: boolean) => void
  editUserMessage: (messageId: string, newContent: string) => Promise<void>
}

let streamingTimer: NodeJS.Timeout | null = null

function parseGeneratedAttachment(response: Response): import('./dummyData').MessageAttachment[] | undefined {
  const header = response.headers.get('X-Generated-Attachment')
  if (!header) return undefined
  try {
    const raw = JSON.parse(decodeURIComponent(header))
    return [raw]
  } catch (err) {
    console.warn('[useChatStore] Failed parsing X-Generated-Attachment header:', err)
    return undefined
  }
}

async function syncConversationFromDatabase(conversationId: string, set: (fn: (state: ChatStore) => Partial<ChatStore>) => void) {
  try {
    const supabase = createClient()
    const dbMessages = await fetchConversationMessages(supabase, conversationId)
    if (dbMessages && dbMessages.length > 0) {
      const mapped: Message[] = dbMessages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: formatDisplayTime(m.created_at),
        feedback: (m.metadata as Record<string, unknown>)?.feedback as 'like' | 'dislike' | null,
        metadata: (m.metadata as Record<string, unknown>) || undefined,
        model: ((m.metadata as Record<string, unknown>)?.model as string) || undefined,
        sources: (m.metadata as Record<string, unknown>)?.sources as Message['sources'],
        hasKnowledge: Boolean((m.metadata as Record<string, unknown>)?.hasKnowledge),
        attachments: (m.message_attachments as unknown as import('./dummyData').MessageAttachment[]) || undefined,
      }))
      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === conversationId ? { ...c, messages: mapped } : c
        )
      }))
    }
  } catch (err) {
    console.warn('[useChatStore] Background sync failed:', err)
  }
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  selectedModel: AVAILABLE_MODELS[0].id,
  chatState: 'idle',
  streamingContent: '',
  abortController: null,
  isGenerating: false,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSearchModalOpen: false,
  isModelSelectorOpen: false,
  error: null,
  lastFailedMessage: null,
  lastFailedMessageId: null,

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get()
    return conversations.find(c => c.id === activeConversationId)
  },

  getCurrentMessages: () => {
    const active = get().getActiveConversation()
    return active ? active.messages : []
  },

  loadConversations: async () => {
    set({ isLoadingConversations: true })
    const supabase = createClient()
    try {
      const dbConversations = await fetchUserConversations(supabase)
      
      const mapped: Conversation[] = dbConversations.map(c => ({
        id: c.id,
        title: c.title,
        category: getCategoryFromDate(c.updated_at),
        updatedAt: formatDisplayTime(c.updated_at),
        modelId: c.model || AVAILABLE_MODELS[0].id,
        messages: [],
      }))

      set({ 
        conversations: mapped,
        isLoadingConversations: false 
      })

      // If active conversation exists, load its messages
      const activeId = get().activeConversationId
      if (activeId) {
        await get().selectConversation(activeId)
      }
    } catch (err) {
      console.error('Error in loadConversations:', err)
      set({ isLoadingConversations: false })
    }
  },

  selectConversation: async (id: string | null) => {
    if (streamingTimer) {
      clearInterval(streamingTimer)
      streamingTimer = null
    }

    if (!id) {
      set({
        activeConversationId: null,
        selectedModel: AVAILABLE_MODELS[0].id,
        chatState: 'idle',
        streamingContent: '',
        isModelSelectorOpen: false,
      })
      return
    }

    const targetConv = get().conversations.find(c => c.id === id)
    set({
      activeConversationId: id,
      selectedModel: targetConv?.modelId || AVAILABLE_MODELS[0].id,
      chatState: 'idle',
      streamingContent: '',
      isModelSelectorOpen: false,
      isLoadingMessages: true,
    })

    const supabase = createClient()
    try {
      const dbMessages = await fetchConversationMessages(supabase, id)
      const mappedMessages: Message[] = dbMessages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: formatDisplayTime(m.created_at),
        feedback: (m.metadata as Record<string, unknown>)?.feedback as 'like' | 'dislike' | null,
        metadata: (m.metadata as Record<string, unknown>) || undefined,
        model: ((m.metadata as Record<string, unknown>)?.model as string) || undefined,
        sources: (m.metadata as Record<string, unknown>)?.sources as Message['sources'],
        hasKnowledge: Boolean((m.metadata as Record<string, unknown>)?.hasKnowledge),
        attachments: (m.message_attachments as unknown as import('./dummyData').MessageAttachment[]) || undefined,
      }))

      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === id ? { ...c, messages: mappedMessages } : c
        ),
        isLoadingMessages: false,
      }))
    } catch (err) {
      console.error('Error fetching conversation messages:', err)
      set({ isLoadingMessages: false })
    }
  },

  createNewChat: async () => {
    if (streamingTimer) {
      clearInterval(streamingTimer)
      streamingTimer = null
    }

    const supabase = createClient()
    try {
      // Create conversation row in Supabase
      const newConv = await createSupabaseConversation(supabase, 'New Chat', 'chatINALabs AI')
      
      if (newConv) {
        const mappedConv: Conversation = {
          id: newConv.id,
          title: newConv.title,
          category: 'Today',
          updatedAt: formatDisplayTime(newConv.updated_at),
          modelId: newConv.model || AVAILABLE_MODELS[0].id,
          messages: [],
        }

        set(state => ({
          conversations: [mappedConv, ...state.conversations.filter(c => c.id !== newConv.id)],
          activeConversationId: newConv.id,
          selectedModel: AVAILABLE_MODELS[0].id,
          chatState: 'idle',
          streamingContent: '',
          isModelSelectorOpen: false,
        }))

        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `/chat/${newConv.id}`)
        }
      } else {
        // Local fallback if offline or db error
        set({
          activeConversationId: null,
          selectedModel: AVAILABLE_MODELS[0].id,
          chatState: 'idle',
          streamingContent: '',
          isModelSelectorOpen: false,
        })
      }
    } catch (err) {
      console.error('Error in createNewChat:', err)
      set({
        activeConversationId: null,
        selectedModel: AVAILABLE_MODELS[0].id,
        chatState: 'idle',
        streamingContent: '',
        isModelSelectorOpen: false,
      })
    }
  },

  deleteConversation: async (id: string) => {
    const supabase = createClient()
    
    // Optimistic UI update
    set(state => {
      const remaining = state.conversations.filter(c => c.id !== id)
      const nextActive = state.activeConversationId === id 
        ? (remaining.length > 0 ? remaining[0].id : null) 
        : state.activeConversationId

      if (typeof window !== 'undefined') {
        if (nextActive) {
          window.history.pushState(null, '', `/chat/${nextActive}`)
        } else {
          window.history.pushState(null, '', '/chat')
        }
      }

      return {
        conversations: remaining,
        activeConversationId: nextActive,
      }
    })

    try {
      await deleteSupabaseConversation(supabase, id)
    } catch (err) {
      console.error('Error deleting conversation from Supabase:', err)
    }
  },

  renameConversation: async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim()
    if (!trimmed) return

    // Optimistic update
    set(state => ({
      conversations: state.conversations.map(c => 
        c.id === id ? { ...c, title: trimmed } : c
      ),
    }))

    const supabase = createClient()
    try {
      await updateSupabaseConversation(supabase, id, { title: trimmed })
    } catch (err) {
      console.error('Error renaming conversation in Supabase:', err)
    }
  },

  sendMessage: async (content: string, files?: File[]) => {
    const trimmed = content.trim()
    const hasFiles = Boolean(files && files.length > 0)
    if ((!trimmed && !hasFiles) || get().chatState === 'thinking' || get().chatState === 'streaming') return

    const supabase = createClient()
    let currentConvId = get().activeConversationId
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const titleText = trimmed || (hasFiles && files![0] ? files![0].name : 'New Chat')
    const derivedTitle = titleText.length > 36 ? titleText.slice(0, 36) + '...' : titleText

    // If starting a fresh chat without prior row, create it in Supabase
    if (!currentConvId) {
      const newConv = await createSupabaseConversation(
        supabase, 
        derivedTitle, 
        get().selectedModel
      )
      if (newConv) {
        currentConvId = newConv.id
        const newConversation: Conversation = {
          id: newConv.id,
          title: derivedTitle,
          category: 'Today',
          updatedAt: now,
          messages: [],
          modelId: get().selectedModel,
        }
        set(state => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: currentConvId,
        }))
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `/chat/${currentConvId}`)
        }
      } else {
        // Fallback local ID
        currentConvId = `conv-${Date.now()}`
        const newConversation: Conversation = {
          id: currentConvId,
          title: derivedTitle,
          category: 'Today',
          updatedAt: now,
          messages: [],
          modelId: get().selectedModel,
        }
        set(state => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: currentConvId,
        }))
      }
    } else {
      // If conversation title is still 'New Chat', update it to the first prompt
      const currentConv = get().getActiveConversation()
      if (currentConv?.title === 'New Chat') {
        get().renameConversation(currentConvId, derivedTitle)
      }
    }

    const targetConvId = currentConvId
    const userMessageId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-u-${Date.now()}`
    const finalContent = trimmed || (hasFiles ? `[Lampiran: ${files!.map(f => f.name).join(', ')}]` : '')

    // Step A: If attachments present, save user message first and upload files
    let uploadedAttachments: MessageAttachment[] = []
    if (hasFiles) {
      const savedUserMsg = await saveSupabaseMessage(
        supabase,
        targetConvId,
        'user',
        finalContent,
        null,
        undefined,
        userMessageId,
        userMessageId
      )

      if (!savedUserMsg) {
        const errMsg = 'Failed to create message record before uploading attachments.'
        set({ error: errMsg, chatState: 'error', isGenerating: false })
        return { success: false, error: errMsg }
      }

      for (const file of files!) {
        const res = await uploadAttachmentFile({
          file,
          conversationId: targetConvId,
          messageId: userMessageId,
        })

        if (res.success && res.attachment) {
          uploadedAttachments.push(res.attachment)
        } else {
          const uploadErr = res.error || `Upload failed for file: ${file.name}`
          console.error(`[upload] Failed uploading attachment "${file.name}":`, uploadErr)

          // Rollback: Remove any already-uploaded files for this failed attempt
          if (uploadedAttachments.length > 0) {
            const pathsToRemove = uploadedAttachments.map(a => a.storage_path)
            await supabase.storage.from('chat-attachments').remove(pathsToRemove)
          }

          // Rollback: Delete message from Supabase (cascades to delete any partial attachment records)
          await supabase.from('messages').delete().eq('id', userMessageId)

          set({
            error: uploadErr,
            chatState: 'idle',
            isGenerating: false,
          })

          return {
            success: false,
            error: uploadErr,
            failedFileName: file.name,
          }
        }
      }
    }

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: finalContent,
      createdAt: now,
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
    }

    const controller = new AbortController()
    console.log(`[CHAT] Generation started\nconversation.id:\n${targetConvId}`)

    // Optimistically append user message & enter thinking state
    set(state => ({
      conversations: state.conversations.map(c => 
        c.id === currentConvId 
          ? { ...c, updatedAt: now, messages: [...c.messages, userMessage] }
          : c
      ),
      chatState: 'thinking',
      streamingContent: '',
      abortController: controller,
      isGenerating: true,
      error: null,
      lastFailedMessage: null,
    }))

    const currentModelId = get().selectedModel

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetConvId,
          content: finalContent,
          model: currentModelId,
          clientMessageId: userMessageId,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`
        try {
          const errData = await response.json()
          if (errData.error) errMessage = errData.error
        } catch {
          // ignore json parse error
        }
        throw new Error(errMessage)
      }

      if (!response.body) {
        throw new Error('No response stream received from server')
      }

      set({ chatState: 'streaming' })

      const fullReply = await consumeTextStream(response.body, (accumulated) => {
        set({ streamingContent: accumulated })
      })

      console.log('[CHAT] Generation completed')

      const assistantTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const assistantMessageId = response.headers.get('X-Assistant-Message-Id') || `msg-ai-${Date.now()}`
      const generatedAttachments = parseGeneratedAttachment(response)
      const hasKnowledgeHeader = response.headers.get('X-Has-Knowledge') === 'true'

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: fullReply,
        createdAt: assistantTime,
        hasKnowledge: hasKnowledgeHeader,
        attachments: generatedAttachments,
        model: currentModelId,
      }

      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        ),
        chatState: 'idle',
        streamingContent: '',
        abortController: null,
        isGenerating: false,
        error: null,
        lastFailedMessage: null,
      }))

      syncConversationFromDatabase(targetConvId, set)

      return { success: true }
    } catch (err: unknown) {
      const isAbort =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError') ||
        (err as any)?.name === 'AbortError' ||
        controller.signal.aborted

      if (isAbort) {
        console.log('[CHAT] Generation stopped by user')
        console.log(`[CHAT] Generation aborted by user\nconversation.id:\n${targetConvId}`)

        const partialContent = get().streamingContent
        const assistantTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        if (partialContent.trim().length > 0) {
          const stoppedMessage: Message = {
            id: `msg-ai-${Date.now()}`,
            role: 'assistant',
            content: `${partialContent.trim()} [stopped]`,
            createdAt: assistantTime,
          }

          set(state => ({
            conversations: state.conversations.map(c => 
              c.id === targetConvId
                ? { ...c, messages: [...c.messages, stoppedMessage] }
                : c
            ),
            chatState: 'idle',
            streamingContent: '',
            abortController: null,
            isGenerating: false,
            error: null,
            lastFailedMessage: null,
          }))
        } else {
          set({
            chatState: 'idle',
            streamingContent: '',
            abortController: null,
            isGenerating: false,
            error: null,
            lastFailedMessage: null,
          })
        }
        return
      }

      console.error('[CHAT] Streaming error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to communicate with AI server'
      const errMessageId = `msg-err-${Date.now()}`

      const assistantErrMessage: Message = {
        id: errMessageId,
        role: 'assistant',
        content: `⚠️ Error: ${errorMsg}. You can try again or click retry.`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, assistantErrMessage] }
            : c
        ),
        chatState: 'idle',
        streamingContent: '',
        abortController: null,
        isGenerating: false,
        error: errorMsg,
        lastFailedMessage: { conversationId: targetConvId, content: trimmed },
        lastFailedMessageId: errMessageId,
      }))
    }
  },

  stopGeneration: () => {
    const controller = get().abortController
    if (controller) {
      console.log('[CHAT] Generation stopped by user')
      controller.abort()
    }
    set({
      abortController: null,
      isGenerating: false,
    })
  },

  regenerateResponse: async (targetMessageId?: string) => {
    const active = get().getActiveConversation()
    if (!active || active.messages.length === 0 || get().chatState === 'thinking' || get().chatState === 'streaming') return

    const messages = [...active.messages]

    // Determine target assistant message to regenerate
    let targetIndex = -1
    if (targetMessageId) {
      targetIndex = messages.findIndex(m => m.id === targetMessageId && m.role === 'assistant')
    }
    if (targetIndex === -1) {
      if (messages[messages.length - 1]?.role === 'assistant') {
        targetIndex = messages.length - 1
      } else {
        targetIndex = messages.map(m => m.role).lastIndexOf('assistant')
      }
    }

    if (targetIndex === -1) return

    // Find preceding user prompt
    const precedingUserMsg = [...messages.slice(0, targetIndex)].reverse().find(m => m.role === 'user')
    if (!precedingUserMsg) return

    // Remove old assistant message from state
    const trimmedMessages = [
      ...messages.slice(0, targetIndex),
      ...messages.slice(targetIndex + 1),
    ]

    const targetConvId = active.id
    const currentModelId = get().selectedModel

    const controller = new AbortController()
    console.log(`[CHAT] Regeneration started\nconversation.id:\n${targetConvId}`)

    set(state => ({
      conversations: state.conversations.map(c => 
        c.id === active.id ? { ...c, messages: trimmedMessages } : c
      ),
      chatState: 'thinking',
      streamingContent: '',
      abortController: controller,
      isGenerating: true,
      error: null,
      lastFailedMessage: null,
      lastFailedMessageId: null,
    }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetConvId,
          content: precedingUserMsg.content,
          model: currentModelId,
          isRegenerate: true,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`
        try {
          const errData = await response.json()
          if (errData.error) errMessage = errData.error
        } catch {
          // ignore
        }
        throw new Error(errMessage)
      }

      if (!response.body) {
        throw new Error('No response stream received from server')
      }

      set({ chatState: 'streaming' })

      const fullReply = await consumeTextStream(response.body, (accumulated) => {
        set({ streamingContent: accumulated })
      })

      console.log('[CHAT] Generation completed')

      const assistantMessageId = response.headers.get('X-Assistant-Message-Id') || `msg-ai-${Date.now()}`
      const generatedAttachments = parseGeneratedAttachment(response)

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: fullReply,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: generatedAttachments,
        model: currentModelId,
      }

      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        ),
        chatState: 'idle',
        streamingContent: '',
        abortController: null,
        isGenerating: false,
        error: null,
        lastFailedMessage: null,
        lastFailedMessageId: null,
      }))

      syncConversationFromDatabase(targetConvId, set)
    } catch (err: unknown) {
      const isAbort =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError') ||
        (err as any)?.name === 'AbortError' ||
        controller.signal.aborted

      if (isAbort) {
        console.log('[CHAT] Generation stopped by user')
        console.log(`[CHAT] Generation aborted by user\nconversation.id:\n${targetConvId}`)

        const partialContent = get().streamingContent
        const assistantTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        if (partialContent.trim().length > 0) {
          const stoppedMessage: Message = {
            id: `msg-ai-${Date.now()}`,
            role: 'assistant',
            content: `${partialContent.trim()} [stopped]`,
            createdAt: assistantTime,
          }

          set(state => ({
            conversations: state.conversations.map(c => 
              c.id === targetConvId
                ? { ...c, messages: [...c.messages, stoppedMessage] }
                : c
            ),
            chatState: 'idle',
            streamingContent: '',
            abortController: null,
            isGenerating: false,
            error: null,
          }))
        } else {
          set({
            chatState: 'idle',
            streamingContent: '',
            abortController: null,
            isGenerating: false,
            error: null,
          })
        }
        return
      }

      console.error('[CHAT] Regeneration error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to regenerate response'
      const errMessageId = `msg-err-${Date.now()}`

      const assistantErrMessage: Message = {
        id: errMessageId,
        role: 'assistant',
        content: `⚠️ Error: ${errorMsg}. You can try again or click retry.`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, assistantErrMessage] }
            : c
        ),
        chatState: 'idle',
        streamingContent: '',
        abortController: null,
        isGenerating: false,
        error: errorMsg,
        lastFailedMessage: { conversationId: targetConvId, content: precedingUserMsg.content },
        lastFailedMessageId: errMessageId,
      }))
    }
  },

  editUserMessage: async (messageId: string, newContent: string) => {
    const active = get().getActiveConversation()
    if (!active || get().chatState === 'thinking' || get().chatState === 'streaming') return

    const targetIndex = active.messages.findIndex(m => m.id === messageId)
    if (targetIndex === -1) return

    const updatedUserMsg: Message = {
      ...active.messages[targetIndex],
      content: newContent,
    }

    const slicedMessages = [...active.messages.slice(0, targetIndex), updatedUserMsg]
    const targetConvId = active.id
    const currentModelId = get().selectedModel

    set(state => ({
      conversations: state.conversations.map(c => 
        c.id === active.id ? { ...c, messages: slicedMessages } : c
      ),
      chatState: 'thinking',
      streamingContent: '',
      error: null,
    }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetConvId,
          content: newContent,
          model: currentModelId,
        }),
      })

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`
        try {
          const errData = await response.json()
          if (errData.error) errMessage = errData.error
        } catch {
          // ignore
        }
        throw new Error(errMessage)
      }

      if (!response.body) {
        throw new Error('No response stream received from server')
      }

      set({ chatState: 'streaming' })

      const fullReply = await consumeTextStream(response.body, (accumulated) => {
        set({ streamingContent: accumulated })
      })

      const assistantMessage: Message = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: fullReply,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: currentModelId,
      }

      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        ),
        chatState: 'idle',
        streamingContent: '',
        error: null,
      }))
    } catch (err: unknown) {
      console.error('Error editing message:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to update response'

      const assistantErrMessage: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${errorMsg}. Click regenerate to retry.`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, assistantErrMessage] }
            : c
        ),
        chatState: 'idle',
        streamingContent: '',
        error: errorMsg,
      }))
    }
  },

  toggleFeedback: async (messageId: string, type: 'like' | 'dislike') => {
    const active = get().getActiveConversation()
    const targetMsg = active?.messages.find(m => m.id === messageId)
    const newFeedback = targetMsg?.feedback === type ? null : type

    // Optimistic update
    set(state => ({
      conversations: state.conversations.map(c => ({
        ...c,
        messages: c.messages.map(m => {
          if (m.id === messageId) {
            return { ...m, feedback: newFeedback }
          }
          return m
        }),
      })),
    }))

    const supabase = createClient()
    try {
      await updateMessageFeedback(supabase, messageId, newFeedback)
    } catch (err) {
      console.error('Error toggling feedback in Supabase:', err)
    }
  },

  copyMessage: async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      return true
    } catch {
      return false
    }
  },

  retryLastMessage: async () => {
    await get().retryFailedGeneration()
  },

  retryFailedGeneration: async (failedMessageId?: string) => {
    const active = get().getActiveConversation()
    if (!active || get().chatState === 'thinking' || get().chatState === 'streaming') return

    const messages = [...active.messages]
    const targetConvId = active.id
    const currentModelId = get().selectedModel

    // Determine content to retry
    let promptContent = get().lastFailedMessage?.content
    if (!promptContent) {
      const lastUser = [...messages].reverse().find(m => m.role === 'user')
      promptContent = lastUser?.content
    }

    if (!promptContent) return

    // Clean up failed error message from messages list
    const errId = failedMessageId || get().lastFailedMessageId
    const cleanedMessages = errId
      ? messages.filter(m => m.id !== errId)
      : messages.filter(m => !m.content.startsWith('⚠️ Error:'))

    const controller = new AbortController()
    console.log(`[CHAT] Retry generation\nconversation.id:\n${targetConvId}`)

    set(state => ({
      conversations: state.conversations.map(c => 
        c.id === targetConvId ? { ...c, messages: cleanedMessages } : c
      ),
      chatState: 'thinking',
      streamingContent: '',
      abortController: controller,
      isGenerating: true,
      error: null,
      lastFailedMessage: null,
      lastFailedMessageId: null,
    }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetConvId,
          content: promptContent,
          model: currentModelId,
          isRetry: true,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`
        try {
          const errData = await response.json()
          if (errData.error) errMessage = errData.error
        } catch {
          // ignore
        }
        throw new Error(errMessage)
      }

      if (!response.body) {
        throw new Error('No response stream received from server')
      }

      set({ chatState: 'streaming' })

      const fullReply = await consumeTextStream(response.body, (accumulated) => {
        set({ streamingContent: accumulated })
      })

      console.log('[CHAT] Generation completed')

      const assistantMessageId = response.headers.get('X-Assistant-Message-Id') || `msg-ai-${Date.now()}`
      const generatedAttachments = parseGeneratedAttachment(response)

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: fullReply,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: generatedAttachments,
        model: currentModelId,
      }

      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        ),
        chatState: 'idle',
        streamingContent: '',
        abortController: null,
        isGenerating: false,
        error: null,
        lastFailedMessage: null,
        lastFailedMessageId: null,
      }))

      syncConversationFromDatabase(targetConvId, set)
    } catch (err: unknown) {
      const isAbort =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError') ||
        (err as any)?.name === 'AbortError' ||
        controller.signal.aborted

      if (isAbort) {
        console.log('[CHAT] Generation stopped by user')
        console.log(`[CHAT] Generation aborted by user\nconversation.id:\n${targetConvId}`)

        const partialContent = get().streamingContent
        const assistantTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        if (partialContent.trim().length > 0) {
          const stoppedMessage: Message = {
            id: `msg-ai-${Date.now()}`,
            role: 'assistant',
            content: `${partialContent.trim()} [stopped]`,
            createdAt: assistantTime,
          }

          set(state => ({
            conversations: state.conversations.map(c => 
              c.id === targetConvId
                ? { ...c, messages: [...c.messages, stoppedMessage] }
                : c
            ),
            chatState: 'idle',
            streamingContent: '',
            abortController: null,
            isGenerating: false,
            error: null,
          }))
        } else {
          set({
            chatState: 'idle',
            streamingContent: '',
            abortController: null,
            isGenerating: false,
            error: null,
          })
        }
        return
      }

      console.error('[CHAT] Retry error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to retry generation'
      const newErrId = `msg-err-${Date.now()}`

      const assistantErrMessage: Message = {
        id: newErrId,
        role: 'assistant',
        content: `⚠️ Error: ${errorMsg}. You can click retry to try again.`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, assistantErrMessage] }
            : c
        ),
        chatState: 'idle',
        streamingContent: '',
        abortController: null,
        isGenerating: false,
        error: errorMsg,
        lastFailedMessage: { conversationId: targetConvId, content: promptContent },
        lastFailedMessageId: newErrId,
      }))
    }
  },

  clearError: () => set({ error: null }),

  setSelectedModel: (modelId: string) => {
    const activeId = get().activeConversationId
    set(state => ({
      selectedModel: modelId,
      isModelSelectorOpen: false,
      conversations: activeId
        ? state.conversations.map(c => c.id === activeId ? { ...c, modelId } : c)
        : state.conversations,
    }))

    if (activeId) {
      const supabase = createClient()
      updateSupabaseConversation(supabase, activeId, { model: modelId }).catch(err => {
        console.error('Error updating model in Supabase:', err)
      })
    }
  },

  setSearchModalOpen: (open: boolean) => set({ isSearchModalOpen: open }),
  setModelSelectorOpen: (open: boolean) => set({ isModelSelectorOpen: open }),
}))
