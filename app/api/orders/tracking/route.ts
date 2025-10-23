import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { normalizeTracking, type OrderDocument } from '@/lib/models/order'

// GET /api/orders/tracking?orderId=... | trackingNumber=...
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get('orderId')
    const trackingNumber = url.searchParams.get('trackingNumber')

    if (!orderId && !trackingNumber) {
      return NextResponse.json({ error: 'orderId or trackingNumber is required' }, { status: 400 })
    }

    const db = await getDb()
    const orders = db.collection('orders')

    const query: any = {}
    if (orderId) query.orderId = orderId
    if (trackingNumber) query['tracking.courier.trackingNumber'] = trackingNumber

    const order = (await orders.findOne(query)) as OrderDocument | null
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const tracking = normalizeTracking(order)

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      tracking,
    })
  } catch (error: any) {
    console.error('Tracking GET error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
