import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()

    // Fetch all transactions from different collections
    const orders = await db.collection('orders')
      .find({ status: { $ne: 'cancelled' } })
      .sort({ createdAt: -1 })
      .toArray()

    const offlineSales = await db.collection('offline_sales')
      .find({})
      .sort({ date: -1 })
      .toArray()

    const expenses = await db.collection('expenses')
      .find({})
      .sort({ date: -1 })
      .toArray()

    // Combine and format all transactions
    const allTransactions = []

    // Add online orders
    orders.forEach(order => {
      allTransactions.push({
        id: order._id.toString(),
        description: `Online Order #${order._id.toString().slice(-6)}`,
        amount: order.total || 0,
        category: 'Online Sales',
        type: 'income',
        date: order.createdAt || new Date(),
        notes: `Customer: ${order.userId || 'N/A'}, Items: ${(order.items || []).length}`,
        source: 'online',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })
    })

    // Add offline sales
    offlineSales.forEach(sale => {
      allTransactions.push({
        id: sale._id.toString(),
        description: sale.description || 'Offline Sale',
        amount: sale.amount || 0,
        category: 'Offline Sales',
        type: 'income',
        date: sale.date || new Date(),
        notes: sale.notes || '',
        source: 'offline',
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      })
    })

    // Add expenses
    expenses.forEach(expense => {
      allTransactions.push({
        id: expense._id.toString(),
        description: expense.description || 'Expense',
        amount: expense.amount || 0,
        category: expense.category || 'Other',
        type: 'expense',
        date: expense.date || new Date(),
        notes: expense.notes || '',
        source: 'expense',
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      })
    })

    // Sort all transactions by date (most recent first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      success: true,
      transactions: allTransactions,
      summary: {
        total: allTransactions.length,
        onlineSales: orders.length,
        offlineSales: offlineSales.length,
        expenses: expenses.length,
        totalRevenue: allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      }
    })

  } catch (error: any) {
    console.error('All transactions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}