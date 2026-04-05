'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'
import { Copy, Check, User, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { getSkillById } from '@/lib/skills'
import { getLanguageById } from '@/lib/languages'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
  langId?: string
}

export function ChatMessage({ message, isStreaming, langId = 'id' }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const skill = message.skillId ? getSkillById(message.skillId) : null
  const lang = getLanguageById(langId)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn(
      'group flex gap-4 px-6 py-5 animate-fade-in',
      isUser ? 'flex-row-reverse' : 'flex-row',
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow-sm">
            <User size={14} className="text-white" />
          </div>
        ) : (
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
            {isStreaming && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0a0f] animate-pulse" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser && 'items-end')}>
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-medium text-[#5a5a72]">
            {isUser ? lang.uiLabel.you : lang.uiLabel.ai}
          </span>
          {skill && skill.id !== 'general' && (
            <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md border font-medium', skill.color)}>
              {skill.emoji} {skill.name}
            </span>
          )}
        </div>

        <div className={cn(
          'relative rounded-2xl px-4 py-3',
          isUser
            ? 'bg-[#7c6af7] text-white rounded-tr-sm shadow-glow-sm'
            : 'bg-[#16161f] border border-[#2a2a3a] text-[#f0f0f8] rounded-tl-sm',
        )}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-dark">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-[#7c6af7] ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Copy button */}
        {!isUser && !isStreaming && message.content && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-[#5a5a72] hover:text-[#9090a8] hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
          >
            {copied ? (
              <><Check size={11} className="text-emerald-400" /><span className="text-emerald-400">Disalin</span></>
            ) : (
              <><Copy size={11} /><span>Salin</span></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
