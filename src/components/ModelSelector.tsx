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
    id: 'agentrouter/claude-opus-4-8',
    name: 'Claude Opus 4.8',
    desc: 'AgentRouter · Default, cepat & pinter',
    icon: Brain,
    badge: 'Free ⭐',
    badgeColor: 'text-emerald-600 bg-emerald-400/10 border-emerald-400/20',
    provider: 'agentrouter',
  },
  {
    id: 'agentrouter/claude-opus-5',
    name: 'Claude Opus 5',
    desc: 'AgentRouter · Model terbaru Anthropic',
    icon: Brain,
    badge: 'AgentRouter',
    badgeColor: 'text-violet-500 bg-violet-400/10 border-violet-400/20',
    provider: 'agentrouter',
  },
  {
    id: 'agentrouter/gpt-5.6-sol',
    name: 'GPT-5.6 Sol',
    desc: 'AgentRouter · OpenAI terkini',
    icon: Flame,
    badge: 'AgentRouter',
    badgeColor: 'text-blue-500 bg-blue-400/10 border-blue-400/20',
    provider: 'agentrouter',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    desc: 'OpenRouter · Google, super cepat',
    icon: Flame,
    badge: 'Free',
    badgeColor: 'text-emerald-500 bg-emerald-400/10 border-emerald-400/20',
    provider: 'openrouter',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    desc: 'NVIDIA · Open source Meta',
    icon: Cpu,
    badge: 'Free',
    badgeColor: 'text-emerald-500 bg-emerald-400/10 border-emerald-400/20',
    provider: 'nvidia',
  },
  {
    id: 'nvidia/deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    desc: 'NVIDIA NIM · Reasoning kuat',
    icon: Zap,
    badge: 'NVIDIA',
    badgeColor: 'text-green-500 bg-green-400/10 border-green-400/20',
    provider: 'nvidia',
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
          bg-[#fff4dc]/80 border border-[#4a2d1c]/18 text-[#60412f] hover:text-[#241711] hover:border-[#b5502e]/35"
      >
        <Icon size={12} className={isPaidModel && userPlan === 'free' ? 'text-amber-500' : 'text-[#b5502e]'} />
        <span className="hidden sm:inline">{selected.name}</span>
        <ChevronDown size={11} className={cn('transition-transform text-[#8a6b52]', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-72 rounded-2xl border border-[#4a2d1c]/18 bg-[#fff4dc] shadow-[0_8px_32px_rgba(36,23,17,0.15)] z-50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-[#4a2d1c]/12 bg-[#f4e6ca]/60">
            <p className="text-[11px] font-semibold text-[#60412f] uppercase tracking-wider">Pilih Model AI</p>
            <p className="text-[10px] text-[#8a6b52] mt-0.5">AgentRouter · OpenRouter · NVIDIA NIM</p>
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
                      ? 'bg-[#b5502e]/10 border border-[#b5502e]/25'
                      : 'hover:bg-[#ead6b5]/50 border border-transparent',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    isActive ? 'bg-[#b5502e]/15' : 'bg-[#ead6b5]/70',
                  )}>
                    <MIcon size={14} className={isActive ? 'text-[#b5502e]' : 'text-[#8a6b52]'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', isActive ? 'text-[#b5502e]' : 'text-[#241711]')}>
                        {model.name}
                      </span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', model.badgeColor)}>
                        {model.badge}
                      </span>
                      {isLocked && <Lock size={10} className="text-amber-500" />}
                    </div>
                    <p className="text-[11px] text-[#8a6b52] mt-0.5">{model.desc}</p>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#b5502e] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
