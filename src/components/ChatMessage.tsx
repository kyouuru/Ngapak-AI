'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'
import {
  Copy, Check,
  Code2, BookOpen, Wrench, Bug, Palette, Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getSkillById } from '@/lib/skills'
import { getLanguageById } from '@/lib/languages'

const SKILL_ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Code2, BookOpen, Wrench, Bug, Palette,
}
function SkillIcon({ name, size = 10 }: { name: string; size?: number }) {
  const Icon = SKILL_ICON_MAP[name] ?? Sparkles
  return <Icon size={size} />
}

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
  langId?: string
  firstMessage?: boolean   // true for msg index 0 & 1 — gets slide-up-from-bottom entrance
}

export function ChatMessage({ message, isStreaming, langId = 'id', firstMessage = false }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const skill = message.skillId ? getSkillById(message.skillId) : null
  const lang = getLanguageById(langId)

  /**
   * Typewriter effect for streaming assistant messages.
   * We show text up to `displayedLength` chars, advancing by
   * a few chars per frame so it feels natural and animated.
   */
  const [displayedLength, setDisplayedLength] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastRafTime = useRef(0)
  // chars-per-second; tune here
  const CHARS_PER_SECOND = 280

  useEffect(() => {
    if (!isStreaming) {
      // Not streaming — show full content immediately
      setDisplayedLength(message.content.length)
      return
    }

    const target = message.content.length

    const step = (timestamp: number) => {
      const elapsed = timestamp - lastRafTime.current
      if (elapsed > 16) { // ~60fps
        const charsToAdd = Math.max(1, Math.floor((CHARS_PER_SECOND * elapsed) / 1000))
        setDisplayedLength((prev) => {
          const next = Math.min(prev + charsToAdd, target)
          return next
        })
        lastRafTime.current = timestamp
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [isStreaming, message.content.length])

  // When message.content grows (new chunks arrive), keep animating
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedLength(message.content.length)
    }
  }, [isStreaming, message.content])

  const displayedContent = isStreaming
    ? message.content.slice(0, displayedLength)
    : message.content

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn(
      'group flex gap-4 px-6 py-5',
      isUser ? 'flex-row-reverse' : 'flex-row',
      firstMessage ? 'msg-first-enter' : 'animate-fade-in',
    )}>
      {/* Content */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser && 'items-end')}>
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-medium text-[#625d4e]">
            {isUser ? lang.uiLabel.you : lang.uiLabel.ai}
          </span>
          {skill && skill.id !== 'general' && (
            <span className={cn('flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border font-medium', skill.color)}>
              <SkillIcon name={skill.icon} size={9} />
              {skill.name}
            </span>
          )}
        </div>

        <div className={cn(
          'relative rounded-2xl px-4 py-3',
          isUser
            ? 'bg-[#d97757] text-white rounded-tr-sm shadow-glow-sm'
            : 'bg-[#fff4dc] border border-[#4a2d1c]/18 text-[#241711] rounded-tl-sm shadow-[4px_4px_0_rgba(36,23,17,0.06)]',
        )}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              {displayedContent.length === 0 ? (
                /* Loading dots while waiting for first chunk */
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#b5502e]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#b5502e]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#b5502e]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayedContent}
                </ReactMarkdown>
              )}
              {/* Blinking cursor while streaming and content exists */}
              {isStreaming && displayedContent.length > 0 && (
                <span className="inline-block w-0.5 h-[1.1em] bg-[#d97757] ml-0.5 align-middle animate-pulse rounded-full" />
              )}
            </div>
          )}
        </div>

        {/* Copy button */}
        {!isUser && !isStreaming && message.content && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-[#625d4e] hover:text-[#a09880] hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
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
