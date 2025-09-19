import { NextRequest, NextResponse } from 'next/server'
import { validateGmailAccount } from '@/lib/gmail-verification'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email is required',
          details: 'Please provide an email address to verify'
        },
        { status: 400 }
      )
    }

    // Validate and verify Gmail account
    const result = await validateGmailAccount(email)

    if (!result.isValid) {
      return NextResponse.json(
        { 
          success: false,
          exists: result.exists,
          error: result.error || 'Gmail verification failed',
          details: result.details || 'Please use a valid Gmail account'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      exists: true,
      message: 'Gmail address verified successfully',
      details: result.details,
      email: email.trim().toLowerCase()
    })

  } catch (error) {
    console.error('Gmail verification API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Verification service error',
        details: 'Unable to verify Gmail address at this time. Please try again.'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const result = await validateGmailAccount(email)
    
    return NextResponse.json({
      success: result.isValid,
      exists: result.exists,
      error: result.error,
      details: result.details,
      email: email.trim().toLowerCase()
    })

  } catch (error) {
    console.error('Gmail verification GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}