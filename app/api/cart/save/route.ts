import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, items, totalAmount } = body

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const cartsCollection = db.collection('carts')

    // Upsert the cart (update if exists, create if not)
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

    return NextResponse.json({
      success: true,
      message: 'Cart saved successfully',
      cartId: result.upsertedId
    })

  } catch (error) {
    console.error('Error saving cart:', error)
    return NextResponse.json(
      { error: 'Failed to save cart' },
      { status: 500 }
    )
  }
}