// Order tracking types and helpers (MongoDB driver based)

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"

export interface TrackingEvent {
  id: string
  type:
    | "order_placed"
    | "order_confirmed"
    | "packed"
    | "shipped"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "delayed"
    | "cancelled"
    | "custom"
  title: string
  description?: string
  status?: "success" | "info" | "warning" | "danger"
  at: string // ISO date string
  actor?: { role: "system" | "user" | "admin"; name?: string; id?: string }
  meta?: Record<string, any>
}

export interface CourierInfo {
  name?: string
  trackingNumber?: string
  trackingUrl?: string
  contact?: string
}

export interface OrderTracking {
  currentStatus: OrderStatus
  expectedDelivery?: string // ISO date
  courier?: CourierInfo
  events: TrackingEvent[]
}

export interface OrderDocument {
  _id?: any
  orderId: string
  userEmail: string
  items: Array<{
    id: string | number
    name: string
    price: number
    quantity: number
    category?: string
    image?: string
  }>
  shippingAddress: {
    fullName: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  paymentMethod: string
  subtotal: number
  tax?: number
  shipping?: number
  total: number
  status?: string // legacy/basic status
  tracking?: OrderTracking
  createdAt: Date
  updatedAt: Date
}

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
]

export function normalizeTracking(order: OrderDocument): OrderTracking {
  // Ensure tracking object exists with sensible defaults
  const nowIso = new Date().toISOString()
  if (!order.tracking) {
    order.tracking = {
      currentStatus: (order.status as OrderStatus) || "placed",
      expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      events: [
        {
          id: `evt_${Date.now()}`,
          type: "order_placed",
          title: "Order placed",
          at: nowIso,
          status: "success",
          actor: { role: "system" },
        },
      ],
    }
  }
  return order.tracking
}

export function addTrackingEvent(
  tracking: OrderTracking,
  event: Omit<TrackingEvent, "id"> & { id?: string }
): OrderTracking {
  const withId: TrackingEvent = {
    id: event.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...event,
  }
  return {
    ...tracking,
    events: [withId, ...(tracking.events || [])].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
    ),
  }
}

export function setOrderStatus(tracking: OrderTracking, status: OrderStatus): OrderTracking {
  return { ...tracking, currentStatus: status }
}
