// MongoDB Address Schema for Flipkart-style address management
import { Schema, model, models } from 'mongoose'

// Address interface matching Flipkart structure
export interface IAddress {
  _id?: string
  userId: string // User's email or unique ID
  addressId?: string // Unique address ID
  type: 'HOME' | 'WORK' | 'OTHER'
  isDefault: boolean

  // Personal details
  fullName: string
  phoneNumber: string
  alternatePhone?: string

  // Address details
  pincode: string
  locality: string
  address: string // House/flat/office number and building name
  city: string
  state: string
  country: string

  // Enhanced location data from validation
  locationInfo?: {
    district?: string
    area?: string
    latitude?: number
    longitude?: number
    deliveryAvailable?: boolean
    estimatedDeliveryDays?: number
  }

  // Delivery preferences
  deliveryInstructions?: string
  addressNickname?: string // e.g., "Mom's House", "Main Office"

  // Metadata
  isVerified: boolean
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema<IAddress>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  addressId: {
    type: String,
    unique: true,
    sparse: true
  },
  type: {
    type: String,
    enum: ['HOME', 'WORK', 'OTHER'],
    default: 'HOME',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },

  // Personal details
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^[6-9]\d{9}$/.test(v) // Indian mobile number validation
      },
      message: 'Please enter a valid 10-digit mobile number'
    }
  },
  alternatePhone: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[6-9]\d{9}$/.test(v)
      },
      message: 'Please enter a valid 10-digit alternate phone number'
    }
  },

  // Address details
  pincode: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^[1-9][0-9]{5}$/.test(v) // Indian pincode validation
      },
      message: 'Please enter a valid 6-digit pincode'
    },
    index: true
  },
  locality: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    minlength: 10
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    index: true
  },
  state: {
    type: String,
    required: true,
    trim: true,
    default: 'Gujarat'
  },
  country: {
    type: String,
    default: 'India'
  },

  // Enhanced location data
  locationInfo: {
    district: String,
    area: String,
    latitude: Number,
    longitude: Number,
    deliveryAvailable: {
      type: Boolean,
      default: true
    },
    estimatedDeliveryDays: {
      type: Number,
      default: 5
    }
  },

  // Delivery preferences
  deliveryInstructions: {
    type: String,
    maxlength: 200
  },
  addressNickname: {
    type: String,
    maxlength: 50
  },

  // Metadata
  isVerified: {
    type: Boolean,
    default: false
  },
  lastUsed: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes for efficient querying
AddressSchema.index({ userId: 1, isDefault: 1 })
AddressSchema.index({ userId: 1, type: 1 })
AddressSchema.index({ userId: 1, createdAt: -1 })
AddressSchema.index({ pincode: 1, city: 1 })

// Pre-save middleware to generate addressId and handle defaults
AddressSchema.pre('save', async function(next) {
  try {
    // Generate unique addressId if not provided
    if (!this.addressId) {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substr(2, 5)
      this.addressId = `addr_${timestamp}_${random}`
    }

    // If this is set as default, unset other default addresses
    if (this.isDefault && this.isModified('isDefault')) {
      await (this.constructor as any).updateMany(
        {
          userId: this.userId,
          _id: { $ne: this._id },
          isDefault: true
        },
        {
          $set: {
            isDefault: false,
            updatedAt: new Date()
          }
        }
      )
    }

    // Update lastUsed if address is being modified (except on creation)
    if (!this.isNew && this.isModified()) {
      this.lastUsed = new Date()
    }

    next()
  } catch (error) {
    next(error as Error)
  }
})

// Post-save middleware to ensure at least one default address exists
AddressSchema.post('save', async function() {
  try {
    const defaultCount = await (this.constructor as any).countDocuments({
      userId: this.userId,
      isDefault: true
    })

    // If no default address exists, make the first address default
    if (defaultCount === 0) {
      const firstAddress = await (this.constructor as any).findOne({
        userId: this.userId
      }).sort({ createdAt: 1 })

      if (firstAddress) {
        firstAddress.isDefault = true
        await firstAddress.save()
      }
    }
  } catch (error) {
    console.error('Error in post-save middleware:', error)
  }
})

// Static methods
AddressSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ isDefault: -1, lastUsed: -1, createdAt: -1 })
}

AddressSchema.statics.findDefaultAddress = function(userId: string) {
  return this.findOne({ userId, isDefault: true })
}

AddressSchema.statics.validateDelivery = function(pincode: string) {
  // Gujarat pincode ranges for delivery validation
  const gujaratRanges = [
    { start: 360001, end: 396445 },
    { start: 380001, end: 396590 }
  ]

  const pin = parseInt(pincode)
  return gujaratRanges.some(range => pin >= range.start && pin <= range.end)
}

// Instance methods
AddressSchema.methods.getFormattedAddress = function() {
  const parts = [
    this.address,
    this.locality,
    `${this.city}, ${this.state}`,
    `PIN: ${this.pincode}`,
    this.country
  ].filter(Boolean)

  return parts.join(', ')
}

AddressSchema.methods.setAsDefault = async function() {
  // Unset all other default addresses for this user
  await (this.constructor as any).updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { $set: { isDefault: false, updatedAt: new Date() } }
  )

  // Set this address as default
  this.isDefault = true
  this.lastUsed = new Date()
  return this.save()
}

// Export the model
const Address = models.Address || model('Address', AddressSchema)

export default Address
export { AddressSchema }
