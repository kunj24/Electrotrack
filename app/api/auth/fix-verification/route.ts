// Fix API to manually verify users who completed pre-signup verification
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
    
    // Check if user exists
    const user = await db.collection('users').findOne({ email })
    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Check if there's a verified pre-signup record
    const verifiedRecord = await db.collection('pre_signup_verification').findOne({
      email,
      verified: true
    })

    if (verifiedRecord) {
      // Update user to verified status
      const result = await db.collection('users').updateOne(
        { email },
        { 
          $set: { 
            emailVerified: true,
            emailVerifiedAt: new Date(),
            updatedAt: new Date()
          } 
        }
      )

      // Clean up pre-signup verification records
      await db.collection('pre_signup_verification').deleteMany({ email })

      return NextResponse.json({
        success: true,
        message: 'User verification status updated successfully',
        updated: result.modifiedCount > 0
      })
    } else {
      return NextResponse.json({
        error: 'No verified pre-signup record found for this email'
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Fix verification error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}