// Address and PIN code validation utilities

interface AddressValidationResult {
  isValid: boolean
  error?: string
}

interface PinCodeInfo {
  pincode: string
  district: string
  state: string
  country: string
}

/**
 * Validates Indian PIN code format and provides location details
 * @param pincode The PIN code to validate
 * @returns Validation result with location info if valid
 */
export function validatePinCode(pincode: string): AddressValidationResult & { locationInfo?: PinCodeInfo } {
  // Remove any spaces or special characters
  const cleanPincode = pincode.replace(/\s+/g, '').trim()

  // Check if PIN code is exactly 6 digits
  const pincodeRegex = /^[1-9][0-9]{5}$/

  if (!cleanPincode) {
    return { isValid: false, error: "PIN code is required" }
  }

  if (!pincodeRegex.test(cleanPincode)) {
    return {
      isValid: false,
      error: "PIN code must be 6 digits and cannot start with 0"
    }
  }

  // Gujarat PIN code ranges (Gujarat state validation)
  const gujaratPinRanges = [
    { start: 360001, end: 396445 }, // Primary Gujarat range
    { start: 380001, end: 396590 }  // Extended Gujarat range
  ]

  const pincodeNum = parseInt(cleanPincode)
  const isGujaratPin = gujaratPinRanges.some(range =>
    pincodeNum >= range.start && pincodeNum <= range.end
  )

  if (!isGujaratPin) {
    return {
      isValid: false,
      error: "Currently we only deliver within Gujarat. Please enter a valid Gujarat PIN code."
    }
  }

  // Get district info based on PIN code ranges (common Gujarat districts)
  const getDistrictInfo = (pin: number): string => {
    if (pin >= 380001 && pin <= 382481) return "Ahmedabad"
    if (pin >= 390001 && pin <= 394633) return "Vadodara"
    if (pin >= 395001 && pin <= 396445) return "Surat"
    if (pin >= 360001 && pin <= 364295) return "Rajkot"
    if (pin >= 370001 && pin <= 370490) return "Kutch"
    if (pin >= 385001 && pin <= 385566) return "Patan"
    if (pin >= 383001 && pin <= 383475) return "Sabarkantha"
    if (pin >= 384001 && pin <= 384570) return "Mehsana"
    if (pin >= 387001 && pin <= 389230) return "Kheda"
    if (pin >= 361001 && pin <= 363775) return "Jamnagar"
    if (pin >= 365601 && pin <= 365880) return "Amreli"
    if (pin >= 362001 && pin <= 362665) return "Porbandar"
    if (pin >= 364001 && pin <= 364710) return "Bhavnagar"
    if (pin >= 388001 && pin <= 388640) return "Anand"
    return "Gujarat" // Fallback for other Gujarat areas
  }

  return {
    isValid: true,
    locationInfo: {
      pincode: cleanPincode,
      district: getDistrictInfo(pincodeNum),
      state: "Gujarat",
      country: "India"
    }
  }
}

/**
 * Validates street address format and completeness
 * @param address The street address to validate
 * @returns Validation result
 */
export function validateAddress(address: string): AddressValidationResult {
  const trimmedAddress = address.trim()

  if (!trimmedAddress) {
    return { isValid: false, error: "Address is required" }
  }

  if (trimmedAddress.length < 10) {
    return {
      isValid: false,
      error: "Address seems too short. Please provide a complete address."
    }
  }

  if (trimmedAddress.length > 200) {
    return {
      isValid: false,
      error: "Address is too long. Please limit to 200 characters."
    }
  }

  // Check for basic address components (at least one number and some text)
  const hasNumber = /\d/.test(trimmedAddress)
  const hasText = /[a-zA-Z]/.test(trimmedAddress)

  if (!hasNumber || !hasText) {
    return {
      isValid: false,
      error: "Please provide a complete address with house/building number and street name."
    }
  }

  return { isValid: true }
}

/**
 * Validates city name
 * @param city The city name to validate
 * @param state The state (for additional validation)
 * @returns Validation result
 */
