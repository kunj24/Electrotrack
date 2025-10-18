import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Helper function to update revenue table
async function updateRevenueTable(db: any) {
  const orders = db.collection('orders')
  const offlineSales = db.collection('offline_sales')
  const revenue = db.collection('revenue')

  // Calculate total revenue from orders
  const onlineRevenue = await orders.aggregate([
    {
      $match: {
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$total' }
      }
    }
  ]).toArray()

  // Calculate total revenue from offline sales
  const offlineRevenue = await offlineSales.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]).toArray()

  const totalOnline = onlineRevenue[0]?.total || 0
  const totalOffline = offlineRevenue[0]?.total || 0
  const totalRevenue = totalOnline + totalOffline

  // Update revenue table
  await revenue.updateOne(
    { _id: 'total_revenue' },
    {
      $set: {
        totalRevenue,
        totalOnline,
        totalOffline,
        lastUpdated: new Date()
      }
    },
    { upsert: true }
  )
}

// Helper function to get date range based on period
function getDateRange(period: string) {
  const now = new Date()
  let startDate = new Date()

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      const weekStart = now.getDate() - now.getDay()
      startDate = new Date(now.setDate(weekStart))
      startDate.setHours(0, 0, 0, 0)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default:
      startDate = new Date(0) // All time
  }

  return { startDate, endDate: now }
}

