'use client'

import { Plus, MessageSquare, Trash2, X, Sparkles, ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/lib/types'
import { MESSAGE_LIMIT } from '@/lib/types'

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  isOpen: boolean        // mobile overlay
  onClose: () => void    // tutup mobile overlay
  collapsed: boolean     // desktop minimize
  onToggleCollapse: () => void
}

export function Sidebar({
  sessions, activeSessionId, onNewChat, onSelectSession, onDeleteSession,
  isOpen, onClose, collapsed, onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed md:relative top-0 left-0 h-full flex flex-col z-30 transition-all duration-300 ease-in-out',
        'border-r border-[#1e1e2a] bg-[#0d0d14]',
        // Mobile: slide in/out
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        // Desktop: collapsed = narrow, expanded = wide
        collapsed ? 'md:w-[60px]' : 'md:w-64',
        'w-64', // mobile selalu lebar
      )}>

        {/* Header / Logo */}
        <div className={cn(
          'flex items-center border-b border-[#1e1e2a] flex-shrink-0',
          collapsed ? 'justify-center px-0 py-4' : 'justify-between px-4 py-4',
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[#f0f0f8] leading-none">Ngapak AI</h1>
                <p className="text-[10px] text-[#5a5a72] mt-0.5">Powered by Danixyz</p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow-sm">
              <Sparkles size={15} className="text-white" />
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-[#5a5a72] hover:text-[#9090a8] hover:bg-white/5 transition-all flex-shrink-0',
              collapsed && 'mt-2',
            )}
            title={collapsed ? 'Buka sidebar' : 'Minimize sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="md:hidden text-[#5a5a72] hover:text-[#9090a8] transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className={cn('py-3 flex-shrink-0', collapsed ? 'px-2' : 'px-3')}>
          <button
            onClick={onNewChat}
            className={cn(
              'flex items-center rounded-xl text-sm font-medium transition-all duration-200 group',
              'bg-[#7c6af7]/10 hover:bg-[#7c6af7]/20 text-[#a78bfa] border border-[#7c6af7]/20 hover:border-[#7c6af7]/40',
              collapsed
                ? 'w-full justify-center p-2.5'
                : 'w-full gap-2.5 px-3 py-2.5',
            )}
            title={collapsed ? 'Obrolan Anyar' : undefined}
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200 flex-shrink-0" />
            {!collapsed && <span>Obrolan Anyar</span>}
          </button>
        </div>

        {/* Sessions List */}
        <div className={cn('flex-1 overflow-y-auto pb-3 space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
          {sessions.length === 0 ? (
            !collapsed && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#1a1a24] flex items-center justify-center mb-3">
                  <MessageSquare size={16} className="text-[#5a5a72]" />
                </div>
                <p className="text-xs text-[#5a5a72]">Durung ana obrolan</p>
                <p className="text-xs text-[#3a3a52] mt-1">Mulai obrolan anyar!</p>
              </div>
            )
          ) : (
            <>
              {!collapsed && (
                <p className="text-[10px] font-medium text-[#5a5a72] uppercase tracking-wider px-2 py-2">
                  Riwayat
                </p>
              )}
              {sessions.map((session) => {
                const isActive = activeSessionId === session.id
                const remaining = MESSAGE_LIMIT - (session.userMessageCount ?? 0)
                const isExhausted = remaining <= 0

                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={cn(
                      'group flex items-center rounded-xl cursor-pointer transition-all duration-150',
                      collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5',
                      isActive
                        ? 'bg-[#7c6af7]/15 border border-[#7c6af7]/25'
                        : 'hover:bg-white/[0.04] border border-transparent',
                    )}
                    title={collapsed ? session.title : undefined}
                  >
                    <MessageSquare
                      size={13}
                      className={cn(
                        'flex-shrink-0',
                        isActive ? 'text-[#7c6af7]' : isExhausted ? 'text-[#3a3a52]' : 'text-[#5a5a72]',
                      )}
                    />
                    {!collapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            'text-xs truncate block',
                            isActive ? 'text-[#f0f0f8]' : isExhausted ? 'text-[#5a5a72]' : 'text-[#9090a8]',
                          )}>
                            {session.title}
                          </span>
                          {isExhausted && (
                            <span className="text-[9px] text-red-400/70">Limit tercapai</span>
                          )}
                          {!isExhausted && session.userMessageCount > 0 && (
                            <span className="text-[9px] text-[#3a3a52]">
                              {remaining}/{MESSAGE_LIMIT} sisa
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id) }}
                          className="opacity-0 group-hover:opacity-100 text-[#5a5a72] hover:text-red-400 transition-all p-0.5 rounded flex-shrink-0"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-[#1e1e2a] flex-shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-bold">N</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#f0f0f8]">Ngapak AI</p>
                <p className="text-[10px] text-[#5a5a72]">Free · {MESSAGE_LIMIT} pesan/sesi</p>
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="px-2 py-4 border-t border-[#1e1e2a] flex-shrink-0 flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">N</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
