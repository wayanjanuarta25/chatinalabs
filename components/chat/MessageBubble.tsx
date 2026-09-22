'use client'

import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { 
  Copy, 
  Check, 
  RefreshCcw, 
  Pencil, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal, 
  FileText,
  Eye,
  Code2,
  Download,
  Sparkles,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import { MessageAttachment, AVAILABLE_MODELS } from '@/lib/store/dummyData'
import { useChatStore } from '@/lib/store/useChatStore'
import { AttachmentBubbleItem } from './AttachmentBubbleItem'

interface MessageBubbleProps {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  isLast?: boolean
  feedback?: 'like' | 'dislike' | null
  sources?: Array<{
    id: string
    documentTitle: string
    snippet: string
    similarity: number
  }>
  hasKnowledge?: boolean
  attachments?: MessageAttachment[]
  onRegenerate?: () => void
  onRetry?: () => void
  onEdit?: (newContent: string) => void
  onFeedback?: (type: 'like' | 'dislike') => void
  onCopy?: (text: string) => Promise<boolean>
}

function SvgVisualRenderer({ svgCode }: { svgCode: string }) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const cleanSvg = useMemo(() => {
    const match = svgCode.match(/<svg[\s\S]*<\/svg>/i)
    return match ? match[0] : svgCode
  }, [svgCode])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanSvg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleDownloadSvg = () => {
    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chatgpt5.6-design.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPng = () => {
    setIsDownloading(true)
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(cleanSvg, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')

      let width = 1080
      let height = 1920

      if (svgEl) {
        const viewBox = svgEl.getAttribute('viewBox')
        if (viewBox) {
          const parts = viewBox.split(/[\s,]+/).map(Number)
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            width = parts[2]
            height = parts[3]
          }
        } else {
          const wAttr = parseInt(svgEl.getAttribute('width') || '', 10)
          const hAttr = parseInt(svgEl.getAttribute('height') || '', 10)
          if (wAttr > 0 && hAttr > 0) {
            width = wAttr
            height = hAttr
          }
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        handleDownloadSvg()
        setIsDownloading(false)
        return
      }

      const img = new window.Image()
      const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        const pngUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = 'chatgpt5.6-design.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setIsDownloading(false)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        setIsDownloading(false)
        handleDownloadSvg()
      }

      img.src = url
    } catch {
      setIsDownloading(false)
      handleDownloadSvg()
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50 dark:bg-[#151515] shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-[#1c1c1c] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <Sparkles size={12} className="text-emerald-500" />
            <span>ChatGPT 5.6 Design</span>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Code2 size={12} />
              <span>SVG Code</span>
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isDownloading}
            className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 dark:bg-white px-2.5 py-1 text-[11px] font-medium text-white dark:text-zinc-900 shadow-xs hover:bg-black dark:hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Download high-resolution PNG image"
          >
            {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-300/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            title="Download original vector SVG"
          >
            <span>SVG</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Copy SVG markup"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'preview' ? (
        <div className="flex w-full items-center justify-center p-3 sm:p-5 bg-zinc-950/5 dark:bg-black/40 overflow-hidden">
          <div 
            className="max-h-[580px] w-full flex items-center justify-center overflow-hidden rounded-xl shadow-md border border-black/5 dark:border-white/5 [&>svg]:max-h-[560px] [&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: cleanSvg }}
          />
        </div>
      ) : (
        <div className="text-[12.5px] bg-[#141414]">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language="xml"
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '0.85rem 1rem',
              background: 'transparent',
              fontSize: '12px',
              lineHeight: '1.5',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            }}
          >
            {cleanSvg}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  )
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const isSvg = (language?.toLowerCase() === 'svg' || language?.toLowerCase() === 'xml') ||
    code.trim().toLowerCase().startsWith('<svg') ||
    (/<svg[\s\S]*<\/svg>/i.test(code))

  if (isSvg) {
    return <SvgVisualRenderer svgCode={code} />
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-zinc-800 bg-[#141414] shadow-xs">
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#1e1e1e] px-4 py-1.5 text-xs text-zinc-400">
        <span className="font-mono text-[11px] lowercase text-zinc-400">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="text-[12.5px]">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language || 'text'}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '0.85rem 1rem',
            background: 'transparent',
            fontSize: '12.5px',
            lineHeight: '1.5',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export function MessageBubble({ 
  role, 
  content, 
  model,
  isLast, 
  feedback,
  sources,
  attachments,
  onRegenerate, 
  onRetry,
  onEdit,
  onFeedback,
  onCopy
}: MessageBubbleProps) {
  const isUser = role === 'user'
  const isErrorMessage = !isUser && (content.startsWith('⚠️ Error:') || content.includes('⚠️ Error:'))
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)

  const storeSelectedModel = useChatStore((s) => s.selectedModel)
  const displayModelName = useMemo(() => {
    const targetModel = model || storeSelectedModel || 'gpt-5.5'
    const matched = AVAILABLE_MODELS.find(
      (m) => m.id === targetModel || m.name.toLowerCase() === targetModel.toLowerCase()
    )
    return matched ? matched.name : (targetModel || 'GPT-5.5')
  }, [model, storeSelectedModel])

  if (role === 'system') return null

  if (isErrorMessage) {
    return (
      <div className="flex w-full justify-center px-4 py-3 sm:px-6 md:py-3.5 animate-in fade-in duration-150">
        <div className="flex w-full max-w-[760px] gap-3 md:gap-4 justify-start">
          <div className="shrink-0 pt-0.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 p-0.5 shadow-xs border border-red-200 dark:border-red-900/50">
              <RefreshCcw size={13} />
            </div>
          </div>
          <div className="flex flex-col gap-2 max-w-[85%]">
            <div className="rounded-2xl border border-red-200/80 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 px-3.5 py-2.5 text-xs sm:text-sm text-red-700 dark:text-red-300 leading-relaxed">
              {content}
            </div>
            {onRetry && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs cursor-pointer"
                  title="Retry generation"
                  aria-label="Retry generation"
                >
                  <RefreshCcw size={12} />
                  <span>Retry</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    let success = false
    if (onCopy) {
      success = await onCopy(content)
    } else {
      try {
        await navigator.clipboard.writeText(content)
        success = true
      } catch {
        success = false
      }
    }
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit?.(editContent.trim())
    }
    setIsEditing(false)
  }

  if (isUser) {
    return (
      <div className="flex w-full justify-center px-4 py-3 sm:px-6 md:py-3.5">
        <div className="flex w-full max-w-[760px] justify-end gap-3 md:gap-4">
          {/* Content Bubble */}
          <div className="group/bubble flex min-w-0 max-w-[85%] sm:max-w-[75%] flex-col items-end">
            {isEditing ? (
              <div className="w-full flex flex-col gap-2">
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] w-full resize-y rounded-2xl border border-zinc-300 bg-white p-3.5 text-sm leading-6 text-zinc-900 shadow-xs outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-[#212121] dark:text-zinc-100"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(content)
                    }} 
                    className="rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleEditSubmit} 
                    className="rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer"
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Attached Documents and Images */}
                {attachments && attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2 justify-end">
                    {attachments.map((att) => (
                      <AttachmentBubbleItem key={att.id} attachment={att} />
                    ))}
                  </div>
                )}

                <div className="message-content max-w-none break-words text-[14.5px] leading-relaxed sm:text-[15px] rounded-[20px] bg-zinc-200/80 px-4 py-2.5 text-zinc-900 dark:bg-[#2c2c2c] dark:text-zinc-100">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p({ children }) {
                        return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                      },
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeString = String(children).replace(/\n$/, '')
                        if (match) {
                          return <CodeBlock code={codeString} language={match[1]} />
                        }
                        return (
                          <code className="rounded-md bg-zinc-200 px-1.5 py-0.5 font-mono text-[13px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>

                {onEdit && (
                  <div className="mt-1 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer" 
                      title="Edit message"
                      aria-label="Edit message"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* User Avatar */}
          <div className="shrink-0 pt-0.5 order-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-600 text-xs font-medium text-white dark:bg-zinc-700 shadow-xs">
              U
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Assistant Message
  return (
    <div className="flex w-full justify-center px-4 py-3 sm:px-6 md:py-3.5">
      <div className="flex w-full max-w-[760px] flex-col justify-start">
        
        {/* Assistant Header: Clean logo (no gray wrapper) + Inalabs AI - [Model yang dipakai] */}
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center">
            <Image
              src="/logo-ci.png"
              alt="Inalabs AI"
              width={18}
              height={18}
              className="object-contain dark:invert"
              priority
            />
          </div>
          <span className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Inalabs AI - {displayModelName}
          </span>
        </div>

        {/* Content Bubble */}
        <div className="group/bubble flex min-w-0 flex-col flex-1">
          {/* Attached Documents and Images */}
          {attachments && attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 justify-start">
              {attachments.map((att) => (
                <AttachmentBubbleItem key={att.id} attachment={att} />
              ))}
            </div>
          )}

          <div className="message-content max-w-none break-words text-[14.5px] leading-relaxed sm:text-[15px] text-zinc-800 dark:text-zinc-200">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p({ children }) {
                      return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                    },
                    ul({ children }) {
                      return <ul className="my-2.5 pl-5 list-disc space-y-1">{children}</ul>
                    },
                    ol({ children }) {
                      return <ol className="my-2.5 pl-5 list-decimal space-y-1">{children}</ol>
                    },
                    li({ children }) {
                      return <li className="leading-relaxed">{children}</li>
                    },
                    h1({ children }) {
                      return <h1 className="text-lg font-semibold mt-4 mb-2 text-zinc-900 dark:text-zinc-100">{children}</h1>
                    },
                    h2({ children }) {
                      return <h2 className="text-base font-semibold mt-3.5 mb-1.5 text-zinc-900 dark:text-zinc-100">{children}</h2>
                    },
                    h3({ children }) {
                      return <h3 className="text-sm font-semibold mt-3 mb-1 text-zinc-900 dark:text-zinc-100">{children}</h3>
                    },
                    table({ children }) {
                      return (
                        <div className="my-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <table className="w-full border-collapse text-left text-xs">{children}</table>
                        </div>
                      )
                    },
                    th({ children }) {
                      return (
                        <th className="border-b border-zinc-200 bg-zinc-100 px-3.5 py-2 font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-100">
                          {children}
                        </th>
                      )
                    },
                    td({ children }) {
                      return (
                        <td className="border-b border-zinc-100 px-3.5 py-2 text-zinc-700 dark:border-zinc-800/50 dark:text-zinc-300">
                          {children}
                        </td>
                      )
                    },
                    code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !props.inline && match ? (
                        <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
                      ) : (
                        <code {...props} className="rounded-md border border-zinc-200/80 bg-zinc-100/90 px-1.5 py-0.5 font-mono text-[12px] text-zinc-800 dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-200">
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>

              {/* Source Citations for RAG Responses */}
              {!isUser && sources && sources.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mr-1">
                    <FileText size={12} />
                    <span>Sources:</span>
                  </div>
                  {sources.map((src, idx) => (
                    <span
                      key={src.id || idx}
                      title={src.snippet}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200/60 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300"
                    >
                      <span className="font-semibold text-zinc-400">[{idx + 1}]</span>
                      <span className="max-w-[150px] truncate">{src.documentTitle}</span>
                      {src.similarity > 0 && (
                        <span className="text-[10px] text-zinc-400">({Math.round(src.similarity * 100)}%)</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Message Actions Bar with Tooltips */}
              <div className={`mt-1 flex min-h-[26px] items-center gap-0.5 text-zinc-400 ${isUser ? '-mr-1' : '-ml-1'}`}>
                 {!isUser && (
                   <>
                      {/* Copy Action */}
                      <button 
                        onClick={handleCopy} 
                        className="flex items-center gap-1 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer" 
                        title="Copy"
                        aria-label="Copy message"
                      >
                        {copied ? <Check size={14} className="text-zinc-900 dark:text-white"/> : <Copy size={14} />}
                      </button>

                      {/* Like Action */}
                      <button 
                        onClick={() => onFeedback?.('like')}
                        className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                          feedback === 'like' 
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' 
                            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                        }`} 
                        title="Like" 
                        aria-label="Like response"
                      >
                        <ThumbsUp size={14} />
                      </button>

                      {/* Dislike Action */}
                      <button 
                        onClick={() => onFeedback?.('dislike')}
                        className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                          feedback === 'dislike' 
                            ? 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400' 
                            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                        }`} 
                        title="Dislike" 
                        aria-label="Dislike response"
                      >
                        <ThumbsDown size={14} />
                      </button>

                      {/* Regenerate Action */}
                      {onRegenerate && (
                        <button 
                          onClick={onRegenerate} 
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer" 
                          title="Regenerate"
                          aria-label="Regenerate response"
                        >
                          <RefreshCcw size={14} />
                        </button>
                      )}

                      {/* More Action */}
                      <button
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                        title="More"
                        aria-label="More actions"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </>
                  )}
               </div>
        </div>
      </div>
    </div>
  )
}
