import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import {
  Product,
  StockMovement,
  stockAdjustmentSchema
} from '@/lib/models/product'
import { ObjectId } from 'mongodb'

// Admin role verification middleware
function verifyAdminRole(request: NextRequest): { isValid: boolean; error?: string } {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Missing or invalid authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')

  // Mock validation - replace with actual JWT verification
  if (!token || token === 'invalid') {
    return { isValid: false, error: 'Invalid or expired token' }
  }

  return { isValid: true }
}

// POST /api/admin/inventory/adjust-stock - Adjust product stock
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validation = stockAdjustmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { productId, quantityChange, reason, notes, adjustedBy } = validation.data

    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const db = await getDb()
    const productsCollection = db.collection<Product>('products')

    // Get current product
    const product = await productsCollection.findOne({
      _id: new ObjectId(productId),
      deletedAt: { $exists: false }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const previousQuantity = product.quantity
    const newQuantity = previousQuantity + quantityChange

    // Validate new quantity is not negative
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: 'Cannot reduce stock below zero' },
        { status: 400 }
      )
    }

    // Update product quantity
    const updateResult = await productsCollection.updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          quantity: newQuantity,
          updatedAt: new Date(),
          updatedBy: adjustedBy
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Also update inventory collection quantity
    const inventoryCollection = db.collection('inventory')
    await inventoryCollection.updateOne(
      { name: product.name },
      {
        $set: {
          quantity: newQuantity,
          updatedAt: new Date(),
          updatedBy: adjustedBy
        }
      }
    )

    // Log stock movement
    const stockMovement: Omit<StockMovement, '_id'> = {
      productId,
      type: 'adjustment',
      quantity: quantityChange,
      previousQuantity,
      newQuantity,
      reason,
      notes,
      adjustedBy,
      createdAt: new Date()
    }

    await db.collection<StockMovement>('stock_movements').insertOne(stockMovement)

    // Get updated product
    const updatedProduct = await productsCollection.findOne({ _id: new ObjectId(productId) })

    return NextResponse.json({
      product: {
        ...updatedProduct,
        id: updatedProduct?._id?.toString()
      },
      stockMovement: {
        ...stockMovement,
        quantityChange,
        previousQuantity,
        newQuantity
      }
    })

  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}

// GET /api/admin/inventory/adjust-stock - Get stock movement history
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const type = searchParams.get('type')

    const db = await getDb()
    const stockMovementsCollection = db.collection<StockMovement>('stock_movements')

    // Build query
    const query: any = {}
    if (productId) {
      if (!ObjectId.isValid(productId)) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
      }
      query.productId = productId
    }
    if (type) {
      query.type = type
    }

    const skip = (page - 1) * limit

    // Get stock movements with product details
    const [movements, totalCount] = await Promise.all([
      stockMovementsCollection.aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'products',
            let: { productId: { $toObjectId: '$productId' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$productId'] } } },
              { $project: { name: 1, images: 1 } }
            ],
            as: 'product'
          }
        },
        {
          $addFields: {
            product: { $arrayElemAt: ['$product', 0] }
          }
        }
      ]).toArray(),
      stockMovementsCollection.countDocuments(query)
    ])

    return NextResponse.json({
      movements,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    )
  }
}
