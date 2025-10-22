"use client"

import { AdminRouteGuard } from "@/components/admin-route-guard"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, CreditCard, IndianRupee, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Package } from "lucide-react"
import Link from "next/link"
import { adminAuth } from "@/lib/admin-auth"
import { useState, useEffect, useMemo } from "react"

interface DashboardData {
  summary: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    totalTransactions: number
  }
  recentTransactions: Array<{
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    date: string
    source: string
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const currentUser = adminAuth.getCurrentUser()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      const result = await response.json()

      if (result.success && result.data) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      setData({
        summary: {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          totalTransactions: 0
        },
        recentTransactions: []
      })
    } finally {
      setLoading(false)
    }
  }

  const quickStats = useMemo(() => {
    if (!data) return []

    return [
      {
        title: "Total Revenue",
        value: `₹${data.summary.totalRevenue.toLocaleString('en-IN')}`,
        change: "+12.5%",
        changeType: "positive" as const,
        icon: IndianRupee,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        title: "Total Expenses",
        value: `₹${data.summary.totalExpenses.toLocaleString('en-IN')}`,
        change: "+8.2%",
        changeType: "negative" as const,
        icon: CreditCard,
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
      {
        title: "Net Profit",
        value: `₹${data.summary.netProfit.toLocaleString('en-IN')}`,
        change: data.summary.netProfit >= 0 ? "+15.3%" : "-15.3%",
        changeType: data.summary.netProfit >= 0 ? "positive" as const : "negative" as const,
        icon: TrendingUp,
        color: data.summary.netProfit >= 0 ? "text-blue-600" : "text-red-600",
        bgColor: data.summary.netProfit >= 0 ? "bg-blue-100" : "bg-red-100",
      },
      {
        title: "Transactions",
        value: data.summary.totalTransactions.toString(),
        change: "+23",
        changeType: "positive" as const,
        icon: Activity,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
    ]
  }, [data])

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">Loading dashboard...</div>
          </main>
        </div>
      </AdminRouteGuard>
    )
  }

  if (!data) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-red-500">Failed to load dashboard data</div>
          </main>
        </div>
      </AdminRouteGuard>
    )
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {currentUser?.name}!</h1>
            <p className="text-gray-600 mt-2">Here's what's happening with your business today.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => (
              <Card key={`stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      {stat.change && (
                        <div className="flex items-center mt-2">
                          {stat.changeType === "positive" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={`text-sm font-medium ml-1 ${
                              stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {stat.change}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">from last month</span>
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest financial activities</CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/transactions">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.recentTransactions.length > 0 ? (
                      data.recentTransactions.map((transaction, index) => (
                        <div key={`transaction-${transaction.id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-2 rounded-full ${
                                transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                              }`}
                            >
                              {transaction.type === "income" ? (
                                <TrendingUp
                                  className={`h-4 w-4 ${
                                    transaction.type === "income" ? "text-green-600" : "text-red-600"
                                  }`}
                                />
                              ) : (
                                <CreditCard className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description || "No description"}</p>
                              <p className="text-sm text-gray-500">
                                {transaction.date ? new Date(transaction.date).toLocaleDateString() : "No date"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                transaction.type === "income" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}₹{transaction.amount?.toLocaleString() || "0"}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.category || "No category"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No transactions yet</p>
                        <Button asChild className="mt-4" size="sm">
                          <Link href="/admin/transactions/manage">Add Transaction</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common admin tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                    <Link href="/admin/inventory">
                      <Package className="h-4 w-4 mr-2" />
                      Inventory Management
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                    <Link href="/admin/transactions/manage">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                    <Link href="/admin/analytics">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                    <Link href="/admin/transactions">
                      <Activity className="h-4 w-4 mr-2" />
                      Manage Transactions
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AdminRouteGuard>
  )
}
