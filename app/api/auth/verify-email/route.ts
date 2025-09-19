// Email Verification API - Verify email token
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { sendWelcomeEmail } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Verification token is required'
      }, { status: 400 })
    }

    const db = await getDb()
    
    // Find the verification token
    const verificationRecord = await db.collection('verification_tokens').findOne({
      token,
      verified: false,
      expiresAt: { $gt: new Date() } // Not expired
    })

    if (!verificationRecord) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired verification token'
      }, { status: 400 })
    }

    // Mark token as verified
    await db.collection('verification_tokens').updateOne(
      { token },
      { 
        $set: { 
          verified: true, 
          verifiedAt: new Date() 
        } 
      }
    )

    // Update user's email verification status
    const updateResult = await db.collection('users').updateOne(
      { email: verificationRecord.email },
      { 
        $set: { 
          emailVerified: true,
          emailVerifiedAt: new Date()
        } 
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found. Please complete registration first.'
      }, { status: 404 })
    }

    // Get user details for welcome email
    const user = await db.collection('users').findOne({ 
      email: verificationRecord.email 
    })

    // Send welcome email
    if (user) {
      try {
        await sendWelcomeEmail(user.email, user.name || user.firstName || 'Valued Customer')
      } catch (welcomeError) {
        console.error('Failed to send welcome email:', welcomeError)
        // Don't fail the verification process if welcome email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        email: verificationRecord.email,
        verified: true
      }
    })

  } catch (error: any) {
    console.error('Email verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST endpoint for manual verification check
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Verification token is required'
      }, { status: 400 })
    }

    const db = await getDb()
    
    // Check token status
    const verificationRecord = await db.collection('verification_tokens').findOne({
      token
    })

    if (!verificationRecord) {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification token',
        status: 'invalid'
      }, { status: 400 })
    }

    // Check if expired
    if (verificationRecord.expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Verification token has expired',
        status: 'expired'
      }, { status: 400 })
    }

    // Check if already verified
    if (verificationRecord.verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        status: 'already_verified',
        email: verificationRecord.email
      })
    }

    return NextResponse.json({
      success: true,
      status: 'pending',
      email: verificationRecord.email,
      expiresAt: verificationRecord.expiresAt
    })

  } catch (error: any) {
    console.error('Verification check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}