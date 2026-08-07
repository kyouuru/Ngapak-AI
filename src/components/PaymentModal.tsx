'use client'

import { X, Wallet, ExternalLink } from 'lucide-react'
import { type Plan } from '@/lib/plans'

interface PaymentModalProps {
  plan: Plan
  user?: { name?: string | null; email?: string | null } | null
  onClose: () => void
  onSwitchToCrypto?: () => void
}

export function PaymentModal({ plan, onClose, onSwitchToCrypto }: PaymentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#241711]/45 backdrop-blur-sm" onClick={onClose} />

      <div className="paper-grain relative w-full max-w-md rounded-2xl bg-[#fff4dc] border border-[#4a2d1c]/15 shadow-[10px_10px_0_rgba(36,23,17,0.12)] overflow-hidden text-[#241711]">
        <div className="h-1 bg-gradient-to-r from-[#b5502e] via-[#9b6a2f] to-[#445d3b]" />

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#8a6b52] hover:text-[#b5502e] p-1 rounded-lg hover:bg-[#ead6b5]/60 transition-all"
          >
            <X size={16} />
          </button>

          <h2 className="text-lg font-semibold text-[#241711] mb-1">Upgrade ke {plan.name}</h2>
          <p className="text-sm text-[#8a6b52] mb-6">Pilih cara pembayaran yang paling mudah buat kamu.</p>

          {/* Crypto — primary recommended */}
          <button
            onClick={() => { onClose(); onSwitchToCrypto?.() }}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#b5502e]/35 bg-[#b5502e]/8 hover:bg-[#b5502e]/14 transition-all mb-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#b5502e]/15 flex items-center justify-center shrink-0">
              <Wallet size={18} className="text-[#b5502e]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#241711]">Bayar pakai Crypto</p>
              <p className="text-xs text-[#8a6b52] mt-0.5">EVM (ETH, Base, Arbitrum, dll) atau Solana — langsung on-chain</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#b5502e] px-2 py-0.5 text-[10px] font-bold text-[#fff4dc]">Direkomendasikan</span>
          </button>

          {/* Manual transfer info */}
          <div className="rounded-xl border border-[#4a2d1c]/15 bg-[#f4e6ca]/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8a6b52] mb-2">Transfer Manual / Metode Lain</p>
            <p className="text-sm text-[#60412f] leading-relaxed">
              Untuk transfer bank, QRIS, atau metode lain — hubungi kami langsung. Kami akan kirim instruksi pembayaran ke email kamu.
            </p>
            <a
              href="mailto:support@ngapak.ai?subject=Upgrade%20Plan%20NGapak%20AI&body=Halo%2C%20saya%20ingin%20upgrade%20ke%20plan..."
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#b5502e] hover:underline"
            >
              Hubungi support@ngapak.ai
              <ExternalLink size={13} />
            </a>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-2.5 rounded-xl text-sm text-[#8a6b52] hover:text-[#60412f] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
