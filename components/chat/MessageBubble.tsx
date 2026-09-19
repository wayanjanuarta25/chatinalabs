'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, RefreshCcw, Pencil, ThumbsUp, ThumbsDown, MoreHorizontal, FileText } from 'lucide-react'
import Image from 'next/image'

interface MessageBubbleProps {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  isLast?: boolean
  feedback?: 'like' | 'dislike' | null
  sources?: Array<{
    id: string
    documentTitle: string
    snippet: string
    similarity: number
  }>
  hasKnowledge?: boolean
  onRegenerate?: () => void
  onEdit?: (newContent: string) => void
  onFeedback?: (type: 'like' | 'dislike') => void
  onCopy?: (text: string) => Promise<boolean>
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

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
  isLast, 
  feedback,
  sources,
  onRegenerate, 
  onEdit,
  onFeedback,
  onCopy
}: MessageBubbleProps) {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)

  if (role === 'system') return null

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

  return (
    <div className="flex w-full justify-center px-4 py-3 sm:px-6 md:py-3.5">
      <div className={`flex w-full max-w-[760px] gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        
        {/* Avatar */}
        <div className={`shrink-0 pt-0.5 ${isUser ? 'order-2' : ''}`}>
          {isUser ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-600 text-xs font-medium text-white dark:bg-zinc-700 shadow-xs">
              U
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white p-0.5 shadow-xs border border-zinc-200/60 dark:border-white/[0.08] dark:bg-zinc-800 overflow-hidden">
              <Image
                src="/logo-ci.png"
                alt="chatINALabs"
                width={22}
                height={22}
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Content Bubble */}
        <div className={`group/bubble flex min-w-0 flex-col ${isUser ? 'max-w-[85%] sm:max-w-[75%] items-end' : 'flex-1'}`}>
          {isEditing && isUser ? (
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
              <div className={`message-content max-w-none break-words text-[14.5px] leading-relaxed sm:text-[15px] ${isUser ? 'rounded-[20px] bg-zinc-200/80 px-4 py-2.5 text-zinc-900 dark:bg-[#2c2c2c] dark:text-zinc-100' : 'text-zinc-800 dark:text-zinc-200'}`}>
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

                      {/* Regenerate Action */}
                      {isLast && onRegenerate && (
                        <button 
                          onClick={onRegenerate} 
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer" 
                          title="Regenerate"
                          aria-label="Regenerate response"
                        >
                          <RefreshCcw size={14} />
                        </button>
                      )}

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
                 
                 {/* User Edit Action */}
                 {isUser && onEdit && (
                   <button 
                     onClick={() => setIsEditing(true)} 
                     className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer" 
                     title="Edit message"
                     aria-label="Edit message"
                   >
                     <Pencil size={13} />
                   </button>
                 )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
