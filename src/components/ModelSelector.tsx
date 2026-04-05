'use client'

import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

const MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: 'Paling pinter, paling cepet' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Cepet banget, hemat token' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', desc: 'Paling canggih kanggo tugas berat' },
]

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span>{selected?.name}</span>
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => { onChange(model.id); setOpen(false) }}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                value === model.id && 'bg-brand-50 dark:bg-brand-900/20',
              )}
            >
              <div className={cn('text-sm font-medium', value === model.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-800 dark:text-gray-100')}>
                {model.name}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{model.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
