// Test API for Gmail verification
import { NextRequest, NextResponse } from 'next/server'
import { validateGmailForSignup } from '@/lib/gmail-address-verification'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        allowSignup: false,
        error: 'Email is required',
        details: 'Please provide an email address to verify'
      }, { status: 400 })
    }

    console.log('Testing Gmail verification for:', email)
    
    const verification = await validateGmailForSignup(email)
    
    console.log('Verification result:', verification)
    
    return NextResponse.json(verification)

  } catch (error: any) {
    console.error('Gmail verification test error:', error)
    return NextResponse.json({
      allowSignup: false,
      error: 'Verification failed',
      details: error.message || 'Internal server error'
    }, { status: 500 })
  }
}