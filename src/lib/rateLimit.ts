/**
 * Rate limiting dengan Vercel KV (Redis)
 * Fallback ke in-memory jika KV belum siap (lokal dev)
 */

import { kvGet, kvIncr, kvExpire } from './db'

export const GUEST_LIMIT = 5
export const USER_LIMIT = 10

// In-memory fallback (per serverless instance)
type LimitEntry = { count: number; date: string }
const memStore = new Map<string, LimitEntry>()

function todayStr() {
  return new Date().toISOString().slice(0, 10) // "2026-04-05"
}

function memGetUsage(key: string): number {
  const entry = memStore.get(key)
  if (!entry || entry.date !== todayStr()) return 0
  return entry.count
}

function memIncrementUsage(key: string): number {
  const today = todayStr()
  const entry = memStore.get(key)
  if (!entry || entry.date !== today) {
    memStore.set(key, { count: 1, date: today })
    return 1
  }
  entry.count++
  return entry.count
}

export async function getUsage(key: string): Promise<number> {
  const redisKey = `ratelimit:${key}:${todayStr()}`
  const val = await kvGet(redisKey)
  if (val !== null) return Number(val)
  return memGetUsage(key)
}

export async function incrementUsage(key: string): Promise<number> {
  const redisKey = `ratelimit:${key}:${todayStr()}`
  try {
    const count = await kvIncr(redisKey)
    // Set expiry for 25 hours (buffer beyond midnight)
    await kvExpire(redisKey, 90000)
    return count
  } catch {
    return memIncrementUsage(key)
  }
}

export async function checkLimit(
  key: string,
  isLoggedIn: boolean,
  userPlanLimit?: number, // override limit dari DB plan
): Promise<{
  allowed: boolean
  used: number
  limit: number
  remaining: number
}> {
  const limit = userPlanLimit ?? (isLoggedIn ? USER_LIMIT : GUEST_LIMIT)
  const used = await getUsage(key)
  const remaining = Math.max(0, limit - used)
  return { allowed: used < limit, used, limit, remaining }
}
