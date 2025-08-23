"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Wallet, Building2, Smartphone, Shield, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { userAuth } from "@/lib/user-auth"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  category: string
}

interface CheckoutData {
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentPage() {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("razorpay")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check login status
    const loggedIn = userAuth.isLoggedIn()
    const user = userAuth.getCurrentUser()
    setIsLoggedIn(loggedIn)
    setCurrentUser(user)

    if (!loggedIn) {
      toast({
        title: "Login required",
        description: "Please login to make a payment.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // Load checkout data from localStorage
    const checkoutDataString = localStorage.getItem("radhika_checkout_cart")
    if (!checkoutDataString) {
      toast({
        title: "No cart data",
        description: "Please add items to cart and try again.",
        variant: "destructive",
      })
      router.push("/cart")
      return
    }

    try {
      const data = JSON.parse(checkoutDataString)
      setCheckoutData(data)
    } catch (error) {
      toast({
        title: "Invalid cart data",
        description: "Please restart the checkout process.",
        variant: "destructive",
      })
      router.push("/cart")
    }

    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [router, toast])

  const processRazorpayPayment = async () => {
    if (!checkoutData || !currentUser) return

    setIsProcessing(true)

    try {
      // Create order on our backend
      const response = await fetch('/api/payment/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: checkoutData.total,
          currency: 'INR',
          userId: currentUser.email,
          orderDetails: {
            items: checkoutData.items,
            subtotal: checkoutData.subtotal,
            tax: checkoutData.tax,
            shipping: checkoutData.shipping,
            total: checkoutData.total
          }
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment order')
      }

      // Initialize Razorpay
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'Radhika Electronics',
        description: 'Purchase from Radhika Electronics',
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payment/razorpay', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: currentUser.email
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              // Clear cart after successful payment
              await fetch('/api/user/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: currentUser.email,
                  action: 'clear_cart'
                })
              })

              // Clear checkout data
              localStorage.removeItem("radhika_checkout_cart")

              toast({
                title: "Payment successful!",
                description: "Your order has been placed successfully.",
              })

              router.push("/order-success")
            } else {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error: any) {
            toast({
              title: "Payment verification failed",
              description: error.message,
              variant: "destructive",
            })
          } finally {
            setIsProcessing(false)
          }
        },
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handlePayment = async () => {
    if (paymentMethod === "razorpay") {
      await processRazorpayPayment()
    } else {
      toast({
        title: "Coming soon",
        description: "This payment method will be available soon.",
        variant: "destructive",
      })
    }
  }

  if (!checkoutData || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Payment</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Methods */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Method</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-4">
                      {/* Razorpay */}
                      <div className="flex items-center space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="razorpay" id="razorpay" />
                        <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Wallet className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">Razorpay</p>
                                <p className="text-sm text-gray-600">Credit/Debit Card, Net Banking, UPI, Wallets</p>
                              </div>
                            </div>
                            <Shield className="h-5 w-5 text-green-600" />
                          </div>
                        </Label>
                      </div>

                      {/* UPI (Coming Soon) */}
                      <div className="flex items-center space-x-3 p-4 border rounded-lg opacity-50">
                        <RadioGroupItem value="upi" id="upi" disabled />
                        <Label htmlFor="upi" className="flex-1 cursor-not-allowed">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Smartphone className="h-5 w-5 text-purple-600" />
                              <div>
                                <p className="font-medium">UPI Direct</p>
                                <p className="text-sm text-gray-600">Pay using Google Pay, PhonePe, Paytm</p>
                              </div>
                            </div>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
                          </div>
                        </Label>
                      </div>

                      {/* Net Banking (Coming Soon) */}
                      <div className="flex items-center space-x-3 p-4 border rounded-lg opacity-50">
                        <RadioGroupItem value="netbanking" id="netbanking" disabled />
                        <Label htmlFor="netbanking" className="flex-1 cursor-not-allowed">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Building2 className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">Net Banking</p>
                                <p className="text-sm text-gray-600">All major banks supported</p>
                              </div>
                            </div>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <p className="text-sm text-blue-800 font-medium">Secure Payment</p>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Your payment information is encrypted and secure. We use industry-standard security measures.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {checkoutData.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{checkoutData.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (18% GST)</span>
                      <span>₹{checkoutData.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{checkoutData.shipping === 0 ? "Free" : `₹${checkoutData.shipping.toLocaleString()}`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{checkoutData.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? "Processing..." : `Pay ₹${checkoutData.total.toLocaleString()}`}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-gray-600">
                      By clicking "Pay", you agree to our terms and conditions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
