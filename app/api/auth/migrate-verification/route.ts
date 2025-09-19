// Migration script to fix verification status for existing users
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const db = await getDb()
    
    // Find all users who are not verified but have verified pre-signup records
    const usersToFix = await db.collection('users').aggregate([
      {
        $match: {
          emailVerified: { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'pre_signup_verification',
          localField: 'email',
          foreignField: 'email',
          as: 'verificationRecords'
        }
      },
      {
        $match: {
          'verificationRecords.verified': true
        }
      }
    ]).toArray()

    let fixedCount = 0
    
    for (const user of usersToFix) {
      // Update user verification status
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
            updatedAt: new Date()
          }
        }
      )
      
      // Clean up pre-signup verification records
      await db.collection('pre_signup_verification').deleteMany({
        email: user.email
      })
      
      fixedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Fixed verification status for ${fixedCount} users`,
      fixedUsers: usersToFix.map(u => ({ email: u.email, name: u.name }))
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error.message
    }, { status: 500 })
  }
}