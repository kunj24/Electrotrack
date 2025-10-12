import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching user count...')
    const db = await getDb()
    const userCount = await db.collection('users').countDocuments()
    console.log('User count:', userCount)
    return NextResponse.json({ count: userCount })
  } catch (error) {
    console.error('Error fetching user count:', error)
    return NextResponse.json({ error: 'Failed to fetch user count' }, { status: 500 })
  }
}