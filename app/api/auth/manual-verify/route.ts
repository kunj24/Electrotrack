// Manual fix for specific user verification
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    const db = await getDb()
    
    // Force update user verification status
    const result = await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { 
        $set: { 
          emailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    )

    // Clean up any pre-signup verification records
    await db.collection('pre_signup_verification').deleteMany({ 
      email: email.toLowerCase() 
    })

    if (result.matchedCount === 0) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Verification status manually updated for ${email}`,
      updated: result.modifiedCount > 0
    })

  } catch (error: any) {
    console.error('Manual fix error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}