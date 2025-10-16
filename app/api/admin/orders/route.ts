import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()

    // Get orders from database
    const orders = await db.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    // Get expenses for transaction data
    const expenses = await db.collection('expenses')
      .find({})
      .sort({ date: -1 })
      .limit(20)
      .toArray()

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order._id.toString(),
        userId: order.userId,
        items: order.items || [],
        total: order.total || 0,
        status: order.status || 'completed',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      expenses: expenses.map(expense => ({
        id: expense._id.toString(),
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        type: expense.type || 'expense',
        date: expense.date,
        notes: expense.notes,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      }))
    })

  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
