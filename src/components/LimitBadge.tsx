'use client'

import { Zap, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signIn } from 'next-auth/react'

interface LimitBadgeProps {
  used: number
  limit: number
  isLoggedIn: boolean
  compact?: boolean
}

export function LimitBadge({ used, limit, isLoggedIn, compact = false }: LimitBadgeProps) {
  const remaining = Math.max(0, limit - used)
  const pct = (used / limit) * 100
  const isLow = remaining <= 2
  const isEmpty = remaining === 0

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border',
        isEmpty ? 'text-red-400 bg-red-400/10 border-red-400/20'
          : isLow ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
          : 'text-[#625d4e] bg-[#141310] border-[#2e2b24]',
      )}>
        <Zap size={10} />
        <span>{remaining}/{limit}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl bg-[#141310] border border-[#2e2b24]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap size={11} className={isEmpty ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-[#d97757]'} />
          <span className="text-[11px] font-medium text-[#a09880]">
            {isLoggedIn ? 'Limit Harian' : 'Limit Guest'}
          </span>
        </div>
        <span className={cn(
          'text-[11px] font-semibold',
          isEmpty ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-[#f2ede4]',
        )}>
          {remaining}/{limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-[#2e2b24] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isEmpty ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-[#d97757]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {!isLoggedIn && (
        <button
          onClick={() => signIn('google')}
          className="flex items-center gap-1.5 text-[10px] text-[#d97757] hover:text-[#e8a87c] transition-colors mt-0.5"
        >
          <Lock size={9} />
          Login Google → dapat 10 chat/hari
        </button>
      )}
    </div>
  )
}
