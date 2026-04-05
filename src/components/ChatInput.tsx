'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  onStop: () => void
  disabled?: boolean
}

export function ChatInput({ onSend, isLoading, onStop, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-sm px-4 py-3 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 dark:focus-within:ring-brand-900 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Takon apa bae karo Ngapak AI... (Enter kanggo kirim)"
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm leading-relaxed outline-none min-h-[24px] max-h-[200px]"
          />
          <button
            onClick={isLoading ? onStop : handleSubmit}
            disabled={!isLoading && (!input.trim() || disabled)}
            className={cn(
              'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
              isLoading
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : input.trim() && !disabled
                ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
            )}
          >
            {isLoading ? <Square size={16} /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
          Ngapak AI bisa gawe kesalahan. Priksa informasi penting ya!
        </p>
      </div>
    </div>
  )
}
