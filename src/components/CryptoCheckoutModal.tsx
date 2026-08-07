'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useAccount, useDisconnect, useSwitchChain, useWriteContract } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { parseUnits } from 'viem'
import type { Plan } from '@/lib/plans'
import { PAYMENT_RECIPIENT_EVM, PAYMENT_RECIPIENT_SOLANA, CHAIN_META } from '@/lib/wagmi-config'
import { cn } from '@/lib/utils'
import {
  AlertTriangle, Check, ChevronRight,
  ExternalLink, Loader2, Shield, Wallet, X, ChevronLeft, Unlink,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
type Step        = 1 | 2 | 3 | 4 | 5 | 6
type NetworkType = 'evm' | 'solana'
type Stablecoin  = 'USDT' | 'USDC' | 'USDG'
type TxStatus    = 'idle' | 'signing' | 'confirming' | 'success' | 'error'

const PLAN_USD: Record<string, number> = { mini: 3.99, pro: 7.99 }

// ── EVM chain configs ────────────────────────────────────────────
const EVM_CHAINS = [
  { id: 1,     name: 'Ethereum',  badge: 'ETH',   explorer: 'https://etherscan.io/tx/' },
  { id: 8453,  name: 'Base',      badge: 'BASE',  explorer: 'https://basescan.org/tx/' },
  { id: 42161, name: 'Arbitrum',  badge: 'ARB',   explorer: 'https://arbiscan.io/tx/' },
  { id: 137,   name: 'Polygon',   badge: 'MATIC', explorer: 'https://polygonscan.com/tx/' },
  { id: 56,    name: 'BNB Chain', badge: 'BNB',   explorer: 'https://bscscan.com/tx/' },
  { id: 10,    name: 'Optimism',  badge: 'OP',    explorer: 'https://optimistic.etherscan.io/tx/' },
]

// ── Stablecoin contract addresses per chain ───────────────────────
// chainId → { USDT, USDC, USDG }
const STABLE_CONTRACTS: Record<number, Partial<Record<Stablecoin, `0x${string}`>>> = {
  1:     { USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  8453:  { USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  42161: { USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
  137:   { USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' },
  56:    { USDT: '0x55d398326f99059fF775485246999027B3197955', USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' },
  10:    { USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' },
}
// Solana stablecoin mints
const SOL_STABLE_MINTS: Partial<Record<Stablecoin, string>> = {
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
}

// ERC-20 minimal ABI for transfer
const ERC20_ABI = [
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },
] as const

function shortAddress(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}` }

// ── Supported networks markdown content ──────────────────────────
const EVM_NETWORKS_MD = `## Jaringan EVM yang Didukung

| Jaringan | Token | Keterangan |
|---|---|---|
| **Ethereum** | USDT, USDC | Mainnet, biaya gas lebih tinggi |
| **Base** | USDC | L2 Coinbase, gas sangat murah |
| **Arbitrum** | USDT, USDC | L2 Offchain Labs, gas murah |
| **Polygon** | USDT, USDC | Sidechain, gas sangat murah |
| **BNB Chain** | USDT, USDC | BSC Mainnet |
| **Optimism** | USDT, USDC | L2 Optimistic, gas murah |

> **Tips:** Gunakan **Base** atau **Polygon** untuk biaya gas paling rendah.

### Cara Bayar
1. Pastikan wallet sudah terhubung ke jaringan yang dipilih
2. Pastikan ada saldo stablecoin (USDT/USDC) di jaringan tersebut
3. Klik Konfirmasi — wallet akan meminta approval transfer

### Penting
- Transaksi on-chain tidak bisa dibatalkan
- Kirim tepat ke alamat yang ditampilkan
- Verifikasi otomatis setelah transaksi dikonfirmasi di blockchain`

const SOL_NETWORKS_MD = `## Jaringan Solana yang Didukung

| Token | Mint Address | Keterangan |
|---|---|---|
| **USDT (SPL)** | Es9vMF...wNYB | Tether di Solana |
| **USDC (SPL)** | EPjFWd...Dt1v | USD Coin di Solana |

> **Tips:** Gunakan wallet **Phantom** atau **Solflare** untuk transaksi SPL token.

### Cara Bayar
1. Connect wallet Phantom atau Solflare
2. Pastikan ada saldo USDT atau USDC SPL
3. Konfirmasi transaksi di wallet

### Penting
- Biaya SOL untuk gas diperlukan (~0.001 SOL)
- Transaksi tidak bisa dibatalkan setelah dikonfirmasi`

// ── Simple Markdown renderer (tables + blockquotes + headings) ───
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]!
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-[#241711] mt-3 mb-1">{line.slice(3)}</h3>)
    } else if (line.startsWith('> ')) {
      elements.push(
        <div key={i} className="border-l-2 border-[#b5502e] pl-3 py-1 my-2 bg-[#b5502e]/5 rounded-r-lg">
          <p className="text-xs text-[#60412f] leading-relaxed">{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</p>
        </div>
      )
    } else if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-xs font-semibold text-[#241711] mt-3 mb-1 uppercase tracking-wide">{line.slice(4)}</h4>)
    } else if (line.startsWith('| ') && line.endsWith(' |')) {
      const rows: string[][] = []
      let j = i
      while (j < lines.length && lines[j]!.startsWith('|')) {
        const cells = lines[j]!.split('|').slice(1, -1).map(c => c.trim())
        if (!cells.every(c => c.replace(/-/g, '').trim() === '')) rows.push(cells)
        j++
      }
      elements.push(
        <div key={i} className="overflow-x-auto my-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#4a2d1c]/15">
                {rows[0]!.map((h, ci) => <th key={ci} className="text-left py-1.5 pr-3 font-semibold text-[#241711]" dangerouslySetInnerHTML={{ __html: h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-[#4a2d1c]/8">
                  {row.map((cell, ci) => <td key={ci} className="py-1.5 pr-3 text-[#60412f]" dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      i = j
      continue
    } else if (line.match(/^\d+\./)) {
      elements.push(<li key={i} className="text-xs text-[#60412f] ml-4 mb-0.5 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>)
    } else if (line.startsWith('- ')) {
      elements.push(<li key={i} className="text-xs text-[#60412f] ml-4 mb-0.5 list-disc">{line.slice(2)}</li>)
    } else if (line.trim() !== '') {
      elements.push(<p key={i} className="text-xs text-[#60412f] leading-relaxed my-1">{line}</p>)
    }
    i++
  }
  return <div>{elements}</div>
}

export function CryptoCheckoutModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { data: session } = useSession()
  const userEmail = session?.user?.email ?? ''

  // Gate: must be logged in
  if (!userEmail) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#241711]/45 backdrop-blur-sm" onClick={onClose} />
        <div className="paper-grain relative w-full max-w-sm rounded-2xl bg-[#fff4dc] border border-[#4a2d1c]/15 shadow-[10px_10px_0_rgba(36,23,17,0.12)] overflow-hidden text-[#241711]">
          <div className="h-1 bg-gradient-to-r from-[#b5502e] via-[#9b6a2f] to-[#445d3b]" />
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#b5502e]/12 border border-[#b5502e]/25 flex items-center justify-center">
              <Shield size={24} className="text-[#b5502e]" />
            </div>
            <div>
              <h2 className="text-base font-semibold mb-1">Login dulu, ya!</h2>
              <p className="text-sm text-[#60412f] leading-relaxed">Akun Google dibutuhkan supaya plan tersimpan ke akun kamu.</p>
            </div>
            <button onClick={() => { onClose(); signIn('google', { callbackUrl: '/upgrade' }) }}
              className="w-full py-3 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2 transition-all">
              <Wallet size={14} /> Login dengan Google
            </button>
            <button onClick={onClose} className="text-sm text-[#8a6b52] hover:text-[#60412f] transition-colors">Batal</button>
          </div>
        </div>
      </div>
    )
  }

  // ── wagmi hooks ──────────────────────────────────────────────
  const { address: evmAddress, isConnected: evmConnected, chain } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { disconnect } = useDisconnect()
  const { writeContractAsync } = useWriteContract()

  // ── state ────────────────────────────────────────────────────
  const [step,       setStep]       = useState<Step>(1)
  const [networkType, setNetworkType] = useState<NetworkType>('evm')
  const [evmChainId,  setEvmChainId]  = useState<number>(8453) // default Base
  const [stablecoin,  setStablecoin]  = useState<Stablecoin>('USDC')
  const [solAddress,  setSolAddress]  = useState('')
  const [txStatus,    setTxStatus]    = useState<TxStatus>('idle')
  const [txHash,      setTxHash]      = useState('')
  const [txError,     setTxError]     = useState('')

  const planUSD   = PLAN_USD[plan.id] ?? 3.99
  const evmChain  = EVM_CHAINS.find(c => c.id === evmChainId) ?? EVM_CHAINS[0]!
  const explorerUrl = networkType === 'evm'
    ? `${evmChain.explorer}${txHash}`
    : `https://solscan.io/tx/${txHash}`

  // available stablecoins for selected chain
  const availableStables: Stablecoin[] = networkType === 'evm'
    ? (Object.keys(STABLE_CONTRACTS[evmChainId] ?? {}) as Stablecoin[])
    : (Object.keys(SOL_STABLE_MINTS) as Stablecoin[])

  const steps = ['Ekosistem', 'Jaringan', 'Wallet', 'Token', 'Bayar', 'Selesai']

  // ── connect solana ───────────────────────────────────────────
  const connectSolana = async () => {
    const solana = (window as unknown as { solana?: { connect: () => Promise<{ publicKey: { toString(): string } }> } }).solana
    if (!solana) { setTxError('Install Phantom atau Solflare terlebih dahulu.'); return }
    try { const { publicKey } = await solana.connect(); setSolAddress(publicKey.toString()); setTxError('') }
    catch (e) { setTxError((e as Error).message) }
  }

  // ── confirm payment ──────────────────────────────────────────
  const confirmPayment = async () => {
    setTxStatus('signing'); setTxError('')
    try {
      let hash = ''
      const amountUnits = BigInt(Math.round(planUSD * 1_000_000)) // 6 decimals (USDT/USDC/USDG)

      if (networkType === 'evm') {
        if (!evmConnected || !evmAddress) throw new Error('Wallet EVM belum terhubung.')
        if (chain?.id !== evmChainId) await switchChainAsync({ chainId: evmChainId })
        const contractAddr = STABLE_CONTRACTS[evmChainId]?.[stablecoin]
        if (!contractAddr) throw new Error(`${stablecoin} tidak tersedia di jaringan ini.`)
        hash = await writeContractAsync({
          address: contractAddr,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [PAYMENT_RECIPIENT_EVM as `0x${string}`, amountUnits],
        })
      } else {
        const solana = (window as unknown as { solana?: { publicKey: { toString(): string }; signAndSendTransaction(tx: unknown): Promise<{ signature: string }> } }).solana
        if (!solana || !solAddress) throw new Error('Wallet Solana belum terhubung.')
        const mint = SOL_STABLE_MINTS[stablecoin]
        if (!mint) throw new Error(`${stablecoin} tidak tersedia di Solana.`)
        const { Connection, PublicKey, Transaction } = await import('@solana/web3.js')
        const { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token')
        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com', 'confirmed')
        const fromPubkey = new PublicKey(solAddress)
        const toPubkey   = new PublicKey(PAYMENT_RECIPIENT_SOLANA)
        const mintPubkey = new PublicKey(mint)
        const fromATA    = await getAssociatedTokenAddress(mintPubkey, fromPubkey)
        const toATA      = await getAssociatedTokenAddress(mintPubkey, toPubkey)
        const { blockhash } = await connection.getLatestBlockhash()
        const tx = new Transaction().add(createTransferInstruction(fromATA, toATA, fromPubkey, amountUnits, [], TOKEN_PROGRAM_ID))
        tx.recentBlockhash = blockhash
        tx.feePayer = fromPubkey
        const { signature } = await solana.signAndSendTransaction(tx)
        hash = signature
      }

      setTxHash(hash); setTxStatus('confirming')
      const res  = await fetch('/api/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: hash, chainId: evmChainId, planId: plan.id, token: stablecoin, expectedAmountUSD: planUSD, userEmail, network: networkType }) })
      const data = await res.json() as { ok: boolean; error?: string }
      if (!data.ok) throw new Error(data.error ?? 'Verifikasi gagal')
      setTxStatus('success'); setStep(6)
    } catch (e) { setTxStatus('error'); setTxError((e as Error).message) }
  }

  const isWalletConnected = networkType === 'evm' ? evmConnected : !!solAddress
  const activeAddress     = networkType === 'evm' ? evmAddress   : solAddress

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#241711]/45 backdrop-blur-sm" onClick={onClose} />
      <div className="paper-grain relative w-full max-w-md rounded-2xl bg-[#fff4dc] border border-[#4a2d1c]/15 shadow-[10px_10px_0_rgba(36,23,17,0.12)] overflow-hidden text-[#241711]">
        <div className="h-1 bg-gradient-to-r from-[#b5502e] via-[#9b6a2f] to-[#445d3b]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#4a2d1c]/15">
          <div className="flex items-center gap-2">
            {step > 1 && step < 6 && (
              <button onClick={() => setStep((s) => (s - 1) as Step)} className="text-[#8a6b52] hover:text-[#b5502e] transition-colors">
                <ChevronLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold">Checkout — Plan {plan.name}</h2>
              <p className="text-xs text-[#8a6b52] mt-0.5">${planUSD}/bulan · stablecoin</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8a6b52] hover:text-[#b5502e] p-1 rounded-lg transition-all"><X size={16} /></button>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-0 px-5 py-3 border-b border-[#4a2d1c]/15 overflow-x-auto">
          {steps.map((label, i) => {
            const n = (i + 1) as Step
            const done = step > n; const active = step === n
            return (
              <div key={label} className="flex items-center flex-shrink-0">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all',
                  done ? 'bg-[#b5502e] text-[#fff4dc]' : active ? 'bg-[#b5502e]/15 border border-[#b5502e] text-[#b5502e]' : 'bg-[#f4e6ca]/80 border border-[#4a2d1c]/15 text-[#8a6b52]')}>
                  {done ? <Check size={10} /> : n}
                </div>
                <span className={cn('text-[10px] ml-1 hidden sm:block whitespace-nowrap', active ? 'text-[#241711]' : 'text-[#8a6b52]')}>{label}</span>
                {i < steps.length - 1 && <div className={cn('h-px w-4 mx-1 flex-shrink-0', step > n ? 'bg-[#b5502e]' : 'bg-[#4a2d1c]/15')} />}
              </div>
            )
          })}
        </div>

        <div className="px-5 py-5 min-h-[300px]">

          {/* Step 1 — pilih ekosistem EVM atau Solana */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-[#8a6b52] mb-2">Pilih ekosistem blockchain kamu:</p>
              {(['evm', 'solana'] as NetworkType[]).map((n) => (
                <button key={n} onClick={() => setNetworkType(n)}
                  className={cn('w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                    networkType === n ? 'border-[#b5502e] bg-[#b5502e]/12 shadow-[0_0_0_3px_rgba(181,80,46,0.12)]' : 'border-[#4a2d1c]/20 bg-[#f4e6ca]/50 hover:border-[#b5502e]/50 hover:bg-[#b5502e]/5')}>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all', networkType === n ? 'bg-[#b5502e]' : 'bg-[#b5502e]/10')}>
                    <Wallet size={18} className={networkType === n ? 'text-[#fff4dc]' : 'text-[#b5502e]'} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-sm font-semibold', networkType === n ? 'text-[#b5502e]' : 'text-[#241711]')}>
                      {n === 'evm' ? 'EVM (Ethereum + L2s)' : 'Solana'}
                    </p>
                    <p className="text-xs text-[#8a6b52] mt-0.5">{n === 'evm' ? 'Ethereum, Base, Arbitrum, Polygon, BSC, Optimism' : 'USDT & USDC SPL Token'}</p>
                  </div>
                  {networkType === n && <div className="w-5 h-5 rounded-full bg-[#b5502e] flex items-center justify-center shrink-0"><Check size={11} className="text-[#fff4dc]" /></div>}
                </button>
              ))}
              <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2">
                Lanjut <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Step 2 — pilih jaringan spesifik + info markdown */}
          {step === 2 && (
            <div className="space-y-3">
              {networkType === 'evm' ? (
                <>
                  <p className="text-xs text-[#8a6b52]">Pilih jaringan untuk transaksi:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {EVM_CHAINS.map((c) => (
                      <button key={c.id} onClick={() => setEvmChainId(c.id)}
                        className={cn('flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all',
                          evmChainId === c.id ? 'border-[#b5502e] bg-[#b5502e]/12' : 'border-[#4a2d1c]/20 bg-[#f4e6ca]/50 hover:border-[#b5502e]/40')}>
                        <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-md', evmChainId === c.id ? 'bg-[#b5502e] text-[#fff4dc]' : 'bg-[#4a2d1c]/10 text-[#60412f]')}>{c.badge}</span>
                        <span className={cn('text-xs font-medium', evmChainId === c.id ? 'text-[#b5502e]' : 'text-[#241711]')}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                  {/* Scrollable info markdown */}
                  <div className="mt-2 rounded-xl border border-[#4a2d1c]/15 bg-[#f4e6ca]/40 p-3 max-h-36 overflow-y-auto text-[11px]">
                    <SimpleMarkdown content={EVM_NETWORKS_MD} />
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-[#4a2d1c]/15 bg-[#f4e6ca]/40 p-3 max-h-52 overflow-y-auto text-[11px]">
                  <SimpleMarkdown content={SOL_NETWORKS_MD} />
                </div>
              )}
              <button onClick={() => setStep(3)} className="w-full py-3 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2">
                Lanjut <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Step 3 — connect wallet */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-[#8a6b52] mb-2">
                {networkType === 'evm' ? `Connect wallet EVM ke ${evmChain.name}:` : 'Connect wallet Solana:'}
              </p>
              {networkType === 'evm' ? (
                evmConnected && evmAddress ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-[#445d3b] bg-[#445d3b]/8">
                    <div className="w-2 h-2 rounded-full bg-[#445d3b] animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#445d3b]">Wallet terhubung</p>
                      <p className="text-sm font-mono text-[#241711]">{shortAddress(evmAddress)}</p>
                    </div>
                    <button
                      onClick={() => disconnect()}
                      title="Putuskan wallet"
                      className="p-1.5 rounded-lg text-[#8a6b52] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                    >
                      <Unlink size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center py-2"><ConnectButton label="Connect EVM Wallet" /></div>
                )
              ) : (
                solAddress ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-[#445d3b] bg-[#445d3b]/8">
                    <div className="w-2 h-2 rounded-full bg-[#445d3b] animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#445d3b]">Wallet Solana terhubung</p>
                      <p className="text-sm font-mono text-[#241711]">{shortAddress(solAddress)}</p>
                    </div>
                    <button
                      onClick={() => setSolAddress('')}
                      title="Putuskan wallet"
                      className="p-1.5 rounded-lg text-[#8a6b52] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                    >
                      <Unlink size={15} />
                    </button>
                  </div>
                ) : (
                  <button onClick={connectSolana} className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-[#4a2d1c]/20 bg-[#f4e6ca]/50 hover:border-[#b5502e]/50 text-left transition-all">
                    <Wallet size={16} className="text-[#b5502e]" />
                    <span className="text-sm font-medium">Connect Phantom / Solflare</span>
                  </button>
                )
              )}
              {txError && <p className="text-xs text-red-500">{txError}</p>}
              {isWalletConnected && (
                <button onClick={() => setStep(4)} className="w-full py-3 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2">
                  Lanjut <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Step 4 — pilih stablecoin */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-xs text-[#8a6b52] mb-2">Pilih stablecoin untuk pembayaran (harga tetap = ${planUSD}):</p>
              {availableStables.length === 0 && (
                <p className="text-xs text-red-500 p-3 bg-red-50 rounded-xl border border-red-200">Tidak ada stablecoin tersedia di jaringan ini. Pilih jaringan lain.</p>
              )}
              {(['USDT', 'USDC', 'USDG'] as Stablecoin[]).map((s) => {
                const available = availableStables.includes(s)
                return (
                  <button key={s} onClick={() => available && setStablecoin(s)} disabled={!available}
                    className={cn('w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left',
                      !available ? 'border-[#4a2d1c]/10 bg-[#f4e6ca]/30 opacity-40 cursor-not-allowed' :
                      stablecoin === s ? 'border-[#b5502e] bg-[#b5502e]/12 shadow-[0_0_0_3px_rgba(181,80,46,0.12)]' : 'border-[#4a2d1c]/20 bg-[#f4e6ca]/50 hover:border-[#b5502e]/50')}>
                    <div>
                      <p className={cn('text-sm font-bold', stablecoin === s && available ? 'text-[#b5502e]' : 'text-[#241711]')}>{s}</p>
                      <p className="text-xs text-[#8a6b52] mt-0.5">{s === 'USDT' ? 'Tether USD' : s === 'USDC' ? 'USD Coin' : 'USDG Stablecoin'}{!available ? ' — tidak tersedia' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#241711]">${planUSD}</span>
                      {stablecoin === s && available && <div className="w-5 h-5 rounded-full bg-[#b5502e] flex items-center justify-center"><Check size={11} className="text-[#fff4dc]" /></div>}
                    </div>
                  </button>
                )
              })}
              {availableStables.length > 0 && (
                <button onClick={() => setStep(5)} className="w-full py-3 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2">
                  Lanjut <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Step 5 — konfirmasi & bayar */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#4a2d1c]/15 bg-[#f4e6ca]/50 p-4 space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-[#8a6b52]">Plan</span><span className="font-semibold">{plan.name}</span></div>
                <div className="flex justify-between"><span className="text-[#8a6b52]">Ekosistem</span><span className="font-semibold">{networkType === 'evm' ? 'EVM' : 'Solana'}</span></div>
                {networkType === 'evm' && <div className="flex justify-between"><span className="text-[#8a6b52]">Jaringan</span><span className="font-semibold">{evmChain.name}</span></div>}
                <div className="flex justify-between"><span className="text-[#8a6b52]">Token</span><span className="font-bold text-[#b5502e]">{stablecoin}</span></div>
                <div className="flex justify-between"><span className="text-[#8a6b52]">Wallet</span><span className="font-mono text-xs">{activeAddress ? shortAddress(activeAddress as string) : '-'}</span></div>
                <div className="border-t border-[#4a2d1c]/10 pt-2.5 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-[#b5502e] text-base">${planUSD} {stablecoin}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#9b6a2f]/8 border border-[#9b6a2f]/20">
                <Shield size={13} className="text-[#9b6a2f] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#60412f] leading-relaxed">Pastikan jaringan wallet sesuai. Transaksi on-chain tidak bisa dibatalkan.</p>
              </div>
              {txStatus === 'error' && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 leading-relaxed">{txError}</p>
                </div>
              )}
              <button onClick={confirmPayment} disabled={['signing', 'confirming'].includes(txStatus)}
                className="w-full py-3.5 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] disabled:opacity-60 disabled:cursor-not-allowed text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                {txStatus === 'signing' || txStatus === 'confirming'
                  ? <><Loader2 size={14} className="animate-spin" /> Memproses...</>
                  : <>Konfirmasi Bayar ${planUSD} {stablecoin}</>}
              </button>
            </div>
          )}

          {/* Step 6 — sukses */}
          {step === 6 && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#445d3b]/15 border-2 border-[#445d3b]/40 flex items-center justify-center">
                <Check size={28} className="text-[#445d3b]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#241711] mb-1">Pembayaran Berhasil!</h3>
                <p className="text-sm text-[#60412f]">Plan <strong className="text-[#b5502e]">{plan.name}</strong> sudah aktif.</p>
              </div>
              {txHash && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#8a6b52] hover:text-[#b5502e] font-mono transition-colors">
                  {shortAddress(txHash)} <ExternalLink size={11} />
                </a>
              )}
              <button onClick={onClose} className="w-full py-3 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold transition-all">
                Mulai Pakai Ngapak AI
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
