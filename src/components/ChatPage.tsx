'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Menu, Code2, BookOpen, Lightbulb, ChefHat,
  ArrowUp, Square, Paperclip, Globe, X,
  FileText, FileCode, Image as ImageIcon,
} from 'lucide-react'
import Image from 'next/image'
import { Sidebar } from './Sidebar'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { ModelSelector } from './ModelSelector'
import { SkillSelector } from './SkillSelector'
import { LanguageSelector } from './LanguageSelector'
import { LimitModal } from './LimitModal'
import { UpgradePrompt } from './UpgradePrompt'
import type { Message, ChatSession } from '@/lib/types'
import { getLanguageById } from '@/lib/languages'
import { GUEST_LIMIT, USER_LIMIT } from '@/lib/rateLimit'
import { cn } from '@/lib/utils'
import {
  buildMessageContent,
  processFileAttachment,
  type ProcessedAttachment,
} from '@/lib/fileProcessor'
import { getT } from '@/lib/i18n'

/* ─── file-type icon helper ─────────────────────────────── */
const ACCEPTED = 'image/*,.txt,.md,.js,.ts,.jsx,.tsx,.py,.rb,.go,.rs,.java,.cpp,.c,.cs,.php,.swift,.kt,.html,.css,.scss,.json,.yaml,.yml,.toml,.xml,.sql,.sh,.bash,.env,.csv'

function AttachFileIcon({ type, name }: { type: string; name: string }) {
  if (type.startsWith('image/')) return <ImageIcon size={14} className="text-violet-400" />
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) return <FileCode size={14} className="text-amber-400" />
  if (['csv'].includes(ext)) return <FileCode size={14} className="text-emerald-400" />
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'cpp', 'c', 'cs', 'php', 'swift', 'kt', 'html', 'css', 'scss', 'sql', 'sh', 'bash'].includes(ext))
    return <FileCode size={14} className="text-blue-400" />
  return <FileText size={14} className="text-[#a09880]" />
}

/* ─── suggestion chips config ───────────────────────────── */
const SUGGESTION_ICONS = [Code2, BookOpen, ChefHat, Lightbulb]
const SUGGESTION_SKILLS = ['code', 'explain', 'general', 'explain']

function generateId() { return Math.random().toString(36).slice(2, 11) }
function generateTitle(content: string) {
  return content.trim().replace(/\s+/g, ' ').slice(0, 40) + (content.length > 40 ? '...' : '')
}

/* ═══════════════════════════════════════════════════════════
   NewChatInputBox
   Composer shown on landing/new-chat state — model, skill,
   language, file and web-search controls all inline.
═══════════════════════════════════════════════════════════ */
interface NewChatInputBoxProps {
  onSend: (message: string, attachment?: ProcessedAttachment) => void
  isLoading: boolean
  disabled?: boolean
  placeholder?: string
  footer?: string
  webSearchEnabled: boolean
  onToggleWebSearch: () => void
  fileLabel?: string
  webLabel?: string
  webOnLabel?: string
  inputHint?: string
  model: string
  onModelChange: (m: string) => void
  skillId: string
  onSkillChange: (s: string) => void
  langId: string
  onLangChange: (l: string) => void
  userPlan: string
  onPaidModelClick: (name: string) => void
  pendingInput?: string
  onPendingInputConsumed: () => void
}

