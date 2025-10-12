import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CART SAVE DEBUG API CALLED ===')
    
    // Test 1: Can we parse the request body?
    let body;
    try {
      body = await request.json()
      console.log('✓ Request body parsed successfully:', body)
    } catch (parseError: any) {
      console.error('✗ Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON body', details: parseError.message }, { status: 400 })
    }

    const { userEmail, items, totalAmount } = body

    // Test 2: Are required fields present?
    if (!userEmail) {
      console.log('✗ No userEmail provided')
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }
    console.log('✓ userEmail provided:', userEmail)

    // Test 3: Can we connect to the database?
    let db;
    try {
      console.log('Attempting database connection...')
      db = await getDb('electrotrack')
      console.log('✓ Database connection successful')
    } catch (dbError: any) {
      console.error('✗ Database connection failed:', dbError)
      return NextResponse.json({ error: 'Database connection failed', details: dbError.message }, { status: 500 })
    }

    // Test 4: Can we access the carts collection?
    let cartsCollection;
    try {
      cartsCollection = db.collection('carts')
      console.log('✓ Carts collection accessed')
    } catch (collectionError: any) {
      console.error('✗ Failed to access carts collection:', collectionError)
      return NextResponse.json({ error: 'Collection access failed', details: collectionError.message }, { status: 500 })
    }

    // Test 5: Can we perform the upsert operation?
    try {
      console.log('Attempting upsert operation...')
      const result = await cartsCollection.updateOne(
        { userEmail },
        {
          $set: {
            userEmail,
            items: items || [],
            totalAmount: totalAmount || 0,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      )
      console.log('✓ Upsert operation successful:', result)
      
      return NextResponse.json({
        success: true,
        message: 'Cart saved successfully',
        result: result,
        debug: true
      })
    } catch (upsertError: any) {
      console.error('✗ Upsert operation failed:', upsertError)
      return NextResponse.json({ error: 'Upsert operation failed', details: upsertError.message }, { status: 500 })
    }

  } catch (error: any) {
    console.error('=== UNEXPECTED ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json({
      error: 'Unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}