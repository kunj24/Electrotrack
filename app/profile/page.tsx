"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Edit, Save, X, Package, Trash2, Plus } from "lucide-react"
import { userAuth } from "@/lib/user-auth"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { validateAddressWithAPI, standardizeAddress } from "@/lib/enhanced-address-validation"
import { AddressValidationFeedback } from "@/components/address-feedback"
import FlipkartAddressManager from "@/components/flipkart-address-manager"

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: 'Gujarat',
    pincode: '',
    type: 'Home',
    isDefault: false
  })
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({})
  const [addressValidation, setAddressValidation] = useState<any>(null)
  const [isValidatingAddress, setIsValidatingAddress] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch user profile data from API
  const fetchUserProfile = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/user/profile?userId=${encodeURIComponent(userEmail)}`)
      const data = await response.json()

      if (data.success) {
        setAddresses(data.user.shippingAddresses || [])
        return data.user
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
    return null
  }

  // Fetch user orders from API
  const fetchUserOrders = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/user/orders?userId=${encodeURIComponent(userEmail)}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      if (!userAuth.isLoggedIn()) {
        router.push("/login")
        return
      }

      const user = userAuth.getCurrentUser()
      setCurrentUser(user)
      setEditedUser(user)

      if (user && user.email) {
        // Fetch profile and orders from API
        const profileData = await fetchUserProfile(user.email)
        if (profileData) {
          const updatedUser = { ...user, ...profileData }
          setCurrentUser(updatedUser)
          setEditedUser(updatedUser)
        }

        await fetchUserOrders(user.email)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.email,
          action: 'update_profile',
          data: {
            name: editedUser.name,
            businessType: editedUser.businessType,
            phone: editedUser.phone
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update localStorage as well
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const userIndex = users.findIndex((u: any) => u.email === currentUser.email)

        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...editedUser }
          localStorage.setItem("users", JSON.stringify(users))
          localStorage.setItem("currentUser", JSON.stringify(users[userIndex]))
        }

        setCurrentUser(editedUser)
        setIsEditing(false)

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditedUser(currentUser)
    setIsEditing(false)
  }

  const handleAddAddress = async () => {
    try {
      setIsValidatingAddress(true)

      // Validate address using our enhanced validation
      const validation = await validateAddressWithAPI(newAddress)
      setAddressValidation(validation)

      if (!validation.isValid) {
        setAddressErrors(validation.errors)
        setIsValidatingAddress(false)

        toast({
          title: "Address validation failed",
          description: "Please fix the errors and try again.",
          variant: "destructive",
        })
        return
      }

      // Use standardized address if available
      const addressToSave = validation.standardized || newAddress

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.email,
          action: 'add_address',
          data: {
            ...addressToSave,
            locationInfo: validation.locationInfo // Save location metadata
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setAddresses([...addresses, data.address])
        setNewAddress({
          fullName: '',
          phone: '',
          address: '',
          city: '',
          state: 'Gujarat',
          pincode: '',
          type: 'Home',
          isDefault: false
        })
        setAddressErrors({})
        setAddressValidation(null)
        setIsAddingAddress(false)

        toast({
          title: "Address added successfully",
          description: validation.standardized
            ? "Address was standardized and saved with location details."
            : "Your delivery address has been added successfully.",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsValidatingAddress(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.email,
          action: 'delete_address',
          data: { addressId }
        })
      })

      const data = await response.json()

      if (data.success) {
        setAddresses(addresses.filter(addr => addr.id !== addressId))

        toast({
          title: "Address deleted",
          description: "The delivery address has been removed.",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800"
      case "Shipped":
        return "bg-blue-100 text-blue-800"
      case "Processing":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={currentUser.picture || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback className="bg-blue-600 text-white text-2xl">
                    {currentUser.name?.charAt(0)?.toUpperCase() || currentUser.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{currentUser.name || "User"}</CardTitle>
                  <CardDescription className="text-lg">{currentUser.email}</CardDescription>
                  {currentUser.provider && (
                    <Badge variant="outline" className="mt-2">
                      Signed in via {currentUser.provider === "google" ? "Google" : currentUser.provider}
                    </Badge>
                  )}
                </div>
                <Button
                  variant={isEditing ? "destructive" : "outline"}
                  onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
                >
                  {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Manage your personal details and contact information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editedUser.name || ""}
                          onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{currentUser.name || "Not provided"}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{currentUser.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editedUser.phone || ""}
                          onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{currentUser.phone || "Not provided"}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          value={editedUser.address || ""}
                          onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                          placeholder="Enter your address"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{currentUser.address || "Not provided"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Order History Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View your past orders and their current status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.length > 0 ? (
                      orders.map((order) => (
                        <div key={order._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-4">
                              <Package className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium">{order.orderId}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </div>
                          <div className="ml-9">
                            <p className="text-sm text-gray-600 mb-1">
                              Items: {order.items.map((item: any) => item.name).join(", ")}
                            </p>
                            <p className="font-medium">₹{order.total.toLocaleString()}</p>
                          </div>
                          <div className="flex justify-end mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/orders/${order._id}`)}
                            >
                              Track Order
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No orders found</p>
                        <p className="text-sm text-gray-400 mb-4">Your order history will appear here once you make a purchase</p>
                        <Button onClick={() => router.push('/dashboard')}>
                          Start Shopping
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <FlipkartAddressManager
                userId={currentUser.email}
                className="bg-white rounded-lg"
              />
            </TabsContent>


            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences and security settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive updates about your orders</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-gray-500">Change your account password</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable 2FA
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>Irreversible and destructive actions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-600">Delete Account</p>
                        <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  )
}
