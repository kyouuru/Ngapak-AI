'use client'

import { ChevronDown, Zap, Brain, Cpu, Flame, Lock } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { PAID_MODELS } from '@/lib/plans'

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
  userPlan?: string
  onPaidModelClick?: (modelName: string) => void
}

const MODELS = [
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek V3',
    desc: 'Gratis · Kuat kanggo coding',
    icon: Cpu,
    badge: 'Free ⭐',
    badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    provider: 'openrouter',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    desc: 'Gratis · Google, super cepet',
    icon: Flame,
    badge: 'Free',
    badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    provider: 'openrouter',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    desc: 'Gratis · Open source',
    icon: Cpu,
    badge: 'Free',
    badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    provider: 'openrouter',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Nemotron 70B',
    desc: 'Gratis · NVIDIA, reasoning kuat',
    icon: Zap,
    badge: 'NVIDIA',
    badgeColor: 'text-green-400 bg-green-400/10 border-green-400/20',
    provider: 'nvidia',
  },
  {
    id: 'nvidia/mistral-nemo-minitron-8b',
    name: 'Minitron 8B',
    desc: 'Gratis · NVIDIA, cepet & ringan',
    icon: Cpu,
    badge: 'NVIDIA',
    badgeColor: 'text-green-400 bg-green-400/10 border-green-400/20',
    provider: 'nvidia',
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    desc: 'Berbayar · Cepet & hemat',
    icon: Zap,
    badge: 'Paid',
    badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    provider: 'openrouter',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    desc: 'Berbayar · Paling pinter',
    icon: Brain,
    badge: 'Paid',
    badgeColor: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    provider: 'openrouter',
  },
]

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

export function ModelSelector({ value, onChange, userPlan = 'free', onPaidModelClick }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0]!
  const Icon = selected.icon
  const isPaidModel = PAID_MODELS.includes(value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleModelClick = (model: typeof MODELS[0]) => {
    const requiresPaid = PAID_MODELS.includes(model.id)
    if (requiresPaid && userPlan === 'free') {
      onPaidModelClick?.(model.name)
      setOpen(false)
      return
    }
    onChange(model.id)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all
          bg-[#141310] border border-[#2e2b24] text-[#a09880] hover:text-[#f2ede4] hover:border-[#3a3628]"
      >
        <Icon size={12} className={isPaidModel && userPlan === 'free' ? 'text-amber-400' : 'text-[#d97757]'} />
        <span className="hidden sm:inline">{selected.name}</span>
        <ChevronDown size={11} className={cn('transition-transform text-[#625d4e]', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-72 rounded-2xl border border-[#2e2b24] bg-[#141310] shadow-card z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2.5 border-b border-[#221f1a]">
            <p className="text-[11px] font-medium text-[#625d4e] uppercase tracking-wider">Pilih Model</p>
            <p className="text-[10px] text-[#35312a] mt-0.5">OpenRouter & NVIDIA NIM</p>
          </div>
          <div className="p-1.5">
            {MODELS.map((model) => {
              const MIcon = model.icon
              const isActive = value === model.id
              const requiresPaid = PAID_MODELS.includes(model.id)
              const isLocked = requiresPaid && userPlan === 'free'
              return (
                <button
                  key={model.id}
                  onClick={() => handleModelClick(model)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                    isActive
                      ? 'bg-[#d97757]/10 border border-[#d97757]/20'
                      : 'hover:bg-white/[0.04] border border-transparent',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    isActive ? 'bg-[#d97757]/20' : 'bg-[#1c1a16]',
                  )}>
                    <MIcon size={14} className={isActive ? 'text-[#e8a87c]' : 'text-[#625d4e]'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', isActive ? 'text-[#f2ede4]' : 'text-[#a09880]')}>
                        {model.name}
                      </span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', model.badgeColor)}>
                        {model.badge}
                      </span>
                      {isLocked && <Lock size={10} className="text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-[#625d4e] mt-0.5">{model.desc}</p>
                  </div>
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
