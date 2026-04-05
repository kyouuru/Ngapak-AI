// In-memory rate limit store (per Vercel Edge instance)
// Untuk production skala besar pakai Redis/KV, tapi ini cukup untuk MVP

export const GUEST_LIMIT = 5
export const USER_LIMIT = 10

type LimitEntry = { count: number; date: string }

const store = new Map<string, LimitEntry>()

function todayStr() {
  return new Date().toISOString().slice(0, 10) // "2026-04-05"
}

export function getUsage(key: string): number {
  const entry = store.get(key)
  if (!entry || entry.date !== todayStr()) return 0
  return entry.count
}

export function incrementUsage(key: string): number {
  const today = todayStr()
  const entry = store.get(key)
  if (!entry || entry.date !== today) {
    store.set(key, { count: 1, date: today })
    return 1
  }
  entry.count++
  return entry.count
}

export function checkLimit(key: string, isLoggedIn: boolean): {
  allowed: boolean
  used: number
  limit: number
  remaining: number
} {
  const limit = isLoggedIn ? USER_LIMIT : GUEST_LIMIT
  const used = getUsage(key)
  const remaining = Math.max(0, limit - used)
  return { allowed: used < limit, used, limit, remaining }
}
