// Debug API to check user verification status
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({
        error: 'Email parameter is required'
      }, { status: 400 })
    }

    const db = await getDb()
    
    // Check user verification status
    const user = await db.collection('users').findOne(
      { email },
      { projection: { password: 0 } } // Exclude password from result
    )

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Check pre-signup verification records
    const preSignupRecords = await db.collection('pre_signup_verification')
      .find({ email })
      .toArray()

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt
      },
      preSignupVerificationRecords: preSignupRecords,
      debug: {
        userEmailVerified: user.emailVerified,
        userEmailVerifiedAt: user.emailVerifiedAt,
        preSignupRecordsCount: preSignupRecords.length
      }
    })

  } catch (error: any) {
    console.error('Debug verification error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}