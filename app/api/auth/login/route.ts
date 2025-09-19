import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    
    const db = await getDb()
    const users = db.collection('users')
    
    // Find user by email
    const user = await users.findOne({ 
      email: validatedData.email,
      isActive: true 
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Update last login
    await users.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    )
    
    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      businessType: user.businessType,
      emailVerified: user.emailVerified, // Include verification status
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      lastLogin: new Date()
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    }, { status: 200 })
    
  } catch (error: any) {
    console.error('Login error:', error)
    
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
