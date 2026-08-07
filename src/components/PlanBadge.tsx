'use client'

import Link from 'next/link'
import { Crown, Star, Zap, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanId } from '@/lib/plans'

interface PlanBadgeProps {
  plan: PlanId
  compact?: boolean
}

const CONFIG = {
  free:  { icon: Zap,    label: 'Gratis', color: 'text-[#625d4e] bg-[#141310] border-[#2e2b24]' },
  mini:  { icon: Star,   label: 'Mini',   color: 'text-[#d97757] bg-[#d97757]/10 border-[#d97757]/20' },
  pro:   { icon: Crown,  label: 'Pro',    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
}

export function PlanBadge({ plan, compact = false }: PlanBadgeProps) {
  const cfg = CONFIG[plan]
  const Icon = cfg.icon

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border', cfg.color)}>
        <Icon size={10} />
        <span>{cfg.label}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border', cfg.color)}>
        <Icon size={12} />
        <span>Plan {cfg.label}</span>
      </div>
      {plan === 'free' && (
        <Link
          href="/upgrade"
          className="flex items-center gap-1 text-[10px] text-[#d97757] hover:text-[#e8a87c] transition-colors"
        >
          Upgrade
          <ArrowUpRight size={10} />
        </Link>
      )}
    </div>
  )
}
