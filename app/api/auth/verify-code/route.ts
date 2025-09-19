// API for verifying code before signup
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({
        success: false,
        error: 'Email and verification code are required'
      }, { status: 400 })
    }

    const db = await getDb()
    
    // Find the verification code
    const verificationRecord = await db.collection('pre_signup_verification').findOne({
      email,
      code,
      verified: false,
      expiresAt: { $gt: new Date() } // Not expired
    })

    if (!verificationRecord) {
      // Increment attempts for rate limiting
      await db.collection('pre_signup_verification').updateOne(
        { email, code },
        { $inc: { attempts: 1 } }
      )

      return NextResponse.json({
        success: false,
        error: 'Invalid or expired verification code'
      }, { status: 400 })
    }

    // Check attempts limit
    if (verificationRecord.attempts >= 5) {
      return NextResponse.json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new verification code.'
      }, { status: 429 })
    }

    // Mark code as verified
    await db.collection('pre_signup_verification').updateOne(
      { email, code },
      { 
        $set: { 
          verified: true, 
          verifiedAt: new Date() 
        } 
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now complete your registration.',
      verificationToken: `verified_${email}_${Date.now()}`, // Temporary token for signup
      email: email,
      name: verificationRecord.name
    })

  } catch (error: any) {
    console.error('Code verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}