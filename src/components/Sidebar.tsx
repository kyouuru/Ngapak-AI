'use client'

import { Plus, MessageSquare, Trash2, X, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/lib/types'

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  sessions, activeSessionId, onNewChat, onSelectSession, onDeleteSession, isOpen, onClose,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed md:relative top-0 left-0 h-full w-64 flex flex-col z-30 transition-transform duration-300',
        'border-r border-[#1e1e2a]',
        'bg-[#0d0d14]',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-[#1e1e2a]">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow-sm">
              <Sparkles size={15} className="text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 blur-md opacity-40 -z-10" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#f0f0f8] leading-none">Ngapak AI</h1>
              <p className="text-[10px] text-[#5a5a72] mt-0.5">Powered by Claude</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-[#5a5a72] hover:text-[#9090a8] transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 py-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              bg-[#7c6af7]/10 hover:bg-[#7c6af7]/20 text-[#a78bfa] border border-[#7c6af7]/20 hover:border-[#7c6af7]/40"
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
            Obrolan Anyar
          </button>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a24] flex items-center justify-center mb-3">
                <MessageSquare size={16} className="text-[#5a5a72]" />
              </div>
              <p className="text-xs text-[#5a5a72]">Durung ana obrolan</p>
              <p className="text-xs text-[#3a3a52] mt-1">Mulai obrolan anyar!</p>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-medium text-[#5a5a72] uppercase tracking-wider px-2 py-2">
                Riwayat
              </p>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    'group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
                    activeSessionId === session.id
                      ? 'bg-[#7c6af7]/15 text-[#f0f0f8] border border-[#7c6af7]/25'
                      : 'text-[#9090a8] hover:bg-white/[0.04] hover:text-[#f0f0f8] border border-transparent',
                  )}
                >
                  <MessageSquare size={13} className={cn(
                    'flex-shrink-0',
                    activeSessionId === session.id ? 'text-[#7c6af7]' : 'text-[#5a5a72]',
                  )} />
                  <span className="flex-1 text-xs truncate">{session.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id) }}
                    className="opacity-0 group-hover:opacity-100 text-[#5a5a72] hover:text-red-400 transition-all p-0.5 rounded flex-shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#1e1e2a]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">N</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#f0f0f8] truncate">Ngapak AI</p>
              <p className="text-[10px] text-[#5a5a72]">Free tier</p>
            </div>
            <ChevronRight size={12} className="text-[#5a5a72]" />
          </div>
        </div>
      </aside>
    </>
  )
}
