"use client"

import { useState, useEffect } from "react"
import { AdminRouteGuard } from "@/components/admin-route-guard"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Search, Eye, Truck, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import ElectrotrackChatbot from "@/components/chatbot"

interface Order {
  _id: string
  orderId: string
  userEmail: string
  status: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  createdAt: string
  tracking?: {
    status: string
    courier?: string
    trackingNumber?: string
  }
}



const statusColors = {
  "Order placed": "bg-blue-100 text-blue-800",
  "Processing": "bg-yellow-100 text-yellow-800",
  "Shipped": "bg-purple-100 text-purple-800",
  "Out for delivery": "bg-orange-100 text-orange-800",
  "Delivered": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800"
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])


  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/orders')
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders || [])
      } else {
        throw new Error(data.error || 'Failed to fetch orders')
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
                <p className="text-gray-600 mt-2">Manage and track all customer orders</p>
              </div>
              <Button onClick={fetchOrders} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by order ID or customer email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Order placed">Order placed</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Out for delivery">Out for delivery</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Orders ({filteredOrders.length})
              </CardTitle>
              <CardDescription>
                View and manage all customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order.orderId}</TableCell>
                          <TableCell>{order.userEmail}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>₹{order.total.toLocaleString()}</TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={`/admin/orders/${order._id}`}>
                                  <Truck className="h-4 w-4 mr-1" />
                                  Track
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={`/admin/orders/${order._id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Orders will appear here once customers place them"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Chatbot Component */}
      <ElectrotrackChatbot />
    </AdminRouteGuard>
  )
}
