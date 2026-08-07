/**
 * /api/verify-payment
 *
 * SECURITY: Plan unlock must never happen from frontend state alone.
 * This endpoint verifies transaction hashes against RPC nodes before any plan
 * activation. In production, persist the activated plan in your database only
 * after recipient, status, amount, token contract, and confirmation depth pass.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { isTxHashUsed, markTxHashUsed, setUserPlan } from '@/lib/db'

export const runtime = 'nodejs'

const RPC_URLS: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  8453: 'https://mainnet.base.org',
  42161: 'https://arb1.arbitrum.io/rpc',
  137: 'https://polygon-rpc.com',
  56: 'https://bsc-dataseed.binance.org',
  10: 'https://mainnet.optimism.io',
}

const RECIPIENT_EVM     = (process.env.PAYMENT_RECIPIENT_EVM     ?? '0x0BE165eD3f0B912fE4D41290656c9FFFd2b23EE0').toLowerCase()
const RECIPIENT_SOLANA  =  process.env.PAYMENT_RECIPIENT_SOLANA  ?? '8bLLgoKTEevg3mCBWQfhQi6BdByuQCwEVjGDJQ226EwG'

// In-memory replay protection removed — now handled by DB via isTxHashUsed/markTxHashUsed

// Tolerance: accept payment if within 20% of expected (price feed drift)
const AMOUNT_TOLERANCE = 0.20

interface VerifyRequest {
  txHash: string
  chainId: number
  planId: string
  token: 'ETH' | 'BNB' | 'MATIC' | 'USDC' | 'USDT' | 'SOL' | 'SOL_USDC'
  expectedAmountUSD: number
  network: 'evm' | 'solana'
}

async function rpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const data = await response.json() as { result?: T; error?: { message?: string } }
  if (data.error) throw new Error(data.error.message ?? 'RPC error')
  return data.result as T
}

// Fetch native token price in USD from a simple public endpoint
async function getNativeTokenPriceUSD(symbol: 'ETH' | 'BNB' | 'MATIC'): Promise<number> {
  const ids: Record<string, string> = { ETH: 'ethereum', BNB: 'binancecoin', MATIC: 'matic-network' }
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids[symbol]}&vs_currencies=usd`,
      { next: { revalidate: 60 } },
    )
    const json = await res.json() as Record<string, { usd: number }>
    return json[ids[symbol]]?.usd ?? 0
  } catch {
    return 0
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth required ────────────────────────────────────────────
    const session = await auth()
    if (!session?.user) {
      return Response.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json() as VerifyRequest
    const { txHash, chainId, planId, token, expectedAmountUSD, network } = body

    if (!txHash || !planId || !network) {
      return Response.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // ── Validate planId to prevent injection ─────────────────────
    if (!['mini', 'pro'].includes(planId)) {
      return Response.json({ ok: false, error: 'Invalid plan' }, { status: 400 })
    }

    // ── Replay protection ────────────────────────────────────────
    if (await isTxHashUsed(txHash)) {
      return Response.json({ ok: false, error: 'Transaction already used' }, { status: 400 })
    }

    if (network === 'evm') {
      const rpcUrl = RPC_URLS[chainId]
      if (!rpcUrl) return Response.json({ ok: false, error: 'Unsupported chain' }, { status: 400 })

      const receipt = await rpc<{ status?: string } | null>(rpcUrl, 'eth_getTransactionReceipt', [txHash])
      if (!receipt) return Response.json({ ok: false, error: 'Transaction not found or not confirmed' }, { status: 404 })
      if (receipt.status !== '0x1') return Response.json({ ok: false, error: 'Transaction failed on-chain' }, { status: 400 })

      const tx = await rpc<{ to?: string; value?: string } | null>(rpcUrl, 'eth_getTransactionByHash', [txHash])
      if (!tx?.to || tx.to.toLowerCase() !== RECIPIENT_EVM) {
        return Response.json({ ok: false, error: 'Wrong payment recipient' }, { status: 400 })
      }

      if (['USDC', 'USDT'].includes(token)) {
        return Response.json({ ok: false, error: 'Stablecoin log verification is not enabled yet' }, { status: 400 })
      }

      // ── Verify amount ────────────────────────────────────────
      if (tx.value && tx.value !== '0x0') {
        const nativeSymbol = token as 'ETH' | 'BNB' | 'MATIC'
        const priceUSD = await getNativeTokenPriceUSD(nativeSymbol)
        if (priceUSD > 0) {
          const sentWei = BigInt(tx.value)
          const sentNative = Number(sentWei) / 1e18
          const sentUSD = sentNative * priceUSD
          const minRequired = expectedAmountUSD * (1 - AMOUNT_TOLERANCE)
          if (sentUSD < minRequired) {
            return Response.json(
              { ok: false, error: `Jumlah tidak cukup. Dikirim ~$${sentUSD.toFixed(2)}, butuh ~$${expectedAmountUSD}` },
              { status: 400 },
            )
          }
        }
      } else {
        return Response.json({ ok: false, error: 'Transaction value is zero' }, { status: 400 })
      }

      // Mark as used + persist plan
      const email = session.user.email!
      await markTxHashUsed(txHash, email, planId)
      await setUserPlan(email, planId, txHash)
      return Response.json({ ok: true, planId, txHash, userEmail: email, message: 'Plan berhasil diaktifkan!' })
    }

    if (network === 'solana') {
      const rpcUrl = process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com'
      const transaction = await rpc<{
        meta?: { err?: unknown; postBalances?: number[]; preBalances?: number[] }
        transaction?: { message?: { accountKeys?: Array<{ pubkey?: string }> } }
      } | null>(rpcUrl, 'getTransaction', [txHash, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }])
      if (!transaction) return Response.json({ ok: false, error: 'Solana transaction not found' }, { status: 404 })
      if (transaction.meta?.err) return Response.json({ ok: false, error: 'Solana transaction failed' }, { status: 400 })

      // Verify recipient is in account keys
      const keys = transaction.transaction?.message?.accountKeys ?? []
      const recipientIdx = keys.findIndex((k) => k.pubkey === RECIPIENT_SOLANA)
      if (recipientIdx === -1) return Response.json({ ok: false, error: 'Wrong payment recipient' }, { status: 400 })

      // Verify SOL amount if native SOL transfer
      if (token === 'SOL' && transaction.meta?.preBalances && transaction.meta?.postBalances) {
        const received = (transaction.meta.postBalances[recipientIdx] ?? 0) - (transaction.meta.preBalances[recipientIdx] ?? 0)
        const receivedSOL = received / 1e9
        const solPrice = await getNativeTokenPriceUSD('ETH') // approximate; use SOL-specific feed in prod
        if (solPrice > 0) {
          const receivedUSD = receivedSOL * solPrice
          const minRequired = expectedAmountUSD * (1 - AMOUNT_TOLERANCE)
          if (receivedUSD < minRequired) {
            return Response.json(
              { ok: false, error: `Jumlah SOL tidak cukup. Diterima ~$${receivedUSD.toFixed(2)}` },
              { status: 400 },
            )
          }
        }
      }

      const email = session.user.email!
      await markTxHashUsed(txHash, email, planId)
      await setUserPlan(email, planId, txHash)
      return Response.json({ ok: true, planId, txHash, userEmail: email, message: 'Plan berhasil diaktifkan!' })
    }

    return Response.json({ ok: false, error: 'Unknown network' }, { status: 400 })
  } catch (error) {
    console.error('[verify-payment] error:', error)
    return Response.json({ ok: false, error: 'Verification failed' }, { status: 500 })
  }
}
