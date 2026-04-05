'use client'

import { signIn } from 'next-auth/react'
import { X, Zap, CheckCircle } from 'lucide-react'
import type { UIStrings } from '@/lib/i18n'

interface LimitModalProps {
  isLoggedIn: boolean
  onClose: () => void
  t: UIStrings
}

export function LimitModal({ isLoggedIn, onClose, t }: LimitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#111118] border border-[#2a2a3a] shadow-card animate-slide-up overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-[#5a5a72] hover:text-[#9090a8] p-1 rounded-lg hover:bg-white/5">
            <X size={16} />
          </button>

          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#7c6af7]/10 border border-[#7c6af7]/20 mb-4 mx-auto">
            <Zap size={22} className="text-[#7c6af7]" />
          </div>

          <h2 className="text-lg font-semibold text-[#f0f0f8] text-center mb-1">{t.limitTitle}</h2>
          <p className="text-sm text-[#9090a8] text-center mb-6">
            {isLoggedIn ? t.limitUserDesc : t.limitGuestDesc}
          </p>

          {!isLoggedIn && (
            <>
              <div className="space-y-2 mb-6">
                {[t.benefit1, t.benefit2, t.benefit3].map((b) => (
                  <div key={b} className="flex items-center gap-2.5">
                    <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-[#9090a8]">{b}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => signIn('google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                  bg-white hover:bg-gray-50 text-gray-800 font-medium text-sm transition-all shadow-md"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t.continueGoogle}
              </button>
              <p className="text-[10px] text-[#3a3a52] text-center mt-3">{t.freeForever}</p>
            </>
          )}

          {isLoggedIn && (
            <button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] text-sm text-[#9090a8] hover:text-[#f0f0f8] transition-all">
              {t.close}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
