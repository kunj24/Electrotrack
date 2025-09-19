// Resend Verification Email API
import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail, generateVerificationToken } from '@/lib/email-service'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Check if it's a Gmail address
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return NextResponse.json({
        success: false,
        error: 'Only Gmail addresses are supported for verification'
      }, { status: 400 })
    }

    const db = await getDb()
    
    // Check if user exists
    const user = await db.collection('users').findOne({ email })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found. Please sign up first.'
      }, { status: 404 })
    }

    // Check if already verified
    if (user.emailVerified === true) {
      return NextResponse.json({
        success: false,
        error: 'Email is already verified'
      }, { status: 400 })
    }

    // Check for rate limiting - don't allow more than 3 emails per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentTokens = await db.collection('verification_tokens').countDocuments({
      email,
      createdAt: { $gt: oneHourAgo }
    })

    if (recentTokens >= 3) {
      return NextResponse.json({
        success: false,
        error: 'Too many verification emails sent. Please wait an hour before requesting another.'
      }, { status: 429 })
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken()

    // Remove old tokens for this email
    await db.collection('verification_tokens').deleteMany({ 
      email,
      verified: false 
    })

    // Store new token
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    await db.collection('verification_tokens').insertOne({
      email,
      token: verificationToken,
      expiresAt,
      createdAt: new Date(),
      verified: false,
      resent: true
    })

    // Get base URL for verification link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   request.nextUrl.origin || 
                   'http://localhost:3000'

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email,
      user.name || user.firstName || 'User',
      verificationToken,
      baseUrl
    )

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send verification email'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email resent successfully',
      messageId: emailResult.messageId
    })

  } catch (error: any) {
    console.error('Resend verification email error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}