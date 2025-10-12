import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    console.log('Cart save API called')
    const body = await request.json()
    console.log('Request body:', body)
    const { userEmail, items, totalAmount } = body

    if (!userEmail) {
      console.log('No userEmail provided')
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    console.log('Getting database connection')
    const db = await getDb('electrotrack')
    console.log('Database connected, getting carts collection')
    const cartsCollection = db.collection('carts')

    console.log('Performing upsert operation for user:', userEmail)
    // Upsert the cart (update if exists, create if not)
    // Set `userId` alongside `userEmail` to remain compatible with older indexes
    // and avoid E11000 duplicate key errors when a unique index on userId exists.
    try {
      const result = await cartsCollection.updateOne(
        { userEmail },
        {
          $set: {
            userEmail,
            // Keep a duplicate userId field for backward compatibility with older code/indexes
            userId: userEmail,
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

      console.log('Cart save result:', result)
      return NextResponse.json({
        success: true,
        message: 'Cart saved successfully',
        cartId: result.upsertedId
      })
    } catch (err: any) {
      // Handle duplicate-key specifically to provide a clearer message
      if (err && err.code === 11000) {
        console.error('Duplicate key error while saving cart (likely userId index conflict):', err)
        return NextResponse.json({
          error: 'Cart save failed due to existing conflicting index (duplicate key).',
          details: err.message
        }, { status: 500 })
      }

      throw err
    }

  } catch (error) {
    console.error('Error saving cart:', error)
    return NextResponse.json(
      { error: 'Failed to save cart' },
      { status: 500 }
    )
  }
}