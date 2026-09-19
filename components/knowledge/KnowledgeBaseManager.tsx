'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  File as FileIcon,
  RefreshCw,
  ExternalLink,
  Plus,
  Database,
  Layers,
  RotateCcw,
  Play
} from 'lucide-react'
import { KBDocument, KnowledgeBase, ProcessingJob } from '@/lib/knowledge/types'
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '@/lib/knowledge/storage'

export interface DocumentWithJob extends KBDocument {
  latestJob?: ProcessingJob | null
  fileUrl?: string | null
}

interface KnowledgeBaseManagerProps {
  initialKnowledgeBaseId?: string
  onClose?: () => void
}

export function KnowledgeBaseManager({ initialKnowledgeBaseId }: KnowledgeBaseManagerProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [selectedKbId, setSelectedKbId] = useState<string>(initialKnowledgeBaseId || '')
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [documents, setDocuments] = useState<DocumentWithJob[]>([])
  const [isLoadingBases, setIsLoadingBases] = useState(true)
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)

  // Upload State
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadingFilename, setUploadingFilename] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch Knowledge Bases
  const fetchBases = useCallback(async () => {
    setIsLoadingBases(true)
    try {
      const res = await fetch('/api/knowledge/bases')
      const data = await res.json()
      if (res.ok && data.knowledgeBases) {
        setKnowledgeBases(data.knowledgeBases)
        setWorkspaceId(data.workspaceId || '')
        if (data.knowledgeBases.length > 0 && !selectedKbId) {
          setSelectedKbId(data.knowledgeBases[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load knowledge bases:', err)
    } finally {
      setIsLoadingBases(false)
    }
  }, [selectedKbId])

  // Fetch Documents for selected KB
  const fetchDocuments = useCallback(async (kbId: string) => {
    if (!kbId) return
    setIsLoadingDocs(true)
    try {
      const res = await fetch(`/api/knowledge/documents?knowledgeBaseId=${encodeURIComponent(kbId)}`)
      const data = await res.json()
      if (res.ok && Array.isArray(data.documents)) {
        setDocuments(data.documents)
      }
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setIsLoadingDocs(false)
    }
  }, [])

  useEffect(() => {
    fetchBases()
  }, [fetchBases])

  useEffect(() => {
    if (selectedKbId) {
      fetchDocuments(selectedKbId)
    }
  }, [selectedKbId, fetchDocuments])

  // Auto-refresh when any document is pending or processing
  useEffect(() => {
    const hasActiveJobs = documents.some(d => {
      const status = d.latestJob?.status || d.processingStatus
      return status === 'pending' || status === 'processing'
    })

    if (!hasActiveJobs || !selectedKbId) return

    const interval = setInterval(() => {
      fetchDocuments(selectedKbId)
    }, 2500)

    return () => clearInterval(interval)
  }, [documents, selectedKbId, fetchDocuments])

  // File Upload Handler
  const handleUploadFile = async (file: File) => {
    setValidationError(null)
    setSuccessMessage(null)

    // 1. Client Validation
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError(`Unsupported file type (${ext}). Supported: ${ALLOWED_EXTENSIONS.join(', ')}`)
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`File size exceeds 50 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB)`)
      return
    }

    if (file.size === 0) {
      setValidationError('Cannot upload an empty file.')
      return
    }

    // 2. Perform Upload with progress simulation
    setUploadingFilename(file.name)
    setUploadProgress(20)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('knowledgeBaseId', selectedKbId)
      if (workspaceId) {
        formData.append('workspaceId', workspaceId)
      }

      setUploadProgress(50)

      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(85)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadProgress(100)
      setSuccessMessage(`"${file.name}" uploaded successfully. Processing job created.`)

      // Refresh documents
      await fetchDocuments(selectedKbId)
    } catch (err) {
      console.error('Upload error:', err)
      setValidationError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setTimeout(() => {
        setUploadProgress(null)
        setUploadingFilename(null)
      }, 800)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      handleUploadFile(file)
    }
  }

  // Delete Document Handler
  const handleDeleteDocument = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also remove the file from storage.`)) {
      return
    }

    setIsDeletingId(id)
    setValidationError(null)

    try {
      const res = await fetch(`/api/knowledge/documents?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete document')
      }

      setDocuments(prev => prev.filter(d => d.id !== id))
      setSuccessMessage(`Document "${title}" removed.`)
    } catch (err) {
      console.error('Delete error:', err)
      setValidationError(err instanceof Error ? err.message : 'Deletion failed')
    } finally {
      setIsDeletingId(null)
    }
  }

  // Manual Process / Retry Handler
  const handleProcessDocument = async (documentId: string, title: string) => {
    setIsProcessingId(documentId)
    setValidationError(null)

    try {
      const res = await fetch('/api/knowledge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Document processing failed')
      }

      setSuccessMessage(
        `"${title}" processed successfully: ${data.result.chunkCount} chunks, ${data.result.totalTokens} tokens.`
      )
      if (selectedKbId) {
        await fetchDocuments(selectedKbId)
      }
    } catch (err) {
      console.error('Process error:', err)
      setValidationError(err instanceof Error ? err.message : 'Processing failed')
      if (selectedKbId) {
        await fetchDocuments(selectedKbId)
      }
    } finally {
      setIsProcessingId(null)
    }
  }

  // Format File Size
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '0 KB'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Render Status Badge
  const renderStatusBadge = (status: string, progress?: number) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 size={12} />
            <span>Ready</span>
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-600 border border-sky-500/20 dark:text-sky-400">
            <Loader2 size={12} className="animate-spin" />
            <span>Processing {progress !== undefined ? `${progress}%` : ''}</span>
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 border border-red-500/20 dark:text-red-400">
            <AlertCircle size={12} />
            <span>Failed</span>
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 border border-amber-500/20 dark:text-amber-400">
            <Clock size={12} />
            <span>Pending</span>
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 text-zinc-900 dark:text-zinc-100">
      {/* Top Header & Knowledge Base Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Database size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Knowledge Base</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manage workspace documents and files for AI retrieval.
              </p>
            </div>
          </div>
        </div>

        {/* KB Switcher / Info */}
        <div className="flex items-center gap-2">
          {knowledgeBases.length > 1 ? (
            <select
              value={selectedKbId}
              onChange={e => setSelectedKbId(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {knowledgeBases.map(kb => (
                <option key={kb.id} value={kb.id}>
                  {kb.name}
                </option>
              ))}
            </select>
          ) : knowledgeBases.length === 1 ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <Layers size={13} className="text-zinc-400" />
              <span>{knowledgeBases[0].name}</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => selectedKbId && fetchDocuments(selectedKbId)}
            disabled={isLoadingDocs}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
            title="Refresh documents"
          >
            <RefreshCw size={14} className={isLoadingDocs ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Validation / Success Notifications */}
      {validationError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 animate-in fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/20'
            : 'border-zinc-300/80 bg-zinc-50/60 hover:border-zinc-400 hover:bg-zinc-100/60 dark:border-zinc-700/80 dark:bg-zinc-900/40 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleUploadFile(e.target.files[0])
            }
          }}
          accept={ALLOWED_EXTENSIONS.join(',')}
          className="hidden"
        />

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs border border-zinc-200/80 text-zinc-600 group-hover:scale-105 transition-transform dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
          <Upload size={20} />
        </div>

        <div className="mt-3">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Click to upload or drag & drop files here
          </p>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            PDF, DOCX, TXT, Markdown, CSV, JSON (Up to 50 MB)
          </p>
        </div>

        {/* Upload Progress Overlay */}
        {uploadProgress !== null && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/90 backdrop-blur-xs p-4 dark:bg-zinc-950/90 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <Loader2 size={16} className="animate-spin text-zinc-600 dark:text-zinc-400" />
              <span>Uploading {uploadingFilename}... {uploadProgress}%</span>
            </div>
            <div className="mt-2.5 h-1.5 w-48 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-zinc-900 dark:bg-white transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Document List Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Uploaded Documents ({documents.length})
          </h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer"
          >
            <Plus size={13} />
            <span>Add File</span>
          </button>
        </div>

        {isLoadingDocs ? (
          <div className="flex items-center justify-center py-10 text-xs text-zinc-400">
            <Loader2 size={18} className="animate-spin mr-2" />
            <span>Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/50 py-10 text-center dark:border-white/[0.04] dark:bg-zinc-900/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <FileIcon size={18} />
            </div>
            <p className="mt-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              No documents in this knowledge base yet
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Upload a PDF or document above to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-200/60 rounded-2xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden dark:divide-white/[0.04] dark:border-white/[0.06] dark:bg-[#181818]">
            {documents.map(doc => {
              const jobStatus = doc.latestJob?.status || doc.processingStatus || 'pending'
              const jobProgress = doc.latestJob?.progress

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <FileText size={17} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100 max-w-[220px] sm:max-w-[340px]">
                          {doc.filename || doc.title}
                        </p>
                        {renderStatusBadge(jobStatus, jobProgress)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                        <span>{formatFileSize(doc.fileSizeBytes)}</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        {doc.sourceType && (
                          <>
                            <span>•</span>
                            <span className="uppercase">{doc.sourceType}</span>
                          </>
                        )}
                        {doc.chunkCount !== undefined && doc.chunkCount !== null && doc.chunkCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {doc.chunkCount} {doc.chunkCount === 1 ? 'chunk' : 'chunks'}
                            </span>
                          </>
                        )}
                        {doc.tokenCount !== undefined && doc.tokenCount !== null && doc.tokenCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{doc.tokenCount.toLocaleString()} tokens</span>
                          </>
                        )}
                        {doc.errorMessage && (
                          <>
                            <span>•</span>
                            <span className="text-red-500 font-normal max-w-[200px] truncate" title={doc.errorMessage}>
                              {doc.errorMessage}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(jobStatus === 'failed' || jobStatus === 'pending') && (
                      <button
                        type="button"
                        onClick={() => handleProcessDocument(doc.id, doc.filename || doc.title)}
                        disabled={isProcessingId === doc.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-sky-600 dark:hover:bg-zinc-800 dark:hover:text-sky-400 transition-colors cursor-pointer"
                        title={jobStatus === 'failed' ? 'Retry processing' : 'Process document'}
                      >
                        {isProcessingId === doc.id ? (
                          <Loader2 size={13} className="animate-spin text-sky-500" />
                        ) : jobStatus === 'failed' ? (
                          <RotateCcw size={13} />
                        ) : (
                          <Play size={13} />
                        )}
                      </button>
                    )}

                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        title="View file"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id, doc.filename || doc.title)}
                      disabled={isDeletingId === doc.id}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      {isDeletingId === doc.id ? (
                        <Loader2 size={13} className="animate-spin text-red-500" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
