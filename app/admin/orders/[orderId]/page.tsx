"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminAuth } from '@/lib/admin-auth'
import { AdminRouteGuard } from '@/components/admin-route-guard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import OrderTrackingTimeline from '@/components/order-tracking-timeline'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Save, Plus, Package, MapPin, Phone, CreditCard, Calendar } from 'lucide-react'
import type { OrderStatus } from '@/lib/models/order'

const statuses: OrderStatus[] = [
  'placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','return_requested','returned'
]

const eventTypes = [
  { value: 'custom', label: 'Custom' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
]

export default function AdminOrderTrackingPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const orderId = params?.orderId
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [orderData, setOrderData] = useState<any>(null)

  const [status, setStatus] = useState<OrderStatus>('placed')
  const [courierName, setCourierName] = useState('')
  const [courierAwb, setCourierAwb] = useState('')
  const [courierUrl, setCourierUrl] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventType, setEventType] = useState('custom')

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) {
      router.push('/admin/unauthorized')
    }
  }, [router])

  const fetchTracking = async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      console.log('Admin - Fetching tracking for orderId:', orderId)
      const res = await fetch(`/api/orders/tracking?orderId=${encodeURIComponent(orderId)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load tracking')
      setData(json)
      setStatus(json.tracking.currentStatus)
      setCourierName(json.tracking.courier?.name || '')
      setCourierAwb(json.tracking.courier?.trackingNumber || '')
      setCourierUrl(json.tracking.courier?.trackingUrl || '')
      setExpectedDelivery(json.tracking.expectedDelivery ? new Date(json.tracking.expectedDelivery).toISOString().split('T')[0] : '')

      // Fetch full order details
      const orderRes = await fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      if (orderRes.ok) {
        const orderJson = await orderRes.json()
        setOrderData(orderJson.order)
      }
    } catch (e: any) {
      console.error('Admin - Fetch tracking error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTracking()
    setRefreshing(false)
    toast({ title: 'Refreshed', description: 'Tracking data updated' })
  }

  useEffect(() => {
    fetchTracking()
  }, [orderId])

  const saveStatus = async () => {
    setSaving(true)
    try {
      // Use the orderId from URL parameter (which could be MongoDB _id or actual orderId)
      const res = await fetch('/api/admin/orders/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, update: 'status', status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update status')
      toast({ title: 'Success', description: 'Status updated successfully' })
      await fetchTracking()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const saveCourier = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/orders/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, update: 'courier', courier: { name: courierName, trackingNumber: courierAwb, trackingUrl: courierUrl } }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update courier')
      toast({ title: 'Success', description: 'Courier details updated' })
      await fetchTracking()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const saveETA = async () => {
    if (!expectedDelivery) {
      toast({ title: 'Validation Error', description: 'Please select a delivery date', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/orders/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, update: 'eta', expectedDelivery: new Date(expectedDelivery).toISOString() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update ETA')
      toast({ title: 'Success', description: 'Expected delivery updated' })
      await fetchTracking()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const addEvent = async () => {
    if (!eventTitle.trim()) {
      toast({ title: 'Validation Error', description: 'Event title is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const admin = adminAuth.getCurrentAdmin()
      const res = await fetch('/api/admin/orders/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          update: 'event',
          event: {
            type: eventType,
            title: eventTitle,
            description: eventDescription || undefined,
            actor: { role: 'admin', name: admin?.name || 'Admin' }
          }
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add event')
      toast({ title: 'Success', description: 'Event added to timeline' })
      setEventTitle('')
      setEventDescription('')
      await fetchTracking()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Tracking Management</h1>
              <p className="text-gray-600 mt-1">Update tracking status, courier details, and custom events</p>
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

          {loading && !data && (
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
            <Card className="border-red-200 bg-red-50 mb-6">
              <CardHeader>
                <CardTitle className="text-red-700">Error</CardTitle>
                <CardDescription className="text-red-600">{error}</CardDescription>
              </CardHeader>
            </Card>
          )}

          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline & Order Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Summary */}
                {orderData && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle>Order #{orderId}</CardTitle>
                        <Badge variant={
                          data.tracking.currentStatus === 'delivered' ? 'default' :
                          data.tracking.currentStatus === 'cancelled' ? 'destructive' :
                          'secondary'
                        } className="text-sm">
                          {data.tracking.currentStatus.replaceAll('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription>
                        Placed on {new Date(orderData.createdAt).toLocaleDateString('en-IN', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </CardHeader>
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
                              <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.name}</p>
                                  <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                </div>
                                <span className="text-sm font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        {/* Address */}
                        {orderData.shippingAddress && (
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <MapPin className="h-4 w-4" />
                              <span>Delivery Address</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p className="font-medium">{orderData.shippingAddress.fullName}</p>
                              <p className="text-xs">{orderData.shippingAddress.address}</p>
                              <p className="text-xs">{orderData.shippingAddress.city}, {orderData.shippingAddress.state}</p>
                              <p className="text-xs flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {orderData.shippingAddress.phone}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Payment */}
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Payment Info</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p><strong>Method:</strong> {orderData.paymentMethod || 'COD'}</p>
                            <p className="text-xl font-bold text-gray-900 mt-2">₹{(orderData.total || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Tracking Timeline</h2>
                  <OrderTrackingTimeline tracking={data.tracking} showAllEvents />
                </div>
              </div>

              {/* Control Panel */}
              <div className="space-y-6">
                {/* Status Update */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Update Status</CardTitle>
                    <CardDescription>Change order delivery status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="status">Order Status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s} value={s}>{s.replaceAll('_',' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={saveStatus} disabled={saving} className="w-full gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Update Status'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Courier Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Courier Details</CardTitle>
                    <CardDescription>Set courier and tracking number</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="courierName">Courier Name</Label>
                      <Input
                        id="courierName"
                        placeholder="e.g., Delhivery, Blue Dart"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="awb">Tracking Number (AWB)</Label>
                      <Input
                        id="awb"
                        placeholder="Tracking/AWB number"
                        value={courierAwb}
                        onChange={(e) => setCourierAwb(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="trackUrl">Tracking URL (Optional)</Label>
                      <Input
                        id="trackUrl"
                        placeholder="https://..."
                        value={courierUrl}
                        onChange={(e) => setCourierUrl(e.target.value)}
                      />
                    </div>
                    <Button onClick={saveCourier} disabled={saving} variant="secondary" className="w-full gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Courier'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Expected Delivery */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Expected Delivery</CardTitle>
                    <CardDescription>Set estimated delivery date</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="eta">Delivery Date</Label>
                      <Input
                        id="eta"
                        type="date"
                        value={expectedDelivery}
                        onChange={(e) => setExpectedDelivery(e.target.value)}
                      />
                    </div>
                    <Button onClick={saveETA} disabled={saving} variant="secondary" className="w-full gap-2">
                      <Calendar className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Update ETA'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Add Event */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Timeline Event</CardTitle>
                    <CardDescription>Add custom tracking update</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="eventType">Event Type</Label>
                      <Select value={eventType} onValueChange={setEventType}>
                        <SelectTrigger id="eventType">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="eventTitle">Event Title *</Label>
                      <Input
                        id="eventTitle"
                        placeholder="e.g., Package picked up"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventDesc">Description (Optional)</Label>
                      <Textarea
                        id="eventDesc"
                        placeholder="Additional details..."
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <Button onClick={addEvent} disabled={saving} variant="default" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      {saving ? 'Adding...' : 'Add Event'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  )
}
