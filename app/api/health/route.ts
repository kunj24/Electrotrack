import { NextResponse } from 'next/server'
import { ping, getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ping()
    const db = await getDb()
    return NextResponse.json({ ok: true, db: db.databaseName, serverTime: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
