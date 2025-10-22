"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Truck, CreditCard, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { userAuth } from "@/lib/user-auth"
import { useAdminIntegration } from "@/hooks/use-admin-integration"
import {
  validateCompleteAddress,
  validatePinCode,
  validateAddress,
  validateCity,
  validatePhone,
  validateFullName,
  isAddressValid
} from "@/lib/address-validation"
import {
  validatePinCodeWithAPI,
  validateAddressWithAPI,
  standardizeAddress,
  getDeliveryEstimate
} from "@/lib/enhanced-address-validation"

interface CartData {
  items: Array<{
    id: number
    name: string
    price: number
    quantity: number
    category: string
  }>
  subtotal: number
  tax: number
  shipping: number
  total: number
}

export default function ShippingPage() {
  const [shippingData, setShippingData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Gujarat",
    pincode: "",
    deliveryMethod: "standard",
    paymentMethod: "cod",
  })

  const [cartData, setCartData] = useState<CartData | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [isNewAddress, setIsNewAddress] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [pincodeInfo, setPincodeInfo] = useState<{district?: string, state?: string, area?: string, suggestions?: any[]} | null>(null)
  const [pincodeLoading, setPincodeLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const { addOnlineSale } = useAdminIntegration()

  useEffect(() => {
    // Check if user is logged in
    const user = userAuth.getCurrentUser()
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to access checkout.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setCurrentUser(user)

    // Load cart data
    const storedCartData = localStorage.getItem("radhika_checkout_cart")
    if (!storedCartData) {
      toast({
        title: "No cart data found",
        description: "Please add items to cart first.",
        variant: "destructive",
      })
      router.push("/cart")
      return
    }

    const parsedCartData: CartData = JSON.parse(storedCartData)
    setCartData(parsedCartData)

    // Load user profile and shipping address
    const loadUserProfile = async () => {
      try {
        const response = await fetch(`/api/user/profile?userId=${encodeURIComponent(user.email)}`)
        const data = await response.json()

        if (data.success && data.user) {
          // Pre-fill user data
          setShippingData((prev) => ({
            ...prev,
            fullName: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
          }))

          // Load saved addresses
          const addresses = data.user.shippingAddresses || []
          setSavedAddresses(addresses)

          // If user has addresses, find default or use first one
          if (addresses.length > 0) {
            const defaultAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0]
            setSelectedAddressId(defaultAddress.id)
            setIsNewAddress(false)

            // Pre-fill with default address
            setShippingData((prev) => ({
              ...prev,
              fullName: defaultAddress.fullName || prev.fullName,
              phone: defaultAddress.phone || prev.phone,
              address: defaultAddress.address || "",
              city: defaultAddress.city || "",
              state: defaultAddress.state || "Gujarat",
              pincode: defaultAddress.pincode || "",
            }))
          }
        } else {
          // Fallback to basic user info
          setShippingData((prev) => ({
            ...prev,
            fullName: user.name || "",
            email: user.email || "",
          }))
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
        // Fallback to basic user info
        setShippingData((prev) => ({
          ...prev,
          fullName: user.name || "",
          email: user.email || "",
        }))
      }
    }

    loadUserProfile()
  }, [router, toast])

  const handleAddressSelection = (addressId: string) => {
    if (addressId === 'new') {
      setIsNewAddress(true)
      setSelectedAddressId('')
      // Clear address fields for new address
      setShippingData((prev) => ({
        ...prev,
        address: "",
        city: "",
        state: "Gujarat",
        pincode: "",
      }))
    } else {
      setIsNewAddress(false)
      setSelectedAddressId(addressId)

      // Find and load selected address
      const selectedAddress = savedAddresses.find((addr: any) => addr.id === addressId)
      if (selectedAddress) {
        setShippingData((prev) => ({
          ...prev,
          fullName: selectedAddress.fullName || prev.fullName,
          phone: selectedAddress.phone || prev.phone,
          address: selectedAddress.address || "",
          city: selectedAddress.city || "",
          state: selectedAddress.state || "Gujarat",
          pincode: selectedAddress.pincode || "",
        }))
      }
    }
  }

  const validateForm = async () => {
    // Use enhanced validation with API
    const validationResult = await validateAddressWithAPI({
      fullName: shippingData.fullName,
      phone: shippingData.phone,
      address: shippingData.address,
      city: shippingData.city,
      state: shippingData.state,
      pincode: shippingData.pincode
    })

    const newErrors = validationResult.errors

    // Email validation (kept separate as it's not part of address validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!shippingData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(shippingData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)

    // If validation passed and we have standardized data, offer to use it
    if (validationResult.isValid && validationResult.standardized) {
      const standardized = validationResult.standardized
      if (standardized.city !== shippingData.city) {
        // Auto-apply standardized city if different
        setShippingData(prev => ({
          ...prev,
          city: standardized.city,
          address: standardized.address
        }))
      }
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!(await validateForm()) || !cartData) return

    setIsLoading(true)

    try {
      // Save shipping address to user profile
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          phone: shippingData.phone,
          shippingAddress: {
            fullName: shippingData.fullName,
            addressLine1: shippingData.address,
            city: shippingData.city,
            state: shippingData.state,
            postalCode: shippingData.pincode,
            country: 'India',
            phone: shippingData.phone
          }
        })
      })

      // Add each cart item as a separate sale in admin system with actual order date
      const orderDate = new Date().toISOString().split("T")[0] // Current date for the order

      cartData.items.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          addOnlineSale({
            description: item.name,
            category: item.category,
            amount: item.price,
            paymentMethod: shippingData.paymentMethod === "cod" ? "COD" : "Online",
            customer: shippingData.fullName,
            orderId: `ORD${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderDate: orderDate // Pass the actual order date
          })
        }
      })

      // Store order data
      const orderData = {
        ...shippingData,
        cartData,
        orderDate: new Date().toISOString(),
        orderId: `ORD${Date.now()}`,
        customer: currentUser,
      }
      localStorage.setItem("radhika_current_order", JSON.stringify(orderData))

      if (shippingData.paymentMethod === "online") {
        // Redirect to payment page
        router.push("/payment")
      } else {
        // Process COD order - Save to MongoDB
        try {
          const codOrderData = {
            userEmail: currentUser.email,
            items: cartData.items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              category: item.category,
              image: "" // Add image if available
            })),
            shippingAddress: {
              fullName: shippingData.fullName,
              address: shippingData.address,
              city: shippingData.city,
              state: shippingData.state,
              pincode: shippingData.pincode,
              phone: shippingData.phone
            },
            paymentMethod: "Cash on Delivery",
            total: finalTotal,
            subtotal: cartData.subtotal,
            tax: cartData.tax,
            shipping: deliveryFee,
            status: "processing"
          }

          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(codOrderData)
          })

          const result = await response.json()

          if (result.success) {
            // Update localStorage with the generated orderId
            orderData.orderId = result.orderId
            localStorage.setItem("radhika_current_order", JSON.stringify(orderData))

            toast({
              title: "Order placed successfully!",
              description: `Your order ${result.orderId} will be delivered within 3-5 business days.`,
            })

            // Clear cart and redirect to success page
            localStorage.removeItem("radhika_checkout_cart")
            router.push("/order-success")
          } else {
            throw new Error(result.error || 'Failed to save order')
          }
        } catch (orderError) {
          console.error("Error saving COD order:", orderError)
          toast({
            title: "Error saving order",
            description: "Order was processed but may not appear in your order history. Please contact support.",
            variant: "destructive",
          })

          // Still redirect to success since admin system was updated
          localStorage.removeItem("radhika_checkout_cart")
          router.push("/order-success")
        }
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error placing order",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setShippingData((prev) => ({ ...prev, [field]: value }))

    // Clear existing error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    // Real-time validation for specific fields
    if (field === 'pincode' && value.trim() && value.length === 6) {
      setPincodeLoading(true)

      // Use enhanced API validation
      validatePinCodeWithAPI(value).then((pincodeValidation) => {
        setPincodeLoading(false)

        if (pincodeValidation.isValid && pincodeValidation.locationInfo) {
          const locationInfo = pincodeValidation.locationInfo
          setPincodeInfo({
            district: locationInfo.district,
            state: locationInfo.state,
            area: locationInfo.area,
            suggestions: pincodeValidation.suggestions
          })

          // Auto-update city if it's empty and we have location info
          if (!shippingData.city.trim()) {
            const suggestedCity = locationInfo.city || locationInfo.district
            setShippingData((prev) => ({
              ...prev,
              [field]: value,
              city: suggestedCity
            }))
          }
        } else {
          setPincodeInfo(null)
          // Show error for invalid PIN code
          if (pincodeValidation.error) {
            setErrors((prev) => ({ ...prev, pincode: pincodeValidation.error! }))
          }
        }
      }).catch(() => {
        setPincodeLoading(false)
        setPincodeInfo(null)
      })
    } else if (field === 'pincode') {
      setPincodeInfo(null)
      setPincodeLoading(false)
    }    // Real-time validation for phone numbers (show format hint)
    if (field === 'phone' && value.trim()) {
      const phoneValidation = validatePhone(value)
      if (!phoneValidation.isValid) {
        // Show format hint instead of error during typing
        console.log('Phone format hint:', phoneValidation.error)
      }
    }
  }

  if (!cartData || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading checkout...</p>
          </div>
        </div>
      </div>
    )
  }

  const deliveryFee = shippingData.deliveryMethod === "express" ? 1000 : 500
  const finalTotal = cartData.subtotal + cartData.tax + deliveryFee

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Shipping & Payment</h1>

        {/* User Info Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Logged in as: <strong>{currentUser.name}</strong> ({currentUser.email})
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your first and last name"
                        value={shippingData.fullName}
                        onChange={(e) => {
                          // Only allow letters, spaces, dots, and apostrophes
                          const value = e.target.value.replace(/[^a-zA-Z\s\.']/g, '')
                          handleInputChange("fullName", value)
                        }}
                        className={errors.fullName ? "border-red-500" : ""}
                        maxLength={100}
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Enter 10-digit mobile number"
                      value={shippingData.phone}
                      onChange={(e) => {
                        // Only allow digits and limit to reasonable length
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                        handleInputChange("phone", value)
                      }}
                      className={errors.phone ? "border-red-500" : ""}
                      maxLength={10}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.phone}
                      </p>
                    )}
                    {!errors.phone && shippingData.phone.length > 0 && shippingData.phone.length < 10 && (
                      <p className="text-amber-600 text-sm mt-1">
                        📱 Enter {10 - shippingData.phone.length} more digits
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address Selection */}
                  {savedAddresses.length > 0 && (
                    <div>
                      <Label>Select Address</Label>
                      <RadioGroup
                        value={isNewAddress ? 'new' : selectedAddressId}
                        onValueChange={handleAddressSelection}
                        className="mt-2"
                      >
                        {savedAddresses.map((address: any) => (
                          <div key={address.id} className="flex items-start space-x-2">
                            <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                            <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                              <div className="p-3 border rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium">{address.fullName}</span>
                                  {address.isDefault && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{address.address}</p>
                                <p className="text-sm text-gray-600">
                                  {address.city}, {address.state} - {address.pincode}
                                </p>
                                <p className="text-sm text-gray-600">{address.phone}</p>
                              </div>
                            </Label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="new" id="new" />
                          <Label htmlFor="new" className="cursor-pointer font-medium">
                            Use new address
                          </Label>
                        </div>
                      </RadioGroup>
                      <Separator className="my-4" />
                    </div>
                  )}

                  {/* Address Form - only show if new address selected or no saved addresses */}
                  {(isNewAddress || savedAddresses.length === 0) && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="address">Street Address</Label>
                        <Textarea
                          id="address"
                          placeholder="Enter complete address with house/flat number, street name, landmark..."
                          value={shippingData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          className={`${errors.address ? "border-red-500" : ""} min-h-[80px]`}
                          maxLength={200}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.address}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {200 - shippingData.address.length} characters remaining
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="Enter city name"
                            value={shippingData.city}
                            onChange={(e) => {
                              // Only allow letters, spaces, hyphens, and apostrophes
                              const value = e.target.value.replace(/[^a-zA-Z\s\-'\.]/g, '')
                              handleInputChange("city", value)
                            }}
                            className={errors.city ? "border-red-500" : ""}
                            maxLength={50}
                          />

                          {/* Address Suggestions */}
                          {pincodeInfo?.suggestions && pincodeInfo.suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              <div className="p-2">
                                <p className="text-xs font-medium text-gray-600 mb-2">Suggested locations for PIN {shippingData.pincode}:</p>
                                {pincodeInfo.suggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                      setShippingData(prev => ({
                                        ...prev,
                                        city: suggestion.name
                                      }))
                                      setPincodeInfo(prev => prev ? {...prev, suggestions: []} : null)
                                    }}
                                    className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm flex items-center justify-between"
                                  >
                                    <div>
                                      <span className="font-medium">{suggestion.name}</span>
                                      <span className="text-gray-500 ml-2">({suggestion.type})</span>
                                    </div>
                                    <span className="text-xs text-blue-600">Use</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {errors.city && (
                            <p className="text-red-500 text-sm mt-1 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.city}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={shippingData.state}
                            onChange={(e) => handleInputChange("state", e.target.value)}
                            readOnly
                          />
                        </div>

                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <div className="relative">
                            <Input
                              id="pincode"
                              placeholder="Enter 6-digit PIN code"
                              value={shippingData.pincode}
                              onChange={(e) => {
                                // Only allow digits and limit to 6 characters
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                                handleInputChange("pincode", value)
                              }}
                              className={`${errors.pincode ? "border-red-500" : ""} ${
                                pincodeInfo ? "border-green-500" : ""
                              } ${pincodeLoading ? "pr-8" : ""}`}
                              maxLength={6}
                            />
                            {pincodeLoading && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                              </div>
                            )}
                          </div>
                          {errors.pincode && (
                            <p className="text-red-500 text-sm mt-1 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.pincode}
                            </p>
                          )}
                          {pincodeInfo && !errors.pincode && (
                            <div className="mt-1 space-y-1">
                              <p className="text-green-600 text-sm flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                📍 {pincodeInfo.district}, {pincodeInfo.state}
                                {pincodeInfo.area && ` • ${pincodeInfo.area}`}
                              </p>
                              <p className="text-blue-600 text-xs">
                                ✅ Delivery Available • Estimated: 2-5 business days
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={shippingData.deliveryMethod}
                    onValueChange={(value) => handleInputChange("deliveryMethod", value)}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Standard Delivery</p>
                            <p className="text-sm text-gray-600">5-7 business days</p>
                          </div>
                          <span className="font-medium">₹500</span>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Express Delivery</p>
                            <p className="text-sm text-gray-600">2-3 business days</p>
                          </div>
                          <span className="font-medium">₹1,000</span>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={shippingData.paymentMethod}
                    onValueChange={(value) => handleInputChange("paymentMethod", value)}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <Truck className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-gray-600">Pay when you receive your order</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Online Payment</p>
                            <p className="text-sm text-gray-600">Net Banking, UPI, Cards</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Address Validation Summary */}
              {Object.keys(errors).length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Please fix the following issues:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field} className="text-sm">
                          <strong className="capitalize">{field}:</strong> {error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : shippingData.paymentMethod === "online" ? (
                  "Proceed to Payment"
                ) : (
                  "Place Order"
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{cartData.subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{cartData.tax.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹{deliveryFee.toLocaleString()}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📊 This order will be automatically added to our admin system for tracking and analytics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
