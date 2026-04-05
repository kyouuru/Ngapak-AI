'use client'

import { ChevronDown, Zap, Brain, Cpu } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

const MODELS = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    desc: 'Paling pinter & cepet',
    icon: Brain,
    badge: 'Recommended',
    badgeColor: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    desc: 'Cepet banget, hemat',
    icon: Zap,
    badge: 'Fast',
    badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    desc: 'Paling canggih',
    icon: Cpu,
    badge: 'Powerful',
    badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
]

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0]
  const Icon = selected?.icon ?? Brain

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
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
          bg-[#1a1a24] border border-[#2a2a3a] text-[#9090a8] hover:text-[#f0f0f8] hover:border-[#3a3a4a]"
      >
        <Icon size={12} className="text-[#7c6af7]" />
        <span>{selected?.name}</span>
        <ChevronDown size={11} className={cn('transition-transform text-[#5a5a72]', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-72 rounded-2xl border border-[#2a2a3a] bg-[#111118] shadow-card z-50 overflow-hidden animate-fade-in">
          <div className="p-1.5">
            {MODELS.map((model) => {
              const MIcon = model.icon
              const isActive = value === model.id
              return (
                <button
                  key={model.id}
                  onClick={() => { onChange(model.id); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                    isActive ? 'bg-[#7c6af7]/10 border border-[#7c6af7]/20' : 'hover:bg-white/[0.04] border border-transparent',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    isActive ? 'bg-[#7c6af7]/20' : 'bg-[#1a1a24]',
                  )}>
                    <MIcon size={14} className={isActive ? 'text-[#a78bfa]' : 'text-[#5a5a72]'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', isActive ? 'text-[#f0f0f8]' : 'text-[#9090a8]')}>
                        {model.name}
                      </span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', model.badgeColor)}>
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5a5a72] mt-0.5">{model.desc}</p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7c6af7] flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
