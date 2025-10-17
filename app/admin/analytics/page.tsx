"use client"

import { useState, useEffect } from "react"
import { AdminRouteGuard } from "@/components/admin-route-guard"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, BarChart3, LineChart, PieChart } from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'

// Chart colors
const COLORS = {
  revenue: '#10b981',
  expenses: '#ef4444',
  profit: '#3b82f6'
}

const PIE_COLORS = ['#10b981', '#ef4444', '#3b82f6']

interface AnalyticsData {
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
  totalOrders: number
  totalProducts: number
  totalUsers: number
  activeSessions: number
  recentTransactions: any[]
  chartData: any[]
  pieData: any[]
  monthlyData: any[]
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/analytics')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const result = await response.json()

      if (result.success && result.analytics) {
        const analytics = result.analytics

        // Generate chart data from API data
        const chartData = [
          { name: 'Revenue', value: analytics.summary.totalRevenue, color: COLORS.revenue },
          { name: 'Expenses', value: analytics.summary.totalExpenses, color: COLORS.expenses },
          { name: 'Profit', value: analytics.summary.netProfit, color: COLORS.profit }
        ]

        // Generate pie chart data
        const pieData = [
          { name: 'Revenue', value: analytics.summary.totalRevenue, fill: COLORS.revenue },
          { name: 'Expenses', value: analytics.summary.totalExpenses, fill: COLORS.expenses }
        ]

        const analyticsData: AnalyticsData = {
          totalRevenue: analytics.summary.totalRevenue,
          totalExpenses: analytics.summary.totalExpenses,
          totalProfit: analytics.summary.netProfit,
          totalOrders: analytics.summary.totalOrders,
          totalProducts: analytics.summary.totalProducts || 0,
          totalUsers: analytics.summary.totalUsers || 0,
          activeSessions: analytics.summary.activeSessions || 0,
          recentTransactions: [],
          chartData,
          pieData,
          monthlyData: analytics.chartData || []
        }

        setData(analyticsData)
      }
    } catch (error) {
      console.error('Analytics fetch error:', error)
      setData({
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
        activeSessions: 0,
        recentTransactions: [],
        chartData: [],
        pieData: [],
        monthlyData: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminRouteGuard>
        <AdminHeader />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
          <div className="text-center">Loading analytics...</div>
        </div>
      </AdminRouteGuard>
    )
  }

  if (!data) {
    return (
      <AdminRouteGuard>
        <AdminHeader />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
          <div className="text-center text-red-500">Failed to load analytics data</div>
        </div>
      </AdminRouteGuard>
    )
  }

  return (
    <AdminRouteGuard>
      <AdminHeader />
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{data.totalRevenue.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{data.totalExpenses.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1">Total spending</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{data.totalProfit.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Net earnings</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{data.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed orders</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{data.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">In inventory</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{data.totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Financial Comparison Bar Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Financial Overview
              </CardTitle>
              <CardDescription>Revenue, Expenses & Profit comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                      fontSize={12}
                      tick={{ fill: '#666' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                      labelStyle={{ color: '#000', fontWeight: 'bold' }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                      {data.chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue vs Expenses Pie Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-6 w-6 text-green-600" />
                Revenue Distribution
              </CardTitle>
              <CardDescription>Revenue vs Expenses breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={data.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent?: number }) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`
                      }
                      outerRadius={120}
                      innerRadius={40}
                      dataKey="value"
                    >
                      {data.pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends Line Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-6 w-6 text-purple-600" />
              Monthly Financial Trends
            </CardTitle>
            <CardDescription>6-month revenue, expenses & profit trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={data.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                    fontSize={12}
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                    labelStyle={{ color: '#000', fontWeight: 'bold' }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.revenue}
                    strokeWidth={4}
                    name="Revenue"
                    dot={{ fill: COLORS.revenue, strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke={COLORS.expenses}
                    strokeWidth={4}
                    name="Expenses"
                    dot={{ fill: COLORS.expenses, strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke={COLORS.profit}
                    strokeWidth={4}
                    name="Profit"
                    dot={{ fill: COLORS.profit, strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest order activity</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {data.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{transaction.customerEmail || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">₹{transaction.totalAmount.toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent transactions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRouteGuard>
  )
}
