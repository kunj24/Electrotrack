import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  try {
    // Test all collections that will be used
    const db = await getDb()
    
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    // Test a simple operation
    const ping = await db.command({ ping: 1 })
    
    return NextResponse.json({
      success: true,
      database: db.databaseName,
      mongodb_connected: true,
      ping_result: ping,
      existing_collections: collectionNames,
      message: 'MongoDB is working correctly!'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      mongodb_connected: false,
      error: error.message,
      suggestion: 'Please ensure MongoDB is running and MONGODB_URI is correct in .env.local'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    const db = await getDb()
    
    if (action === 'setup') {
      // Create indexes for better performance
      const users = db.collection('users')
      
      // Create unique index on email
      await users.createIndex({ email: 1 }, { unique: true })
      
      // Create index on createdAt for sorting
      await users.createIndex({ createdAt: -1 })
      
      return NextResponse.json({
        success: true,
        message: 'Database setup completed successfully',
        indexes_created: ['email (unique)', 'createdAt']
      })
    }
    
    if (action === 'count_users') {
      const users = db.collection('users')
      const count = await users.countDocuments()
      const recentUsers = await users.find({}, { 
        projection: { password: 0 }, 
        sort: { createdAt: -1 }, 
        limit: 5 
      }).toArray()
      
      return NextResponse.json({
        success: true,
        total_users: count,
        recent_users: recentUsers
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    }, { status: 400 })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
