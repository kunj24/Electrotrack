import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
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

    let query: any = {}

    if (orderId) {
      console.log('Tracking API - Searching for orderId:', orderId)
      // Try multiple search strategies:
      // 1. Search by orderId field
      // 2. Search by MongoDB _id if it looks like ObjectId
      const searchQueries: any[] = [
        { orderId: orderId }
      ]

      // If orderId looks like a MongoDB ObjectId, also search by _id
      if (ObjectId.isValid(orderId)) {
        searchQueries.push({ _id: new ObjectId(orderId) })
      }

      query = { $or: searchQueries }
    } else if (trackingNumber) {
      console.log('Tracking API - Searching for trackingNumber:', trackingNumber)
      query = { 'tracking.courier.trackingNumber': trackingNumber }
    }

    console.log('Tracking API - Query:', JSON.stringify(query))
    const order = (await orders.findOne(query)) as OrderDocument | null
    if (!order) {
      console.log('Tracking API - Order not found')
      // Also log available order IDs for debugging
      const availableOrders = await orders.find({}, { projection: { orderId: 1, _id: 1 } }).limit(10).toArray()
      console.log('Tracking API - Available orders:', availableOrders.map(o => ({ orderId: o.orderId, _id: o._id.toString() })))

      return NextResponse.json({
        error: 'Order not found',
        debugInfo: {
          searchedOrderId: orderId,
          searchedTrackingNumber: trackingNumber,
          availableOrderIds: availableOrders.map(o => o.orderId)
        }
      }, { status: 404 })
    }

    console.log('Tracking API - Found order:', order.orderId)

    const tracking = normalizeTracking(order)

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      tracking,
      order: {
        _id: order._id.toString(),
        orderId: order.orderId,
        userEmail: order.userEmail,
        items: order.items || [],
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod || 'COD',
        total: order.total || 0,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        estimatedDelivery: (order as any).estimatedDelivery
      }
    })
  } catch (error: any) {
    console.error('Tracking GET error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
