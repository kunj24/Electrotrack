import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getDb } from '@/lib/mongodb'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

// Create payment order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = 'INR', userId, orderDetails } = body
    
    if (!amount || !userId) {
      return NextResponse.json({
        error: 'Amount and user ID are required'
      }, { status: 400 })
    }
    
    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    }
    
    const order = await razorpay.orders.create(options)
    
    // Store temporary order in database
    const db = await getDb()
    const tempOrders = db.collection('temp_orders')
    
    const orderRecord = {
      razorpayOrderId: order.id,
      userId,
      amount: amount,
      currency,
      status: 'created',
      orderDetails,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await tempOrders.insertOne(orderRecord)
    
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    })
    
  } catch (error: any) {
    console.error('Payment order creation error:', error)
    return NextResponse.json({
      error: 'Failed to create payment order',
      details: error.message
    }, { status: 500 })
  }
}

// Verify payment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId 
    } = body
    
    // Verify signature
    const text = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text.toString())
      .digest('hex')
    
    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({
        error: 'Invalid payment signature'
      }, { status: 400 })
    }
    
    // Update order status in database and create order record
    const db = await getDb()
    const orders = db.collection('orders')
    const tempOrders = db.collection('temp_orders') // Temporary orders from payment creation
    
    // Find the temporary order
    const tempOrder = await tempOrders.findOne({ 
      razorpayOrderId: razorpay_order_id,
      userId 
    })
    
    if (!tempOrder) {
      return NextResponse.json({
        error: 'Order not found'
      }, { status: 404 })
    }
    
    // Create permanent order record
    const orderRecord = {
      orderId: `ORD-${Date.now()}`,
      userEmail: userId,
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      items: tempOrder.orderDetails?.items || [],
      shippingAddress: tempOrder.orderDetails?.shippingAddress || {},
      total: tempOrder.amount,
      status: 'Processing',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await orders.insertOne(orderRecord)
    
    // Clean up temporary order
    await tempOrders.deleteOne({ _id: tempOrder._id })
    
    // Clear user's cart after successful payment
    const carts = db.collection('carts')
    await carts.deleteOne({ userEmail: userId })
    
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order: orderRecord
    })
    
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({
      error: 'Failed to verify payment',
      details: error.message
    }, { status: 500 })
  }
}
