'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Bot, User, Copy, Check, RefreshCcw, Pencil } from 'lucide-react'

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  isLast?: boolean
  onRegenerate?: () => void
  onEdit?: (newContent: string) => void
}

export function MessageBubble({ role, content, isLast, onRegenerate, onEdit }: MessageBubbleProps) {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)

  if (role === 'system') return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text', err)
    }
  }

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit?.(editContent.trim())
    }
    setIsEditing(false)
  }

  return (
    <div className={`py-6 px-4 sm:px-8 w-full flex justify-center ${isUser ? 'bg-white dark:bg-zinc-950' : 'bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50'}`}>
      <div className="max-w-3xl w-full flex gap-4 md:gap-6">
        
        {/* Avatar */}
        <div className="shrink-0 pt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
              <User size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-700/50">
              <Bot size={18} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col pt-1 group/bubble">
          {isEditing && isUser ? (
             <div className="w-full flex flex-col gap-2">
               <textarea 
                 value={editContent}
                 onChange={(e) => setEditContent(e.target.value)}
                 className="w-full bg-zinc-50 dark:bg-zinc-900 border border-emerald-500 rounded-xl p-3 min-h-[100px] text-zinc-900 dark:text-zinc-100 outline-none resize-y text-sm md:text-base focus:ring-2 focus:ring-emerald-500/20"
               />
               <div className="flex justify-end gap-2">
                  <button onClick={() => {
                    setIsEditing(false)
                    setEditContent(content)
                  }} className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                  <button onClick={handleEditSubmit} className="px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Save & Submit</button>
               </div>
             </div>
          ) : (
            <>
              <div className="prose prose-zinc dark:prose-invert max-w-none break-words text-zinc-800 dark:text-zinc-200 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !props.inline && match ? (
                        <SyntaxHighlighter
                          {...props}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md border border-zinc-200 dark:border-zinc-800 my-4 text-[13px] !bg-[#1E1E1E]"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code {...props} className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-zinc-200 dark:border-zinc-700/50 text-zinc-800 dark:text-zinc-200">
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
              
              {/* Actions Bar */}
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity min-h-[28px] -ml-2">
                 {!isUser && (
                   <>
                     <button onClick={handleCopy} className="flex items-center gap-1.5 p-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-all">
                       {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14} />}
                     </button>
                     {isLast && onRegenerate && (
                       <button onClick={onRegenerate} className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-all" title="Regenerate">
                         <RefreshCcw size={14} />
                       </button>
                     )}
                   </>
                 )}
                 {isUser && onEdit && (
                   <button onClick={() => setIsEditing(true)} className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-md transition-all" title="Edit message">
                     <Pencil size={14} />
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
