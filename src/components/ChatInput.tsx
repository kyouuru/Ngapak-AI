'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Paperclip, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  onStop: () => void
  placeholder?: string
}

export function ChatInput({ onSend, isLoading, onStop, placeholder = 'Takon apa bae karo Ngapak AI...' }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [input])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = input.trim().length > 0 && !isLoading

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className={cn(
          'relative rounded-2xl border transition-all duration-200',
          'bg-[#16161f] border-[#2a2a3a]',
          input.length > 0 ? 'border-[#7c6af7]/40 shadow-glow-sm' : 'hover:border-[#3a3a4a]',
        )}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-transparent text-[#f0f0f8] placeholder-[#5a5a72] text-sm leading-relaxed
              resize-none outline-none px-4 pt-3.5 pb-12 min-h-[52px] max-h-[180px]"
          />

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg text-[#5a5a72] hover:text-[#9090a8] hover:bg-white/5 transition-all" title="Lampiran (segera hadir)">
                <Paperclip size={15} />
              </button>
              <button className="p-1.5 rounded-lg text-[#5a5a72] hover:text-[#9090a8] hover:bg-white/5 transition-all" title="Pencarian web (segera hadir)">
                <Globe size={15} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#3a3a52]">
                {isLoading ? '' : 'Enter kirim · Shift+Enter baris baru'}
              </span>
              <button
                onClick={isLoading ? onStop : handleSubmit}
                disabled={!isLoading && !canSend}
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                  isLoading
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    : canSend
                    ? 'bg-[#7c6af7] text-white hover:bg-[#6b59e6] shadow-glow-sm'
                    : 'bg-[#1e1e2a] text-[#3a3a52] cursor-not-allowed border border-[#2a2a3a]',
                )}
              >
                {isLoading ? <Square size={13} /> : <ArrowUp size={15} />}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#3a3a52] mt-2">
          Ngapak AI bisa gawe kesalahan. Priksa informasi penting ya!
        </p>
      </div>
    </div>
  )
}
