'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, Sparkles, Code2, BookOpen, Lightbulb, ChefHat } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { ModelSelector } from './ModelSelector'
import type { Message, ChatSession } from '@/lib/types'

const SUGGESTIONS = [
  { icon: Code2,     text: 'Kepriwe carane gawe REST API nganggo Next.js?',       label: 'Coding' },
  { icon: BookOpen,  text: 'Jelasna machine learning nganggo basa sing gampang!', label: 'Belajar' },
  { icon: ChefHat,   text: 'Tulung gaweake resep masakan khas Banyumas',          label: 'Resep' },
  { icon: Lightbulb, text: 'Apa bedane Python karo JavaScript kanggo pemula?',    label: 'Tips' },
]

function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

function generateTitle(content: string) {
  return content.slice(0, 42) + (content.length > 42 ? '...' : '')
}

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [model, setModel] = useState('claude-3-5-sonnet-20241022')
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [activeSession?.messages, streamingContent, isLoading, scrollToBottom])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ngapak-sessions-v2')
      if (saved) {
        const parsed = JSON.parse(saved) as ChatSession[]
        setSessions(parsed)
        if (parsed.length > 0) setActiveSessionId(parsed[0].id)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('ngapak-sessions-v2', JSON.stringify(sessions))
    }
  }, [sessions])

  const createNewSession = useCallback(() => {
    const s: ChatSession = {
      id: generateId(), title: 'Obrolan Anyar', messages: [],
      createdAt: new Date(), updatedAt: new Date(),
    }
    setSessions((prev) => [s, ...prev])
    setActiveSessionId(s.id)
    setSidebarOpen(false)
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setActiveSessionId((prev) => prev === id ? null : prev)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading) return

    let sessionId = activeSessionId
    if (!sessionId) {
      const s: ChatSession = {
        id: generateId(), title: generateTitle(content), messages: [],
        createdAt: new Date(), updatedAt: new Date(),
      }
      setSessions((prev) => [s, ...prev])
      setActiveSessionId(s.id)
      sessionId = s.id
    }

    const userMsg: Message = { id: generateId(), role: 'user', content, createdAt: new Date() }

    setSessions((prev) => prev.map((s) => s.id === sessionId ? {
      ...s,
      messages: [...s.messages, userMsg],
      title: s.messages.length === 0 ? generateTitle(content) : s.title,
      updatedAt: new Date(),
    } : s))

    setIsLoading(true)
    setStreamingContent('')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const currentSession = sessions.find((s) => s.id === sessionId)
      const history = [...(currentSession?.messages ?? []), userMsg]
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, model }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error('Request gagal')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const lines = decoder.decode(value).split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data) as { text: string }
                fullText += parsed.text
                setStreamingContent(fullText)
              } catch {}
            }
          }
        }
      }

      const assistantMsg: Message = {
        id: generateId(), role: 'assistant', content: fullText, createdAt: new Date(),
      }
      setSessions((prev) => prev.map((s) => s.id === sessionId
        ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: new Date() }
        : s,
      ))
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errMsg: Message = {
          id: generateId(), role: 'assistant',
          content: 'Waduh, ana masalah teknis. Coba maning ya, bro! 🙏',
          createdAt: new Date(),
        }
        setSessions((prev) => prev.map((s) => s.id === sessionId
          ? { ...s, messages: [...s.messages, errMsg] } : s,
        ))
      }
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      abortRef.current = null
    }
  }, [activeSessionId, isLoading, model, sessions])

  const messages = activeSession?.messages ?? []
  const isEmpty = messages.length === 0 && !isLoading

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={createNewSession}
        onSelectSession={(id) => { setActiveSessionId(id); setSidebarOpen(false) }}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2a] bg-[#0a0a0f]/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-[#5a5a72] hover:text-[#9090a8] hover:bg-white/5 transition-all"
            >
              <Menu size={18} />
            </button>
            {activeSession ? (
              <div>
                <h2 className="text-sm font-medium text-[#f0f0f8] truncate max-w-[200px] md:max-w-sm">
                  {activeSession.title}
                </h2>
                <p className="text-[10px] text-[#5a5a72]">
                  {activeSession.messages.length} pesan
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles size={12} className="text-white" />
                </div>
                <span className="text-sm font-medium text-[#9090a8]">Ngapak AI</span>
              </div>
            )}
          </div>
          <ModelSelector value={model} onChange={setModel} />
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" ref={bottomRef}>
          {isEmpty ? (
            /* Welcome */
            <div className="flex flex-col items-center justify-center h-full px-4 py-16 animate-fade-in">
              {/* Hero */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-glow-md">
                  <Sparkles size={36} className="text-white" />
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500 to-blue-500 blur-2xl opacity-20 -z-10 scale-150" />
              </div>

              <h2 className="text-3xl font-bold text-gradient mb-2">Ngapak AI</h2>
              <p className="text-[#9090a8] text-center max-w-sm mb-2 text-sm">
                Halo! Inyong asisten AI saka tlatah Banyumas.
              </p>
              <p className="text-[#5a5a72] text-center max-w-sm mb-10 text-xs">
                Takon apa bae — coding, belajar, resep, utawa sekedar ngobrol!
              </p>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={s.text}
                      onClick={() => sendMessage(s.text)}
                      className="group flex items-start gap-3 p-4 rounded-2xl text-left transition-all duration-200
                        bg-[#16161f] border border-[#2a2a3a] hover:border-[#7c6af7]/40 hover:bg-[#1a1a28]
                        hover:shadow-glow-sm"
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
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && streamingContent ? (
                <ChatMessage
                  message={{ id: 'streaming', role: 'assistant', content: streamingContent, createdAt: new Date() }}
                  isStreaming
                />
              ) : isLoading ? (
                <TypingIndicator />
              ) : null}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          onStop={() => abortRef.current?.abort()}
        />
      </div>
    </div>
  )
}
