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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all
          bg-[#141310] border border-[#2e2b24] text-[#a09880] hover:text-[#f2ede4] hover:border-[#3a3628]"
      >
        <Languages size={12} className="text-[#d97757]" />
        <span className="hidden sm:inline">{selected.name}</span>
        <ChevronDown size={11} className={cn('transition-transform text-[#625d4e]', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-48 rounded-2xl border border-[#2e2b24] bg-[#141310] shadow-card z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2.5 border-b border-[#221f1a] flex items-center gap-2">
            <Languages size={12} className="text-[#d97757]" />
            <p className="text-[11px] font-medium text-[#625d4e] uppercase tracking-wider">Pilih Bahasa</p>
          </div>
          <div className="p-1.5 max-h-72 overflow-y-auto">
            {LANGUAGES.map((lang: Language) => {
              const isActive = value === lang.id
              return (
                <button
                  key={lang.id}
                  onClick={() => { onChange(lang.id); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left',
                    isActive
                      ? 'bg-[#d97757]/10 border border-[#d97757]/20'
                      : 'hover:bg-white/[0.04] border border-transparent',
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium flex-1',
                    isActive ? 'text-[#f2ede4]' : 'text-[#a09880]',
                  )}>
                    {lang.name}
                  </span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#d97757] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
