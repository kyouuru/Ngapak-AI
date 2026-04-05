'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, Sparkles } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { ModelSelector } from './ModelSelector'
import type { Message, ChatSession } from '@/lib/types'

const SUGGESTIONS = [
  'Kepriwe carane gawe website nganggo Next.js?',
  'Jelasna apa iku machine learning nganggo basa sing gampang!',
  'Tulung gaweake resep masakan khas Banyumas',
  'Apa bedane Python karo JavaScript?',
]

function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

function generateTitle(content: string) {
  return content.slice(0, 40) + (content.length > 40 ? '...' : '')
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

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, streamingContent, isLoading])

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ngapak-sessions')
      if (saved) {
        const parsed = JSON.parse(saved) as ChatSession[]
        setSessions(parsed)
        if (parsed.length > 0) setActiveSessionId(parsed[0].id)
      }
    } catch {}
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('ngapak-sessions', JSON.stringify(sessions))
    }
  }, [sessions])

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'Obrolan Anyar',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    setSidebarOpen(false)
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setActiveSessionId((prev) => {
      if (prev === id) return null
      return prev
    })
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading) return

    let sessionId = activeSessionId
    // Create session if none active
    if (!sessionId) {
      const newSession: ChatSession = {
        id: generateId(),
        title: generateTitle(content),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      sessionId = newSession.id
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: new Date(),
    }

    // Add user message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, userMessage],
              title: s.messages.length === 0 ? generateTitle(content) : s.title,
              updatedAt: new Date(),
            }
          : s,
      ),
    )

    setIsLoading(true)
    setStreamingContent('')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const currentSession = sessions.find((s) => s.id === sessionId)
      const history = [
        ...(currentSession?.messages ?? []),
        userMessage,
      ].map((m) => ({ role: m.role, content: m.content }))

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
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
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

      // Save assistant message
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: fullText,
        createdAt: new Date(),
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: new Date() }
            : s,
        ),
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Waduh, ana masalah teknis. Coba maning ya, bro!',
          createdAt: new Date(),
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, errMsg] }
              : s,
          ),
        )
      }
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      abortRef.current = null
    }
  }, [activeSessionId, isLoading, model, sessions])

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const messages = activeSession?.messages ?? []

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={createNewSession}
        onSelectSession={(id) => { setActiveSessionId(id); setSidebarOpen(false) }}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs shadow">
                N
              </div>
              <h1 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                Ngapak AI
              </h1>
            </div>
          </div>
          <ModelSelector value={model} onChange={setModel} />
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center h-full px-4 py-12 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg mb-6">
                <Sparkles size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Halo! Inyong Ngapak AI
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-10">
                Asisten AI saka tlatah Banyumas. Takon apa bae, inyong siap mbantu kowe!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all text-sm text-gray-600 dark:text-gray-300 shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && streamingContent ? (
                <ChatMessage
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
                    createdAt: new Date(),
                  }}
                />
              ) : isLoading ? (
                <TypingIndicator />
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          onStop={handleStop}
          disabled={false}
        />
      </div>
    </div>
  )
}
