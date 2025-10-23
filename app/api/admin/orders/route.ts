import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()

    // Get orders from database
    const orders = await db.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        _id: order._id.toString(),
        orderId: order.orderId,
        userEmail: order.userEmail,
        status: order.status || 'Processing',
        total: order.total || 0,
        items: order.items || [],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        tracking: order.tracking // Include tracking info if exists
      }))
    })

  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
