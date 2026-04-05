'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Paperclip, Globe, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string, attachment?: { name: string; content: string; type: string }) => void
  isLoading: boolean
  onStop: () => void
  placeholder?: string
  disabled?: boolean
  footer?: string
  webSearchEnabled?: boolean
  onToggleWebSearch?: () => void
}

export function ChatInput({
  onSend, isLoading, onStop,
  placeholder = 'Ketik pesan kamu...',
  disabled = false,
  footer,
  webSearchEnabled = false,
  onToggleWebSearch,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [attachment, setAttachment] = useState<{ name: string; content: string; type: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [input])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if ((!trimmed && !attachment) || isLoading || disabled) return
    onSend(trimmed || (attachment ? `[File: ${attachment.name}]` : ''), attachment ?? undefined)
    setInput('')
    setAttachment(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      setAttachment({ name: file.name, content, type: file.type })
    }

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }

    // Reset input agar bisa pilih file yang sama lagi
    e.target.value = ''
  }

  const canSend = (input.trim().length > 0 || !!attachment) && !isLoading && !disabled
  const isImage = attachment?.type.startsWith('image/')

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className={cn(
          'relative rounded-2xl border transition-all duration-200',
          disabled
            ? 'bg-[#111118] border-[#1e1e2a] opacity-60 cursor-not-allowed'
            : (input.length > 0 || attachment)
            ? 'bg-[#16161f] border-[#7c6af7]/40 shadow-glow-sm'
            : 'bg-[#16161f] border-[#2a2a3a] hover:border-[#3a3a4a]',
        )}>

          {/* Attachment preview */}
          {attachment && (
            <div className="flex items-center gap-2 px-4 pt-3">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] max-w-xs">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={attachment.content} alt={attachment.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                ) : (
                  <ImageIcon size={14} className="text-[#7c6af7] flex-shrink-0" />
                )}
                <span className="text-xs text-[#9090a8] truncate max-w-[150px]">{attachment.name}</span>
                <button
                  onClick={() => setAttachment(null)}
                  className="text-[#5a5a72] hover:text-red-400 transition-colors flex-shrink-0 ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-[#f0f0f8] placeholder-[#5a5a72] text-sm leading-relaxed
              resize-none outline-none px-4 pt-3.5 pb-12 min-h-[52px] max-h-[180px] disabled:cursor-not-allowed"
          />

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              {/* Upload file */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.txt,.md,.js,.ts,.py,.json,.csv,.html,.css"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  attachment
                    ? 'text-[#7c6af7] bg-[#7c6af7]/10'
                    : 'text-[#5a5a72] hover:text-[#9090a8] hover:bg-white/5',
                )}
                title="Upload gambar atau file teks"
              >
                <Paperclip size={15} />
              </button>

              {/* Web search toggle */}
              <button
                onClick={onToggleWebSearch}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all',
                  webSearchEnabled
                    ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'
                    : 'text-[#5a5a72] hover:text-[#9090a8] hover:bg-white/5',
                )}
                title={webSearchEnabled ? 'Web search aktif — klik untuk nonaktifkan' : 'Aktifkan web search'}
              >
                <Globe size={13} />
                {webSearchEnabled && <span>Web</span>}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#3a3a52] hidden sm:block">
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
          {footer ?? 'Ngapak AI bisa membuat kesalahan. Periksa informasi penting ya!'}
        </p>
      </div>
    </div>
  )
}
