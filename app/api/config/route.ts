import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB
  
  return NextResponse.json({
    mongodb_configured: !!uri,
    database_name: dbName || 'not_set',
    connection_string_format: uri ? 'Valid format' : 'Missing MONGODB_URI',
    environment_status: {
      MONGODB_URI: uri ? '✅ Set' : '❌ Missing',
      MONGODB_DB: dbName ? '✅ Set' : '⚠️ Optional but recommended'
    },
    next_steps: uri ? [
      'MongoDB connection configured',
      'Visit /api/health to test actual connection',
      'Try registering a user at /signup'
    ] : [
      'Set MONGODB_URI in .env.local',
      'Choose between MongoDB Atlas (cloud) or local MongoDB',
      'See README-BACKEND.md for detailed setup instructions'
    ]
  })
}

export async function POST(request: NextRequest) {
  try {
    const { testConnection } = await request.json()
    
    if (testConnection) {
      // This will test if we can import and use the MongoDB connection
      const { ping } = await import('@/lib/mongodb')
      
      try {
        await ping()
        return NextResponse.json({
          success: true,
          message: 'MongoDB connection successful!',
          status: 'Connected and working'
        })
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message,
          suggestion: 'Check if MongoDB is running and connection string is correct'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
