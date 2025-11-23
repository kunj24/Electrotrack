import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function DELETE(
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

    // Try to find and delete by orderId first, then by MongoDB _id
    let result

    // First try to delete by orderId
    result = await orders.deleteOne({ orderId })

    if (result.deletedCount === 0 && ObjectId.isValid(orderId)) {
      // If not found, try by MongoDB _id
      result = await orders.deleteOne({ _id: new ObjectId(orderId) })
    }

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete order error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete order',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 })
    }

    const db = await getDb()
    const orders = db.collection('orders')

    // Prepare update data
    const updateData = {
      ...body,
      updatedAt: new Date().toISOString()
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id
    delete updateData.createdAt

    // Try to update by orderId first, then by MongoDB _id
    let result

    result = await orders.updateOne(
      { orderId },
      { $set: updateData }
    )

    if (result.matchedCount === 0 && ObjectId.isValid(orderId)) {
      result = await orders.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: updateData }
      )
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 })
    }

    // Fetch the updated order
    let updatedOrder = await orders.findOne({ orderId })
    if (!updatedOrder && ObjectId.isValid(orderId)) {
      updatedOrder = await orders.findOne({ _id: new ObjectId(orderId) })
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    })

  } catch (error: any) {
    console.error('Update order error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update order',
      details: error.message
    }, { status: 500 })
  }
}
