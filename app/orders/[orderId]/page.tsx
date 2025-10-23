"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/header'
import OrderTrackingTimeline from '@/components/order-tracking-timeline'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Package, MapPin, CreditCard, Phone } from 'lucide-react'

export default function OrderTrackingPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params?.orderId
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingData, setTrackingData] = useState<any>(null)
  const [orderData, setOrderData] = useState<any>(null)

  const fetchTracking = async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/tracking?orderId=${encodeURIComponent(orderId)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load tracking')
      setTrackingData(json)

      // Also fetch full order details
      const orderRes = await fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      if (orderRes.ok) {
        const orderJson = await orderRes.json()
        setOrderData(orderJson.order)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTracking()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchTracking()
  }, [orderId])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
            <p className="text-gray-600 mt-1">Track your order status and delivery progress</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="space-y-6">
          {loading && !trackingData && (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading tracking information...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Unable to load tracking</CardTitle>
                <CardDescription className="text-red-600">{error}</CardDescription>
              </CardHeader>
            </Card>
          )}

          {trackingData && (
            <>
              {/* Order Summary Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Order #{trackingData.orderId}</CardTitle>
                      <CardDescription>
                        Placed on {orderData?.createdAt ? new Date(orderData.createdAt).toLocaleDateString('en-IN', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        }) : '—'}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      trackingData.tracking.currentStatus === 'delivered' ? 'default' :
                      trackingData.tracking.currentStatus === 'cancelled' ? 'destructive' :
                      'secondary'
                    } className="text-sm px-3 py-1">
                      {trackingData.tracking.currentStatus.replaceAll('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                {orderData && (
                  <CardContent className="space-y-4">
                    {/* Items */}
                    {orderData.items && orderData.items.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Package className="h-4 w-4" />
                          <span>Items ({orderData.items.length})</span>
                        </div>
                        <div className="space-y-2">
                          {orderData.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                              </div>
                              <span className="text-sm font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Delivery Address */}
                    {orderData.shippingAddress && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>Delivery Address</span>
                        </div>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-900">{orderData.shippingAddress.fullName}</p>
                          <p>{orderData.shippingAddress.address}</p>
                          <p>{orderData.shippingAddress.city}, {orderData.shippingAddress.state} - {orderData.shippingAddress.pincode}</p>
                          <p className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {orderData.shippingAddress.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Payment & Total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700">Payment:</span>
                        <Badge variant="outline">{orderData.paymentMethod || 'COD'}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(orderData.total || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Tracking Timeline */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Delivery Status</h2>
                <OrderTrackingTimeline tracking={trackingData.tracking} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