// Get analytics data
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'month'
    const { startDate, endDate } = getDateRange(period)

    const db = await getDb()
    const orders = db.collection('orders')
    const expenses = db.collection('expenses')
    const offlineSales = db.collection('offline_sales')
    const analytics = db.collection('analytics')
    const inventory = db.collection('inventory')

    // Date filter for time-based queries
    const dateFilter = period === 'month' ? {} : {
      createdAt: { $gte: startDate, $lte: endDate }
    }

    // Calculate revenue from orders (online sales)
    const onlineRevenueData = await orders.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      }
    ]).toArray()

    // Calculate revenue from offline sales
    const offlineRevenueData = await offlineSales.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalSales: { $sum: 1 }
        }
      }
    ]).toArray()

    // Calculate total expenses
    const expenseData = await expenses.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]).toArray()

    // Get monthly revenue trends
    const monthlyRevenue = await orders.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray()

    // Get monthly offline sales trends
    const monthlyOfflineSales = await offlineSales.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          salesCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray()

    // Get monthly expenses trends
    const monthlyExpenses = await expenses.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          expenses: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray()

    // Get category-wise expenses
    const categoryExpenses = await expenses.aggregate([
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]).toArray()

    // Get total product count from inventory
    const productCount = await inventory.countDocuments()

    // Count total users from different collections
    const usersCollection = db.collection('users')
    const accountsCollection = db.collection('accounts') // NextAuth accounts
    const sessionsCollection = db.collection('sessions') // NextAuth sessions

    // Get total registered users (from both custom users and OAuth users)
    let customUsers = 0
    let oauthUsers = 0
    let activeSessions = 0

    try {
      customUsers = await usersCollection.countDocuments({})
    } catch (error) {
      console.log('Custom users collection not found or empty')
    }

    try {
      oauthUsers = await accountsCollection.countDocuments({})
    } catch (error) {
      console.log('OAuth accounts collection not found or empty')
    }

    try {
      activeSessions = await sessionsCollection.countDocuments({
        expires: { $gt: new Date() }
      })
    } catch (error) {
      console.log('Sessions collection not found or empty')
    }

    // Get unique users (avoid double counting if user has both custom and OAuth account)
    const allUserEmails = new Set<string>()

    // Add custom user emails
    try {
      const customUserEmails = await usersCollection.find({}, { projection: { email: 1 } }).toArray()
      customUserEmails.forEach((user: any) => {
        if (user.email) allUserEmails.add(user.email.toLowerCase())
      })
    } catch (error) {
      console.log('Error fetching custom user emails:', error)
    }

    // Add OAuth user emails
    try {
      const oauthAccounts = await accountsCollection.find({}, { projection: { userId: 1 } }).toArray()
      for (const account of oauthAccounts) {
        if (account.userId) {
          // Get user details from NextAuth users collection
          const userDoc = await db.collection('users').findOne({ _id: new ObjectId(account.userId) })
          if (userDoc?.email) {
            allUserEmails.add(userDoc.email.toLowerCase())
          }
        }
      }
    } catch (error) {
      console.log('Error fetching OAuth user emails:', error)
    }

    // Calculate total unique users
    const totalUsers = allUserEmails.size > 0 ? allUserEmails.size : (customUsers + oauthUsers)

    // Calculate totals
    const onlineRevenue = onlineRevenueData[0]?.totalRevenue || 0
    const offlineRevenue = offlineRevenueData[0]?.totalRevenue || 0
    const totalRevenue = onlineRevenue + offlineRevenue
    const totalExpenses = expenseData[0]?.totalExpenses || 0
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Store computed revenue data in revenue collection
    const revenueCollection = db.collection('revenue')
    const revenueData = {
      totalRevenue,
      onlineRevenue,
      offlineRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalOrders: (onlineRevenueData[0]?.totalOrders || 0) + (offlineRevenueData[0]?.totalSales || 0),
      totalProducts: productCount,
      period: 'all-time',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Upsert the revenue data (update if exists, insert if not)
    await revenueCollection.updateOne(
      { period: 'all-time' },
      {
        $set: revenueData,
        $setOnInsert: { _id: new ObjectId() }
      },
      { upsert: true }
    )

    // Format monthly data for charts
    const monthlyData = []
    const monthMap = new Map()

    // Add revenue data (online sales)
    monthlyRevenue.forEach(item => {
      const key = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`
      monthMap.set(key, {
        month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: item.revenue,
        expenses: 0,
        profit: item.revenue
      })
    })

    // Add offline sales data
    monthlyOfflineSales.forEach(item => {
      const key = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`
      if (monthMap.has(key)) {
        const existing = monthMap.get(key)
        existing.revenue += item.revenue
        existing.profit = existing.revenue - existing.expenses
      } else {
        monthMap.set(key, {
          month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: item.revenue,
          expenses: 0,
          profit: item.revenue
        })
      }
    })

    // Add expense data
    monthlyExpenses.forEach(item => {
      const key = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`
      if (monthMap.has(key)) {
        const existing = monthMap.get(key)
        existing.expenses = item.expenses
        existing.profit = existing.revenue - item.expenses
      } else {
        monthMap.set(key, {
          month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: 0,
          expenses: item.expenses,
          profit: -item.expenses
        })
      }
    })

    // Convert map to array and sort
    const chartData = Array.from(monthMap.values()).sort((a, b) => {
      return new Date(a.month).getTime() - new Date(b.month).getTime()
    })

    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: parseFloat(profitMargin.toFixed(2)),
          totalOrders: (onlineRevenueData[0]?.totalOrders || 0) + (offlineRevenueData[0]?.totalSales || 0),
          avgOrderValue: parseFloat((onlineRevenueData[0]?.avgOrderValue || 0).toFixed(2)),
          totalProducts: productCount,
          totalUsers,
          activeSessions
        },
        chartData,
        categoryData: categoryExpenses.map(cat => ({
          name: cat._id,
          value: cat.amount,
          count: cat.count
        }))
      }
    })

  } catch (error: any) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add expense or revenue entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, description, amount, category, notes, date } = body

    if (!type || !description || !amount || !category) {
      return NextResponse.json({
        error: 'Type, description, amount, and category are required'
      }, { status: 400 })
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json({
        error: 'Type must be either "income" or "expense"'
      }, { status: 400 })
    }

    const db = await getDb()
    const collection = type === 'expense' ? db.collection('expenses') : db.collection('offline_sales')

    const entry = {
      _id: new ObjectId(),
      description,
      amount: parseFloat(amount),
      category,
      type,
      notes: notes || '',
      date: date ? new Date(date) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await collection.insertOne(entry)

    // Update revenue table after adding new transaction
    await updateRevenueTable(db)

    return NextResponse.json({
      success: true,
      message: `${type} entry added successfully`,
      entry
    })

  } catch (error: any) {
    console.error('Analytics add error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update expense or revenue entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, description, amount, category, notes, date } = body

    if (!id || !type) {
      return NextResponse.json({
        error: 'ID and type are required'
      }, { status: 400 })
    }

    const db = await getDb()
    const collection = type === 'expense' ? db.collection('expenses') : db.collection('offline_sales')

    const updateData: any = { updatedAt: new Date() }
    if (description) updateData.description = description
    if (amount) updateData.amount = parseFloat(amount)
    if (category) updateData.category = category
    if (notes !== undefined) updateData.notes = notes
    if (date) updateData.date = new Date(date)

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    // Update revenue table after updating transaction
    await updateRevenueTable(db)

    return NextResponse.json({
      success: true,
      message: `${type} entry updated successfully`
    })

  } catch (error: any) {
    console.error('Analytics update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete expense or revenue entry
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const type = url.searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json({
        error: 'ID and type are required'
      }, { status: 400 })
    }

    const db = await getDb()
    const collection = type === 'expense' ? db.collection('expenses') : db.collection('offline_sales')

    await collection.deleteOne({ _id: new ObjectId(id) })

    // Update revenue table after deleting transaction
    await updateRevenueTable(db)

    return NextResponse.json({
      success: true,
      message: `${type} entry deleted successfully`
    })

  } catch (error: any) {
    console.error('Analytics delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
