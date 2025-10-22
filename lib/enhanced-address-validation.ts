// Enhanced address validation with external API integration
import { validatePinCode, validateAddress, validateCity, validatePhone, validateFullName } from './address-validation'

interface PinCodeAPIResponse {
  pincode: string
  country: string
  state: string
  district: string
  city?: string
  area?: string
  division?: string
  region?: string
  circle?: string
}

interface AddressLookupResult {
  success: boolean
  data?: PinCodeAPIResponse
  error?: string
}

interface AddressSuggestion {
  type: 'area' | 'locality' | 'landmark'
  name: string
  pincode: string
  district: string
  state: string
}

/**
 * Enhanced PIN code validation with external API lookup
 * Falls back to local validation if API fails
 */
export async function validatePinCodeWithAPI(pincode: string): Promise<{
  isValid: boolean
  error?: string
  locationInfo?: PinCodeAPIResponse
  suggestions?: AddressSuggestion[]
}> {
  // First do basic format validation
  const localValidation = validatePinCode(pincode)
  if (!localValidation.isValid) {
    return { isValid: false, error: localValidation.error }
  }

  try {
    // Try external API first
    const apiResult = await lookupPinCodeAPI(pincode)

    if (apiResult.success && apiResult.data) {
      // Verify it's within Gujarat (our delivery area)
      if (apiResult.data.state?.toLowerCase() !== 'gujarat') {
        return {
          isValid: false,
          error: "We currently only deliver within Gujarat state. Please enter a Gujarat PIN code."
        }
      }

      return {
        isValid: true,
        locationInfo: apiResult.data,
        suggestions: generateAddressSuggestions(apiResult.data)
      }
    }
  } catch (error) {
    console.warn('PIN code API failed, falling back to local validation:', error)
  }

  // Fallback to local validation
  if (localValidation.locationInfo) {
    return {
      isValid: true,
      locationInfo: {
        pincode: localValidation.locationInfo.pincode,
        country: localValidation.locationInfo.country,
        state: localValidation.locationInfo.state,
        district: localValidation.locationInfo.district,
        city: localValidation.locationInfo.district
      }
    }
  }

  return { isValid: false, error: "Unable to validate PIN code" }
}

/**
 * Lookup PIN code using external API
 * Uses free Indian postal PIN code API
 */
