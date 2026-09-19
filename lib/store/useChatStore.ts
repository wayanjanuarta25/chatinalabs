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
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  isSearchModalOpen: boolean
  isModelSelectorOpen: boolean
  error: string | null
  lastFailedMessage: { conversationId: string; content: string } | null

  // Getters
  getActiveConversation: () => Conversation | undefined
  getCurrentMessages: () => Message[]

  // Supabase-backed actions
  loadConversations: () => Promise<void>
  createNewChat: () => Promise<void>
  selectConversation: (id: string | null) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  regenerateResponse: () => Promise<void>
  renameConversation: (id: string, newTitle: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  toggleFeedback: (messageId: string, type: 'like' | 'dislike') => Promise<void>
  copyMessage: (content: string) => Promise<boolean>
  retryLastMessage: () => Promise<void>
  clearError: () => void

  // UI state toggles
  setSelectedModel: (modelId: string) => void
  setSearchModalOpen: (open: boolean) => void
  setModelSelectorOpen: (open: boolean) => void
  editUserMessage: (messageId: string, newContent: string) => Promise<void>
}

let streamingTimer: NodeJS.Timeout | null = null

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  selectedModel: AVAILABLE_MODELS[0].id,
  chatState: 'idle',
  streamingContent: '',
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSearchModalOpen: false,
  isModelSelectorOpen: false,
  error: null,
  lastFailedMessage: null,

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
        sources: (m.metadata as Record<string, unknown>)?.sources as Message['sources'],
        hasKnowledge: Boolean((m.metadata as Record<string, unknown>)?.hasKnowledge),
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

  sendMessage: async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || get().chatState === 'thinking' || get().chatState === 'streaming') return

    const supabase = createClient()
    let currentConvId = get().activeConversationId
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const derivedTitle = trimmed.length > 36 ? trimmed.slice(0, 36) + '...' : trimmed

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

    const tempUserId = `msg-u-${Date.now()}`
    const userMessage: Message = {
      id: tempUserId,
      role: 'user',
      content: trimmed,
      createdAt: now,
    }

    // Optimistically append user message & enter thinking state
    set(state => ({
      conversations: state.conversations.map(c => 
        c.id === currentConvId 
          ? { ...c, updatedAt: now, messages: [...c.messages, userMessage] }
          : c
      ),
      chatState: 'thinking',
      streamingContent: '',
      error: null,
      lastFailedMessage: null,
    }))

    const targetConvId = currentConvId
    const currentModelId = get().selectedModel

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetConvId,
          content: trimmed,
          model: currentModelId,
          clientMessageId: tempUserId,
        }),
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

      const assistantTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const tempAiId = `msg-ai-${Date.now()}`

      const hasKnowledgeHeader = response.headers.get('X-Has-Knowledge') === 'true'

      const assistantMessage: Message = {
        id: tempAiId,
        role: 'assistant',
        content: fullReply,
        createdAt: assistantTime,
        hasKnowledge: hasKnowledgeHeader,
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
        lastFailedMessage: null,
      }))
    } catch (err: unknown) {
      console.error('Error sending message to /api/chat:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to communicate with AI server'

      const assistantErrMessage: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${errorMsg}. You can try again or click regenerate.`,
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
        lastFailedMessage: { conversationId: targetConvId, content: trimmed },
      }))
    }
  },

  regenerateResponse: async () => {
    const active = get().getActiveConversation()
    if (!active || active.messages.length === 0 || get().chatState === 'thinking' || get().chatState === 'streaming') return

    const messages = [...active.messages]
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== 'assistant') return

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return

    const trimmedMessages = messages.slice(0, -1)
    const targetConvId = active.id
    const currentModelId = get().selectedModel

    set(state => ({
      conversations: state.conversations.map(c => 
        c.id === active.id ? { ...c, messages: trimmedMessages } : c
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
          content: '',
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
      console.error('Error regenerating response:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to regenerate response'

      const assistantErrMessage: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${errorMsg}. Please try again.`,
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
    const lastFailed = get().lastFailedMessage
    if (lastFailed?.content) {
      await get().sendMessage(lastFailed.content)
    } else {
      await get().regenerateResponse()
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
