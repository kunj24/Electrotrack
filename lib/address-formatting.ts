// Advanced address formatting and standardization utilities

interface FormattedAddress {
  line1: string
  line2?: string
  city: string
  district: string
  state: string
  pincode: string
  country: string
  formatted: string
}

interface AddressComponents {
  houseNumber?: string
  streetName?: string
  locality?: string
  landmark?: string
  area?: string
}

/**
 * Parse address string into components
 */
export function parseAddressComponents(address: string): AddressComponents {
  const cleanAddress = address.trim()
  const components: AddressComponents = {}

  // Extract house/flat number (digits at start or after common prefixes)
  const houseNumberPatterns = [
    /^(\d+[\w\/\-]*)/,  // Starting with number
    /(?:flat|apartment|apt|house|h\.?no\.?|plot)\s*[:\-]?\s*(\d+[\w\/\-]*)/i,
    /(?:no\.?\s*)(\d+[\w\/\-]*)/i
  ]

  for (const pattern of houseNumberPatterns) {
    const match = cleanAddress.match(pattern)
    if (match) {
      components.houseNumber = match[1]
      break
    }
  }

  // Extract landmarks (near, opp, opposite, behind, etc.)
  const landmarkPattern = /(?:near|opp|opposite|behind|beside|next to|close to)\s+([^,]+)/i
  const landmarkMatch = cleanAddress.match(landmarkPattern)
  if (landmarkMatch) {
    components.landmark = landmarkMatch[1].trim()
  }

  // Extract common area/locality indicators
  const areaPatterns = [
    /(?:society|soc|colony|col|nagar|park|estate|complex|residency)\s*[:\-]?\s*([^,]+)/i,
    /([^,]+)\s+(?:society|soc|colony|col|nagar|park|estate|complex|residency)/i
  ]

  for (const pattern of areaPatterns) {
    const match = cleanAddress.match(pattern)
    if (match) {
      components.area = match[1].trim()
      break
    }
  }

  // Extract street name (remaining significant part)
  let streetName = cleanAddress
  if (components.houseNumber) {
    streetName = streetName.replace(components.houseNumber, '').trim()
  }
  if (components.landmark) {
    streetName = streetName.replace(landmarkMatch![0], '').trim()
  }
  if (components.area) {
    streetName = streetName.replace(components.area, '').trim()
  }

  // Clean up street name
  streetName = streetName
    .replace(/^[,\-\s]+|[,\-\s]+$/g, '') // Remove leading/trailing punctuation
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim()

  if (streetName.length > 3) {
    components.streetName = streetName
  }

  return components
}

/**
 * Format address into standardized lines
 */
export function formatAddressLines(
  address: string,
  city: string,
  district: string,
  state: string,
  pincode: string,
  locationInfo?: any
): FormattedAddress {
  const components = parseAddressComponents(address)

  // Build line 1 (house number + street/area)
  let line1 = ''
  if (components.houseNumber) {
    line1 += components.houseNumber
  }
  if (components.streetName) {
    line1 += (line1 ? ', ' : '') + components.streetName
  }
  if (components.area && !components.streetName) {
    line1 += (line1 ? ', ' : '') + components.area
  }

  // Build line 2 (locality/area + landmark)
  let line2 = ''
  if (components.area && components.streetName) {
    line2 += components.area
  }
  if (components.landmark) {
    line2 += (line2 ? ', ' : '') + `Near ${components.landmark}`
  }
  if (locationInfo?.area && locationInfo.area !== city) {
    line2 += (line2 ? ', ' : '') + locationInfo.area
  }

  // Fallback if parsing didn't work well
  if (!line1.trim()) {
    line1 = address.trim()
    line2 = ''
  }

  // Clean up formatting
  line1 = line1.replace(/^[,\s]+|[,\s]+$/g, '').replace(/\s+/g, ' ')
  if (line2) {
    line2 = line2.replace(/^[,\s]+|[,\s]+$/g, '').replace(/\s+/g, ' ')
  }

  // Format complete address
  const formatted = [
    line1,
    line2,
    `${city}, ${district}`,
    `${state} ${pincode}`,
    'India'
  ].filter(Boolean).join('\n')

  return {
    line1,
    line2: line2 || undefined,
    city: toProperCase(city),
    district: toProperCase(district),
    state: toProperCase(state),
    pincode,
    country: 'India',
    formatted
  }
}

