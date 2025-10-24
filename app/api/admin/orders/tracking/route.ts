import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { addTrackingEvent, setOrderStatus, type OrderDocument, type OrderStatus } from '@/lib/models/order'

// Admin: POST /api/admin/orders/tracking
// Body supports operations:
// - { orderId, update: 'status', status: OrderStatus }
// - { orderId, update: 'event', event: { type, title, description?, at?, status?, actor?, meta? } }
// - { orderId, update: 'courier', courier: { name?, trackingNumber?, trackingUrl?, contact? } }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, update } = body || {}

    console.log('Admin tracking API - orderId:', orderId, 'update:', update)

    if (!orderId || !update) {
      return NextResponse.json({ error: 'orderId and update are required' }, { status: 400 })
    }

    const db = await getDb()
    const orders = db.collection('orders')

    // Try to find by orderId first, then by MongoDB _id
    let order = await orders.findOne({ orderId }) as OrderDocument | null

    if (!order && ObjectId.isValid(orderId)) {
      order = await orders.findOne({ _id: new ObjectId(orderId) }) as OrderDocument | null
    }

    if (!order) {
      console.log('Admin tracking - Order not found for:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const tracking = order.tracking || { currentStatus: 'placed', events: [] }
    const nowIso = new Date().toISOString()

    let updatedTracking = tracking
    let legacyStatusUpdate: any = {}

    if (update === 'status') {
      const status = body.status as OrderStatus
      if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 })

      updatedTracking = setOrderStatus(updatedTracking, status)
      // Also push an event reflecting the status change
      updatedTracking = addTrackingEvent(updatedTracking, {
        type:
          status === 'placed' ? 'order_placed' :
          status === 'confirmed' ? 'order_confirmed' :
          status === 'packed' ? 'packed' :
          status === 'shipped' ? 'shipped' :
          status === 'out_for_delivery' ? 'out_for_delivery' :
          status === 'delivered' ? 'delivered' :
          status === 'cancelled' ? 'cancelled' : 'custom',
        title: `Status updated to ${status.replaceAll('_',' ')}`,
        at: nowIso,
        status: status === 'cancelled' ? 'danger' : 'info',
        actor: { role: 'admin' },
      })

      // Keep legacy status aligned for existing dashboards
      legacyStatusUpdate.status =
        status === 'delivered' ? 'delivered' :
        status === 'shipped' || status === 'out_for_delivery' ? 'shipped' :
        status === 'cancelled' ? 'cancelled' : 'processing'
    } else if (update === 'event') {
      const { event } = body
      if (!event || !event.type || !event.title) {
        return NextResponse.json({ error: 'event with type and title required' }, { status: 400 })
      }
      updatedTracking = addTrackingEvent(updatedTracking, {
        ...event,
        at: event.at || nowIso,
        actor: event.actor || { role: 'admin' },
      })
    } else if (update === 'courier') {
      updatedTracking = {
        ...updatedTracking,
        courier: { ...updatedTracking.courier, ...(body.courier || {}) },
      }
    } else if (update === 'eta') {
      updatedTracking = {
        ...updatedTracking,
        expectedDelivery: body.expectedDelivery || nowIso,
      }
    } else {
      return NextResponse.json({ error: 'Unsupported update type' }, { status: 400 })
    }

    // Use the actual _id for the update operation, not the URL parameter
    const result = await orders.updateOne(
      { _id: order._id },
      {
        $set: {
          tracking: updatedTracking,
          updatedAt: new Date(),
          ...legacyStatusUpdate,
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin tracking POST error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
