'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Menu, Sparkles, Code2, BookOpen, Lightbulb, ChefHat } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { ModelSelector } from './ModelSelector'
import { SkillSelector } from './SkillSelector'
import { LanguageSelector } from './LanguageSelector'
import { LimitModal } from './LimitModal'
import type { Message, ChatSession } from '@/lib/types'
import { getSkillById } from '@/lib/skills'
import { getLanguageById } from '@/lib/languages'
import { GUEST_LIMIT, USER_LIMIT } from '@/lib/rateLimit'
import { cn } from '@/lib/utils'
import { buildMessageContent, type ProcessedAttachment } from '@/lib/fileProcessor'

const SUGGESTIONS = [
  { icon: Code2,     text: 'Kepriwe carane gawe REST API nganggo Next.js?', label: 'Coding',  skillId: 'code' },
  { icon: BookOpen,  text: 'Jelasna machine learning nganggo basa sing gampang!', label: 'Belajar', skillId: 'explain' },
  { icon: ChefHat,   text: 'Tulung gaweake resep masakan khas Banyumas', label: 'Resep', skillId: 'general' },
  { icon: Lightbulb, text: 'Apa bedane Python karo JavaScript kanggo pemula?', label: 'Tips', skillId: 'explain' },
]

function generateId() { return Math.random().toString(36).slice(2, 11) }
function generateTitle(content: string) {
  return content.trim().replace(/\s+/g, ' ').slice(0, 40) + (content.length > 40 ? '...' : '')
}

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
  const [model, setModel] = useState('deepseek/deepseek-chat-v3-0324:free')
  const [skillId, setSkillId] = useState('general')
  const [langId, setLangId] = useState('id')
  const [limitUsed, setLimitUsed] = useState(0)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null
  const isLimitReached = limitUsed >= limitMax

  const fetchLimit = useCallback(async () => {
    try {
      const res = await fetch('/api/limit')
      if (res.ok) {
        const data = await res.json()
        setLimitUsed(data.used)
      }
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
        setSessions(parsed)
        if (parsed.length > 0) setActiveSessionId(parsed[0].id)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem('ngapak-sessions-v3', JSON.stringify(sessions))
  }, [sessions])

  const createNewSession = useCallback(() => {
    const s: ChatSession = {
      id: generateId(), title: 'Obrolan Anyar', messages: [],
      createdAt: new Date(), updatedAt: new Date(), userMessageCount: 0,
    }
    setSessions((prev) => [s, ...prev])
    setActiveSessionId(s.id)
    setSidebarOpen(false)
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setActiveSessionId((prev) => prev === id ? null : prev)
  }, [])

  const sendMessage = useCallback(async (content: string, attachment?: ProcessedAttachment) => {
    if (isLoading) return
    if (isLimitReached) { setShowLimitModal(true); return }

    let sessionId = activeSessionId
    if (!sessionId) {
      const s: ChatSession = {
        id: generateId(), title: generateTitle(content || (attachment?.name ?? 'File')), messages: [],
        createdAt: new Date(), updatedAt: new Date(), userMessageCount: 0,
      }
      setSessions((prev) => [s, ...prev])
      setActiveSessionId(s.id)
      sessionId = s.id
    }

    // Build display content untuk UI (selalu string)
    const displayContent = attachment
      ? attachment.kind === 'image'
        ? (content ? `${content}\n\n📎 ${attachment.name}` : `📎 ${attachment.name}`)
        : (content ? `${content}\n\n📄 ${attachment.name}` : `📄 ${attachment.name}`)
      : content

    // Build API content (bisa string atau multipart blocks)
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
      // Kirim history dengan display content (string), tapi pesan terakhir pakai apiContent (bisa multipart)
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

      if (!res.ok) throw new Error('Request gagal')

      const remaining = res.headers.get('X-RateLimit-Remaining')
      const limit = res.headers.get('X-RateLimit-Limit')
      if (remaining !== null && limit !== null) {
        setLimitUsed(parseInt(limit) - parseInt(remaining))
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const lines = decoder.decode(value).split('\n')
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data) as { text: string }
              fullText += parsed.text
              setStreamingContent(fullText)
            } catch {}
          }
        }
      }

      const assistantMsg: Message = {
        id: generateId(), role: 'assistant', content: fullText, createdAt: new Date(), skillId,
      }
      setSessions((prev) => prev.map((s) => s.id === sessionId
        ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: new Date() } : s))
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setSessions((prev) => prev.map((s) => s.id === sessionId
          ? { ...s, userMessageCount: Math.max(0, (s.userMessageCount ?? 1) - 1) } : s))
        const errMsg: Message = {
          id: generateId(), role: 'assistant',
          content: 'Waduh, ana masalah teknis. Coba maning ya, bro! 🙏',
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
  const isEmpty = messages.length === 0 && !isLoading
  const lang = getLanguageById(langId)

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      {showLimitModal && (
        <LimitModal isLoggedIn={isLoggedIn} onClose={() => setShowLimitModal(false)} />
      )}

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
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e2a] bg-[#0a0a0f]/80 backdrop-blur-xl z-10 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl text-[#5a5a72] hover:text-[#9090a8] hover:bg-white/5 transition-all flex-shrink-0"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1 min-w-0">
            {activeSession ? (
              <div>
                <h2 className="text-sm font-medium text-[#f0f0f8] truncate">{activeSession.title}</h2>
                <p className="text-[10px] text-[#5a5a72]">
                  {activeSession.messages.length} pesan · {' '}
                  <span className={cn(
                    (limitMax - limitUsed) <= 1 ? 'text-red-400'
                      : (limitMax - limitUsed) <= 3 ? 'text-amber-400'
                      : 'text-[#5a5a72]',
                  )}>
                    {isLimitReached ? 'Limit harian habis' : `${limitMax - limitUsed} chat tersisa`}
                  </span>
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={11} className="text-white" />
                </div>
                <span className="text-sm font-medium text-[#9090a8]">Ngapak AI</span>
              </div>
            )}
          </div>

          {/* Controls kanan */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <LanguageSelector value={langId} onChange={setLangId} />
            <SkillSelector value={skillId} onChange={setSkillId} />
            <ModelSelector value={model} onChange={setModel} />
          </div>
        </header>

        {/* Limit warning banner */}
        {isLimitReached && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 flex-shrink-0">
            <span className="text-xs text-red-300 flex-1">
              {isLoggedIn
                ? `Limit harian ${limitMax} chat habis. Balik sesuk!`
                : `Limit guest ${GUEST_LIMIT} chat habis. Login Google → ${USER_LIMIT} chat/hari!`}
            </span>
            {!isLoggedIn && (
              <button
                onClick={() => setShowLimitModal(true)}
                className="text-xs px-3 py-1 rounded-lg bg-[#7c6af7]/20 hover:bg-[#7c6af7]/30 text-[#a78bfa] border border-[#7c6af7]/30 transition-all flex-shrink-0"
              >
                Login Google
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-16 animate-fade-in">
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-glow-md">
                  <Sparkles size={36} className="text-white" />
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500 to-blue-500 blur-2xl opacity-20 -z-10 scale-150" />
              </div>
              <h2 className="text-3xl font-bold text-gradient mb-2">Ngapak AI</h2>
              <p className="text-[#9090a8] text-center max-w-sm mb-1 text-sm">
                {lang.greeting} Inyong asisten AI saka tlatah Banyumas.
              </p>
              <p className="text-[#5a5a72] text-center max-w-sm mb-10 text-xs">
                {isLoggedIn
                  ? `${limitMax - limitUsed} chat tersisa hari ini`
                  : `Guest: ${GUEST_LIMIT} chat/hari · Login Google: ${USER_LIMIT} chat/hari`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={s.text}
                      onClick={() => { setSkillId(s.skillId); sendMessage(s.text) }}
                      disabled={isLimitReached}
                      className="group flex items-start gap-3 p-4 rounded-2xl text-left transition-all duration-200
                        bg-[#16161f] border border-[#2a2a3a] hover:border-[#7c6af7]/40 hover:bg-[#1a1a28]
                        hover:shadow-glow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#7c6af7]/10 border border-[#7c6af7]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#7c6af7]/20 transition-colors">
                        <Icon size={14} className="text-[#7c6af7]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-[#5a5a72] mb-1 uppercase tracking-wider">{s.label}</p>
                        <p className="text-xs text-[#9090a8] group-hover:text-[#f0f0f8] transition-colors leading-relaxed">{s.text}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((msg) => <ChatMessage key={msg.id} message={msg} langId={langId} />)}
              {isLoading && streamingContent ? (
                <ChatMessage
                  message={{ id: 'streaming', role: 'assistant', content: streamingContent, createdAt: new Date() }}
                  isStreaming
                  langId={langId}
                />
              ) : isLoading ? <TypingIndicator /> : null}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          onStop={() => abortRef.current?.abort()}
          placeholder={isLimitReached
            ? (isLoggedIn ? 'Limit harian habis. Balik sesuk!' : 'Login Google kanggo lanjut chat!')
            : lang.uiLabel.placeholder}
          disabled={isLimitReached}
          footer={lang.uiLabel.footer}
          webSearchEnabled={webSearch}
          onToggleWebSearch={() => setWebSearch((v) => !v)}
        />
      </div>
    </div>
  )
}
