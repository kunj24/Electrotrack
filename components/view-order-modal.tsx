"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Package,
  MapPin,
  Phone,
  CreditCard,
  Calendar,
  Truck,
  User,
  Mail
} from "lucide-react"

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
  tracking?: {
    status: string
    courier?: string
    trackingNumber?: string
  }
}

interface ViewOrderModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

const statusColors = {
  "Order placed": "bg-blue-100 text-blue-800",
  "Processing": "bg-yellow-100 text-yellow-800",
  "Confirmed": "bg-indigo-100 text-indigo-800",
  "Packed": "bg-purple-100 text-purple-800",
  "Shipped": "bg-orange-100 text-orange-800",
  "Out for delivery": "bg-amber-100 text-amber-800",
  "Delivered": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800",
  "Return requested": "bg-gray-100 text-gray-800",
  "Returned": "bg-gray-100 text-gray-800"
}

export function ViewOrderModal({ order, isOpen, onClose }: ViewOrderModalProps) {
  if (!order) return null

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details</span>
            {getStatusBadge(order.status)}
          </DialogTitle>
          <DialogDescription>
            Order ID: {order.orderId} • Created on {new Date(order.createdAt).toLocaleDateString('en-IN', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-lg flex items-center mb-3">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{order.userEmail}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold text-lg flex items-center mb-3">
                <Package className="h-5 w-5 mr-2" />
                Order Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">₹{item.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">each</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold text-lg flex items-center mb-3">
                <MapPin className="h-5 w-5 mr-2" />
                Shipping Address
              </h3>
              <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                <div className="flex items-center pt-2">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{order.shippingAddress.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Payment & Total */}
            <div>
              <h3 className="font-semibold text-lg flex items-center mb-3">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Information
              </h3>
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payment Method:</span>
                  <span className="font-medium">{order.paymentMethod || 'COD'}</span>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {order.tax && (
                    <div className="flex justify-between">
                      <span>Tax (GST):</span>
                      <span>₹{order.tax.toLocaleString()}</span>
                    </div>
                  )}
                  {order.shipping !== undefined && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping.toLocaleString()}`}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {order.tracking && (
              <div>
                <h3 className="font-semibold text-lg flex items-center mb-3">
                  <Truck className="h-5 w-5 mr-2" />
                  Tracking Information
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                  {order.tracking.courier && (
                    <div className="flex justify-between">
                      <span>Courier:</span>
                      <span className="font-medium">{order.tracking.courier}</span>
                    </div>
                  )}
                  {order.tracking.trackingNumber && (
                    <div className="flex justify-between">
                      <span>Tracking Number:</span>
                      <span className="font-mono text-xs">{order.tracking.trackingNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Information */}
            <div>
              <h3 className="font-semibold text-lg flex items-center mb-3">
                <Calendar className="h-5 w-5 mr-2" />
                Delivery Information
              </h3>
              <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Order Date:</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                {order.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span>Estimated Delivery:</span>
                    <span className="font-medium">
                      {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {order.updatedAt && (
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{new Date(order.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4">
              <div className="flex space-x-3">
                <Button
                  onClick={() => window.open(`/admin/orders/${order._id}`, '_blank')}
                  className="flex-1"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Track Order
                </Button>
                <Button
                  onClick={() => window.location.href = `/admin/orders/edit/${order._id}`}
                  variant="outline"
                  className="flex-1"
                >
                  Edit Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
