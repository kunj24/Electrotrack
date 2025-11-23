"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminRouteGuard } from "@/components/admin-route-guard"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Save,
  Package,
  MapPin,
  Phone,
  CreditCard,
  Plus,
  Trash2,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

interface OrderItem {
  name: string
  quantity: number
  price: number
  image?: string
}

interface ShippingAddress {
  fullName: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
}

interface Order {
  _id: string
  orderId: string
  userEmail: string
  status: string
  total: number
  subtotal?: number
  tax?: number
  shipping?: number
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod: string
  createdAt: string
  updatedAt?: string
  estimatedDelivery?: string
}

const orderStatuses = [
  "Order placed",
  "Processing",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
  "Cancelled",
  "Return requested",
  "Returned"
]

const paymentMethods = [
  "COD",
  "Online Payment",
  "UPI",
  "Credit Card",
  "Debit Card",
  "Net Banking"
]

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.orderId as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [formData, setFormData] = useState<Partial<Order>>({})

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (data.success) {
        setOrder(data.order)
        setFormData({
          ...data.order,
          estimatedDelivery: data.order.estimatedDelivery
            ? new Date(data.order.estimatedDelivery).toISOString().split('T')[0]
            : ''
        })
      } else {
        throw new Error(data.error || 'Failed to fetch order')
      }
    } catch (error: any) {
      console.error('Failed to fetch order:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load order",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress!,
        [field]: value
      }
    }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...(formData.items || [])]
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'price' || field === 'quantity' ? parseFloat(value) || 0 : value
    }
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))

    // Recalculate totals
    calculateTotals(newItems)
  }

  const addItem = () => {
    const newItems = [...(formData.items || []), { name: '', quantity: 1, price: 0 }]
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))
  }

  const removeItem = (index: number) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index)
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))
    calculateTotals(newItems)
  }

  const calculateTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.18 // 18% GST
    const shipping = subtotal > 500 ? 0 : 50 // Free shipping above ₹500
    const total = subtotal + tax + shipping

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      shipping,
      total
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validate required fields
      if (!formData.userEmail || !formData.status) {
        toast({
          title: "Validation Error",
          description: "Email and status are required",
          variant: "destructive",
        })
        return
      }

      const updateData = {
        ...formData,
        estimatedDelivery: formData.estimatedDelivery
          ? new Date(formData.estimatedDelivery).toISOString()
          : null
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Order updated successfully",
        })
        router.push('/admin/orders')
      } else {
        throw new Error(data.error || 'Failed to update order')
      }
    } catch (error: any) {
      console.error('Save order error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading order...</p>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    )
  }

  if (!order) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
                <p className="text-gray-500 mb-6">The order you're looking for doesn't exist or may have been deleted.</p>
                <Button asChild>
                  <Link href="/admin/orders">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminRouteGuard>
    )
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" asChild>
                  <Link href="/admin/orders">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Edit Order</h1>
                  <p className="text-gray-600 mt-2">Order ID: {order.orderId}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button onClick={fetchOrder} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                  <CardDescription>Basic order details and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="userEmail">Customer Email</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={formData.userEmail || ''}
                        onChange={(e) => handleInputChange('userEmail', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Order Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
                      <Input
                        id="estimatedDelivery"
                        type="date"
                        value={formData.estimatedDelivery || ''}
                        onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        Order Items
                      </CardTitle>
                      <CardDescription>Manage products in this order</CardDescription>
                    </div>
                    <Button onClick={addItem} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(formData.items || []).map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        <Button
                          onClick={() => removeItem(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Product Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            placeholder="Product name"
                          />
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="text-right text-sm text-gray-600">
                        Subtotal: ₹{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Shipping Address
                  </CardTitle>
                  <CardDescription>Delivery address information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.shippingAddress?.fullName || ''}
                        onChange={(e) => handleAddressChange('fullName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.shippingAddress?.phone || ''}
                        onChange={(e) => handleAddressChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.shippingAddress?.address || ''}
                      onChange={(e) => handleAddressChange('address', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.shippingAddress?.city || ''}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.shippingAddress?.state || ''}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        value={formData.shippingAddress?.pincode || ''}
                        onChange={(e) => handleAddressChange('pincode', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{(formData.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (18% GST):</span>
                    <span>₹{(formData.tax || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>₹{(formData.shipping || 0).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{(formData.total || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="w-full justify-center py-2 text-sm">
                    {formData.status || 'Unknown'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-3">
                    Created: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  {order.updatedAt && (
                    <p className="text-sm text-gray-600">
                      Updated: {new Date(order.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AdminRouteGuard>
  )
}
