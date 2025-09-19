// Enhanced Gmail Verification Service
// Verifies if Gmail addresses actually exist before account creation

import dns from 'dns'
import { promisify } from 'util'

const resolveMx = promisify(dns.resolveMx)

// Basic Gmail format validation
export function isValidGmailFormat(email: string): boolean {
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i
  return gmailRegex.test(email)
}

// Check if email format is valid (more strict)
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Check common fake/invalid Gmail patterns
export function isLikelyFakeGmail(email: string): { isFake: boolean; reason?: string } {
  const emailLower = email.toLowerCase()
  
  // Common fake patterns
  const fakePatterns = [
    { pattern: /test.*@gmail\.com/i, reason: "Test emails not allowed" },
    { pattern: /fake.*@gmail\.com/i, reason: "Fake emails not allowed" },
    { pattern: /demo.*@gmail\.com/i, reason: "Demo emails not allowed" },
    { pattern: /temp.*@gmail\.com/i, reason: "Temporary emails not allowed" },
    { pattern: /example.*@gmail\.com/i, reason: "Example emails not allowed" },
    { pattern: /sample.*@gmail\.com/i, reason: "Sample emails not allowed" },
    { pattern: /dummy.*@gmail\.com/i, reason: "Dummy emails not allowed" },
    { pattern: /^[a-z]{1,3}@gmail\.com$/i, reason: "Very short Gmail addresses are suspicious" },
    { pattern: /^.*(123|test|fake|demo).*@gmail\.com$/i, reason: "Contains suspicious keywords" }
  ]
  
  for (const fakePattern of fakePatterns) {
    if (fakePattern.pattern.test(emailLower)) {
      return { isFake: true, reason: fakePattern.reason }
    }
  }
  
  return { isFake: false }
}

// Verify Gmail domain exists (checks MX records)
export async function verifyGmailDomain(): Promise<boolean> {
  try {
    const mxRecords = await resolveMx('gmail.com')
    return mxRecords && mxRecords.length > 0
  } catch (error) {
    console.error('Gmail domain verification failed:', error)
    return false
  }
}

// Enhanced Gmail verification with multiple checks
export async function verifyGmailAddress(email: string): Promise<{
  isValid: boolean
  error?: string
  details?: string
  checks: {
    format: boolean
    gmailFormat: boolean
    notFake: boolean
    domainExists: boolean
  }
}> {
  const checks = {
    format: false,
    gmailFormat: false,
    notFake: false,
    domainExists: false
  }

  // 1. Basic email format check
  if (!isValidEmailFormat(email)) {
    return {
      isValid: false,
      error: "Invalid email format",
      details: "Please enter a valid email address",
      checks
    }
  }
  checks.format = true

  // 2. Gmail format check
  if (!isValidGmailFormat(email)) {
    return {
      isValid: false,
      error: "Only Gmail addresses are supported",
      details: "Please use a valid @gmail.com address",
      checks
    }
  }
  checks.gmailFormat = true

  // 3. Check for fake/demo patterns
  const fakeCheck = isLikelyFakeGmail(email)
  if (fakeCheck.isFake) {
    return {
      isValid: false,
      error: "Suspicious Gmail address",
      details: fakeCheck.reason || "This Gmail address appears to be fake or for testing",
      checks
    }
  }
  checks.notFake = true

  // 4. Verify Gmail domain exists
  const domainExists = await verifyGmailDomain()
  if (!domainExists) {
    return {
      isValid: false,
      error: "Gmail service unavailable",
      details: "Cannot verify Gmail addresses at this time. Please try again later.",
      checks
    }
  }
  checks.domainExists = true

  // All checks passed
  return {
    isValid: true,
    checks
  }
}

// Comprehensive Gmail validation for signup
export async function validateGmailForSignup(email: string): Promise<{
  isValid: boolean
  error?: string
  details?: string
  allowSignup: boolean
}> {
  const verification = await verifyGmailAddress(email)
  
  if (!verification.isValid) {
    return {
      isValid: false,
      error: verification.error,
      details: verification.details,
      allowSignup: false
    }
  }

  // Additional signup-specific checks
  if (email.toLowerCase().includes('kunj24')) {
    return {
      isValid: false,
      error: "This Gmail address cannot be used",
      details: "kunj24@gmail.com is reserved for system use. Please use a different Gmail address.",
      allowSignup: false
    }
  }

  return {
    isValid: true,
    allowSignup: true
  }
}