'use client'

import { useState } from 'react'
import { X, Copy, Check, CreditCard, Smartphone, Building2, AlertCircle } from 'lucide-react'
import { type Plan, formatPrice } from '@/lib/plans'
import { cn } from '@/lib/utils'

interface PaymentModalProps {
  plan: Plan
  user?: { name?: string | null; email?: string | null } | null
  onClose: () => void
}

type PaymentMethod = 'bca' | 'mandiri' | 'bni' | 'bri' | 'qris'

const BANK_INFO: Record<string, { name: string; account: string; holder: string }> = {
  bca:     { name: 'BCA',     account: '1234567890', holder: 'Ngapak AI' },
  mandiri: { name: 'Mandiri', account: '1234567890', holder: 'Ngapak AI' },
  bni:     { name: 'BNI',     account: '1234567890', holder: 'Ngapak AI' },
  bri:     { name: 'BRI',     account: '1234567890', holder: 'Ngapak AI' },
}

export function PaymentModal({ plan, user, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('bca')
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select')
  const [copied, setCopied] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  const bank = method !== 'qris' ? BANK_INFO[method] : null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = () => {
    // Di production: kirim ke backend untuk verifikasi manual atau integrasi payment gateway
    setStep('done')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-[#111118] border border-[#2a2a3a] shadow-card animate-slide-up overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />

        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-[#5a5a72] hover:text-[#9090a8] p-1 rounded-lg hover:bg-white/5">
            <X size={16} />
          </button>

          {step === 'select' && (
            <>
              <h2 className="text-lg font-semibold text-[#f0f0f8] mb-1">Upgrade ke {plan.name}</h2>
              <p className="text-sm text-[#5a5a72] mb-6">{formatPrice(plan.price)}/bulan</p>

              {/* User info */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs text-[#5a5a72] mb-1 block">Nama</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-3 py-2.5 text-sm text-[#f0f0f8] placeholder-[#5a5a72] outline-none focus:border-[#7c6af7]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#5a5a72] mb-1 block">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@kamu.com"
                    className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-3 py-2.5 text-sm text-[#f0f0f8] placeholder-[#5a5a72] outline-none focus:border-[#7c6af7]/50"
                  />
                </div>
              </div>

              {/* Payment method */}
              <p className="text-xs text-[#5a5a72] mb-3 uppercase tracking-wider font-medium">Metode Pembayaran</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {(['bca', 'mandiri', 'bni', 'bri'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all',
                      method === m
                        ? 'border-[#7c6af7]/40 bg-[#7c6af7]/10 text-[#f0f0f8]'
                        : 'border-[#2a2a3a] bg-[#1a1a24] text-[#9090a8] hover:border-[#3a3a4a]',
                    )}
                  >
                    <Building2 size={14} />
                    {BANK_INFO[m]?.name}
                  </button>
                ))}
                <button
                  onClick={() => setMethod('qris')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all col-span-2',
                    method === 'qris'
                      ? 'border-[#7c6af7]/40 bg-[#7c6af7]/10 text-[#f0f0f8]'
                      : 'border-[#2a2a3a] bg-[#1a1a24] text-[#9090a8] hover:border-[#3a3a4a]',
                  )}
                >
                  <Smartphone size={14} />
                  QRIS (GoPay, OVO, Dana, dll)
                </button>
              </div>

              <button
                onClick={() => setStep('confirm')}
                disabled={!name || !email}
                className="w-full py-3 rounded-xl bg-[#7c6af7] hover:bg-[#6b59e6] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lanjut ke Pembayaran
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <h2 className="text-lg font-semibold text-[#f0f0f8] mb-1">Detail Pembayaran</h2>
              <p className="text-sm text-[#5a5a72] mb-6">Transfer sesuai nominal berikut</p>

              {method === 'qris' ? (
                <div className="flex flex-col items-center mb-6">
                  {/* QRIS placeholder */}
                  <div className="w-48 h-48 rounded-2xl bg-white flex items-center justify-center mb-3">
                    <div className="text-center text-gray-400 text-xs p-4">
                      <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
                      QRIS akan tersedia setelah integrasi payment gateway
                    </div>
                  </div>
                  <p className="text-xs text-[#5a5a72]">Scan dengan aplikasi e-wallet kamu</p>
                </div>
              ) : bank ? (
                <div className="space-y-3 mb-6">
                  <div className="rounded-xl bg-[#1a1a24] border border-[#2a2a3a] p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#5a5a72]">Bank</span>
                      <span className="text-sm font-medium text-[#f0f0f8]">{bank.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#5a5a72]">No. Rekening</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-[#f0f0f8]">{bank.account}</span>
                        <button onClick={() => handleCopy(bank.account)} className="text-[#5a5a72] hover:text-[#7c6af7] transition-colors">
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#5a5a72]">Atas Nama</span>
                      <span className="text-sm text-[#f0f0f8]">{bank.holder}</span>
                    </div>
                    <div className="border-t border-[#2a2a3a] pt-3 flex justify-between items-center">
                      <span className="text-xs text-[#5a5a72]">Nominal Transfer</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#7c6af7]">{formatPrice(plan.price)}</span>
                        <button onClick={() => handleCopy(String(plan.price))} className="text-[#5a5a72] hover:text-[#7c6af7] transition-colors">
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">
                      Transfer nominal <strong>tepat</strong> sesuai di atas. Sertakan nama kamu di berita transfer.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-xl bg-[#7c6af7] hover:bg-[#6b59e6] text-white text-sm font-semibold transition-all"
                >
                  Sudah Transfer, Konfirmasi
                </button>
                <button
                  onClick={() => setStep('select')}
                  className="w-full py-2.5 rounded-xl text-sm text-[#5a5a72] hover:text-[#9090a8] transition-colors"
                >
                  Kembali
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-[#f0f0f8] mb-2">Konfirmasi Diterima!</h2>
              <p className="text-sm text-[#9090a8] mb-6 leading-relaxed">
                Tim kami akan memverifikasi pembayaran kamu dalam <strong className="text-[#f0f0f8]">1×24 jam</strong>.
                Notifikasi akan dikirim ke <strong className="text-[#f0f0f8]">{email}</strong>.
              </p>
              <p className="text-xs text-[#5a5a72] mb-6">
                Ada pertanyaan? Hubungi kami di{' '}
                <a href="mailto:support@ngapak.ai" className="text-[#7c6af7] hover:underline">
                  support@ngapak.ai
                </a>
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] text-sm text-[#9090a8] hover:text-[#f0f0f8] transition-all"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
