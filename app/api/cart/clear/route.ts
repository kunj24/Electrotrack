import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail } = body

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const cartsCollection = db.collection('carts')

    // Clear the cart by setting items to empty array
    const result = await cartsCollection.updateOne(
      { userEmail },
      {
        $set: {
          items: [],
          totalAmount: 0,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully',
      modifiedCount: result.modifiedCount
    })

  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}