export function validateCity(city: string, state: string = "Gujarat"): AddressValidationResult {
  const trimmedCity = city.trim()

  if (!trimmedCity) {
    return { isValid: false, error: "City is required" }
  }

  if (trimmedCity.length < 2) {
    return { isValid: false, error: "City name seems too short" }
  }

  if (trimmedCity.length > 50) {
    return { isValid: false, error: "City name is too long" }
  }

  // Only allow letters, spaces, and common city name characters
  const cityRegex = /^[a-zA-Z\s\-'\.]+$/
  if (!cityRegex.test(trimmedCity)) {
    return {
      isValid: false,
      error: "City name contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed."
    }
  }

  // Common Gujarat cities for additional validation
  const gujaratCities = [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar",
    "Gandhinagar", "Junagadh", "Gandhidham", "Anand", "Navsari", "Morbi",
    "Mahesana", "Bharuch", "Vapi", "Ankleshwar", "Godhra", "Palanpur",
    "Valsad", "Patan", "Deesa", "Amreli", "Veraval", "Kapadvanj",
    "Keshod", "Wadhwan", "Anjar", "Khambhat", "Mahuva", "Porbandar"
  ]

  if (state.toLowerCase() === "gujarat") {
    const isKnownCity = gujaratCities.some(knownCity =>
      knownCity.toLowerCase() === trimmedCity.toLowerCase()
    )

    // Don't fail validation, just provide info
    if (!isKnownCity) {
      console.log(`Note: ${trimmedCity} is not in our common Gujarat cities list, but validation passed.`)
    }
  }

  return { isValid: true }
}

/**
 * Validates phone number for delivery purposes
 * @param phone The phone number to validate
 * @returns Validation result
 */
export function validatePhone(phone: string): AddressValidationResult {
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[-()]/g, '').trim()

  if (!cleanPhone) {
    return { isValid: false, error: "Phone number is required" }
  }

  // Indian mobile number validation (10 digits starting with 6-9)
  const indianMobileRegex = /^[6-9]\d{9}$/

  // Also accept numbers with +91 country code
  const indianMobileWithCodeRegex = /^(\+91|91)?[6-9]\d{9}$/

  if (!indianMobileRegex.test(cleanPhone) && !indianMobileWithCodeRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: "Please enter a valid Indian mobile number (10 digits starting with 6-9)"
    }
  }

  return { isValid: true }
}

/**
 * Validates full name
 * @param fullName The full name to validate
 * @returns Validation result
 */
export function validateFullName(fullName: string): AddressValidationResult {
  const trimmedName = fullName.trim()

  if (!trimmedName) {
    return { isValid: false, error: "Full name is required" }
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: "Name seems too short" }
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: "Name is too long" }
  }

  // Allow letters, spaces, dots, and common name characters
  const nameRegex = /^[a-zA-Z\s\.']+$/
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: "Name contains invalid characters. Only letters, spaces, dots, and apostrophes are allowed."
    }
  }

  // Check for at least one space (indicating first + last name)
  const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0)
  if (nameParts.length < 2) {
    return {
      isValid: false,
      error: "Please provide your full name (first and last name)"
    }
  }

  return { isValid: true }
}

/**
 * Comprehensive address validation function
 * @param addressData Complete address object
 * @returns Validation results for all fields
 */
export function validateCompleteAddress(addressData: {
  fullName: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}): Record<string, AddressValidationResult & { locationInfo?: PinCodeInfo }> {
  return {
    fullName: validateFullName(addressData.fullName),
    phone: validatePhone(addressData.phone),
    address: validateAddress(addressData.address),
    city: validateCity(addressData.city, addressData.state),
    pincode: validatePinCode(addressData.pincode)
  }
}

/**
 * Check if validation results contain any errors
 * @param validationResults Results from validateCompleteAddress
 * @returns true if all validations passed
 */
export function isAddressValid(validationResults: Record<string, AddressValidationResult>): boolean {
  return Object.values(validationResults).every(result => result.isValid)
}
