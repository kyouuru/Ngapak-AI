/**
 * db.ts — Vercel KV (Redis) + Vercel Postgres adapter
 *
 * Graceful fallback: jika env vars belum ada (lokal dev / sebelum DB disetup),
 * semua fungsi jatuh kembali ke in-memory store sehingga app tetap jalan.
 *
 * SETUP DI VERCEL:
 * 1. Buka dashboard.vercel.com → project → Storage
 * 2. Create KV Database → connect ke project → env vars otomatis ter-set
 * 3. Create Postgres Database → connect ke project → env vars otomatis ter-set
 * 4. Jalankan migration: buka /api/db-migrate (sekali saja)
 */

// ─── KV (Redis) — rate limiting ──────────────────────────────────────────────

let kv: typeof import('@vercel/kv').kv | null = null

async function getKV() {
  if (kv) return kv
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
  try {
    const mod = await import('@vercel/kv')
    kv = mod.kv
    return kv
  } catch {
    return null
  }
}

// In-memory fallback for KV
const memStore = new Map<string, string>()

export async function kvGet(key: string): Promise<string | null> {
  const client = await getKV()
  if (client) {
    try { return await client.get<string>(key) } catch { /* fallthrough */ }
  }
  return memStore.get(key) ?? null
}

export async function kvSet(key: string, value: string, exSeconds?: number): Promise<void> {
  const client = await getKV()
  if (client) {
    try {
      if (exSeconds) await client.set(key, value, { ex: exSeconds })
      else await client.set(key, value)
      return
    } catch { /* fallthrough */ }
  }
  memStore.set(key, value)
  if (exSeconds) setTimeout(() => memStore.delete(key), exSeconds * 1000)
}

export async function kvIncr(key: string): Promise<number> {
  const client = await getKV()
  if (client) {
    try { return await client.incr(key) } catch { /* fallthrough */ }
  }
  const cur = Number(memStore.get(key) ?? '0') + 1
  memStore.set(key, String(cur))
  return cur
}

export async function kvExpire(key: string, seconds: number): Promise<void> {
  const client = await getKV()
  if (client) {
    try { await client.expire(key, seconds); return } catch { /* fallthrough */ }
  }
  // fallback: schedule deletion
  setTimeout(() => memStore.delete(key), seconds * 1000)
}

// ─── Postgres — plan state ───────────────────────────────────────────────────

let pgReady = false

async function getSql() {
  if (!process.env.POSTGRES_URL) return null
  try {
    const { sql } = await import('@vercel/postgres')
    return sql
  } catch {
    return null
  }
}

export async function ensureSchema(): Promise<void> {
  const sql = await getSql()
  if (!sql) return
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_plans (
        id           SERIAL PRIMARY KEY,
        user_email   TEXT NOT NULL UNIQUE,
        plan_id      TEXT NOT NULL DEFAULT 'free',
        tx_hash      TEXT,
        activated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at   TIMESTAMPTZ,
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS used_tx_hashes (
        tx_hash     TEXT PRIMARY KEY,
        user_email  TEXT NOT NULL,
        plan_id     TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `
    pgReady = true
  } catch (err) {
    console.error('[db] schema error:', err)
  }
}

// ─── Plan helpers ────────────────────────────────────────────────────────────

// In-memory fallback for plan state
const memPlans = new Map<string, { planId: string; expiresAt: Date | null }>()
const memUsedHashes = new Set<string>()

export async function getUserPlan(email: string): Promise<{ planId: string; expiresAt: Date | null }> {
  const sql = await getSql()
  if (sql) {
    try {
      const rows = await sql<{ plan_id: string; expires_at: string | null }>`
        SELECT plan_id, expires_at FROM user_plans WHERE user_email = ${email} LIMIT 1
      `
      if (rows.rows[0]) {
        return {
          planId:    rows.rows[0].plan_id,
          expiresAt: rows.rows[0].expires_at ? new Date(rows.rows[0].expires_at) : null,
        }
      }
    } catch (err) {
      console.error('[db] getUserPlan error:', err)
    }
  }
  return memPlans.get(email) ?? { planId: 'free', expiresAt: null }
}

export async function setUserPlan(
  email:    string,
  planId:   string,
  txHash:   string,
  months = 1,
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const sql = await getSql()
  if (sql) {
    try {
      await sql`
        INSERT INTO user_plans (user_email, plan_id, tx_hash, expires_at, updated_at)
        VALUES (${email}, ${planId}, ${txHash}, ${expiresAt.toISOString()}, NOW())
        ON CONFLICT (user_email)
        DO UPDATE SET
          plan_id      = EXCLUDED.plan_id,
          tx_hash      = EXCLUDED.tx_hash,
          expires_at   = EXCLUDED.expires_at,
          updated_at   = NOW()
      `
      return
    } catch (err) {
      console.error('[db] setUserPlan error:', err)
    }
  }
  memPlans.set(email, { planId, expiresAt })
}

export async function isTxHashUsed(txHash: string): Promise<boolean> {
  const sql = await getSql()
  if (sql) {
    try {
      const rows = await sql<{ tx_hash: string }>`
        SELECT tx_hash FROM used_tx_hashes WHERE tx_hash = ${txHash} LIMIT 1
      `
      return rows.rows.length > 0
    } catch (err) {
      console.error('[db] isTxHashUsed error:', err)
    }
  }
  return memUsedHashes.has(txHash)
}

export async function markTxHashUsed(txHash: string, email: string, planId: string): Promise<void> {
  const sql = await getSql()
  if (sql) {
    try {
      await sql`
        INSERT INTO used_tx_hashes (tx_hash, user_email, plan_id)
        VALUES (${txHash}, ${email}, ${planId})
        ON CONFLICT DO NOTHING
      `
      return
    } catch (err) {
      console.error('[db] markTxHashUsed error:', err)
    }
  }
  memUsedHashes.add(txHash)
}
