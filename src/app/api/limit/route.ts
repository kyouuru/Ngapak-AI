import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkLimit, GUEST_LIMIT, USER_LIMIT } from '@/lib/rateLimit'
import { getUserPlan } from '@/lib/db'
import { PLANS } from '@/lib/plans'

export async function GET(req: NextRequest) {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  const limitKey = isLoggedIn
    ? `user:${session!.user!.id ?? session!.user!.email}`
    : `ip:${ip}`

  // Get user's actual plan limit from DB
  let dailyLimit: number | undefined
  let planId = 'free'
  if (isLoggedIn && session?.user?.email) {
    const userPlan = await getUserPlan(session.user.email)
    planId = userPlan.planId
    const plan = PLANS.find((p) => p.id === planId)
    if (plan) dailyLimit = plan.limits.dailyMessages
  }

  const { used, limit, remaining, allowed } = await checkLimit(limitKey, isLoggedIn, dailyLimit)

  return NextResponse.json({
    isLoggedIn,
    user: isLoggedIn ? { name: session!.user!.name, email: session!.user!.email, image: session!.user!.image } : null,
    planId,
    used,
    limit,
    remaining,
    allowed,
    guestLimit:  GUEST_LIMIT,
    userLimit:   USER_LIMIT,
  })
}
