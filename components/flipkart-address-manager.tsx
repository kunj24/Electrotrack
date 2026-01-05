"use client"

// Flipkart-style Address Management Component
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  Home,
  Building,
  MapPin,
  Edit2,
  Trash2,
  Star,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AddressValidationFeedback } from '@/components/address-feedback'

interface Address {
  _id?: string
  addressId?: string
  type: 'HOME' | 'WORK' | 'OTHER'
  isDefault: boolean
  fullName: string
  phoneNumber: string
  alternatePhone?: string
  pincode: string
  locality: string
  address: string
  city: string
  state: string
  country: string
  locationInfo?: {
    district?: string
    area?: string
    deliveryAvailable?: boolean
    estimatedDeliveryDays?: number
  }
  deliveryInstructions?: string
  addressNickname?: string
  isVerified: boolean
  lastUsed?: string
  createdAt?: string
}

interface AddressManagerProps {
  userId: string
  onAddressSelect?: (address: Address) => void
  selectionMode?: boolean
  className?: string
}

export function FlipkartAddressManager({
  userId,
  onAddressSelect,
  selectionMode = false,
  className = ""
}: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [addressValidation, setAddressValidation] = useState<any>(null)

  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<Address>>({
    type: 'HOME',
    fullName: '',
    phoneNumber: '',
    alternatePhone: '',
    pincode: '',
    locality: '',
    address: '',
    city: '',
    state: 'Gujarat',
    country: 'India',
    deliveryInstructions: '',
    addressNickname: '',
    isDefault: false
  })

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      const response = await fetch(`/api/addresses?userId=${encodeURIComponent(userId)}`)
      const data = await response.json()

      if (data.success) {
        setAddresses(data.addresses)
        // Set default selected address
        const defaultAddr = data.addresses.find((addr: Address) => addr.isDefault)
        if (defaultAddr && selectionMode) {
          setSelectedAddressId(defaultAddr.addressId!)
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchAddresses()
    }
  }, [userId])

  // Handle form submission (add/edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setValidationErrors({})

    try {
      const isEditing = !!editingAddress
      const url = '/api/addresses'
      const method = isEditing ? 'PUT' : 'POST'

      const payload = {
        userId,
        ...(isEditing && { addressId: editingAddress.addressId }),
        addressData: formData
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        await fetchAddresses()
        resetForm()

        toast({
          title: isEditing ? "Address updated" : "Address added",
          description: data.message,
        })
      } else {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors)
        }
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete address
  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const response = await fetch(`/api/addresses?userId=${encodeURIComponent(userId)}&addressId=${addressId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await fetchAddresses()
        toast({
          title: "Address deleted",
          description: "Address has been removed successfully",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      })
    }
  }

  // Set as default
  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch('/api/addresses/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          addressId,
          action: 'set_default'
        })
      })

      const data = await response.json()

      if (data.success) {
        await fetchAddresses()
        toast({
          title: "Default address updated",
          description: "This address is now your default delivery address",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update default address",
        variant: "destructive",
      })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'HOME',
      fullName: '',
      phoneNumber: '',
      alternatePhone: '',
      pincode: '',
      locality: '',
      address: '',
      city: '',
      state: 'Gujarat',
      country: 'India',
      deliveryInstructions: '',
      addressNickname: '',
      isDefault: false
    })
    setEditingAddress(null)
    setShowAddForm(false)
    setValidationErrors({})
    setAddressValidation(null)
  }

  // Start editing
  const startEdit = (address: Address) => {
    setFormData(address)
    setEditingAddress(address)
    setShowAddForm(true)
  }

  // Get address icon
  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'HOME':
        return <Home className="h-4 w-4" />
      case 'WORK':
        return <Building className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  // Handle address selection
  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId)
    const address = addresses.find(addr => addr.addressId === addressId)
    if (address && onAddressSelect) {
      onAddressSelect(address)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading addresses...</span>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectionMode ? 'Select Delivery Address' : 'Manage Addresses'}
          </h2>
          <p className="text-gray-600">
            {selectionMode
              ? 'Choose where you want your order delivered'
              : 'Add and manage your delivery addresses'
            }
          </p>
        </div>

        {!selectionMode && (
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </DialogTitle>
              </DialogHeader>

              {/* Address Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Validation Feedback */}
                {(Object.keys(validationErrors).length > 0 || addressValidation?.locationInfo) && (
                  <AddressValidationFeedback
                    errors={validationErrors}
                    locationInfo={addressValidation?.locationInfo}
                    suggestions={addressValidation?.suggestions?.map((s: any) => s.name)}
                    isValidating={isSubmitting}
                  />
                )}

                {/* Personal Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Enter full name"
                      className={validationErrors.fullName ? "border-red-500" : ""}
                    />
                    {validationErrors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Mobile Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setFormData({...formData, phoneNumber: value})
                      }}
                      placeholder="10-digit mobile number"
                      className={validationErrors.phoneNumber ? "border-red-500" : ""}
                      maxLength={10}
                    />
                    {validationErrors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
                    )}
                  </div>
                </div>

                {/* Address Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setFormData({...formData, pincode: value})
                      }}
                      placeholder="6-digit pincode"
                      className={validationErrors.pincode ? "border-red-500" : ""}
                      maxLength={6}
                    />
                    {validationErrors.pincode && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.pincode}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="locality">Locality *</Label>
                    <Input
                      id="locality"
                      value={formData.locality}
                      onChange={(e) => setFormData({...formData, locality: e.target.value})}
                      placeholder="Area, sector, locality"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="House/flat/office number, building name, road name"
                    className={validationErrors.address ? "border-red-500" : ""}
                    rows={3}
                  />
                  {validationErrors.address && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="City name"
                      className={validationErrors.city ? "border-red-500" : ""}
                    />
                    {validationErrors.city && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Address Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'HOME' | 'WORK' | 'OTHER') => setFormData({...formData, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOME">Home</SelectItem>
                        <SelectItem value="WORK">Work</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="alternatePhone">Alternate Phone</Label>
                    <Input
                      id="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setFormData({...formData, alternatePhone: value})
                      }}
                      placeholder="Alternate contact number"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
                  <Textarea
                    id="deliveryInstructions"
                    value={formData.deliveryInstructions}
                    onChange={(e) => setFormData({...formData, deliveryInstructions: e.target.value})}
                    placeholder="Any specific delivery instructions..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({...formData, isDefault: !!checked})}
                  />
                  <Label htmlFor="isDefault" className="text-sm">
                    Make this my default address
                  </Label>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingAddress ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      editingAddress ? 'Update Address' : 'Save Address'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Addresses List */}
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
            <p className="text-gray-600 mb-4">Add your first delivery address to get started</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </Card>
        ) : (
          addresses.map((address) => (
            <Card
              key={address.addressId}
              className={`${
                selectionMode && selectedAddressId === address.addressId
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:shadow-md'
              } transition-all cursor-pointer`}
              onClick={() => selectionMode && handleAddressSelection(address.addressId!)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Address Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      {selectionMode && (
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="selectedAddress"
                            checked={selectedAddressId === address.addressId}
                            onChange={() => handleAddressSelection(address.addressId!)}
                            className="mr-3"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        {getAddressIcon(address.type)}
                        <Badge variant={address.type === 'HOME' ? 'default' : 'secondary'}>
                          {address.type}
                        </Badge>
                        {address.isDefault && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        )}
                        {address.isVerified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>

                      {address.addressNickname && (
                        <Badge variant="outline">{address.addressNickname}</Badge>
                      )}
                    </div>

                    {/* Address Details */}
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">{address.fullName}</p>
                      <p className="text-gray-700">
                        {address.address}, {address.locality}
                      </p>
                      <p className="text-gray-700">
                        {address.city}, {address.state} - {address.pincode}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {address.phoneNumber}
                        </div>

                        {address.locationInfo?.district && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {address.locationInfo.district}
                            {address.locationInfo.estimatedDeliveryDays && (
                              <span className="ml-1">
                                • {address.locationInfo.estimatedDeliveryDays} days
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {address.deliveryInstructions && (
                        <p className="text-sm text-gray-600 italic">
                          "{address.deliveryInstructions}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!selectionMode && (
                    <div className="flex items-center space-x-2">
                      {!address.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.addressId!)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(address)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(address.addressId!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Selection Actions */}
      {selectionMode && selectedAddressId && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-900 font-medium">
                Address selected for delivery
              </span>
            </div>
            <Button onClick={() => onAddressSelect?.(addresses.find(a => a.addressId === selectedAddressId)!)}>
              Deliver Here
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlipkartAddressManager
