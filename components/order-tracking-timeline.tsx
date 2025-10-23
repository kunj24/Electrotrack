"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Truck, Package, Clock, MapPin, Info, ChevronDown, ChevronUp, AlertCircle, XCircle, RotateCcw, ExternalLink } from 'lucide-react'
import type { OrderTracking, ORDER_STATUS_STEPS, OrderStatus } from '@/lib/models/order'

type Props = {
  tracking: OrderTracking
  className?: string
  showAllEvents?: boolean
}

const stepMeta: Record<OrderStatus, { label: string; icon: any; color: string }> = {
  placed: { label: 'Order placed', icon: Clock, color: 'blue' },
  confirmed: { label: 'Order confirmed', icon: CheckCircle2, color: 'green' },
  packed: { label: 'Packed', icon: Package, color: 'purple' },
  shipped: { label: 'Shipped', icon: Truck, color: 'blue' },
  out_for_delivery: { label: 'Out for delivery', icon: Truck, color: 'orange' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'green' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'red' },
  return_requested: { label: 'Return requested', icon: RotateCcw, color: 'amber' },
  returned: { label: 'Returned', icon: RotateCcw, color: 'gray' },
}

export default function OrderTrackingTimeline({ tracking, className, showAllEvents = false }: Props) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const toggleStep = (key: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const steps = useMemo(() => {
    const order = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const
    const currentIndex = order.indexOf(tracking.currentStatus as any)

    // Handle special statuses
    if (tracking.currentStatus === 'cancelled' || tracking.currentStatus === 'return_requested' || tracking.currentStatus === 'returned') {
      return order.map((s, idx) => ({
        key: s,
        label: stepMeta[s].label,
        Icon: stepMeta[s].icon,
        color: stepMeta[s].color,
        status: 'cancelled' as const,
      }))
    }

    return order.map((s, idx) => ({
      key: s,
      label: stepMeta[s].label,
      Icon: stepMeta[s].icon,
      color: stepMeta[s].color,
      status: idx < currentIndex ? 'done' : idx === currentIndex ? 'current' : 'pending',
    }))
  }, [tracking.currentStatus])

  const getLineColor = (status: string) => {
    if (status === 'cancelled') return 'bg-gray-300'
    if (status === 'done') return 'bg-green-500'
    if (status === 'current') return 'bg-gradient-to-b from-green-500 to-gray-300'
    return 'bg-gray-300'
  }

  const isCancelled = tracking.currentStatus === 'cancelled' || tracking.currentStatus === 'return_requested' || tracking.currentStatus === 'returned'

  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-6">
        {/* Special status banner */}
        {isCancelled && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-900">
                {tracking.currentStatus === 'cancelled' && 'Order Cancelled'}
                {tracking.currentStatus === 'return_requested' && 'Return Requested'}
                {tracking.currentStatus === 'returned' && 'Order Returned'}
              </p>
              <p className="text-sm text-red-700">
                {tracking.currentStatus === 'cancelled' && 'This order has been cancelled and will not be delivered.'}
                {tracking.currentStatus === 'return_requested' && 'Return has been requested. Processing your return.'}
                {tracking.currentStatus === 'returned' && 'This order has been returned successfully.'}
              </p>
            </div>
          </div>
        )}

        {/* Header: courier + ETA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Expected delivery:</span>
            <Badge variant="secondary" className="text-sm">
              {tracking.expectedDelivery ? new Date(tracking.expectedDelivery).toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : '—'}
            </Badge>
          </div>
          {tracking.courier?.trackingNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                <strong>{tracking.courier?.name || 'Courier'}</strong>
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="outline" className="font-mono">{tracking.courier.trackingNumber}</Badge>
              {tracking.courier.trackingUrl && (
                <a
                  href={tracking.courier.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Steps */}
        <div className="relative">
          {steps.map(({ key, label, Icon, color, status }, idx) => {
            const stepEvents = tracking.events.filter((e) =>
              e.type.replace('order_', '') === key ||
              e.type === key ||
              (key === 'shipped' && (e.type === 'in_transit' || e.type === 'shipped'))
            )
            const isExpanded = expandedSteps.has(key) || showAllEvents
            const hasEvents = stepEvents.length > 0

            return (
              <div key={key} className="relative flex items-start gap-4 pb-8 last:pb-0">
                {/* Connecting line */}
                {idx < steps.length - 1 && (
                  <div className={`absolute left-3 top-8 w-0.5 h-full ${getLineColor(status)} transition-colors duration-500`} />
                )}

                {/* Icon */}
                <div
                  className={`relative z-10 mt-0.5 h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    status === 'cancelled' ? 'bg-gray-100 border-gray-300 text-gray-500' :
                    status === 'done' ? 'bg-green-100 border-green-500 text-green-700' :
                    status === 'current' ? 'bg-blue-100 border-blue-500 text-blue-700 ring-4 ring-blue-100 animate-pulse' :
                    'bg-gray-50 border-gray-300 text-gray-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold ${
                      status === 'current' ? 'text-blue-700' :
                      status === 'done' ? 'text-green-700' :
                      'text-gray-600'
                    }`}>
                      {label}
                    </span>
                    {status === 'done' && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                        ✓ Completed
                      </Badge>
                    )}
                    {status === 'current' && (
                      <Badge className="text-xs bg-blue-600">In progress</Badge>
                    )}
                  </div>

                  {/* Events */}
                  {hasEvents && (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStep(key)}
                        className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Hide {stepEvents.length} {stepEvents.length === 1 ? 'update' : 'updates'}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show {stepEvents.length} {stepEvents.length === 1 ? 'update' : 'updates'}
                          </>
                        )}
                      </Button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
                          {stepEvents.map((e) => (
                            <div key={e.id} className="text-sm">
                              <div className="flex items-start gap-2">
                                <Info className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                                  e.status === 'success' ? 'text-green-600' :
                                  e.status === 'warning' ? 'text-amber-600' :
                                  e.status === 'danger' ? 'text-red-600' :
                                  'text-blue-600'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900">{e.title}</p>
                                  {e.description && (
                                    <p className="text-gray-600 mt-0.5">{e.description}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(e.at).toLocaleString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                    {e.actor?.name && (
                                      <span className="ml-2">• by {e.actor.name}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* All events section */}
        {!showAllEvents && tracking.events.length > 0 && (
          <>
            <Separator className="my-4" />
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                View all {tracking.events.length} timeline events
              </summary>
              <div className="mt-3 space-y-2 pl-4">
                {tracking.events.slice().reverse().map((e) => (
                  <div key={e.id} className="flex items-start gap-2 text-xs text-gray-600 pb-2 border-b border-gray-100 last:border-0">
                    <span className="font-mono text-gray-400">{new Date(e.at).toLocaleTimeString('en-IN')}</span>
                    <span className="font-medium text-gray-900">{e.title}</span>
                    {e.description && <span>— {e.description}</span>}
                  </div>
                ))}
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  )
}
