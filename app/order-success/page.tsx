"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Package, Truck, Home, CreditCard, Calendar, User, MapPin } from "lucide-react"
import { userAuth } from "@/lib/user-auth"
import { CartService } from "@/lib/cart-service"

export default function OrderSuccessPage() {
  const [orderData, setOrderData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    const initializeOrderSuccess = async () => {
      try {
        // Check for URL parameters (from enhanced payment system)
        const orderId = searchParams.get('orderId')
        const paymentId = searchParams.get('paymentId')

        if (orderId && paymentId) {
          // Fetch order details from backend
          const response = await fetch(`/api/orders/${orderId}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              setOrderData({
                orderId,
                paymentId,
                ...result.order
              })
            }
          } else {
            // Fallback to localStorage if API fails
            const storedOrderData = localStorage.getItem("radhika_current_order")
            if (storedOrderData) {
              setOrderData(JSON.parse(storedOrderData))
            }
          }
        } else {
          // Fallback to localStorage for older orders
          const storedOrderData = localStorage.getItem("radhika_current_order")
          if (storedOrderData) {
            setOrderData(JSON.parse(storedOrderData))
          }
        }

        // Clear the cart after successful order
        const user = userAuth.getCurrentUser()
        if (user) {
          try {
            await CartService.clearCart(user.email)
            console.log('Cart cleared after successful order')
          } catch (error) {
            console.error('Failed to clear cart after order:', error)
          }
        }

        // Clear checkout cart from localStorage
        localStorage.removeItem("radhika_checkout_cart")
        localStorage.removeItem("radhika_current_order")

      } catch (error) {
        console.error('Error loading order details:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeOrderSuccess()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="mb-4">
              <CheckCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't find your order details. Please check your email for the order confirmation.</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Thank you for your purchase. Your order has been confirmed and payment processed.</p>
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
                  <p className="font-semibold">
                    {orderData.createdAt
                      ? new Date(orderData.createdAt).toLocaleDateString()
                      : new Date(orderData.orderDate || Date.now()).toLocaleDateString()
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <p className="font-semibold capitalize">
                      {orderData.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : orderData.paymentMethod === "card"
                        ? "Credit/Debit Card"
                        : orderData.paymentMethod === "upi"
                        ? "UPI"
                        : orderData.paymentMethod === "netbanking"
                        ? "Net Banking"
                        : orderData.paymentMethod === "wallet"
                        ? "Digital Wallet"
                        : "Online Payment"
                      }
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <Badge
                    variant={orderData.paymentStatus === 'completed' ? 'default' : 'secondary'}
                    className={orderData.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {orderData.paymentStatus === 'completed' ? 'Paid' : 'Processing'}
                  </Badge>
                </div>
                {orderData.paymentId && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Payment ID</p>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{orderData.paymentId}</p>
                  </div>
                )}
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
                {orderData.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}

                <div className="pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{orderData.subtotal?.toLocaleString() || orderData.total?.toLocaleString()}</span>
                  </div>
                  {orderData.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>₹{orderData.tax.toLocaleString()}</span>
                    </div>
                  )}
                  {orderData.shipping > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping:</span>
                      <span>₹{orderData.shipping.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-green-600">₹{orderData.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <div>
                    <p className="font-medium">Order Confirmation</p>
                    <p className="text-sm text-gray-600">You'll receive an email confirmation shortly</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <div>
                    <p className="font-medium">Processing</p>
                    <p className="text-sm text-gray-600">Your order will be processed within 1-2 business days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <div>
                    <p className="font-medium">Shipping</p>
                    <p className="text-sm text-gray-600">Estimated delivery in 5-7 business days</p>
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
            <Button asChild variant="outline" className="flex-1">
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                View Orders
              </Link>
            </Button>
          </div>

          {/* Support Info */}
          <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">Need Help?</p>
            <p className="text-sm text-blue-700">
              Contact our support team at{" "}
              <Link href="/contact" className="underline font-medium">
                support@radhikaelectronics.com
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
