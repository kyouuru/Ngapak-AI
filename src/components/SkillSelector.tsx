'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SKILLS, type Skill } from '@/lib/skills'

interface SkillSelectorProps {
  value: string
  onChange: (skillId: string) => void
}

export function SkillSelector({ value, onChange }: SkillSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = SKILLS.find((s) => s.id === value) ?? SKILLS[0]!

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
        <span>{selected.emoji}</span>
        <span>{selected.name}</span>
        <ChevronDown size={11} className={cn('transition-transform text-[#5a5a72]', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-64 rounded-2xl border border-[#2a2a3a] bg-[#111118] shadow-card z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2.5 border-b border-[#1e1e2a]">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-[#7c6af7]" />
              <span className="text-[11px] font-medium text-[#5a5a72] uppercase tracking-wider">Mode / Skill</span>
            </div>
            <p className="text-[10px] text-[#3a3a52] mt-1">Pilih mode kanggo ngoptimalake jawaban AI</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {SKILLS.map((skill: Skill) => {
              const isActive = value === skill.id
              return (
                <button
                  key={skill.id}
                  onClick={() => { onChange(skill.id); setOpen(false) }}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                    isActive
                      ? 'bg-[#7c6af7]/10 border border-[#7c6af7]/20'
                      : 'hover:bg-white/[0.04] border border-transparent',
                  )}
                >
                  <span className="text-base leading-none mt-0.5 flex-shrink-0">{skill.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium', isActive ? 'text-[#f0f0f8]' : 'text-[#9090a8]')}>
                        {skill.name}
                      </span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#7c6af7]" />}
                    </div>
                    <p className="text-[10px] text-[#5a5a72] mt-0.5 leading-relaxed">{skill.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
