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
import { useTransactionStore } from "@/lib/transaction-store"

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
  recentTransactions: any[]
  chartData: any[]
  pieData: any[]
  monthlyData: any[]
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { transactions, getStats } = useTransactionStore()

  useEffect(() => {
    processAnalytics()
  }, [transactions])

  const processAnalytics = () => {
    try {
      const stats = getStats()
      
      // Generate chart data
      const chartData = [
        { name: 'Revenue', value: stats.totalRevenue, color: COLORS.revenue },
        { name: 'Expenses', value: stats.totalExpenses, color: COLORS.expenses },
        { name: 'Profit', value: stats.netProfit, color: COLORS.profit }
      ]

      // Generate pie chart data
      const pieData = [
        { name: 'Revenue', value: stats.totalRevenue, fill: COLORS.revenue },
        { name: 'Expenses', value: stats.totalExpenses, fill: COLORS.expenses }
      ]

      // Generate monthly trend data (last 6 months)
      const monthlyData = generateMonthlyTrends(transactions)
      
      const analyticsData: AnalyticsData = {
        totalRevenue: stats.totalRevenue,
        totalExpenses: stats.totalExpenses,
        totalProfit: stats.netProfit,
        totalOrders: transactions.filter(t => t.type === 'income').length,
        totalProducts: 0,
        totalUsers: 0,
        recentTransactions: transactions.slice(0, 5).map(t => ({
          customerEmail: t.notes?.includes('Customer:') ? t.notes.split('Customer: ')[1]?.split(',')[0] : 'Store Transaction',
          totalAmount: t.amount,
          createdAt: t.date
        })),
        chartData,
        pieData,
        monthlyData
      }
      
      setData(analyticsData)
    } catch (error) {
      console.error('Analytics processing error:', error)
      setData({
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
        recentTransactions: [],
        chartData: [],
        pieData: [],
        monthlyData: []
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyTrends = (transactions: any[]) => {
    const monthlyStats: { [key: string]: { revenue: number; expenses: number; profit: number; month: string } } = {}
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      monthlyStats[monthKey] = { revenue: 0, expenses: 0, profit: 0, month: monthName }
    }
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyStats[monthKey]) {
        if (transaction.type === 'income') {
          monthlyStats[monthKey].revenue += transaction.amount
        } else {
          monthlyStats[monthKey].expenses += transaction.amount
        }
        monthlyStats[monthKey].profit = monthlyStats[monthKey].revenue - monthlyStats[monthKey].expenses
      }
    })
    
    return Object.values(monthlyStats)
  }

  const fetchAnalytics = async () => {
    // Fallback API call if needed
    try {
      const response = await fetch('/api/admin/analytics')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const analyticsData = await response.json()
      // Merge with processed data if needed
    } catch (error) {
      console.error('Analytics fetch error:', error)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{data.totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{data.totalProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Comparison Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Financial Overview
              </CardTitle>
              <CardDescription>Revenue, Expenses & Profit comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar dataKey="value">
                    {data.chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue vs Expenses Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Revenue Distribution
              </CardTitle>
              <CardDescription>Revenue vs Expenses breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={data.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent?: number }) => 
                      `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`
                    }
                    outerRadius={80}
                    dataKey="value"
                  >
                    {data.pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Monthly Financial Trends
            </CardTitle>
            <CardDescription>6-month revenue, expenses & profit trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RechartsLineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={COLORS.revenue} 
                  strokeWidth={3}
                  name="Revenue"
                  dot={{ fill: COLORS.revenue, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke={COLORS.expenses} 
                  strokeWidth={3}
                  name="Expenses"
                  dot={{ fill: COLORS.expenses, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke={COLORS.profit} 
                  strokeWidth={3}
                  name="Profit"
                  dot={{ fill: COLORS.profit, strokeWidth: 2, r: 4 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
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
