'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession }          from 'next-auth/react'
import { useAccount, useConnect, useSendTransaction, useSwitchChain } from 'wagmi'
import { ConnectButton }       from '@rainbow-me/rainbowkit'
import { parseEther }          from 'viem'
import type { Plan }           from '@/lib/plans'
import { getTokenPriceUSD, usdToCrypto, formatCrypto } from '@/lib/price-feed'
import { PAYMENT_RECIPIENT_EVM, PAYMENT_RECIPIENT_SOLANA, CHAIN_META } from '@/lib/wagmi-config'
import { cn }                  from '@/lib/utils'
import {
  AlertTriangle, Check, ChevronRight,
  ExternalLink, Loader2, Shield, Wallet, X,
} from 'lucide-react'

type Step        = 1 | 2 | 3 | 4 | 5
type NetworkType = 'evm' | 'solana'
type Token       = 'ETH' | 'BNB' | 'MATIC' | 'SOL' | 'SOL_USDC'
type TxStatus    = 'idle' | 'signing' | 'confirming' | 'success' | 'error'

const PLAN_USD: Record<string, number> = { mini: 3.99, pro: 7.99 }

const EVM_CHAIN_IDS: Record<string, number> = {
  'Ethereum': 1, 'Base': 8453, 'Arbitrum': 42161,
  'Polygon': 137, 'BSC': 56, 'Optimism': 10,
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function CryptoCheckoutModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { data: session } = useSession()
  const userEmail = session?.user?.email ?? 'wallet-user'

  // ── wagmi EVM hooks ──────────────────────────────────────────
  const { address: evmAddress, isConnected: evmConnected, chain } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync }     = useSwitchChain()

  // ── local state ──────────────────────────────────────────────
  const [step,       setStep]       = useState<Step>(1)
  const [network,    setNetwork]    = useState<NetworkType>('evm')
  const [token,      setToken]      = useState<Token>('ETH')
  const [solAddress, setSolAddress] = useState('')
  const [prices,     setPrices]     = useState<Record<string, number>>({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [txStatus,   setTxStatus]   = useState<TxStatus>('idle')
  const [txHash,     setTxHash]     = useState('')
  const [txError,    setTxError]    = useState('')

  const planUSD      = PLAN_USD[plan.id] ?? 3.99
  const chainMeta    = CHAIN_META[chain?.id ?? 1] ?? CHAIN_META[1]!
  const tokenSymbol  = token === 'SOL_USDC' ? 'USDC' : token
  const tokenPrice   = prices[tokenSymbol] ?? 0
  const cryptoAmount = usdToCrypto(planUSD, tokenPrice)
  const displayAmt   = formatCrypto(cryptoAmount, token)
  const explorerUrl  = network === 'evm'
    ? `${chainMeta?.explorer ?? 'https://etherscan.io/tx/'}${txHash}`
    : `https://solscan.io/tx/${txHash}`

  const steps = ['Jaringan', 'Wallet', 'Token', 'Bayar', 'Selesai']

  // fetch prices at step 3
  useEffect(() => {
    if (step !== 3) return
    setLoadingPrices(true)
    const symbols = network === 'evm' ? ['ETH', 'BNB', 'MATIC'] : ['SOL']
    Promise.all(symbols.map(async (s) => [s, await getTokenPriceUSD(s)] as const))
      .then((pairs) => setPrices(Object.fromEntries(pairs)))
      .finally(() => setLoadingPrices(false))
  }, [network, step])

  const tokenOptions = useMemo<Token[]>(() => (
    network === 'evm' ? ['ETH', 'BNB', 'MATIC'] : ['SOL', 'SOL_USDC']
  ), [network])

  // ── Solana connect ───────────────────────────────────────────
  const connectSolana = async () => {
    const solana = (window as unknown as {
      solana?: { connect: () => Promise<{ publicKey: { toString(): string } }> }
    }).solana
    if (!solana) { setTxError('Install Phantom atau Solflare terlebih dahulu.'); return }
    try {
      const { publicKey } = await solana.connect()
      setSolAddress(publicKey.toString())
      setTxError('')
    } catch (e) {
      setTxError((e as Error).message)
    }
  }

  // ── Confirm payment ──────────────────────────────────────────
  const confirmPayment = async () => {
    setTxStatus('signing')
    setTxError('')
    try {
      let hash = ''

      if (network === 'evm') {
        if (!evmConnected || !evmAddress) throw new Error('Wallet EVM belum terhubung.')

        // Switch chain if needed
        const targetChainId = EVM_CHAIN_IDS[chainMeta?.name ?? 'Ethereum'] ?? 1
        if (chain?.id !== targetChainId) {
          await switchChainAsync({ chainId: targetChainId })
        }

        const tx = await sendTransactionAsync({
          to:    PAYMENT_RECIPIENT_EVM as `0x${string}`,
          value: parseEther(cryptoAmount.toFixed(18)),
        })
        hash = tx
      } else {
        // Solana via window.solana
        const solana = (window as unknown as {
          solana?: {
            publicKey: { toString(): string }
            signAndSendTransaction(tx: unknown): Promise<{ signature: string }>
          }
        }).solana
        if (!solana || !solAddress) throw new Error('Wallet Solana belum terhubung.')

        const { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } =
          await import('@solana/web3.js')
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
          'confirmed',
        )
        const fromPubkey = new PublicKey(solAddress)
        const toPubkey   = new PublicKey(PAYMENT_RECIPIENT_SOLANA)
        const { blockhash } = await connection.getLatestBlockhash()

        let tx
        if (token === 'SOL') {
          tx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey,
              toPubkey,
              lamports: Math.ceil(cryptoAmount * LAMPORTS_PER_SOL),
            }),
          )
        } else {
          let createTransferInstruction: typeof import('@solana/spl-token').createTransferInstruction
          let getAssociatedTokenAddress: typeof import('@solana/spl-token').getAssociatedTokenAddress
          let TOKEN_PROGRAM_ID: typeof import('@solana/spl-token').TOKEN_PROGRAM_ID
          try {
            const splToken = await import('@solana/spl-token')
            createTransferInstruction = splToken.createTransferInstruction
            getAssociatedTokenAddress = splToken.getAssociatedTokenAddress
            TOKEN_PROGRAM_ID          = splToken.TOKEN_PROGRAM_ID
          } catch {
            throw new Error('Modul USDC SPL belum siap. Gunakan SOL untuk saat ini.')
          }
          const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
          const fromATA   = await getAssociatedTokenAddress(USDC_MINT, fromPubkey)
          const toATA     = await getAssociatedTokenAddress(USDC_MINT, toPubkey)
          tx = new Transaction().add(
            createTransferInstruction(fromATA, toATA, fromPubkey, Math.ceil(planUSD * 1_000_000), [], TOKEN_PROGRAM_ID),
          )
        }
        tx.recentBlockhash = blockhash
        tx.feePayer        = fromPubkey
        const { signature } = await solana.signAndSendTransaction(tx)
        hash = signature
      }

      setTxHash(hash)
      setTxStatus('confirming')

      // Backend verification
      const res  = await fetch('/api/verify-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash:           hash,
          chainId:          chain?.id ?? 1,
          planId:           plan.id,
          token,
          expectedAmountUSD: planUSD,
          userEmail,
          network,
        }),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (!data.ok) throw new Error(data.error ?? 'Verifikasi gagal')

      setTxStatus('success')
      setStep(5)
    } catch (e) {
      setTxStatus('error')
      setTxError((e as Error).message)
    }
  }

  const activeAddress = network === 'evm' ? evmAddress : solAddress
  const isConnected   = network === 'evm' ? evmConnected : !!solAddress

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#241711]/45 backdrop-blur-sm" onClick={onClose} />
      <div className="paper-grain relative w-full max-w-md rounded-2xl bg-[#fff4dc] border border-[#4a2d1c]/15 shadow-[10px_10px_0_rgba(36,23,17,0.12)] overflow-hidden text-[#241711]">
        <div className="h-1 bg-gradient-to-r from-[#b5502e] via-[#9b6a2f] to-[#445d3b]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#4a2d1c]/15">
          <div>
            <h2 className="text-sm font-semibold">Checkout — Plan {plan.name}</h2>
            <p className="text-xs text-[#8a6b52] mt-0.5">${planUSD}/bulan · bayar crypto</p>
          </div>
          <button onClick={onClose} className="text-[#8a6b52] hover:text-[#b5502e] p-1 rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-0 px-5 py-3 border-b border-[#4a2d1c]/15">
          {steps.map((label, i) => {
            const n = (i + 1) as Step
            const done   = step > n
            const active = step === n
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all',
                  done   ? 'bg-[#b5502e] text-[#fff4dc]'
                  : active ? 'bg-[#b5502e]/15 border border-[#b5502e] text-[#b5502e]'
                           : 'bg-[#f4e6ca]/80 border border-[#4a2d1c]/15 text-[#8a6b52]',
                )}>
                  {done ? <Check size={10} /> : n}
                </div>
                <span className={cn('text-[10px] ml-1 hidden sm:block', active ? 'text-[#241711]' : 'text-[#8a6b52]')}>{label}</span>
                {i < steps.length - 1 && <div className={cn('h-px flex-1 mx-1', step > n ? 'bg-[#b5502e]' : 'bg-[#4a2d1c]/15')} />}
              </div>
            )
          })}
        </div>

        <div className="px-5 py-5 min-h-[280px]">

          {/* Step 1 — pilih jaringan */}
          {step === 1 && (
            <div className="space-y-3">
              {(['evm', 'solana'] as NetworkType[]).map((n) => (
                <button key={n} onClick={() => { setNetwork(n); setToken(n === 'evm' ? 'ETH' : 'SOL') }}
                  className={cn('w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                    network === n ? 'border-[#b5502e]/40 bg-[#b5502e]/8' : 'border-[#4a2d1c]/15 bg-[#f4e6ca]/50 hover:border-[#b5502e]/30',
                  )}>
                  <div className="w-10 h-10 rounded-xl bg-[#b5502e]/10 flex items-center justify-center shrink-0">
                    <Wallet size={18} className="text-[#b5502e]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{n === 'evm' ? 'EVM (Ethereum + L2s)' : 'Solana'}</p>
                    <p className="text-xs text-[#8a6b52] mt-0.5">{n === 'evm' ? 'ETH, Base, Arbitrum, Polygon, BSC, Optimism' : 'SOL dan USDC SPL'}</p>
                  </div>
                </button>
              ))}
              <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2">
                Lanjut <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Step 2 — connect wallet */}
          {step === 2 && (
            <div className="space-y-3">
              {network === 'evm' ? (
                evmConnected && evmAddress ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#445d3b]/30 bg-[#445d3b]/8">
                    <div className="w-2 h-2 rounded-full bg-[#445d3b] animate-pulse" />
                    <div>
                      <p className="text-xs font-medium text-[#445d3b]">Wallet terhubung</p>
                      <p className="text-sm font-mono text-[#241711]">{shortAddress(evmAddress)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-2">
                    <ConnectButton label="Connect EVM Wallet" />
                  </div>
                )
              ) : (
                solAddress ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#445d3b]/30 bg-[#445d3b]/8">
                    <div className="w-2 h-2 rounded-full bg-[#445d3b] animate-pulse" />
                    <div>
                      <p className="text-xs font-medium text-[#445d3b]">Wallet Solana terhubung</p>
                      <p className="text-sm font-mono text-[#241711]">{shortAddress(solAddress)}</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={connectSolana} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#4a2d1c]/15 bg-[#f4e6ca]/50 hover:border-[#b5502e]/30 text-left transition-all">
                    <Wallet size={16} className="text-[#b5502e]" />
                    <span className="text-sm">Connect Phantom / Solflare</span>
                  </button>
                )
              )}
              {txError && <p className="text-xs text-red-500">{txError}</p>}
              {isConnected && (
                <button onClick={() => setStep(3)} className="w-full py-3 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2">
                  Lanjut <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Step 3 — pilih token */}
          {step === 3 && (
            <div>
              {loadingPrices
                ? <div className="flex items-center justify-center py-10 gap-2 text-[#8a6b52]"><Loader2 size={16} className="animate-spin" /> Mengambil harga...</div>
                : (
                  <div className="space-y-2">
                    {tokenOptions.map((opt) => {
                      const sym = opt === 'SOL_USDC' ? 'USDC' : opt
                      const amt = formatCrypto(usdToCrypto(planUSD, prices[sym] ?? 1), opt)
                      return (
                        <button key={opt} onClick={() => setToken(opt)}
                          className={cn('w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left',
                            token === opt ? 'border-[#b5502e]/40 bg-[#b5502e]/8' : 'border-[#4a2d1c]/15 bg-[#f4e6ca]/50 hover:border-[#b5502e]/25',
                          )}>
                          <div>
                            <p className="text-sm font-medium">{opt === 'SOL_USDC' ? 'USDC (SPL)' : opt}</p>
                            <p className="text-xs text-[#8a6b52] mt-0.5">Estimasi gas ditampilkan di wallet</p>
                          </div>
                          <p className="text-sm font-mono text-[#b5502e]">{amt}</p>
                        </button>
                      )
                    })}
                  </div>
                )
              }
              {!loadingPrices && (
                <button onClick={() => setStep(4)} className="w-full mt-4 py-3 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2">
                  Lanjut <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Step 4 — konfirmasi */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#4a2d1c]/15 bg-[#f4e6ca]/50 p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[#8a6b52]">Plan</span><span className="font-medium">{plan.name}</span></div>
                <div className="flex justify-between"><span className="text-[#8a6b52]">Jaringan</span><span className="font-medium">{network === 'evm' ? (chainMeta?.name ?? 'EVM') : 'Solana'}</span></div>
                <div className="flex justify-between"><span className="text-[#8a6b52]">Token</span><span className="font-medium">{token}</span></div>
                <div className="flex justify-between"><span className="text-[#8a6b52]">Wallet</span><span className="font-mono text-xs">{activeAddress ? shortAddress(activeAddress) : '-'}</span></div>
                <div className="border-t border-[#4a2d1c]/10 pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-[#b5502e] font-mono">{displayAmt}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#9b6a2f]/8 border border-[#9b6a2f]/20">
                <Shield size={13} className="text-[#9b6a2f] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#60412f] leading-relaxed">Pastikan jaringan di wallet sesuai sebelum konfirmasi. Transaksi on-chain tidak bisa dibatalkan.</p>
              </div>

              {txStatus === 'error' && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 leading-relaxed">{txError}</p>
                </div>
              )}

              <button
                onClick={confirmPayment}
                disabled={['signing', 'confirming'].includes(txStatus)}
                className="w-full py-3.5 rounded-xl bg-[#b5502e] hover:bg-[#8f3e24] disabled:opacity-60 disabled:cursor-not-allowed text-[#fff4dc] text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {txStatus === 'signing' || txStatus === 'confirming'
                  ? <><Loader2 size={14} className="animate-spin" /> Verifikasi on-chain...</>
                  : <>Konfirmasi Pembayaran — {displayAmt}</>
                }
              </button>
            </div>
          )}

          {/* Step 5 — sukses */}
          {step === 5 && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#445d3b]/15 border border-[#445d3b]/30 flex items-center justify-center">
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
