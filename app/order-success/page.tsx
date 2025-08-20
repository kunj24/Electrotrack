"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, Truck, Home } from "lucide-react"

export default function OrderSuccessPage() {
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    const storedOrderData = localStorage.getItem("radhika_current_order")
    if (storedOrderData) {
      setOrderData(JSON.parse(storedOrderData))
    }
  }, [])

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="bg-green-100 text-green-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600">Thank you for your purchase. Your order has been confirmed.</p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-semibold">{orderData.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-semibold">{new Date(orderData.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold capitalize">
                    {orderData.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Method</p>
                  <p className="font-semibold capitalize">{orderData.deliveryMethod} Delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="font-semibold">{orderData.fullName}</p>
                <p className="text-gray-600">{orderData.address}</p>
                <p className="text-gray-600">
                  {orderData.city}, {orderData.state} {orderData.pincode}
                </p>
                <p className="text-gray-600">Phone: {orderData.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderData.cartData.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}

                <div className="pt-3 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span>
                      ₹
                      {(
                        orderData.cartData.subtotal +
                        orderData.cartData.tax +
                        (orderData.deliveryMethod === "express" ? 1000 : 500)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Order Confirmed</p>
                    <p className="text-sm text-gray-600">Your order has been placed and confirmed</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-gray-100 text-gray-600 p-2 rounded-full">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Processing</p>
                    <p className="text-sm text-gray-600">We'll prepare your items for shipment</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-gray-100 text-gray-600 p-2 rounded-full">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Delivery</p>
                    <p className="text-sm text-gray-600">
                      Expected delivery: {orderData.deliveryMethod === "express" ? "2-3" : "5-7"} business days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>

            <Button variant="outline" asChild className="flex-1 bg-transparent">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>

          {/* Contact Info */}
          <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Questions about your order? Contact us at{" "}
              <a href="tel:+919510886281" className="font-medium hover:underline">
                +91 95108 86281
              </a>{" "}
              or{" "}
              <a href="mailto:jayeshsavaliya3011@gmail.com" className="font-medium hover:underline">
                jayeshsavaliya3011@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
