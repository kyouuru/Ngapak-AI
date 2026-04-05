'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Check, Sparkles, ArrowLeft, Zap, Crown, Star } from 'lucide-react'
import Link from 'next/link'
import { PLANS, formatPrice, type Plan } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { PaymentModal } from './PaymentModal'

const PLAN_ICONS = {
  free: Zap,
  mini: Star,
  pro: Crown,
}

export function UpgradePage() {
  const { data: session } = useSession()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f8]">
      {selectedPlan && (
        <PaymentModal plan={selectedPlan} user={session?.user} onClose={() => setSelectedPlan(null)} />
      )}

      {/* Header */}
      <div className="border-b border-[#1e1e2a] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-[#5a5a72] hover:text-[#9090a8] transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm">Kembali</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold">Ngapak AI</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7c6af7]/10 border border-[#7c6af7]/20 text-[#a78bfa] text-sm mb-6">
            <Sparkles size={14} />
            Upgrade Plan
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Pilih Plan yang{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Cocok Buat Kowe
            </span>
          </h1>
          <p className="text-[#9090a8] text-lg max-w-xl mx-auto">
            Mulai gratis, upgrade kapan saja. Semua plan bisa dibatalkan kapan saja.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => {
            const Icon = PLAN_ICONS[plan.id]
            const isPopular = plan.id === 'mini'
            const isPro = plan.id === 'pro'

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border p-6 flex flex-col transition-all duration-200',
                  isPopular
                    ? 'border-[#7c6af7]/50 bg-[#7c6af7]/5 shadow-glow-sm'
                    : isPro
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-[#2a2a3a] bg-[#16161f]',
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={cn(
                    'absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold border',
                    plan.badgeColor,
                  )}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center mb-4',
                    isPopular ? 'bg-[#7c6af7]/20' : isPro ? 'bg-amber-500/20' : 'bg-[#1a1a24]',
                  )}>
                    <Icon size={18} className={isPopular ? 'text-[#7c6af7]' : isPro ? 'text-amber-400' : 'text-[#5a5a72]'} />
                  </div>
                  <h2 className="text-xl font-bold text-[#f0f0f8] mb-1">{plan.name}</h2>
                  <p className="text-sm text-[#5a5a72]">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <div className="text-3xl font-bold text-[#f0f0f8]">Gratis</div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold text-[#f0f0f8]">
                        {formatPrice(plan.price)}
                      </div>
                      <div className="text-sm text-[#5a5a72]">per bulan</div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={14} className={cn(
                        'flex-shrink-0 mt-0.5',
                        isPopular ? 'text-[#7c6af7]' : isPro ? 'text-amber-400' : 'text-emerald-400',
                      )} />
                      <span className="text-sm text-[#9090a8]">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.price === 0 ? (
                  <Link
                    href="/"
                    className="w-full py-3 rounded-xl text-sm font-medium text-center transition-all
                      bg-[#1a1a24] border border-[#2a2a3a] text-[#9090a8] hover:text-[#f0f0f8] hover:border-[#3a3a4a]"
                  >
                    Mulai Gratis
                  </Link>
                ) : (
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      'w-full py-3 rounded-xl text-sm font-semibold transition-all',
                      isPopular
                        ? 'bg-[#7c6af7] hover:bg-[#6b59e6] text-white shadow-glow-sm'
                        : 'bg-amber-500 hover:bg-amber-400 text-black',
                    )}
                  >
                    Upgrade ke {plan.name}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#16161f] overflow-hidden mb-16">
          <div className="px-6 py-4 border-b border-[#2a2a3a]">
            <h3 className="font-semibold text-[#f0f0f8]">Perbandingan Lengkap</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e2a]">
                  <th className="text-left px-6 py-3 text-[#5a5a72] font-medium">Fitur</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-6 py-3 text-center text-[#9090a8] font-medium">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Chat per hari', values: PLANS.map((p) => `${p.limits.dailyMessages}x`) },
                  { label: 'Model AI gratis', values: PLANS.map(() => '✅') },
                  { label: 'Model Claude (berbayar)', values: ['❌', '✅', '✅'] },
                  { label: 'Analisis gambar', values: ['❌', '✅', '✅'] },
                  { label: 'Upload file kode', values: ['✅', '✅', '✅'] },
                  { label: 'Semua bahasa daerah', values: ['✅', '✅', '✅'] },
                  { label: 'Priority response', values: ['❌', '❌', '✅'] },
                  { label: 'Akses fitur beta', values: ['❌', '❌', '✅'] },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-[#1e1e2a] last:border-0">
                    <td className="px-6 py-3 text-[#9090a8]">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-6 py-3 text-center text-[#f0f0f8]">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-center mb-8">Pertanyaan Umum</h3>
          <div className="space-y-4">
            {[
              { q: 'Bagaimana cara bayar?', a: 'Pembayaran via transfer bank (BCA, Mandiri, BNI, BRI) atau QRIS. Setelah konfirmasi pembayaran, akun kamu langsung diupgrade.' },
              { q: 'Apakah bisa dibatalkan?', a: 'Ya, kamu bisa batalkan kapan saja. Plan aktif sampai akhir periode billing.' },
              { q: 'Kenapa model Claude butuh plan berbayar?', a: 'Model Claude dari Anthropic memiliki biaya API per penggunaan. Plan berbayar membantu kami menutup biaya tersebut.' },
              { q: 'Apa bedanya analisis gambar?', a: 'Dengan plan Mini/Pro, kamu bisa upload foto/screenshot dan AI akan menganalisis isinya — cocok untuk debug UI, analisis diagram, atau membaca teks dari gambar.' },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-[#2a2a3a] bg-[#16161f] p-5">
                <h4 className="font-medium text-[#f0f0f8] mb-2">{faq.q}</h4>
                <p className="text-sm text-[#9090a8] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
