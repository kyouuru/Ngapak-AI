import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: [
    '/api/chat/:path*',
    '/api/verify-payment/:path*',
    '/api/limit/:path*',
    '/chat/:path*',
  ],
}

// Edge-level rate limit: max 60 req/min per IP
const edgeHits = new Map<string, { count: number; resetAt: number }>()

function edgeRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = edgeHits.get(ip)
  if (!entry || entry.resetAt < now) {
    edgeHits.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 60) return false
  entry.count++
  return true
}

export function proxy(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (req.nextUrl.pathname.startsWith('/api/')) {
    if (!edgeRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Coba lagi sebentar.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After':  '60',
          },
        },
      )
    }
  }

  const response = NextResponse.next()
  response.headers.set('X-Frame-Options',       'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection',       '1; mode=block')
  response.headers.set('Referrer-Policy',        'strict-origin-when-cross-origin')
  return response
}
