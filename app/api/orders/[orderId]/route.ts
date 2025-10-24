import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 })
    }

    const db = await getDb()
    const orders = db.collection('orders')

    // Try to find by orderId first, then by MongoDB _id
    let order = await orders.findOne({ orderId })

    if (!order && ObjectId.isValid(orderId)) {
      order = await orders.findOne({ _id: new ObjectId(orderId) })
    }

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 })
    }

    // Return complete order details
    const orderDetails = {
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
      estimatedDelivery: order.estimatedDelivery,
      tracking: order.tracking
    }

    return NextResponse.json({
      success: true,
      order: orderDetails
    })

  } catch (error: any) {
    console.error('Order fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch order details',
      details: error.message
    }, { status: 500 })
  }
}
