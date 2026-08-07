'use client'

import { signIn, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import {
  LogIn, LogOut, User, Settings, Zap,
  ChevronUp, Unlink, Crown, BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAccount, useDisconnect } from 'wagmi'

interface AuthButtonProps {
  user?: { name?: string | null; email?: string | null; image?: string | null } | null
  compact?: boolean
  logoutLabel?: string
  limitUsed?: number
  limitMax?: number
  userPlan?: string
}

function UserAvatar({ user, size = 28 }: { user: AuthButtonProps['user']; size?: number }) {
  if (user?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.image} alt={user.name ?? ''} style={{ width: size, height: size }}
        className="rounded-full flex-shrink-0 ring-1 ring-[#4a2d1c]/20" />
    )
  }
  const initial = (user?.name ?? user?.email ?? '?')[0]!.toUpperCase()
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-[#b5502e] flex items-center justify-center flex-shrink-0 text-[#fff4dc] font-bold text-xs ring-1 ring-[#b5502e]/40">
      {initial}
    </div>
  )
}

export function AuthButton({
  user, compact = false, logoutLabel = 'Logout',
  limitUsed = 0, limitMax = 10, userPlan = 'free',
}: AuthButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { address: evmAddress, isConnected: evmConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) {
    return (
      <button
        onClick={() => signIn('google')}
        className={cn(
          'flex items-center gap-2 rounded-xl text-xs font-medium transition-all w-full justify-center',
          'bg-[#b5502e]/10 hover:bg-[#b5502e]/18 text-[#b5502e] border border-[#b5502e]/20 hover:border-[#b5502e]/35',
          compact ? 'p-2' : 'px-3 py-2',
        )}
        title="Login dengan Google"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" className="flex-shrink-0">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {!compact && <span>Login Google</span>}
      </button>
    )
  }

  const shortAddr = evmAddress ? `${evmAddress.slice(0, 6)}…${evmAddress.slice(-4)}` : null
  const limitPct  = limitMax > 0 ? Math.round((limitUsed / limitMax) * 100) : 0
  const planLabel = userPlan === 'free' ? 'Plan Gratis' : userPlan === 'mini' ? 'Plan Mini' : 'Plan Pro'

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className={cn(
          'flex items-center gap-2 rounded-xl border transition-all w-full',
          'bg-[#fff4dc]/70 border-[#4a2d1c]/18 hover:border-[#b5502e]/40 hover:bg-[#fff4dc]',
          compact ? 'p-1.5 justify-center' : 'px-2.5 py-2',
        )}
        title={compact ? (user.name ?? user.email ?? 'Akun') : undefined}
      >
        <UserAvatar user={user} size={compact ? 22 : 26} />
        {!compact && (
          <>
            <span className="flex-1 text-xs font-medium text-[#241711] truncate text-left">
              {user.name ?? user.email?.split('@')[0]}
            </span>
            <ChevronUp size={12} className={cn('text-[#8a6b52] transition-transform flex-shrink-0', open ? 'rotate-0' : 'rotate-180')} />
          </>
        )}
      </button>

      {/* Popup menu */}
      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 right-0 min-w-[220px] z-50
            rounded-2xl border border-[#4a2d1c]/18 bg-[#fff4dc] shadow-[0_8px_32px_rgba(36,23,17,0.18)]
            overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User identity */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#4a2d1c]/12 bg-[#f4e6ca]/60">
            <UserAvatar user={user} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#241711] truncate">{user.name ?? 'Pengguna'}</p>
              <p className="text-[10px] text-[#8a6b52] truncate">{user.email}</p>
            </div>
          </div>

          <div className="px-2 py-2 space-y-0.5">
            {/* Plan */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f4e6ca]/60">
              <div className="flex items-center gap-2">
                <Crown size={13} className="text-[#b5502e]" />
                <span className="text-xs font-medium text-[#241711]">{planLabel}</span>
              </div>
              {userPlan === 'free' && (
                <Link href="/upgrade" onClick={() => setOpen(false)}
                  className="text-[10px] font-semibold text-[#b5502e] hover:text-[#8f3e24] transition-colors">
                  Upgrade →
                </Link>
              )}
            </div>

            {/* Limit harian */}
            <div className="px-3 py-2 rounded-xl bg-[#f4e6ca]/60">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <BarChart2 size={13} className="text-[#8a6b52]" />
                  <span className="text-xs font-medium text-[#241711]">Limit Harian</span>
                </div>
                <span className={cn('text-xs font-bold', limitUsed >= limitMax ? 'text-red-500' : 'text-[#241711]')}>
                  {limitUsed}/{limitMax}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#4a2d1c]/12 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', limitPct >= 100 ? 'bg-red-500' : limitPct >= 80 ? 'bg-[#b5502e]' : 'bg-[#445d3b]')}
                  style={{ width: `${Math.min(limitPct, 100)}%` }}
                />
              </div>
            </div>

            {/* Wallet EVM */}
            <div className="px-3 py-2 rounded-xl bg-[#f4e6ca]/60">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={13} className="text-[#8a6b52]" />
                <span className="text-xs font-medium text-[#241711]">Wallet EVM</span>
              </div>
              {evmConnected && shortAddr ? (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#60412f]">{shortAddr}</span>
                  <button onClick={() => { disconnect(); setOpen(false) }}
                    className="flex items-center gap-1 text-[10px] text-[#8a6b52] hover:text-red-500 transition-colors">
                    <Unlink size={11} /> Putuskan
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-[#8a6b52]">Belum terhubung</p>
              )}
            </div>

            <div className="border-t border-[#4a2d1c]/10 my-1" />

            {/* Settings (placeholder) */}
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#60412f] hover:bg-[#ead6b5]/60 transition-colors">
              <Settings size={13} className="text-[#8a6b52]" />
              Pengaturan Akun
            </button>

            {/* Logout */}
            <button onClick={() => { signOut(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={13} />
              {logoutLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
