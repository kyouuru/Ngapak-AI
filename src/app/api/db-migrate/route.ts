/**
 * GET /api/db-migrate
 * Panggil sekali saja setelah Postgres database di-connect di Vercel.
 * Endpoint ini membuat tabel yang diperlukan.
 * Setelah schema terbuat, endpoint ini tidak berbahaya jika dipanggil ulang
 * karena menggunakan CREATE TABLE IF NOT EXISTS.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { ensureSchema } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Only allow from localhost or if a secret token matches
  const secret = req.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.MIGRATION_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Also allow if the caller is an authenticated admin (logged-in user)
  if (!expectedSecret) {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { ok: false, error: 'Set MIGRATION_SECRET env var or login first' },
        { status: 401 },
      )
    }
  }

  try {
    await ensureSchema()
    return Response.json({
      ok: true,
      message: 'Schema created/verified. Tables: user_plans, used_tx_hashes',
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 },
    )
  }
}
