import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const cartsCollection = db.collection('carts')

    const cart = await cartsCollection.findOne({ userEmail })

    if (!cart) {
      return NextResponse.json({
        items: [],
        totalAmount: 0,
        message: 'No cart found for user'
      })
    }

    return NextResponse.json({
      items: cart.items || [],
      totalAmount: cart.totalAmount || 0,
      updatedAt: cart.updatedAt
    })

  } catch (error) {
    console.error('Error retrieving cart:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve cart' },
      { status: 500 }
    )
  }
}