'use client'

import { X, Lock, Star, Check } from 'lucide-react'
import Link from 'next/link'
import { getPlanById } from '@/lib/plans'

interface UpgradePromptProps {
  reason: 'model' | 'vision' | 'limit'
  modelName?: string
  onClose: () => void
}

export function UpgradePrompt({ reason, modelName, onClose }: UpgradePromptProps) {
  const miniPlan = getPlanById('mini')

  const content = {
    model: {
      title: 'Model Berbayar',
      desc: `${modelName ?? 'Model ini'} membutuhkan plan berbayar. Upgrade ke Mini untuk akses semua model Claude.`,
    },
    vision: {
      title: 'Fitur Vision AI',
      desc: 'Analisis gambar membutuhkan plan berbayar. Upgrade ke Mini untuk bisa upload dan analisis gambar.',
    },
    limit: {
      title: 'Limit Harian Habis',
      desc: 'Kamu sudah mencapai limit chat harian. Upgrade untuk mendapatkan lebih banyak chat.',
    },
  }[reason]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#111118] border border-[#2a2a3a] shadow-card animate-slide-up overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-[#5a5a72] hover:text-[#9090a8] p-1 rounded-lg hover:bg-white/5">
            <X size={16} />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-[#7c6af7]/10 border border-[#7c6af7]/20 flex items-center justify-center mb-4">
            <Lock size={20} className="text-[#7c6af7]" />
          </div>

          <h2 className="text-base font-semibold text-[#f0f0f8] mb-2">{content.title}</h2>
          <p className="text-sm text-[#9090a8] mb-5 leading-relaxed">{content.desc}</p>

          {/* Mini plan highlight */}
          <div className="rounded-xl bg-[#7c6af7]/5 border border-[#7c6af7]/20 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-[#7c6af7]" />
              <span className="text-sm font-semibold text-[#f0f0f8]">Plan Mini — Rp 49.000/bulan</span>
            </div>
            <ul className="space-y-1.5">
              {miniPlan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={11} className="text-[#7c6af7] flex-shrink-0" />
                  <span className="text-xs text-[#9090a8]">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/upgrade"
            onClick={onClose}
            className="w-full flex items-center justify-center py-3 rounded-xl bg-[#7c6af7] hover:bg-[#6b59e6] text-white text-sm font-semibold transition-all"
          >
            Lihat Semua Plan
          </Link>
          <button onClick={onClose} className="w-full py-2 mt-2 text-xs text-[#5a5a72] hover:text-[#9090a8] transition-colors">
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  )
}
