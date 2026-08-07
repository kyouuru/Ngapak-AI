'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Check, Sparkles, ArrowLeft, Zap, Crown, Star, LogIn } from 'lucide-react'
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
  const isLoggedIn = !!session?.user
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  function handleSelectPlan(plan: Plan) {
    if (!isLoggedIn) {
      signIn('google', { callbackUrl: '/upgrade' })
      return
    }
    setSelectedPlan(plan)
  }

  return (
    <div className="paper-grain min-h-screen bg-[#f4e6ca] text-[#241711]">
      {selectedPlan && (
        <PaymentModal plan={selectedPlan} user={session?.user} onClose={() => setSelectedPlan(null)} />
      )}

      {/* Header */}
      <div className="border-b border-[#4a2d1c]/15 bg-[#f4e6ca]/88 px-6 py-4 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-[#60412f] hover:text-[#b5502e] transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm">Kembali</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#b5502e] flex items-center justify-center">
              <Sparkles size={12} className="text-[#fff4dc]" />
            </div>
            <span className="text-sm font-semibold">Ngapak AI</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fff4dc]/70 border border-[#4a2d1c]/15 text-[#b5502e] text-sm mb-6">
            <Sparkles size={14} />
            Upgrade Plan
          </div>
          <h1 className="font-display text-4xl font-bold mb-4">
            Pilih Plan yang{' '}
            <span className="text-[#b5502e]">
              Cocok Buat Kowe
            </span>
          </h1>
          <p className="text-[#60412f] text-lg max-w-xl mx-auto">
            Mulai gratis, upgrade kapan saja. Semua plan bisa dibatalkan kapan saja.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Login banner — tampil kalau belum login */}
          {!isLoggedIn && (
            <div className="md:col-span-3 flex items-center justify-between gap-4 rounded-2xl border border-[#b5502e]/30 bg-[#b5502e]/8 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#b5502e]/15 flex items-center justify-center shrink-0">
                  <LogIn size={16} className="text-[#b5502e]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#241711]">Login dulu untuk upgrade</p>
                  <p className="text-xs text-[#8a6b52] mt-0.5">Akun Google dibutuhkan agar plan tersimpan ke akun kamu.</p>
                </div>
              </div>
              <button
                onClick={() => signIn('google', { callbackUrl: '/upgrade' })}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold transition-all"
              >
                <LogIn size={14} />
                Login Google
              </button>
            </div>
          )}
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
                    ? 'border-[#b5502e]/45 bg-[#fff4dc]/80 shadow-[8px_8px_0_rgba(36,23,17,0.08)]'
                    : isPro
                    ? 'border-[#445d3b]/30 bg-[#445d3b]/10'
                    : 'border-[#4a2d1c]/15 bg-[#fff4dc]/65',
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
                    isPopular ? 'bg-[#b5502e]/12' : isPro ? 'bg-[#445d3b]/14' : 'bg-[#ead6b5]/75',
                  )}>
                    <Icon size={18} className={isPopular ? 'text-[#b5502e]' : isPro ? 'text-[#445d3b]' : 'text-[#60412f]'} />
                  </div>
                  <h2 className="text-xl font-bold text-[#241711] mb-1">{plan.name}</h2>
                  <p className="text-sm text-[#8a6b52]">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <div className="text-3xl font-bold text-[#241711]">Gratis</div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold text-[#241711]">
                        {formatPrice(plan.price)}
                      </div>
                      <div className="text-sm text-[#8a6b52]">per bulan</div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={14} className={cn(
                        'flex-shrink-0 mt-0.5',
                        isPopular ? 'text-[#b5502e]' : isPro ? 'text-[#445d3b]' : 'text-[#445d3b]',
                      )} />
                      <span className="text-sm text-[#60412f]">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.price === 0 ? (
                  <Link
                    href="/"
                    className="w-full py-3 rounded-xl text-sm font-medium text-center transition-all
                      bg-[#ead6b5]/65 border border-[#4a2d1c]/15 text-[#60412f] hover:text-[#241711] hover:border-[#b5502e]/30"
                  >
                    Mulai Gratis
                  </Link>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={cn(
                      'w-full py-3 rounded-xl text-sm font-semibold transition-all',
                      isPopular
                        ? 'bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] shadow-[5px_5px_0_rgba(36,23,17,0.12)]'
                        : 'bg-[#445d3b] hover:bg-[#34472d] text-[#fff4dc]',
                    )}
                  >
                    {!isLoggedIn ? (
                      <span className="flex items-center justify-center gap-2">
                        <LogIn size={14} /> Login untuk Upgrade
                      </span>
                    ) : (
                      `Upgrade ke ${plan.name}`
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-[#4a2d1c]/15 bg-[#fff4dc]/65 overflow-hidden mb-16">
          <div className="px-6 py-4 border-b border-[#4a2d1c]/15">
            <h3 className="font-semibold text-[#241711]">Perbandingan Lengkap</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#4a2d1c]/15">
                  <th className="text-left px-6 py-3 text-[#8a6b52] font-medium">Fitur</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-6 py-3 text-center text-[#60412f] font-medium">{p.name}</th>
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
                  <tr key={row.label} className="border-b border-[#4a2d1c]/15 last:border-0">
                    <td className="px-6 py-3 text-[#60412f]">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-6 py-3 text-center text-[#241711]">{v}</td>
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
              <div key={faq.q} className="rounded-xl border border-[#4a2d1c]/15 bg-[#fff4dc]/65 p-5">
                <h4 className="font-medium text-[#241711] mb-2">{faq.q}</h4>
                <p className="text-sm text-[#60412f] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
