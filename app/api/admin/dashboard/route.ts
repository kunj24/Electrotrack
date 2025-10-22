import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  try {
    const db = await getDb()

    // Calculate revenue from orders (online sales)
    const onlineRevenueData = await db.collection('orders').aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 }
        }
      }
    ]).toArray()

    // Calculate revenue from offline sales
    const offlineRevenueData = await db.collection('offline_sales').aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalSales: { $sum: 1 }
        }
      }
    ]).toArray()

    // Calculate total expenses
    const expenseData = await db.collection('expenses').aggregate([
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          totalExpenseCount: { $sum: 1 }
        }
      }
    ]).toArray()

    // Get recent transactions from all collections
    const recentOrders = await db.collection('orders').find(
      { status: { $ne: 'cancelled' } },
      {
        sort: { createdAt: -1 },
        limit: 3,
        projection: {
          _id: 1,
          total: 1,
          createdAt: 1,
          userEmail: 1,
          status: 1,
          items: 1
        }
      }
    ).toArray()

    const recentOfflineSales = await db.collection('offline_sales').find(
      {},
      {
        sort: { date: -1 },
        limit: 3,
        projection: {
          _id: 1,
          amount: 1,
          date: 1,
          description: 1,
          notes: 1
        }
      }
    ).toArray()

    const recentExpenses = await db.collection('expenses').find(
      {},
      {
        sort: { date: -1 },
        limit: 3,
        projection: {
          _id: 1,
          amount: 1,
          date: 1,
          description: 1,
          category: 1
        }
      }
    ).toArray()

    // Calculate totals
    const onlineRevenue = onlineRevenueData[0]?.totalRevenue || 0
    const offlineRevenue = offlineRevenueData[0]?.totalRevenue || 0
    const totalRevenue = onlineRevenue + offlineRevenue
    const totalExpenses = expenseData[0]?.totalExpenses || 0
    const netProfit = totalRevenue - totalExpenses
    const totalTransactions = (onlineRevenueData[0]?.totalOrders || 0) +
                            (offlineRevenueData[0]?.totalSales || 0) +
                            (expenseData[0]?.totalExpenseCount || 0)

    // Format recent transactions for display
    const recentTransactions: any[] = []

    // Add online orders
    recentOrders.forEach(order => {
      const itemsText = order.items?.map((item: any) => item.name || item.productName).join(', ') || 'Order items'
      recentTransactions.push({
        id: order._id.toString(),
        description: `Online Order - ${itemsText}`,
        amount: order.total || 0,
        type: 'income',
        category: 'Online Sales',
        date: order.createdAt || new Date(),
        source: 'online'
      })
    })

    // Add offline sales
    recentOfflineSales.forEach(sale => {
      recentTransactions.push({
        id: sale._id.toString(),
        description: sale.description || 'Offline Sale',
        amount: sale.amount || 0,
        type: 'income',
        category: 'Offline Sales',
        date: sale.date || new Date(),
        source: 'offline'
      })
    })

    // Add expenses
    recentExpenses.forEach(expense => {
      recentTransactions.push({
        id: expense._id.toString(),
        description: expense.description || 'Expense',
        amount: expense.amount || 0,
        type: 'expense',
        category: expense.category || 'Other',
        date: expense.date || new Date(),
        source: 'expense'
      })
    })

    // Sort by date (most recent first)
    recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          totalTransactions
        },
        recentTransactions: recentTransactions.slice(0, 5)
      }
    })

  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
