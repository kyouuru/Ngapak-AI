'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Paperclip, Globe, X, FileText, FileCode, FileSpreadsheet, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { processFileAttachment, type ProcessedAttachment } from '@/lib/fileProcessor'

interface ChatInputProps {
  onSend: (message: string, attachment?: ProcessedAttachment) => void
  isLoading: boolean
  onStop: () => void
  placeholder?: string
  disabled?: boolean
  footer?: string
  webSearchEnabled?: boolean
  onToggleWebSearch?: () => void
  fileLabel?: string
  webLabel?: string
  webOnLabel?: string
  inputHint?: string
}

const ACCEPTED = 'image/*,.txt,.md,.js,.ts,.jsx,.tsx,.py,.rb,.go,.rs,.java,.cpp,.c,.cs,.php,.swift,.kt,.html,.css,.scss,.json,.yaml,.yml,.toml,.xml,.sql,.sh,.bash,.csv'

function FileIcon({ type, name }: { type: string; name: string }) {
  if (type.startsWith('image/')) return <Image size={14} className="text-violet-400" />
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) return <FileCode size={14} className="text-amber-400" />
  if (['csv'].includes(ext)) return <FileSpreadsheet size={14} className="text-emerald-400" />
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'cpp', 'c', 'cs', 'php', 'swift', 'kt', 'html', 'css', 'scss', 'sql', 'sh', 'bash'].includes(ext))
    return <FileCode size={14} className="text-blue-400" />
  return <FileText size={14} className="text-[#9090a8]" />
}

export function ChatInput({
  onSend, isLoading, onStop,
  placeholder = 'Ketik pesan kamu...',
  disabled = false, footer,
  webSearchEnabled = false, onToggleWebSearch,
  fileLabel = 'File', webLabel = 'Web', webOnLabel = 'Web On',
  inputHint = 'Enter kirim · Shift+Enter baris baru',
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [attachment, setAttachment] = useState<ProcessedAttachment | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
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
    if ((!trimmed && !attachment) || isLoading || disabled || isProcessing) return
    onSend(trimmed, attachment ?? undefined)
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

    if (file.size > 10 * 1024 * 1024) {
      setAttachment({ kind: 'error', name: file.name, message: 'File terlalu besar. Maksimal 10MB.' })
      e.target.value = ''
      return
    }

    setIsProcessing(true)
    const reader = new FileReader()

    reader.onload = (ev) => {
      const result = ev.target?.result as string
      const processed = processFileAttachment(file.name, file.type, result)
      setAttachment(processed)
      setIsProcessing(false)
    }

    reader.onerror = () => {
      setAttachment({ kind: 'error', name: file.name, message: 'Gagal membaca file.' })
      setIsProcessing(false)
    }

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }

    e.target.value = ''
  }

  const canSend = (input.trim().length > 0 || (!!attachment && attachment.kind !== 'error')) && !isLoading && !disabled && !isProcessing

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className={cn(
          'relative rounded-2xl border transition-all duration-200',
          disabled
            ? 'bg-[#ead6b5]/55 border-[#4a2d1c]/15 opacity-60 cursor-not-allowed'
            : (input.length > 0 || attachment)
            ? 'bg-[#fff4dc] border-[#b5502e]/35 shadow-[5px_5px_0_rgba(36,23,17,0.08)]'
            : 'bg-[#fff4dc] border-[#4a2d1c]/20 hover:border-[#4a2d1c]/35',
        )}>

          {attachment && (
            <div className="px-4 pt-3">
              {attachment.kind === 'error' ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <X size={12} className="text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-500 flex-1">{attachment.message}</span>
                  <button onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-500 flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ) : attachment.kind === 'image' ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ead6b5]/60 border border-[#4a2d1c]/15">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:${attachment.mediaType};base64,${attachment.base64}`}
                    alt={attachment.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[#4a2d1c]/15"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#241711] truncate">{attachment.name}</p>
                    <p className="text-[10px] text-[#8a6b52]">{attachment.sizeKb}KB · {attachment.mediaType.split('/')[1].toUpperCase()}</p>
                  </div>
                  <button onClick={() => setAttachment(null)} className="text-[#8a6b52] hover:text-red-500 transition-colors flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ead6b5]/60 border border-[#4a2d1c]/15">
                  <FileIcon type="text" name={attachment.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#241711] truncate">{attachment.name}</p>
                    <p className="text-[10px] text-[#8a6b52]">{attachment.language} · {attachment.content.length} chars</p>
                  </div>
                  <button onClick={() => setAttachment(null)} className="text-[#8a6b52] hover:text-red-500 transition-colors flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isProcessing ? 'Memproses file...' : placeholder}
            disabled={disabled || isProcessing}
            rows={1}
            className="w-full bg-transparent text-[#241711] placeholder-[#a09880] text-sm leading-relaxed
              resize-none outline-none px-4 pt-3.5 pb-12 min-h-[52px] max-h-[180px] disabled:cursor-not-allowed"
          />

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
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

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#a09880] hidden sm:block">
                {isLoading ? '' : inputHint}
              </span>
              <button
                onClick={isLoading ? onStop : handleSubmit}
                disabled={!isLoading && !canSend}
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
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

        <p className="text-center text-[10px] text-[#a09880] mt-2">
          {footer ?? 'Ngapak AI bisa gawe kesalahan. Priksa informasi penting ya!'}
        </p>
      </div>
    </div>
  )
}
