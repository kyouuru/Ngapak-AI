// Price feed — fetch from CoinGecko public API (no key needed for basic use)
// In production, consider Pyth or Chainlink for on-chain price feeds

export interface TokenPrice {
  usd: number
  lastUpdated: number
}

const CACHE: Record<string, TokenPrice> = {}
const CACHE_TTL = 60_000 // 1 minute

const COINGECKO_IDS: Record<string, string> = {
  ETH:  'ethereum',
  BNB:  'binancecoin',
  MATIC: 'matic-network',
  SOL:  'solana',
  USDC: 'usd-coin',
  USDT: 'tether',
}

export async function getTokenPriceUSD(symbol: string): Promise<number> {
  const id = COINGECKO_IDS[symbol.toUpperCase()]
  if (!id) return 1 // stablecoins

  const cached = CACHE[symbol]
  if (cached && Date.now() - cached.lastUpdated < CACHE_TTL) {
    return cached.usd
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) throw new Error('Price fetch failed')
    const data = await res.json() as Record<string, { usd: number }>
    const price = data[id]?.usd ?? 0
    CACHE[symbol] = { usd: price, lastUpdated: Date.now() }
    return price
  } catch {
    // Return cached value if available, even if stale
    return CACHE[symbol]?.usd ?? 0
  }
}

export function usdToCrypto(usdAmount: number, tokenPriceUSD: number): number {
  if (tokenPriceUSD === 0) return 0
  return usdAmount / tokenPriceUSD
}

export function formatCrypto(amount: number, symbol: string): string {
  if (['USDC', 'USDT'].includes(symbol)) {
    return `${amount.toFixed(2)} ${symbol}`
  }
  if (amount < 0.001) return `${amount.toFixed(6)} ${symbol}`
  if (amount < 1) return `${amount.toFixed(4)} ${symbol}`
  return `${amount.toFixed(3)} ${symbol}`
}
