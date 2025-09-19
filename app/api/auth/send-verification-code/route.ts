// API for sending verification code before signup
import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationCode, generateVerificationCode } from '@/lib/pre-signup-verification'
import { getDb } from '@/lib/mongodb'

// Store verification codes temporarily (before account creation)
async function storeVerificationCode(email: string, code: string, name: string) {
  try {
    const db = await getDb()
    
    // Remove any existing codes for this email
    await db.collection('pre_signup_verification').deleteMany({ email })
    
    // Store new code with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    await db.collection('pre_signup_verification').insertOne({
      email,
      code,
      name,
      expiresAt,
      createdAt: new Date(),
      verified: false,
      attempts: 0
    })
    
    return true
  } catch (error) {
    console.error('Failed to store verification code:', error)
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
        error: 'Only Gmail addresses are supported'
      }, { status: 400 })
    }

    // Check if user already exists
    const db = await getDb()
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists with this email'
      }, { status: 400 })
    }

    // Check rate limiting - max 3 codes per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCodes = await db.collection('pre_signup_verification').countDocuments({
      email,
      createdAt: { $gt: oneHourAgo }
    })

    if (recentCodes >= 3) {
      return NextResponse.json({
        success: false,
        error: 'Too many verification attempts. Please wait an hour before requesting another code.'
      }, { status: 429 })
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()

    // Store code in database
    const codeStored = await storeVerificationCode(email, verificationCode, name)
    if (!codeStored) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate verification code'
      }, { status: 500 })
    }

    // Send verification code email
    const emailResult = await sendVerificationCode(email, name, verificationCode)

    if (!emailResult.success) {
      // Clean up stored code if email failed
      await db.collection('pre_signup_verification').deleteMany({ email, code: verificationCode })
      
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send verification code',
        details: 'If this Gmail address doesn\'t exist, you won\'t receive the email.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      email: email,
      expiresInMinutes: 10
    })

  } catch (error: any) {
    console.error('Send verification code error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}