async function lookupPinCodeAPI(pincode: string): Promise<AddressLookupResult> {
  try {
    // Using postal.api.gov.in (official Indian postal API) or backup APIs
    const apis = [
      `https://api.postalpincode.in/pincode/${pincode}`,
      `https://postalpincodes.in/api/pincode/${pincode}`,
      // Backup API endpoints
    ]

    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ElectrackApp/1.0'
          },
          // Add timeout
          signal: AbortSignal.timeout(5000)
        })

        if (!response.ok) continue

        const data = await response.json()

        // Handle different API response formats
        const normalizedData = normalizeAPIResponse(data, apiUrl)
        if (normalizedData) {
          return { success: true, data: normalizedData }
        }
      } catch (error) {
        console.warn(`API ${apiUrl} failed:`, error)
        continue
      }
    }

    return { success: false, error: "All PIN code APIs are unavailable" }
  } catch (error) {
    return { success: false, error: `PIN code lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * Normalize different API response formats to our standard format
 */
function normalizeAPIResponse(data: any, apiUrl: string): PinCodeAPIResponse | null {
  try {
    // Handle postalpincode.in API format
    if (apiUrl.includes('postalpincode.in')) {
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0]
        return {
          pincode: postOffice.Pincode,
          country: postOffice.Country || 'India',
          state: postOffice.State,
          district: postOffice.District,
          city: postOffice.Division,
          area: postOffice.Name,
          division: postOffice.Division,
          region: postOffice.Region,
          circle: postOffice.Circle
        }
      }
    }

    // Handle other API formats as needed
    // Add more normalizers here for different APIs

    return null
  } catch (error) {
    console.warn('Failed to normalize API response:', error)
    return null
  }
}

/**
 * Generate address suggestions based on PIN code data
 */
function generateAddressSuggestions(locationData: PinCodeAPIResponse): AddressSuggestion[] {
  const suggestions: AddressSuggestion[] = []

  // Add area suggestion
  if (locationData.area && locationData.area !== locationData.city) {
    suggestions.push({
      type: 'area',
      name: locationData.area,
      pincode: locationData.pincode,
      district: locationData.district,
      state: locationData.state
    })
  }

  // Add city suggestion
  if (locationData.city) {
    suggestions.push({
      type: 'locality',
      name: locationData.city,
      pincode: locationData.pincode,
      district: locationData.district,
      state: locationData.state
    })
  }

  // Add district as fallback
  suggestions.push({
    type: 'locality',
    name: locationData.district,
    pincode: locationData.pincode,
    district: locationData.district,
    state: locationData.state
  })

  return suggestions
}

/**
 * Smart address standardization
 */
export function standardizeAddress(addressData: {
  address: string
  city: string
  state: string
  pincode: string
  locationInfo?: PinCodeAPIResponse
}): {
  standardized: {
    address: string
    city: string
    state: string
    pincode: string
    area?: string
  }
  improvements: string[]
} {
  const improvements: string[] = []
  const standardized: any = { ...addressData }

  // Clean and format address
  standardized.address = addressData.address
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/,+/g, ',') // Multiple commas to single comma
    .replace(/\.+/g, '.') // Multiple dots to single dot

  // Standardize city name using location data
  if (addressData.locationInfo) {
    const suggestedCity = addressData.locationInfo.city || addressData.locationInfo.district

    if (suggestedCity && suggestedCity.toLowerCase() !== addressData.city.toLowerCase()) {
      standardized.city = suggestedCity
      standardized.area = addressData.locationInfo.area
      improvements.push(`Suggested city: ${suggestedCity}`)
    }
  }

  // Ensure proper case formatting
  standardized.city = toTitleCase(standardized.city)
  standardized.state = toTitleCase(standardized.state)

  // Clean PIN code
  standardized.pincode = addressData.pincode.replace(/\D/g, '')

  return { standardized, improvements }
}

/**
 * Convert string to title case
 */
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Enhanced address validation with API integration
 */
export async function validateAddressWithAPI(addressData: {
  fullName: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}): Promise<{
  isValid: boolean
  errors: Record<string, string>
  locationInfo?: PinCodeAPIResponse
  suggestions?: AddressSuggestion[]
  standardized?: any
}> {
  const errors: Record<string, string> = {}
  let locationInfo: PinCodeAPIResponse | undefined
  let suggestions: AddressSuggestion[] | undefined

  // Validate all fields
  const nameValidation = validateFullName(addressData.fullName)
  if (!nameValidation.isValid) errors.fullName = nameValidation.error!

  const phoneValidation = validatePhone(addressData.phone)
  if (!phoneValidation.isValid) errors.phone = phoneValidation.error!

  const addressValidation = validateAddress(addressData.address)
  if (!addressValidation.isValid) errors.address = addressValidation.error!

  const cityValidation = validateCity(addressData.city, addressData.state)
  if (!cityValidation.isValid) errors.city = cityValidation.error!

  // Enhanced PIN code validation with API
  const pincodeValidation = await validatePinCodeWithAPI(addressData.pincode)
  if (!pincodeValidation.isValid) {
    errors.pincode = pincodeValidation.error!
  } else {
    locationInfo = pincodeValidation.locationInfo
    suggestions = pincodeValidation.suggestions
  }

  // Generate standardized address if valid
  let standardized
  if (Object.keys(errors).length === 0 && locationInfo) {
    const standardizationResult = standardizeAddress({
      ...addressData,
      locationInfo
    })
    standardized = standardizationResult.standardized
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    locationInfo,
    suggestions,
    standardized
  }
}

/**
 * Get delivery estimation based on PIN code
 */
export function getDeliveryEstimate(pincode: string, locationInfo?: PinCodeAPIResponse): {
  days: string
  cost: number
  type: 'standard' | 'express'
} {
  // Default delivery
  let days = "5-7 business days"
  let cost = 500
  let type: 'standard' | 'express' = 'standard'

  if (locationInfo) {
    // Major cities get faster delivery
    const majorCities = ['ahmedabad', 'surat', 'vadodara', 'rajkot', 'gandhinagar']
    const cityName = locationInfo.city?.toLowerCase() || locationInfo.district?.toLowerCase() || ''

    if (majorCities.some(city => cityName.includes(city))) {
      days = "2-3 business days"
      type = 'express'
    } else {
      days = "3-5 business days"
    }
  }

  return { days, cost, type }
}
