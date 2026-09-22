'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, Link2, Sparkles, Filter } from 'lucide-react'
import { AVAILABLE_MODELS, ModelOption } from '@/lib/store/dummyData'
import { useChatStore } from '@/lib/store/useChatStore'

// Model Provider Logo using /logo-gpt.jpg
function ProviderIcon({ size = 20 }: { provider?: string; size?: number }) {
  return (
    <div 
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-xs bg-emerald-600/10"
      style={{ width: size, height: size }}
    >
      <Image 
        src="/logo-gpt.jpg" 
        alt="Model Logo" 
        width={size} 
        height={size} 
        className="h-full w-full object-cover rounded-full"
      />
    </div>
  )
}

interface ModelSelectorDropdownProps {
  placement?: 'top' | 'bottom'
  compact?: boolean
}

export function ModelSelectorDropdown({ placement = 'top', compact = false }: ModelSelectorDropdownProps) {
  const { selectedModel, setSelectedModel } = useChatStore()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0]

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Auto focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filter models based on search query
  const filteredModels = AVAILABLE_MODELS.filter(model => {
    return (
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button - Matches reference UI pill button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 dark:bg-[#212121] dark:hover:bg-[#2a2a2a] px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-white/5 transition-colors cursor-pointer select-none"
        title="Select AI Model"
        aria-expanded={isOpen}
      >
        <span className="truncate max-w-[110px]">{currentModel.name}</span>
        <ChevronDown 
          size={12} 
          className={`text-zinc-400 dark:text-zinc-500 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div 
          className={`absolute ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 z-50 w-[270px] rounded-2xl bg-white/95 dark:bg-[#1a1a1a]/95 border border-zinc-200 dark:border-[#2e2e2e] shadow-2xl backdrop-blur-xl p-2 text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Search and Category Filter Bar */}
          <div className="relative mb-2 flex items-center gap-1.5 px-1 pt-0.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a model"
                className="w-full rounded-xl bg-zinc-100 dark:bg-[#262626] pl-8 pr-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 transition-colors"
              />
            </div>

            {/* Category Dropdown Toggle */}
            <div className="relative">
              <div className="flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-[#262626] px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 select-none">
                <span>All</span>
                <ChevronDown size={11} className="text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Model List */}
          <div className="max-h-[260px] overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {filteredModels.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                No models match "{searchQuery}"
              </div>
            ) : (
              filteredModels.map(model => {
                const isSelected = model.id === selectedModel
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(model.id)
                      setIsOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left transition-colors cursor-pointer group ${
                      isSelected 
                        ? 'bg-zinc-100 dark:bg-white/[0.08]' 
                        : 'hover:bg-zinc-100/70 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-1">
                      <ProviderIcon provider={model.provider} size={20} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[13px] font-medium truncate ${isSelected ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-800 dark:text-zinc-200'}`}>
                            {model.name}
                          </span>
                          <Link2 size={12} className="text-zinc-400/60 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      </div>
                    </div>

                    {/* Checkmark for Selected Model */}
                    {isSelected && (
                      <Check size={14} strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100 shrink-0 ml-1.5" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
