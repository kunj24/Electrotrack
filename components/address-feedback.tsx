// Enhanced error handling and user feedback for address validation

import { AlertCircle, CheckCircle, Info, Lightbulb } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ValidationError {
  field: string
  message: string
  type: 'error' | 'warning' | 'info'
  suggestion?: string
}

interface AddressFeedbackProps {
  errors: Record<string, string>
  suggestions?: string[]
  locationInfo?: any
  isValidating?: boolean
}

export function AddressValidationFeedback({
  errors,
  suggestions = [],
  locationInfo,
  isValidating = false
}: AddressFeedbackProps) {
  const hasErrors = Object.keys(errors).length > 0
  const hasSuccess = locationInfo && !hasErrors

  if (isValidating) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
          <AlertDescription className="text-blue-800">
            Validating address details...
          </AlertDescription>
        </div>
      </Alert>
    )
  }

  if (hasSuccess) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Address Verified!</strong>
          <div className="mt-1 text-sm">
            📍 {locationInfo.district}, {locationInfo.state}
            {locationInfo.area && ` • ${locationInfo.area}`}
            <br />
            ✅ Delivery available • Expected: 2-5 business days
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (hasErrors) {
    return (
      <div className="space-y-3">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Address Issues Found:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field} className="text-sm">
                  <strong className="capitalize">{field}:</strong> {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        {suggestions.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Suggestions:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm">{suggestion}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return null
}

/**
 * Enhanced error messages with context and solutions
 */
export const enhancedErrorMessages = {
  fullName: {
    required: "Full name is required for delivery",
    invalid: "Name should contain only letters, spaces, and common punctuation",
    tooShort: "Please provide your complete first and last name",
    suggestion: "Example: Rajesh Kumar Patel"
  },

  phone: {
    required: "Mobile number is needed for delivery coordination",
    invalid: "Please enter a valid 10-digit Indian mobile number",
    format: "Number should start with 6, 7, 8, or 9",
    suggestion: "Example: 9876543210"
  },

  address: {
    required: "Complete street address is required",
    tooShort: "Address seems incomplete - add house number, street name, and area",
    invalid: "Please provide a complete address with house number and street details",
    suggestion: "Example: 123, MG Road, Rajkot Colony, Near City Mall"
  },

  city: {
    required: "City name is required",
    invalid: "City name should contain only letters and spaces",
    notFound: "City not recognized - please check spelling",
    suggestion: "Choose from: Ahmedabad, Surat, Vadodara, Rajkot, etc."
  },

  pincode: {
    required: "PIN code is required for delivery",
    invalid: "PIN code should be exactly 6 digits",
    notDeliverable: "We currently deliver only within Gujarat state",
    notFound: "PIN code not found - please verify the code",
    suggestion: "Gujarat PIN codes: 360001-396590"
  }
}

/**
 * Get enhanced error message with context
 */
export function getEnhancedErrorMessage(
  field: string,
  error: string,
  context?: any
): { message: string; suggestion?: string; type: 'error' | 'warning' } {
  const fieldMessages = enhancedErrorMessages[field as keyof typeof enhancedErrorMessages]

  if (!fieldMessages) {
    return { message: error, type: 'error' }
  }

  // Determine error type and get appropriate message
  if (error.includes('required')) {
    return {
      message: fieldMessages.required,
      suggestion: fieldMessages.suggestion,
      type: 'error'
    }
  }

  if (error.includes('invalid') || error.includes('characters')) {
    return {
      message: fieldMessages.invalid,
      suggestion: fieldMessages.suggestion,
      type: 'error'
    }
  }

  if (error.includes('short')) {
    return {
      message: (fieldMessages as any).tooShort || fieldMessages.invalid,
      suggestion: fieldMessages.suggestion,
      type: 'warning'
    }
  }

  if (error.includes('Gujarat') || error.includes('deliver')) {
    return {
      message: (fieldMessages as any).notDeliverable || error,
      suggestion: (fieldMessages as any).suggestion,
      type: 'error'
    }
  }

  return { message: error, type: 'error' }
}

/**
 * Smart field validation with progressive disclosure
 */
export function getFieldValidationState(
  field: string,
  value: string,
  error?: string
): {
  status: 'empty' | 'partial' | 'valid' | 'invalid'
  message?: string
  progress?: number
} {
  if (!value.trim()) {
    return { status: 'empty' }
  }

  if (error) {
    return { status: 'invalid', message: error }
  }

  // Field-specific progressive validation
  switch (field) {
    case 'pincode':
      if (value.length < 6) {
        return {
          status: 'partial',
          message: `Enter ${6 - value.length} more digits`,
          progress: (value.length / 6) * 100
        }
      }
      return { status: 'valid' }

    case 'phone':
      if (value.length < 10) {
        return {
          status: 'partial',
          message: `Enter ${10 - value.length} more digits`,
          progress: (value.length / 10) * 100
        }
      }
      return { status: 'valid' }

    case 'address':
      if (value.length < 15) {
        return {
          status: 'partial',
          message: 'Add more details (house number, street, area)',
          progress: Math.min((value.length / 15) * 100, 90)
        }
      }
      return { status: 'valid' }

    case 'fullName':
      const nameParts = value.trim().split(/\s+/)
      if (nameParts.length < 2) {
        return {
          status: 'partial',
          message: 'Add last name',
          progress: 50
        }
      }
      return { status: 'valid' }

    default:
      return { status: 'valid' }
  }
}

/**
 * Generate helpful tips based on user input patterns
 */
export function generateHelpfulTips(formData: Record<string, string>): string[] {
  const tips: string[] = []

  // PIN code specific tips
  if (formData.pincode && formData.pincode.length === 6) {
    tips.push("💡 We'll auto-suggest your city and area based on your PIN code")
  }

  // Address completeness tips
  if (formData.address && formData.address.length > 0 && formData.address.length < 20) {
    tips.push("📍 Add landmarks or area names for easier delivery")
  }

  // Phone number tips
  if (formData.phone && formData.phone.length === 10) {
    tips.push("📱 Our delivery partner will call you before delivery")
  }

  // General tips
  if (Object.values(formData).every(value => value.trim())) {
    tips.push("🚀 Complete address helps us deliver faster and more accurately")
  }

  return tips
}