function NewChatInputBox({
  onSend, isLoading, disabled = false,
  placeholder = 'Takon apa bae, inyong siap mbantu...',
  footer,
  webSearchEnabled, onToggleWebSearch,
  fileLabel = 'File', webLabel = 'Web', webOnLabel = 'Web On',
  inputHint = 'Enter kirim · Shift+Enter baris baru',
  model, onModelChange, skillId, onSkillChange, langId, onLangChange,
  userPlan, onPaidModelClick,
  pendingInput, onPendingInputConsumed,
}: NewChatInputBoxProps) {
  const [input, setInput] = useState('')
  const [attachment, setAttachment] = useState<ProcessedAttachment | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // When a chip sets pendingInput, fill the textarea and focus
  useEffect(() => {
    if (pendingInput !== undefined) {
      setInput(pendingInput)
      onPendingInputConsumed()
      setTimeout(() => {
        textareaRef.current?.focus()
        const len = pendingInput.length
        textareaRef.current?.setSelectionRange(len, len)
      }, 10)
    }
  }, [pendingInput, onPendingInputConsumed])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if ((!trimmed && !attachment) || disabled || isProcessing) return
    onSend(trimmed, attachment ?? undefined)
    setInput('')
    setAttachment(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setAttachment({ kind: 'error', name: file.name, message: 'File terlalu besar. Maksimal 10MB.' })
      e.target.value = ''; return
    }
    setIsProcessing(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAttachment(processFileAttachment(file.name, file.type, ev.target?.result as string))
      setIsProcessing(false)
    }
    reader.onerror = () => {
      setAttachment({ kind: 'error', name: file.name, message: 'Gagal membaca file.' })
      setIsProcessing(false)
    }
    if (file.type.startsWith('image/')) reader.readAsDataURL(file)
    else reader.readAsText(file)
    e.target.value = ''
  }

  const canSend = (input.trim().length > 0 || (!!attachment && attachment.kind !== 'error')) &&
    !disabled && !isProcessing

  return (
    <div className="w-full">
      <div className={cn(
        'relative rounded-2xl border transition-all duration-200 shadow-card',
        disabled
          ? 'bg-[#ead6b5]/55 border-[#4a2d1c]/15 opacity-60 cursor-not-allowed'
          : (input.length > 0 || attachment)
          ? 'bg-[#fff4dc]/92 border-[#b5502e]/35 shadow-[7px_7px_0_rgba(36,23,17,0.08)]'
          : 'bg-[#fff4dc]/82 border-[#4a2d1c]/18 hover:border-[#b5502e]/30',
      )}>

        {/* Attachment preview */}
        {attachment && (
          <div className="px-4 pt-3">
            {attachment.kind === 'error' ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <X size={12} className="text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-300 flex-1">{attachment.message}</span>
                <button onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-300"><X size={12} /></button>
              </div>
            ) : attachment.kind === 'image' ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ead6b5]/60 border border-[#4a2d1c]/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`data:${attachment.mediaType};base64,${attachment.base64}`} alt={attachment.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[#4a2d1c]/15" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#241711] truncate">{attachment.name}</p>
                  <p className="text-[10px] text-[#8a6b52]">{attachment.sizeKb}KB · {attachment.mediaType.split('/')[1].toUpperCase()}</p>
                </div>
                <button onClick={() => setAttachment(null)} className="text-[#8a6b52] hover:text-red-500 transition-colors"><X size={13} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ead6b5]/60 border border-[#4a2d1c]/15">
                <AttachFileIcon type="text" name={attachment.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#241711] truncate">{attachment.name}</p>
                  <p className="text-[10px] text-[#8a6b52]">{attachment.language} · {attachment.content.length} chars</p>
                </div>
                <button onClick={() => setAttachment(null)} className="text-[#8a6b52] hover:text-red-500 transition-colors"><X size={13} /></button>
              </div>
            )}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isProcessing ? 'Memproses file...' : placeholder}
          disabled={disabled || isProcessing}
          rows={1}
          className="w-full bg-transparent text-[#241711] placeholder-[#8a6b52] text-sm leading-relaxed
            resize-none outline-none px-4 pt-4 pb-14 min-h-[60px] max-h-[200px] disabled:cursor-not-allowed"
        />

        {/* Bottom toolbar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3 pt-1 border-t border-[#4a2d1c]/12">
          <div className="flex items-center gap-1 flex-wrap">
            <ModelSelector value={model} onChange={onModelChange} userPlan={userPlan} onPaidModelClick={onPaidModelClick} />
            <SkillSelector value={skillId} onChange={onSkillChange} />
            <div className="hidden md:block">
              <LanguageSelector value={langId} onChange={onLangChange} />
            </div>
            <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isProcessing}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] transition-all',
                attachment && attachment.kind !== 'error'
                  ? 'text-[#b5502e] bg-[#b5502e]/10 border border-[#b5502e]/20'
                  : 'text-[#8a6b52] hover:text-[#60412f] hover:bg-[#4a2d1c]/8',
              )}
              title="Upload gambar atau file kode"
            >
              <Paperclip size={13} />
              <span className="hidden sm:inline">{isProcessing ? 'Loading...' : fileLabel}</span>
            </button>
            <button
              onClick={onToggleWebSearch}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all',
                webSearchEnabled
                  ? 'text-[#445d3b] bg-[#445d3b]/10 border border-[#445d3b]/20'
                  : 'text-[#8a6b52] hover:text-[#60412f] hover:bg-[#4a2d1c]/8',
              )}
              title={webSearchEnabled ? 'Web search aktif' : 'Aktifkan web search'}
            >
              <Globe size={13} />
              <span className="hidden sm:inline">{webSearchEnabled ? webOnLabel : webLabel}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] text-[#a09880] hidden sm:block">{isLoading ? 'Kirim baru = stop & ulang' : inputHint}</span>
            <button
              onClick={handleSubmit}
              disabled={!canSend}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
                isLoading
                  ? 'bg-red-500/15 text-red-500 hover:bg-red-500/25 border border-red-500/25'
                  : canSend
                  ? 'bg-[#b5502e] text-white hover:bg-[#8f3e24] shadow-[3px_3px_0_rgba(36,23,17,0.12)]'
                  : 'bg-[#ead6b5] text-[#a09880] cursor-not-allowed border border-[#4a2d1c]/15',
              )}
            >
              {isLoading ? <Square size={13} /> : <ArrowUp size={15} />}
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-[#a09880] mt-2.5">
        {footer ?? 'Ngapak AI bisa gawe kesalahan. Priksa informasi penting ya!'}
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ChatPage — main shell
═══════════════════════════════════════════════════════════ */
export function ChatPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const limitMax = isLoggedIn ? USER_LIMIT : GUEST_LIMIT

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [model, setModel] = useState('agentrouter/claude-opus-4-8')
  const [skillId, setSkillId] = useState('general')
  const [langId, setLangId] = useState('ngapak')
  const [limitUsed, setLimitUsed] = useState(0)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'model' | 'vision' | 'limit' | null>(null)
  const [upgradeModelName, setUpgradeModelName] = useState('')
  const [pendingInput, setPendingInput] = useState<string | undefined>(undefined)
  const userPlan = 'free' as const
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Abort streaming on unmount (close tab / navigate away) ──
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
    }
  }, [])

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null
  const isLimitReached = limitUsed >= limitMax
  const t = getT(langId)
  const lang = getLanguageById(langId)

  const SUGGESTIONS = [
    { icon: SUGGESTION_ICONS[0]!, text: t.suggCoding, label: t.suggCodingLabel, skillId: SUGGESTION_SKILLS[0]! },
    { icon: SUGGESTION_ICONS[1]!, text: t.suggLearn,  label: t.suggLearnLabel,  skillId: SUGGESTION_SKILLS[1]! },
    { icon: SUGGESTION_ICONS[2]!, text: t.suggRecipe, label: t.suggRecipeLabel, skillId: SUGGESTION_SKILLS[2]! },
    { icon: SUGGESTION_ICONS[3]!, text: t.suggTips,   label: t.suggTipsLabel,   skillId: SUGGESTION_SKILLS[3]! },
  ]

  const fetchLimit = useCallback(async () => {
    try {
      const res = await fetch('/api/limit')
      if (res.ok) { const data = await res.json(); setLimitUsed(data.used) }
    } catch {}
  }, [])

  useEffect(() => { fetchLimit() }, [fetchLimit, isLoggedIn])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, streamingContent, isLoading])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ngapak-sessions-v3')
      if (saved) {
        const parsed = JSON.parse(saved) as ChatSession[]
        // Filter out empty sessions (no messages) — they're leftover from previous mounts
        const withMessages = parsed.filter((s) => s.messages.length > 0)
        setSessions(withMessages)
        // Don't auto-select any session — user starts fresh each visit
      }
    } catch {}
  }, [])

  useEffect(() => {
    // Only persist sessions that have at least one message
    const withMessages = sessions.filter((s) => s.messages.length > 0)
    if (withMessages.length > 0) {
      localStorage.setItem('ngapak-sessions-v3', JSON.stringify(withMessages))
    } else {
      localStorage.removeItem('ngapak-sessions-v3')
    }
  }, [sessions])

  const createNewSession = useCallback(() => {
    const s: ChatSession = {
      id: generateId(), title: t.newChat, messages: [],
      createdAt: new Date(), updatedAt: new Date(), userMessageCount: 0,
    }
    setSessions((prev) => [s, ...prev])
    setActiveSessionId(s.id)
    setSidebarOpen(false)
  }, [t.newChat])

  // ── Auto new chat on mount — start fresh, sidebar shows history ──
  useEffect(() => {
    const s: ChatSession = {
      id: generateId(), title: t.newChat, messages: [],
      createdAt: new Date(), updatedAt: new Date(), userMessageCount: 0,
    }
    setSessions((prev) => [s, ...prev])
    setActiveSessionId(s.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setActiveSessionId((prev) => {
      if (prev === id) {
        // If we're deleting the active session while AI is loading, abort it
        abortRef.current?.abort()
        setIsLoading(false)
        setStreamingContent('')
        abortRef.current = null
        return null
      }
      return prev
    })
  }, [])

  const sendMessage = useCallback(async (content: string, attachment?: ProcessedAttachment) => {
    // Allow sending new message even while loading — it will abort the current stream
    if (isLimitReached) { setShowLimitModal(true); return }

    // Abort any in-flight request before starting a new one
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsLoading(false)
    setStreamingContent('')

    let sessionId = activeSessionId
    if (!sessionId) {
      const s: ChatSession = {
        id: generateId(),
        title: generateTitle(content || (attachment?.name ?? 'File')),
        messages: [], createdAt: new Date(), updatedAt: new Date(), userMessageCount: 0,
      }
      setSessions((prev) => [s, ...prev])
      setActiveSessionId(s.id)
      sessionId = s.id
    }

    const displayContent = attachment
      ? attachment.kind === 'image'
        ? (content ? `${content}\n\n[Gambar: ${attachment.name}]` : `[Gambar: ${attachment.name}]`)
        : (content ? `${content}\n\n[File: ${attachment.name}]` : `[File: ${attachment.name}]`)
      : content

    const apiContent = buildMessageContent(content, attachment ?? null)
    const userMsg: Message = { id: generateId(), role: 'user', content: displayContent, createdAt: new Date(), skillId }

    setSessions((prev) => prev.map((s) => s.id === sessionId ? {
      ...s,
      messages: [...s.messages, userMsg],
      title: s.messages.length === 0 ? generateTitle(content) : s.title,
      updatedAt: new Date(),
      userMessageCount: (s.userMessageCount ?? 0) + 1,
    } : s))

    setIsLoading(true)
    setStreamingContent('')
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const currentSession = sessions.find((s) => s.id === sessionId)
      const history = [
        ...(currentSession?.messages ?? []).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: apiContent },
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, model, skillId, langId, webSearch }),
        signal: controller.signal,
      })

      if (res.status === 429) {
        const data = await res.json()
        setLimitUsed(data.used ?? limitMax)
        setShowLimitModal(true)
        setSessions((prev) => prev.map((s) => s.id === sessionId
          ? { ...s, userMessageCount: Math.max(0, (s.userMessageCount ?? 1) - 1) } : s))
        return
      }
      if (!res.ok) throw new Error('Request failed')

      const remaining = res.headers.get('X-RateLimit-Remaining')
      const limit = res.headers.get('X-RateLimit-Limit')
      if (remaining !== null && limit !== null) setLimitUsed(parseInt(limit) - parseInt(remaining))

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      // Client-side timeout — auto-abort if no data for 50s
      let streamTimeout: ReturnType<typeof setTimeout> | null = null
      const resetTimeout = () => {
        if (streamTimeout) clearTimeout(streamTimeout)
        streamTimeout = setTimeout(() => {
          reader?.cancel()
        }, 50_000)
      }

      if (reader) {
        resetTimeout()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            resetTimeout()
            for (const line of decoder.decode(value).split('\n')) {
              if (!line.startsWith('data: ')) continue
              const d = line.slice(6).trim()
              if (d === '[DONE]') { reader.cancel(); break }
              try { const p = JSON.parse(d) as { text: string }; fullText += p.text; setStreamingContent(fullText) } catch {}
            }
          }
        } finally {
          if (streamTimeout) clearTimeout(streamTimeout)
        }
      }

      // Save whatever we got — even partial content is better than nothing
      if (fullText.trim().length > 0) {
        const assistantMsg: Message = { id: generateId(), role: 'assistant', content: fullText, createdAt: new Date(), skillId }
        setSessions((prev) => prev.map((s) => s.id === sessionId
          ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: new Date() } : s))
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setSessions((prev) => prev.map((s) => s.id === sessionId
          ? { ...s, userMessageCount: Math.max(0, (s.userMessageCount ?? 1) - 1) } : s))
        const errMsg: Message = {
          id: generateId(), role: 'assistant',
          content: 'Ada masalah teknis. Coba lagi ya!',
          createdAt: new Date(),
        }
        setSessions((prev) => prev.map((s) => s.id === sessionId
          ? { ...s, messages: [...s.messages, errMsg] } : s))
      }
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      abortRef.current = null
    }
  }, [activeSessionId, isLoading, isLimitReached, limitMax, model, sessions, skillId, langId, webSearch])

  const messages = activeSession?.messages ?? []
  // isEmpty: no active session OR no messages AND not loading for a real session
  const isEmpty = !activeSessionId || (messages.length === 0 && !isLoading)

  // Keep greeting rendered during exit animation (400ms)
  const [showGreeting, setShowGreeting] = useState(true)
  const [greetingExiting, setGreetingExiting] = useState(false)
  const greetingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isEmpty) {
      // Trigger exit animation, then unmount after it completes
      setGreetingExiting(true)
      greetingTimerRef.current = setTimeout(() => {
        setShowGreeting(false)
        setGreetingExiting(false)
      }, 420)
    } else {
      // Back to empty state (new chat) — show greeting again
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current)
      setGreetingExiting(false)
      setShowGreeting(true)
    }
    return () => {
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current)
    }
  }, [isEmpty])

  const greetingLine = langId === 'ngapak'
    ? 'Piye kabare?' : langId === 'jawa'
    ? 'Sugeng rawuh!' : langId === 'sunda'
    ? 'Wilujeng sumping!' : langId === 'minang'
    ? 'Apo nan bisa ambo bantu?' : langId === 'betawi'
    ? 'Aye bisa bantu apa nih?' : langId === 'madura'
    ? 'Aapa se bisa kaula bantu?' : langId === 'english'
    ? 'What can I help with?'
    : 'Ada yang bisa aku bantu?'

  const greetingUser = isLoggedIn && session?.user?.name
    ? `, ${session.user.name.split(' ')[0]}` : ''

  return (
    <div className="paper-grain flex h-screen overflow-hidden bg-[#f4e6ca] text-[#241711]">
      {showLimitModal && <LimitModal isLoggedIn={isLoggedIn} onClose={() => setShowLimitModal(false)} t={t} />}
      {upgradeReason && <UpgradePrompt reason={upgradeReason} modelName={upgradeModelName} onClose={() => setUpgradeReason(null)} />}

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={createNewSession}
        onSelectSession={(id) => { setActiveSessionId(id); setSidebarOpen(false) }}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        limitUsed={limitUsed}
        limitMax={limitMax}
        isLoggedIn={isLoggedIn}
        user={session?.user}
        langId={langId}
        userPlan={userPlan}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex md:hidden items-center gap-2 px-4 py-3 border-b border-[#4a2d1c]/15 bg-[#f4e6ca]/90 backdrop-blur-xl z-10 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-[#60412f] hover:text-[#b5502e] hover:bg-[#fff4dc]/60 transition-all flex-shrink-0">
            <Menu size={18} />
          </button>
          <div className="flex-1 min-w-0">
            {activeSession
              ? <h2 className="text-sm font-medium text-[#241711] truncate">{activeSession.title}</h2>
              : <span className="text-sm font-medium text-[#60412f]">Ngapak AI</span>}
          </div>
          <LanguageSelector value={langId} onChange={setLangId} />
        </header>



        {/* Limit banner */}
        {isLimitReached && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 flex-shrink-0">
            <span className="text-xs text-red-300 flex-1">{isLoggedIn ? t.limitUserMsg : t.limitGuestMsg}</span>
            {!isLoggedIn && (
              <button onClick={() => setShowLimitModal(true)}
                className="text-xs px-3 py-1 rounded-lg bg-[#d97757]/20 hover:bg-[#d97757]/30 text-[#e8a87c] border border-[#d97757]/30 transition-all flex-shrink-0">
                {t.loginGoogle}
              </button>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto relative">
          {/* ── GREETING / LANDING (animates out when chat starts) ── */}
          {showGreeting && (
            <div className={cn(
              'absolute inset-0 flex flex-col items-center justify-center px-4 py-12',
              greetingExiting ? 'greeting-exit pointer-events-none' : 'animate-fade-in',
            )}>
              <div className="w-full max-w-[720px] flex flex-col items-center">

                {/* Greeting */}
                <div className="text-center mb-8 mt-4">
                  {/* Logo above greeting */}
                  <div className="flex justify-center mb-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo.png"
                      alt="Ngapak AI"
                      style={{ height: 120, width: 'auto', filter: 'drop-shadow(0 0 24px rgba(217,119,87,0.5))' }}
                    />
                  </div>
                  <h1 className="font-display text-[2rem] sm:text-[2.4rem] leading-tight text-[#241711] tracking-tight mb-2">
                    {greetingLine}
                    {greetingUser && <span className="text-gradient">{greetingUser}</span>}
                  </h1>
                  <p className="text-sm text-[#60412f] mt-1">{t.welcomeSubtitle}</p>
                  {!isLoggedIn && (
                    <p className="text-xs text-[#8a6b52] mt-1">
                      Guest: {GUEST_LIMIT} chat/hari · Login Google: {USER_LIMIT} chat/hari
                    </p>
                  )}
                </div>

                {/* Input composer */}
                <div className="w-full">
                  <NewChatInputBox
                    onSend={sendMessage}
                    isLoading={isLoading}
                    disabled={isLimitReached}
                    placeholder={isLimitReached ? t.limitReached : 'Takon apa bae, inyong siap mbantu...'}
                    footer={lang.uiLabel.footer}
                    webSearchEnabled={webSearch}
                    onToggleWebSearch={() => setWebSearch((v) => !v)}
                    fileLabel={t.fileBtn}
                    webLabel={t.webBtn}
                    webOnLabel={t.webBtnOn}
                    inputHint={t.inputHint}
                    model={model}
                    onModelChange={setModel}
                    skillId={skillId}
                    onSkillChange={setSkillId}
                    langId={langId}
                    onLangChange={setLangId}
                    userPlan={userPlan}
                    onPaidModelClick={(name) => { setUpgradeModelName(name); setUpgradeReason('model') }}
                    pendingInput={pendingInput}
                    onPendingInputConsumed={() => setPendingInput(undefined)}
                  />
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2 justify-center mt-4 w-full px-1">
                  {SUGGESTIONS.map((s) => {
                    const Icon = s.icon
                    return (
                      <button
                        key={s.skillId + s.label}
                        onClick={() => { setSkillId(s.skillId); setPendingInput(s.text) }}
                        disabled={isLimitReached}
                        className={cn(
                          'flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium',
                          'transition-all duration-150',
                          'border-[#4a2d1c]/15 bg-[#fff4dc]/60 text-[#60412f] hover:border-[#b5502e]/40 hover:text-[#241711] hover:bg-[#fff4dc]',
                          'disabled:opacity-40 disabled:cursor-not-allowed',
                        )}
                      >
                        <Icon size={12} className="text-[#b5502e] flex-shrink-0" />
                        <span>{s.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── CHAT MESSAGES (fades in when first message arrives) ── */}
          {!isEmpty && (
            <div className="min-h-full flex flex-col justify-end">
              <div className={cn(
                'max-w-3xl w-full mx-auto py-4',
                showGreeting ? 'opacity-0' : 'messages-enter',
              )}>
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    langId={langId}
                    firstMessage={i < 2}
                  />
                ))}
                {isLoading && streamingContent ? (
                  <ChatMessage
                    message={{ id: 'streaming', role: 'assistant', content: streamingContent, createdAt: new Date() }}
                    isStreaming
                    langId={langId}
                  />
                ) : isLoading ? <TypingIndicator /> : null}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Sticky input for active chat (show once greeting starts exiting) */}
        {(!isEmpty || greetingExiting) && (
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            onStop={() => abortRef.current?.abort()}
            placeholder={isLimitReached ? t.limitReached : lang.uiLabel.placeholder}
            disabled={isLimitReached}
            footer={lang.uiLabel.footer}
            webSearchEnabled={webSearch}
            onToggleWebSearch={() => setWebSearch((v) => !v)}
            fileLabel={t.fileBtn}
            webLabel={t.webBtn}
            webOnLabel={t.webBtnOn}
            inputHint={t.inputHint}
          />
        )}
      </div>
    </div>
  )
}
