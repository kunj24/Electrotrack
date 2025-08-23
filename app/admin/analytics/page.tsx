"use client"

import { useState, useEffect } from "react"
import { AdminRouteGuard } from "@/components/admin-route-guard"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, BarChart3, PieChart, LineChart } from "lucide-react"
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
  Legend,
  AreaChart,
  Area
} from 'recharts'
import { useTransactionStore } from "@/lib/transaction-store"

interface AnalyticsData {
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
  totalOrders: number 
  totalProducts: number
  totalUsers: number
  recentTransactions: any[]
  monthlyData: any[]
  categoryData: any[]
  dailyData: any[]
}

// Chart colors
const COLORS = {
  revenue: '#10b981', // green
  expenses: '#ef4444', // red
  profit: '#3b82f6', // blue
  secondary: '#f59e0b', // amber
  tertiary: '#8b5cf6' // purple
}

const PIE_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { transactions, getStats } = useTransactionStore()

  useEffect(() => {
    // Process transaction data for charts
    processTransactionData()
  }, [transactions])

  const processTransactionData = () => {
    try {
      const stats = getStats()
      
      // Process monthly data for line chart
      const monthlyData = generateMonthlyData(transactions)
      
      // Process category data for pie chart
      const categoryData = generateCategoryData(transactions)
      
      // Process daily data for the last 30 days
      const dailyData = generateDailyData(transactions)
      
      const analyticsData: AnalyticsData = {
        totalRevenue: stats.totalRevenue,
        totalExpenses: stats.totalExpenses,
        totalProfit: stats.netProfit,
        totalOrders: stats.totalTransactions,
        totalProducts: 0, // This would come from products API
        totalUsers: 0, // This would come from users API
        recentTransactions: transactions.slice(0, 5).map(t => ({
          customerEmail: t.notes?.includes('Customer:') ? t.notes.split('Customer: ')[1]?.split(',')[0] : 'Store Transaction',
          totalAmount: t.amount,
          createdAt: t.date
        })),
        monthlyData,
        categoryData,
        dailyData
      }
      
      setData(analyticsData)
    } catch (error) {
      console.error('Data processing error:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyData = (transactions: any[]) => {
    const monthlyStats: { [key: string]: { revenue: number; expenses: number; profit: number; month: string } } = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { revenue: 0, expenses: 0, profit: 0, month: monthName }
      }
      
      if (transaction.type === 'income') {
        monthlyStats[monthKey].revenue += transaction.amount
      } else {
        monthlyStats[monthKey].expenses += transaction.amount
      }
      monthlyStats[monthKey].profit = monthlyStats[monthKey].revenue - monthlyStats[monthKey].expenses
    })
    
    return Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month))
  }

  const generateCategoryData = (transactions: any[]) => {
    const categoryStats: { [key: string]: number } = {}
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        categoryStats[transaction.category] = (categoryStats[transaction.category] || 0) + transaction.amount
      }
    })
    
    return Object.entries(categoryStats).map(([name, value]) => ({ name, value }))
  }

  const generateDailyData = (transactions: any[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()
    
    const dailyStats: { [key: string]: { date: string; revenue: number; expenses: number; profit: number } } = {}
    
    last30Days.forEach(date => {
      dailyStats[date] = { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: 0, expenses: 0, profit: 0 }
    })
    
    transactions.forEach(transaction => {
      if (dailyStats[transaction.date]) {
        if (transaction.type === 'income') {
          dailyStats[transaction.date].revenue += transaction.amount
        } else {
          dailyStats[transaction.date].expenses += transaction.amount
        }
        dailyStats[transaction.date].profit = dailyStats[transaction.date].revenue - dailyStats[transaction.date].expenses
      }
    })
    
    return Object.values(dailyStats)
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <Badge variant="outline" className="text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </Badge>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{data.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From all sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{data.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Operating costs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{data.totalProfit.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totalRevenue > 0 ? `${((data.totalProfit / data.totalRevenue) * 100).toFixed(1)}% margin` : 'No revenue'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Monthly Financial Trends
              </CardTitle>
              <CardDescription>Revenue, expenses, and profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke={COLORS.revenue} strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke={COLORS.expenses} strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke={COLORS.profit} strokeWidth={2} name="Profit" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Category Pie Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Revenue by Category
              </CardTitle>
              <CardDescription>Distribution of income sources</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent?: number }) => 
                      `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Performance Area Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Performance (Last 30 Days)
              </CardTitle>
              <CardDescription>Daily revenue and expenses comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke={COLORS.revenue} fill={COLORS.revenue} fillOpacity={0.6} name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stackId="2" stroke={COLORS.expenses} fill={COLORS.expenses} fillOpacity={0.6} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Profit Bar Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Profit Analysis
              </CardTitle>
              <CardDescription>Profit margins by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Profit']} />
                  <Legend />
                  <Bar dataKey="profit" fill={COLORS.profit} name="Monthly Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Key financial metrics and ratios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">PROFIT MARGINS</h3>
                <div className="text-2xl font-bold">
                  {data.totalRevenue > 0 ? `${((data.totalProfit / data.totalRevenue) * 100).toFixed(1)}%` : '0%'}
                </div>
                <p className="text-sm text-muted-foreground">Overall profit margin</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">EXPENSE RATIO</h3>
                <div className="text-2xl font-bold">
                  {data.totalRevenue > 0 ? `${((data.totalExpenses / data.totalRevenue) * 100).toFixed(1)}%` : '0%'}
                </div>
                <p className="text-sm text-muted-foreground">Expenses vs revenue</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">BREAK-EVEN</h3>
                <div className="text-2xl font-bold">
                  {data.totalProfit >= 0 ? (
                    <span className="text-green-600">✓ Profitable</span>
                  ) : (
                    <span className="text-red-600">⚠ Loss</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Current status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {data.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{transaction.customerEmail}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      ₹{transaction.totalAmount.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent transactions available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRouteGuard>
  )
}
