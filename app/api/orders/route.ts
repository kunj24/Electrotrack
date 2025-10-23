import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { z } from 'zod'
import { normalizeTracking, type OrderDocument } from '@/lib/models/order'

const orderSchema = z.object({
  userEmail: z.string().email('Valid email required'),
  items: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    category: z.string(),
    image: z.string().optional()
  })),
  shippingAddress: z.object({
    fullName: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    phone: z.string()
  }),
  paymentMethod: z.string(),
  total: z.number(),
  subtotal: z.number(),
  tax: z.number().optional(),
  shipping: z.number().optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional()
})

// Get orders for a user
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userEmail = url.searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    const db = await getDb()
    const orders = db.collection('orders')

    const userOrders = await orders.find({ userEmail })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      orders: userOrders
    })

  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate order data
    const validatedData = orderSchema.parse(body)

    const db = await getDb()
    const orders = db.collection('orders')

    // Generate order ID
    const orderId = `ORD-${Date.now()}`

    // Create order record with initial tracking
    const newOrder: OrderDocument = {
      orderId,
      ...validatedData,
      status: validatedData.status || 'placed',
      createdAt: new Date(),
      updatedAt: new Date(),
      // estimatedDelivery kept inside tracking.expectedDelivery
      tracking: {
        currentStatus: 'placed',
        expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        events: [
          {
            id: `evt_${Date.now()}`,
            type: 'order_placed',
            title: 'Order placed',
            at: new Date().toISOString(),
            status: 'success',
            actor: { role: 'system' }
          }
        ]
      }
    }

    const result = await orders.insertOne(newOrder)

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      orderId: newOrder.orderId,
      order: { ...newOrder, tracking: normalizeTracking(newOrder) }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Create order error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, trackingNumber } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }

    const db = await getDb()
    const orders = db.collection('orders')

    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber
    }

    const result = await orders.updateOne(
      { orderId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    })

  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
