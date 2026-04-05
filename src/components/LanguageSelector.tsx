'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANGUAGES, type Language } from '@/lib/languages'

interface LanguageSelectorProps {
  value: string
  onChange: (langId: string) => void
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = LANGUAGES.find((l) => l.id === value) ?? LANGUAGES[0]!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
          bg-[#1a1a24] border border-[#2a2a3a] text-[#9090a8] hover:text-[#f0f0f8] hover:border-[#3a3a4a]"
      >
        <span className="text-sm leading-none">{selected.flag}</span>
        <span className="hidden sm:inline">{selected.name}</span>
        <ChevronDown size={11} className={cn('transition-transform text-[#5a5a72]', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-56 rounded-2xl border border-[#2a2a3a] bg-[#111118] shadow-card z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2.5 border-b border-[#1e1e2a] flex items-center gap-2">
            <Languages size={12} className="text-[#7c6af7]" />
            <p className="text-[11px] font-medium text-[#5a5a72] uppercase tracking-wider">Pilih Bahasa</p>
          </div>
          <div className="p-1.5 max-h-72 overflow-y-auto">
            {LANGUAGES.map((lang: Language) => {
              const isActive = value === lang.id
              return (
                <button
                  key={lang.id}
                  onClick={() => { onChange(lang.id); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left',
                    isActive
                      ? 'bg-[#7c6af7]/10 border border-[#7c6af7]/20'
                      : 'hover:bg-white/[0.04] border border-transparent',
                  )}
                >
                  <span className="text-lg leading-none flex-shrink-0">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-[#f0f0f8]' : 'text-[#9090a8]',
                    )}>
                      {lang.name}
                    </span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#7c6af7] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
