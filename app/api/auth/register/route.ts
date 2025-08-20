import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessType: z.string().optional().default('electronics')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
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
    
    // Create user
    const newUser = {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      businessType: validatedData.businessType,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }
    
    const result = await users.insertOne(newUser)
    
    // Return user data without password
    const userResponse = {
      id: result.insertedId,
      name: newUser.name,
      email: newUser.email,
      businessType: newUser.businessType,
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