/**
 * Convert to proper case (Title Case)
 */
function toProperCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Generate address variations for better matching
 */
export function generateAddressVariations(address: string): string[] {
  const variations = [address]
  const cleaned = address.trim()

  // Common abbreviations and their expansions
  const expansions: Record<string, string[]> = {
    'rd': ['road', 'rd'],
    'road': ['rd', 'road'],
    'st': ['street', 'st'],
    'street': ['st', 'street'],
    'apt': ['apartment', 'apt'],
    'apartment': ['apt', 'apartment'],
    'soc': ['society', 'soc'],
    'society': ['soc', 'society'],
    'col': ['colony', 'col'],
    'colony': ['col', 'colony'],
    'nr': ['near', 'nr'],
    'near': ['nr', 'near']
  }

  // Generate variations with expansions
  Object.entries(expansions).forEach(([short, long]) => {
    if (cleaned.toLowerCase().includes(short.toLowerCase())) {
      long.forEach(expansion => {
        const variation = cleaned.replace(
          new RegExp(`\\b${short}\\b`, 'gi'),
          expansion
        )
        if (variation !== cleaned) {
          variations.push(variation)
        }
      })
    }
  })

  return [...new Set(variations)]
}

/**
 * Calculate address similarity score (0-1)
 */
export function calculateAddressSimilarity(addr1: string, addr2: string): number {
  const normalize = (str: string) =>
    str.toLowerCase()
       .replace(/[^\w\s]/g, ' ')
       .replace(/\s+/g, ' ')
       .trim()

  const normalized1 = normalize(addr1)
  const normalized2 = normalize(addr2)

  if (normalized1 === normalized2) return 1

  const words1 = normalized1.split(' ')
  const words2 = normalized2.split(' ')

  const allWords = [...new Set([...words1, ...words2])]
  const commonWords = words1.filter(word => words2.includes(word))

  return commonWords.length / allWords.length
}

/**
 * Suggest address corrections
 */
export function suggestAddressCorrections(
  address: string,
  locationInfo?: any
): string[] {
  const suggestions: string[] = []
  const components = parseAddressComponents(address)

  // Suggest adding missing components
  if (!components.houseNumber) {
    suggestions.push("Consider adding house/flat number for better delivery accuracy")
  }

  if (!components.streetName && !components.area) {
    suggestions.push("Add street name or area/colony name for precise location")
  }

  if (address.length < 15) {
    suggestions.push("Address seems incomplete. Add more details like street, area, or landmarks")
  }

  // Suggest based on location info
  if (locationInfo?.area && !address.toLowerCase().includes(locationInfo.area.toLowerCase())) {
    suggestions.push(`Consider adding area: ${locationInfo.area}`)
  }

  return suggestions
}

/**
 * Validate address format and completeness
 */
export function validateAddressFormat(address: string): {
  isComplete: boolean
  score: number
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  const components = parseAddressComponents(address)

  // Score based on components
  if (components.houseNumber) score += 25
  if (components.streetName) score += 25
  if (components.area) score += 20
  if (components.landmark) score += 15
  if (address.length >= 20) score += 15

  // Check for issues
  if (!components.houseNumber) {
    issues.push("Missing house/building number")
    suggestions.push("Add your house, flat, or building number")
  }

  if (!components.streetName && !components.area) {
    issues.push("Missing street or area information")
    suggestions.push("Include street name, colony, or area name")
  }

  if (address.length < 10) {
    issues.push("Address too short")
    suggestions.push("Provide more detailed address information")
  }

  const isComplete = score >= 70 && issues.length === 0

  return {
    isComplete,
    score,
    issues,
    suggestions: suggestions.concat(suggestAddressCorrections(address))
  }
}
