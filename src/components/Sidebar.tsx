'use client'

import {
  Plus, MessageSquare, Trash2, X,
  PanelLeftClose, PanelLeftOpen,
  Zap, ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/lib/types'
import { LimitBadge } from './LimitBadge'
import { AuthButton } from './AuthButton'
import { getT } from '@/lib/i18n'
import type { PlanId } from '@/lib/plans'

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  isOpen: boolean          // mobile drawer open
  onClose: () => void
  collapsed: boolean       // desktop icon-only mode
  onToggleCollapse: () => void
  limitUsed: number
  limitMax: number
  isLoggedIn: boolean
  user?: { name?: string | null; email?: string | null; image?: string | null } | null
  langId: string
  userPlan?: PlanId
}

function groupSessions(sessions: ChatSession[]) {
  const now = new Date()
  const today: ChatSession[] = []
  const yesterday: ChatSession[] = []
  const week: ChatSession[] = []
  const older: ChatSession[] = []
  for (const s of sessions) {
    const diff = Math.floor((now.getTime() - new Date(s.updatedAt).getTime()) / 86_400_000)
    if (diff < 1) today.push(s)
    else if (diff < 2) yesterday.push(s)
    else if (diff < 7) week.push(s)
    else older.push(s)
  }
  return { today, yesterday, week, older }
}

/** Logo: natural size, no container */
function Logo({ size }: { size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Ngapak AI"
      style={{ height: size, width: 'auto', flexShrink: 0 }}
    />
  )
}

