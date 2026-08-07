'use client'

import { SessionProvider } from 'next-auth/react'
import { Web3Providers }   from './Web3Providers'
import { SmoothScroll }    from './SmoothScroll'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Web3Providers>
        <SmoothScroll>{children}</SmoothScroll>
      </Web3Providers>
    </SessionProvider>
  )
}
