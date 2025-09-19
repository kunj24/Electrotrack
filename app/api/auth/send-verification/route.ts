// Email Verification API - Send verification email
import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail, generateVerificationToken } from '@/lib/email-service'
import { getDb } from '@/lib/mongodb'

// Store verification tokens in database with expiration
async function storeVerificationToken(email: string, token: string) {
  try {
    const db = await getDb()
    
    // Remove any existing tokens for this email
    await db.collection('verification_tokens').deleteMany({ email })
    
    // Store new token with 24-hour expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    await db.collection('verification_tokens').insertOne({
      email,
      token,
      expiresAt,
      createdAt: new Date(),
      verified: false
    })
    
    return true
  } catch (error) {
    console.error('Failed to store verification token:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email and name are required'
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

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Store token in database
    const tokenStored = await storeVerificationToken(email, verificationToken)
    if (!tokenStored) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate verification token'
      }, { status: 500 })
    }

    // Get base URL for verification link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   request.nextUrl.origin || 
                   'http://localhost:3000'

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email,
      name,
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
      message: 'Verification email sent successfully',
      messageId: emailResult.messageId
    })

  } catch (error: any) {
    console.error('Send verification email error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET endpoint to check if email needs verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter is required'
      }, { status: 400 })
    }

    const db = await getDb()
    
    // Check if user exists and is verified
    const user = await db.collection('users').findOne({ email })
    
    if (!user) {
      return NextResponse.json({
        exists: false,
        verified: false,
        needsVerification: true
      })
    }

    const isVerified = user.emailVerified === true

    return NextResponse.json({
      exists: true,
      verified: isVerified,
      needsVerification: !isVerified
    })

  } catch (error: any) {
    console.error('Check verification status error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}