export function Sidebar({
  sessions, activeSessionId, onNewChat, onSelectSession, onDeleteSession,
  isOpen, onClose, collapsed, onToggleCollapse,
  limitUsed, limitMax, isLoggedIn, user, langId, userPlan = 'free',
}: SidebarProps) {
  const t = getT(langId)
  const { today, yesterday, week, older } = groupSessions(sessions)

  const GroupLabel = ({ label }: { label: string }) => (
    <p className="text-[10px] font-medium text-[#4a4538] uppercase tracking-wider px-2 pt-3 pb-1">
      {label}
    </p>
  )

  const SessionItem = ({ session }: { session: ChatSession }) => {
    const isActive = activeSessionId === session.id
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onSelectSession(session.id) }}
        className={cn(
          'group flex items-center rounded-xl cursor-pointer transition-all duration-150',
          collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
          isActive
            ? 'bg-[#d97757]/10 border border-[#d97757]/20'
            : 'hover:bg-white/[0.04] border border-transparent',
        )}
        title={collapsed ? session.title : undefined}
      >
        <MessageSquare
          size={13}
          className={cn('flex-shrink-0 transition-colors', isActive ? 'text-[#d97757]' : 'text-[#4a4538]')}
        />
        {!collapsed && (
          <>
            <span className={cn('flex-1 text-xs truncate', isActive ? 'text-[#f2ede4]' : 'text-[#a09880]')}>
              {session.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id) }}
              className="opacity-0 group-hover:opacity-100 text-[#4a4538] hover:text-red-400 transition-all p-0.5 rounded flex-shrink-0"
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
      </div>
    )
  }

  // ─── Expanded width on desktop: 268px | Collapsed: 60px
  // ─── On mobile: always full 268px width, toggled via translate-x
  return (
    <>
      {/* Mobile backdrop — only when drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        onClick={collapsed ? onToggleCollapse : undefined}
        className={cn(
          'flex flex-col bg-[#ead6b5]/88 border-r border-[#4a2d1c]/15 overflow-hidden backdrop-blur-xl',
          'transition-[width,transform] duration-300 ease-in-out flex-shrink-0',
          'md:relative md:translate-x-0 md:h-full',
          collapsed ? 'md:w-[60px]' : 'md:w-[268px]',
          'fixed top-0 left-0 z-30 h-full w-[268px]',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed && 'cursor-pointer',
        )}
      >
        {/* ── Header ── */}
        <div className={cn(
          'flex items-center h-14 border-b border-[#4a2d1c]/15 flex-shrink-0 transition-all duration-300',
          collapsed ? 'justify-center px-2' : 'justify-between px-3 gap-2',
        )}>
          {/* Logo + name (hidden when collapsed) */}
          <div className={cn(
            'flex items-center gap-2.5 overflow-hidden transition-all duration-300',
            collapsed ? 'w-0 opacity-0 pointer-events-none' : 'flex-1 opacity-100',
          )}>
            <div className="flex-shrink-0 flex items-center justify-center">
              <Logo size={48} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-[#241711] leading-none whitespace-nowrap">Ngapak AI</h1>
              <p className="text-[10px] text-[#8a6b52] mt-0.5 whitespace-nowrap">Saka tlatah Banyumas</p>
            </div>
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse() }}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0
              text-[#60412f] hover:text-[#b5502e] hover:bg-[#fff4dc]/60 transition-all"
            title={collapsed ? 'Buka sidebar' : 'Minimize sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0
              text-[#60412f] hover:text-[#b5502e] hover:bg-[#fff4dc]/60 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── New Chat ── */}
        <div className={cn('py-3 flex-shrink-0', collapsed ? 'px-2' : 'px-3')}>
          <button
            onClick={(e) => { e.stopPropagation(); onNewChat() }}
            className={cn(
              'flex items-center rounded-xl text-sm font-medium transition-all duration-150 group',
              'bg-[#b5502e]/10 hover:bg-[#b5502e]/18 text-[#b5502e] border border-[#b5502e]/20 hover:border-[#b5502e]/35',
              collapsed ? 'w-full justify-center p-2.5' : 'w-full gap-2.5 px-3 py-2.5',
            )}
            title={collapsed ? t.newChat : undefined}
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200 flex-shrink-0" />
            {!collapsed && <span>{t.newChat}</span>}
          </button>
        </div>

        {/* ── Sessions list ── */}
        <div className={cn('flex-1 overflow-y-auto pb-3 min-h-0', collapsed ? 'px-2' : 'px-3')}>
          {sessions.length === 0 ? (
            !collapsed && (
              <div className={cn(
                'flex flex-col items-center justify-center py-10 text-center',
                'transition-[opacity] duration-200 delay-[180ms]',
                collapsed ? 'opacity-0' : 'opacity-100',
              )}>
                <div className="w-9 h-9 rounded-xl bg-[#fff4dc]/65 flex items-center justify-center mb-3">
                  <MessageSquare size={15} className="text-[#8a6b52]" />
                </div>
                <p className="text-xs text-[#60412f]">{t.noChats}</p>
                <p className="text-xs text-[#8a6b52] mt-1">{t.noChatsDesc}</p>
              </div>
            )
          ) : (
            <>
              {today.length > 0 && <>
                {!collapsed && <GroupLabel label="Hari ini" />}
                {today.map((s) => <SessionItem key={s.id} session={s} />)}
              </>}
              {yesterday.length > 0 && <>
                {!collapsed && <GroupLabel label="Kemarin" />}
                {yesterday.map((s) => <SessionItem key={s.id} session={s} />)}
              </>}
              {week.length > 0 && <>
                {!collapsed && <GroupLabel label="7 hari terakhir" />}
                {week.map((s) => <SessionItem key={s.id} session={s} />)}
              </>}
              {older.length > 0 && <>
                {!collapsed && <GroupLabel label="Lebih lama" />}
                {older.map((s) => <SessionItem key={s.id} session={s} />)}
              </>}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {/* Always rendered — opacity delayed so content fades in AFTER width animation */}
        <div className="border-t border-[#4a2d1c]/15 flex-shrink-0">
          {/* Expanded footer */}
          <div
            className={cn(
              'px-4 pt-3 pb-4 space-y-2.5 transition-[opacity,transform] duration-200',
              collapsed
                ? 'opacity-0 pointer-events-none delay-0 -translate-x-2'
                : 'opacity-100 pointer-events-auto delay-[180ms] translate-x-0',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#fff4dc]/65 border border-[#4a2d1c]/15">
                <Zap size={11} className="text-[#8a6b52]" />
                <span className="text-[11px] text-[#60412f] font-medium whitespace-nowrap">
                  {userPlan === 'free' ? 'Plan Gratis' : userPlan === 'mini' ? 'Plan Mini' : 'Plan Pro'}
                </span>
              </div>
              {userPlan === 'free' && (
                <Link
                  href="/upgrade"
                  className="flex items-center gap-0.5 text-[11px] text-[#b5502e] hover:text-[#8f3e24] transition-colors whitespace-nowrap"
                >
                  Upgrade <ArrowUpRight size={11} />
                </Link>
              )}
            </div>
            <LimitBadge used={limitUsed} limit={limitMax} isLoggedIn={isLoggedIn} />
            <AuthButton user={user} logoutLabel={t.logout} limitUsed={limitUsed} limitMax={limitMax} userPlan={userPlan} />
          </div>

          {/* Collapsed footer */}
          <div
            className={cn(
              'px-2 py-3 flex flex-col items-center gap-2 transition-[opacity] duration-150',
              collapsed
                ? 'opacity-100 pointer-events-auto delay-[180ms]'
                : 'opacity-0 pointer-events-none delay-0 absolute bottom-0 left-0 right-0',
            )}
          >
            <LimitBadge used={limitUsed} limit={limitMax} isLoggedIn={isLoggedIn} compact />
            <AuthButton user={user} compact limitUsed={limitUsed} limitMax={limitMax} userPlan={userPlan} />
          </div>
        </div>
      </aside>
    </>
  )
}
