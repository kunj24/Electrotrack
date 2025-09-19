// Gmail verification service to check if Gmail addresses actually exist

/**
 * Validates if a Gmail address is properly formatted
 */
export function isValidGmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i
  return emailRegex.test(email.trim())
}

/**
 * Checks if Gmail address actually exists by attempting SMTP verification
 * This is a simulation - in production you'd use real SMTP verification
 */
export async function verifyGmailExists(email: string): Promise<{
  exists: boolean
  error?: string
  details?: string
}> {
  try {
    // First validate format
    if (!isValidGmailFormat(email)) {
      return {
        exists: false,
        error: 'Invalid Gmail format',
        details: 'Email must be a valid Gmail address (@gmail.com)'
      }
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()

    // List of known fake/test Gmail patterns that should be rejected
    const fakePatterns = [
      /^test.*@gmail\.com$/,
      /^fake.*@gmail\.com$/,
      /^dummy.*@gmail\.com$/,
      /^invalid.*@gmail\.com$/,
      /^notreal.*@gmail\.com$/,
      /^example.*@gmail\.com$/,
      /^demo.*@gmail\.com$/,
      /^sample.*@gmail\.com$/,
      /^[a-z]{1,3}@gmail\.com$/, // Very short usernames like a@gmail.com, ab@gmail.com
      /^[0-9]+@gmail\.com$/, // Only numbers
      /^(.)\1{5,}@gmail\.com$/ // Repeated characters like aaaaaa@gmail.com
    ]

    // Check against fake patterns
    const isFakePattern = fakePatterns.some(pattern => pattern.test(normalizedEmail))
    if (isFakePattern) {
      return {
        exists: false,
        error: 'Invalid Gmail address',
        details: 'This Gmail address appears to be fake or invalid. Please use a real Gmail account.'
      }
    }

    // Simulate SMTP verification by checking against a list of known valid patterns
    // In production, you would implement actual SMTP verification here
    return await simulateGmailVerification(normalizedEmail)

  } catch (error) {
    console.error('Gmail verification error:', error)
    return {
      exists: false,
      error: 'Verification failed',
      details: 'Unable to verify Gmail address. Please try again.'
    }
  }
}

/**
 * Simulates Gmail verification process
 * In production, this would use real SMTP verification or Google's APIs
 */
async function simulateGmailVerification(email: string): Promise<{
  exists: boolean
  error?: string
  details?: string
}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // For demonstration, we'll consider some patterns as "verified"
  // In real implementation, you'd use SMTP verification or Gmail API
  
  const username = email.split('@')[0]
  
  // Consider emails valid if they:
  // 1. Have reasonable length (6+ characters)
  // 2. Use common name patterns
  // 3. Don't match obviously fake patterns
  
  if (username.length < 6) {
    return {
      exists: false,
      error: 'Gmail address not found',
      details: 'This Gmail address does not exist. Please check the spelling or use a different Gmail account.'
    }
  }

  // Check for realistic username patterns
  const hasReasonablePattern = (
    /[a-z].*[a-z]/.test(username) || // Contains multiple letters
    /[a-z].*[0-9]/.test(username) || // Contains letters and numbers
    /[a-z].*\..*[a-z]/.test(username) // Contains letters with dots
  )

  if (!hasReasonablePattern) {
    return {
      exists: false,
      error: 'Gmail address not found',
      details: 'This Gmail address does not exist. Please use a valid Gmail account.'
    }
  }

  // For demo purposes, we'll reject some specific fake emails
  const knownFakeEmails = [
    'fakeuser@gmail.com',
    'notreal@gmail.com',
    'invalid@gmail.com',
    'doesnotexist@gmail.com',
    'testing123@gmail.com'
  ]

  if (knownFakeEmails.includes(email)) {
    return {
      exists: false,
      error: 'Gmail address not found',
      details: 'This Gmail address does not exist. Please use a valid Gmail account.'
    }
  }

  // If it passes all checks, consider it valid
  return {
    exists: true,
    details: 'Gmail address verified successfully'
  }
}

/**
 * Comprehensive Gmail validation including existence check
 */
export async function validateGmailAccount(email: string): Promise<{
  isValid: boolean
  exists?: boolean
  error?: string
  details?: string
}> {
  // First check format
  if (!isValidGmailFormat(email)) {
    return {
      isValid: false,
      error: 'Invalid email format',
      details: 'Please enter a valid Gmail address (@gmail.com)'
    }
  }

  // Then check existence
  const verification = await verifyGmailExists(email)
  
  return {
    isValid: verification.exists,
    exists: verification.exists,
    error: verification.error,
    details: verification.details
  }
}

/**
 * Real SMTP-based Gmail verification (commented out - requires server-side implementation)
 * This is how you would implement real verification in production
 */
/*
export async function realGmailVerification(email: string): Promise<{
  exists: boolean
  error?: string
}> {
  try {
    // This would require a server-side implementation
    // using Node.js SMTP libraries like 'net' or 'smtp-connection'
    
    const response = await fetch('/api/verify-gmail-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    
    return await response.json()
  } catch (error) {
    return {
      exists: false,
      error: 'Verification failed'
    }
  }
}
*/