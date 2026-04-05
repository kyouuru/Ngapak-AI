import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkLimit, GUEST_LIMIT, USER_LIMIT } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  const limitKey = isLoggedIn
    ? `user:${session!.user!.id ?? session!.user!.email}`
    : `ip:${ip}`

  const { used, limit, remaining, allowed } = checkLimit(limitKey, isLoggedIn)

  return NextResponse.json({
    isLoggedIn,
    user: isLoggedIn ? { name: session!.user!.name, email: session!.user!.email, image: session!.user!.image } : null,
    used,
    limit,
    remaining,
    allowed,
    guestLimit: GUEST_LIMIT,
    userLimit: USER_LIMIT,
  })
}
