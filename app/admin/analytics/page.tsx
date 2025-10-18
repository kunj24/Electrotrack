"use client"

import { useState, useEffect } from "react"
import { AdminRouteGuard } from "@/components/admin-route-guard"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Package, Users, BarChart3, LineChart, PieChart, Calendar } from "lucide-react"
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

// Enhanced Chart colors with gradients
const COLORS = {
  revenue: '#10b981',
  expenses: '#ef4444',
  profit: '#3b82f6',
  revenueGradient: 'url(#revenueGradient)',
  expenseGradient: 'url(#expenseGradient)',
  profitGradient: 'url(#profitGradient)'
}

const PIE_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6']

// Professional chart styling
const chartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  gridStyle: { strokeDasharray: '3 3', opacity: 0.2 },
  axisStyle: { fontSize: 12, fill: '#6b7280' },
  tooltipStyle: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    padding: '8px 12px'
  }
}

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

type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month')

  useEffect(() => {
    fetchAnalytics(selectedPeriod)
  }, [selectedPeriod])

  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ]

  const fetchAnalytics = async (period: TimePeriod = 'month') => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${period}`)
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

          {/* Time Period Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div className="flex flex-wrap gap-1">
              {timePeriods.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value)}
                  className="text-xs"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-5 w-5 text-green-600" />
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
                <Badge variant="secondary" className="ml-auto">
                  {timePeriods.find(p => p.value === selectedPeriod)?.label}
                </Badge>
              </CardTitle>
              <CardDescription>Revenue, Expenses & Profit comparison for {timePeriods.find(p => p.value === selectedPeriod)?.label.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData} margin={chartConfig.margin}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...chartConfig.gridStyle} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={chartConfig.axisStyle}
                      dy={10}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                      axisLine={false}
                      tickLine={false}
                      tick={chartConfig.axisStyle}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      labelStyle={{ color: '#1f2937', fontWeight: '600', marginBottom: '4px' }}
                      contentStyle={chartConfig.tooltipStyle}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
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
                <Badge variant="secondary" className="ml-auto">
                  {timePeriods.find(p => p.value === selectedPeriod)?.label}
                </Badge>
              </CardTitle>
              <CardDescription>Revenue vs Expenses breakdown for {timePeriods.find(p => p.value === selectedPeriod)?.label.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[450px] w-full">
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
                      outerRadius={140}
                      innerRadius={60}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      {data.pieData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      contentStyle={chartConfig.tooltipStyle}
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
              Financial Trends
              <Badge variant="secondary" className="ml-auto">
                {timePeriods.find(p => p.value === selectedPeriod)?.label}
              </Badge>
            </CardTitle>
            <CardDescription>Revenue, expenses & profit trends for {timePeriods.find(p => p.value === selectedPeriod)?.label.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={data.monthlyData} margin={chartConfig.margin}>
                  <CartesianGrid {...chartConfig.gridStyle} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={chartConfig.axisStyle}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                    axisLine={false}
                    tickLine={false}
                    tick={chartConfig.axisStyle}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                    labelStyle={{ color: '#1f2937', fontWeight: '600', marginBottom: '4px' }}
                    contentStyle={chartConfig.tooltipStyle}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.revenue}
                    strokeWidth={3}
                    name="Revenue"
                    dot={{ fill: COLORS.revenue, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, strokeWidth: 3, fill: COLORS.revenue, stroke: '#ffffff' }}
                    strokeDasharray="0"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke={COLORS.expenses}
                    strokeWidth={3}
                    name="Expenses"
                    dot={{ fill: COLORS.expenses, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, strokeWidth: 3, fill: COLORS.expenses, stroke: '#ffffff' }}
                    strokeDasharray="0"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke={COLORS.profit}
                    strokeWidth={3}
                    name="Profit"
                    dot={{ fill: COLORS.profit, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, strokeWidth: 3, fill: COLORS.profit, stroke: '#ffffff' }}
                    strokeDasharray="0"
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
