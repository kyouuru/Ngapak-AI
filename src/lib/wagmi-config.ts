import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
  phantomWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { mainnet, base, arbitrum, polygon, bsc, optimism } from 'wagmi/chains'

export const SUPPORTED_EVM_CHAINS = [mainnet, base, arbitrum, polygon, bsc, optimism] as const

export const wagmiConfig = getDefaultConfig({
  appName:     'Ngapak AI',
  projectId:   process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'ngapak-ai-dev',
  chains:      SUPPORTED_EVM_CHAINS,
  ssr:         true,
  // Explicit wallet list — excludes baseAccount connector which pulls in
  // @base-org/account → @coinbase/cdp-sdk → @x402/* (missing packages)
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
        phantomWallet,
      ],
    },
    {
      groupName: 'More',
      wallets: [walletConnectWallet],
    },
  ],
})

export const CHAIN_META: Record<number, { name: string; badge: string; explorer: string; color: string }> = {
  1:     { name: 'Ethereum', badge: 'ETH',   explorer: 'https://etherscan.io/tx/',              color: '#627EEA' },
  8453:  { name: 'Base',     badge: 'BASE',  explorer: 'https://basescan.org/tx/',              color: '#0052FF' },
  42161: { name: 'Arbitrum', badge: 'ARB',   explorer: 'https://arbiscan.io/tx/',               color: '#28A0F0' },
  137:   { name: 'Polygon',  badge: 'MATIC', explorer: 'https://polygonscan.com/tx/',           color: '#8247E5' },
  56:    { name: 'BSC',      badge: 'BNB',   explorer: 'https://bscscan.com/tx/',               color: '#F0B90B' },
  10:    { name: 'Optimism', badge: 'OP',    explorer: 'https://optimistic.etherscan.io/tx/',   color: '#FF0420' },
}

export const PAYMENT_RECIPIENT_EVM     = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_EVM     ?? '0x0BE165eD3f0B912fE4D41290656c9FFFd2b23EE0'
export const PAYMENT_RECIPIENT_SOLANA  = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_SOLANA  ?? '8bLLgoKTEevg3mCBWQfhQi6BdByuQCwEVjGDJQ226EwG'
