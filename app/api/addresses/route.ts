// Address management API - Flipkart-style address CRUD operations
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Address, { IAddress } from '@/lib/models/address'
import { validateAddressWithAPI } from '@/lib/enhanced-address-validation'

// MongoDB connection helper
async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!)
  }
}

// GET - Fetch user addresses
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const addressId = searchParams.get('addressId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Fetch specific address
    if (addressId) {
      const address = await Address.findOne({ userId, addressId })
      if (!address) {
        return NextResponse.json({
          success: false,
          error: 'Address not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        address
      })
    }

    // Fetch all addresses for user
    const addresses = await (Address as any).findByUserId(userId)

    return NextResponse.json({
      success: true,
      addresses,
      count: addresses.length
    })

  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch addresses'
    }, { status: 500 })
  }
}

// POST - Create new address
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { userId, addressData } = body

    if (!userId || !addressData) {
      return NextResponse.json({
        success: false,
        error: 'User ID and address data are required'
      }, { status: 400 })
    }

    // Validate address using enhanced validation
    const validation = await validateAddressWithAPI({
      fullName: addressData.fullName,
      phone: addressData.phoneNumber,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state || 'Gujarat',
      pincode: addressData.pincode
    })

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Address validation failed',
        validationErrors: validation.errors
      }, { status: 400 })
    }

    // Use standardized address if available
    const finalAddressData = validation.standardized
      ? {
          ...addressData,
          address: validation.standardized.address,
          city: validation.standardized.city,
          pincode: validation.standardized.pincode
        }
      : addressData

    // Check if this is the user's first address (make it default)
    const existingCount = await Address.countDocuments({ userId })

    const newAddress = new Address({
      userId,
      ...finalAddressData,
      phoneNumber: finalAddressData.phoneNumber || finalAddressData.phone,
      isDefault: existingCount === 0 || addressData.isDefault,
      locationInfo: validation.locationInfo ? {
        district: validation.locationInfo.district,
        area: validation.locationInfo.area,
        deliveryAvailable: true,
        estimatedDeliveryDays: getDeliveryEstimate(validation.locationInfo.district)
      } : undefined,
      isVerified: true // Mark as verified since it passed validation
    })

    await newAddress.save()

    return NextResponse.json({
      success: true,
      address: newAddress,
      message: 'Address saved successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create address'
    }, { status: 500 })
  }
}

// PUT - Update existing address
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { userId, addressId, addressData } = body

    if (!userId || !addressId || !addressData) {
      return NextResponse.json({
        success: false,
        error: 'User ID, address ID, and address data are required'
      }, { status: 400 })
    }

    // Find existing address
    const existingAddress = await Address.findOne({ userId, addressId })
    if (!existingAddress) {
      return NextResponse.json({
        success: false,
        error: 'Address not found'
      }, { status: 404 })
    }

    // Validate updated address
    const validation = await validateAddressWithAPI({
      fullName: addressData.fullName,
      phone: addressData.phoneNumber || addressData.phone,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state || 'Gujarat',
      pincode: addressData.pincode
    })

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Address validation failed',
        validationErrors: validation.errors
      }, { status: 400 })
    }

    // Update address with validated data
    const updateData = {
      ...addressData,
      phoneNumber: addressData.phoneNumber || addressData.phone,
      updatedAt: new Date()
    }

    if (validation.standardized) {
      updateData.address = validation.standardized.address
      updateData.city = validation.standardized.city
      updateData.pincode = validation.standardized.pincode
    }

    if (validation.locationInfo) {
      updateData.locationInfo = {
        district: validation.locationInfo.district,
        area: validation.locationInfo.area,
        deliveryAvailable: true,
        estimatedDeliveryDays: getDeliveryEstimate(validation.locationInfo.district)
      }
    }

    Object.assign(existingAddress, updateData)
    await existingAddress.save()

    return NextResponse.json({
      success: true,
      address: existingAddress,
      message: 'Address updated successfully'
    })

  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update address'
    }, { status: 500 })
  }
}

// DELETE - Remove address
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const addressId = searchParams.get('addressId')

    if (!userId || !addressId) {
      return NextResponse.json({
        success: false,
        error: 'User ID and address ID are required'
      }, { status: 400 })
    }

    // Find and remove address
    const address = await Address.findOneAndDelete({ userId, addressId })

    if (!address) {
      return NextResponse.json({
        success: false,
        error: 'Address not found'
      }, { status: 404 })
    }

    // If deleted address was default, make another address default
    if (address.isDefault) {
      const remainingAddresses = await Address.find({ userId }).sort({ lastUsed: -1, createdAt: -1 })
      if (remainingAddresses.length > 0) {
        remainingAddresses[0].isDefault = true
        await remainingAddresses[0].save()
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete address'
    }, { status: 500 })
  }
}

// Helper function to estimate delivery days based on location
function getDeliveryEstimate(district?: string): number {
  const majorCities = ['ahmedabad', 'surat', 'vadodara', 'rajkot', 'gandhinagar']
  const districtLower = district?.toLowerCase() || ''

  if (majorCities.some(city => districtLower.includes(city))) {
    return 2 // Express delivery for major cities
  }

  return 5 // Standard delivery for other areas
}
