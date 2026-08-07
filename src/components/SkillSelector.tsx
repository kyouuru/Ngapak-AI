'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown, Sparkles, Code2, BookOpen,
  Wrench, Bug, Palette, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SKILLS, type Skill } from '@/lib/skills'

interface SkillSelectorProps {
  value: string
  onChange: (skillId: string) => void
}

/** Map skill.icon string → Lucide component */
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Code2,
  BookOpen,
  Wrench,
  Bug,
  Palette,
}

function SkillIcon({ name, size = 14, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICON_MAP[name] ?? Sparkles
  return <Icon size={size} className={className} />
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all
          bg-[#141310] border border-[#2e2b24] text-[#a09880] hover:text-[#f2ede4] hover:border-[#3a3628]"
      >
        <SkillIcon name={selected.icon} size={12} className="text-[#d97757]" />
        <span>{selected.name}</span>
        <ChevronDown size={11} className={cn('transition-transform text-[#625d4e]', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-64 rounded-2xl border border-[#2e2b24] bg-[#141310] shadow-card z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2.5 border-b border-[#221f1a]">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-[#d97757]" />
              <span className="text-[11px] font-medium text-[#625d4e] uppercase tracking-wider">Mode / Skill</span>
            </div>
            <p className="text-[10px] text-[#35312a] mt-1">Pilih mode kanggo ngoptimalake jawaban AI</p>
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
                      ? 'bg-[#d97757]/10 border border-[#d97757]/20'
                      : 'hover:bg-white/[0.04] border border-transparent',
                  )}
                >
                  {/* Icon in a small tinted box */}
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border',
                    isActive ? 'bg-[#d97757]/15 border-[#d97757]/25' : 'bg-[#1c1a16] border-[#2e2b24]',
                  )}>
                    <SkillIcon
                      name={skill.icon}
                      size={13}
                      className={isActive ? 'text-[#d97757]' : 'text-[#625d4e]'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium', isActive ? 'text-[#f2ede4]' : 'text-[#a09880]')}>
                        {skill.name}
                      </span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#d97757]" />}
                    </div>
                    <p className="text-[10px] text-[#625d4e] mt-0.5 leading-relaxed">{skill.description}</p>
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
