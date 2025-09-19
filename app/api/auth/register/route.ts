import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { validateGmailForSignup } from '@/lib/gmail-address-verification'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  emailVerified: z.boolean().optional().default(false),
  verificationToken: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    // Basic Gmail format check only (don't block accounts)
    if (!validatedData.email.toLowerCase().endsWith('@gmail.com')) {
      return NextResponse.json({
        error: 'Only Gmail addresses are supported',
        details: 'Please use a valid @gmail.com address',
        type: 'invalid_format'
      }, { status: 400 })
    }
    
    console.log('Creating account for Gmail address:', validatedData.email)
    
    const db = await getDb()
    const users = db.collection('users')
    
    // Check if user already exists
    const existingUser = await users.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }
    
    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds)
    
    // Check if email was pre-verified
    let emailVerificationStatus = {
      emailVerified: validatedData.emailVerified || false,
      emailVerifiedAt: validatedData.emailVerified ? new Date() : null
    }
    
    // If this is a pre-verified registration, validate the verification token
    if (validatedData.emailVerified && validatedData.verificationToken) {
      const verificationRecord = await db.collection('pre_signup_verification').findOne({
        email: validatedData.email,
        verified: true,
        verifiedAt: { $exists: true }
      })
      
      if (!verificationRecord) {
        return NextResponse.json({
          error: 'Invalid verification. Please verify your email first.',
          type: 'verification_required'
        }, { status: 400 })
      }
      
      console.log('✅ Pre-verified email confirmed for:', validatedData.email)
    }
    
    // Create user with proper email verification status
    const newUser = {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      businessType: 'electronics', // Default to electronics
      ...emailVerificationStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }
    
    const result = await users.insertOne(newUser)
    
    // Clean up pre-signup verification record if it was used
    if (validatedData.emailVerified && validatedData.verificationToken) {
      await db.collection('pre_signup_verification').deleteMany({
        email: validatedData.email
      })
      console.log('🧹 Cleaned up pre-signup verification records for:', validatedData.email)
    }
    
    // Return user data without password
    const userResponse = {
      id: result.insertedId,
      name: newUser.name,
      email: newUser.email,
      businessType: newUser.businessType,
      emailVerified: newUser.emailVerified,
      createdAt: newUser.createdAt
    }
    
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
