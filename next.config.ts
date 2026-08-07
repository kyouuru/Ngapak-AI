import type { NextConfig } from 'next'

// Stub entire packages that are pulled in transitively by @wagmi/connectors
// but not needed by our app. Turbopack resolveAlias maps them to an empty module.
const STUB = './src/lib/empty-module.js'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',         value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https: wss:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  turbopack: {
    resolveAlias: {
      // Stub the entire coinbase/base package chains — not used by our app
      '@coinbase/cdp-sdk':                  STUB,
      '@base-org/account':                  STUB,
      // Stub all @x402/* sub-paths
      '@x402/evm':                          STUB,
      '@x402/svm':                          STUB,
      '@x402/core':                         STUB,
      '@x402/core/client':                  STUB,
      '@x402/evm/exact/client':             STUB,
      '@x402/evm/upto/client':              STUB,
      '@x402/svm/exact/client':             STUB,
    },
  },
}

export default nextConfig
