// Address operations API - Set default, verify, etc.
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Address from '@/lib/models/address'

// MongoDB connection helper
async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!)
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { userId, addressId, action } = body

    if (!userId || !addressId || !action) {
      return NextResponse.json({
        success: false,
        error: 'User ID, address ID, and action are required'
      }, { status: 400 })
    }

    const address = await Address.findOne({ userId, addressId })
    if (!address) {
      return NextResponse.json({
        success: false,
        error: 'Address not found'
      }, { status: 404 })
    }

    switch (action) {
      case 'set_default':
        await address.setAsDefault()
        return NextResponse.json({
          success: true,
          message: 'Address set as default',
          address
        })

      case 'mark_used':
        address.lastUsed = new Date()
        await address.save()
        return NextResponse.json({
          success: true,
          message: 'Address usage updated',
          address
        })

      case 'verify':
        address.isVerified = true
        await address.save()
        return NextResponse.json({
          success: true,
          message: 'Address verified',
          address
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error performing address operation:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to perform operation'
    }, { status: 500 })
  }
}
