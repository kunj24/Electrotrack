"use client"

import { useState, useEffect } from 'react'

export interface AdminStats {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  totalTransactions: number
  totalUsers: number
  activeUsers: number
  totalOrders: number
  pendingOrders: number
}

export interface RecentTransaction {
  id: string
  description: string
  amount: number
  category: string
  type: "income" | "expense"
  date: string
  notes?: string
}

export interface RecentOrder {
  id: string
  userId: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  total: number
  status: string
  createdAt: string
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTransactions: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch analytics data
      const analyticsResponse = await fetch('/api/admin/analytics')
      const analyticsData = await analyticsResponse.json()

      // Fetch user stats
      const userStatsResponse = await fetch('/api/admin/user-stats')
      const userStatsData = await userStatsResponse.json()

      // Fetch recent orders (if available)
      let ordersData = { orders: [] }
      try {
        const ordersResponse = await fetch('/api/admin/orders')
        if (ordersResponse.ok) {
          ordersData = await ordersResponse.json()
        }
      } catch (err) {
        console.log('Orders API not available yet')
      }

      // Fetch expenses for transaction data
      let expensesData = { expenses: [] }
      try {
        const expensesResponse = await fetch('/api/admin/expenses')
        if (expensesResponse.ok) {
          expensesData = await expensesResponse.json()
        }
      } catch (err) {
        console.log('Expenses API not available yet')
      }

      // Calculate stats from analytics data
      const totalRevenue = analyticsData.totalRevenue || 0
      const totalExpenses = analyticsData.totalExpenses || 0
      const netProfit = totalRevenue - totalExpenses
      const totalTransactions = (analyticsData.transactions?.length || 0) + (expensesData.expenses?.length || 0)

      // Process recent transactions from expenses and orders
      const transactions: RecentTransaction[] = []

      // Add expense transactions
      if (expensesData.expenses) {
        expensesData.expenses.slice(0, 3).forEach((expense: any) => {
          transactions.push({
            id: expense._id || expense.id,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            type: 'expense',
            date: expense.date || expense.createdAt,
            notes: expense.notes,
          })
        })
      }

      // Add order transactions (as income)
      if (ordersData.orders) {
        ordersData.orders.slice(0, 3).forEach((order: any) => {
          transactions.push({
            id: order._id || order.id,
            description: `Order #${order._id?.toString().slice(-6) || 'N/A'}`,
            amount: order.total,
            category: 'Sales',
            type: 'income',
            date: order.createdAt,
            notes: `${order.items?.length || 0} items`,
          })
        })
      }

      // Sort transactions by date (most recent first)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit,
        totalTransactions,
        totalUsers: userStatsData.totalUsers || 0,
        activeUsers: userStatsData.activeUsers || 0,
        totalOrders: ordersData.orders?.length || 0,
        pendingOrders: ordersData.orders?.filter((o: any) => o.status === 'pending').length || 0,
      })

      setRecentTransactions(transactions.slice(0, 5))
      setRecentOrders(ordersData.orders?.slice(0, 5) || [])

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    recentTransactions,
    recentOrders,
    loading,
    error,
    refetch: fetchDashboardData,
  }
}
