import { NextRequest, NextResponse } from 'next/server'
import { validateAddressWithAPI } from '@/lib/enhanced-address-validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { fullName, phone, address, city, state, pincode } = body

    // Server-side validation
    if (!fullName || !phone || !address || !city || !state || !pincode) {
      return NextResponse.json({
        success: false,
        error: 'All address fields are required'
      }, { status: 400 })
    }

    // Enhanced validation with API integration
    const validationResult = await validateAddressWithAPI({
      fullName,
      phone,
      address,
      city,
      state,
      pincode
    })

    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        errors: validationResult.errors,
        message: 'Address validation failed'
      }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        locationInfo: validationResult.locationInfo,
        suggestions: validationResult.suggestions,
        standardized: validationResult.standardized
      }
    })

  } catch (error) {
    console.error('Address validation API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error during address validation'
    }, { status: 500 })
  }
}
