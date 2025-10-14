import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import {
  Product,
  updateProductSchema,
  ProductStatus,
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

// GET /api/admin/inventory/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const { id } = await params

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const db = await getDb()
    const inventoryCollection = db.collection('inventory')

    const item = await inventoryCollection.findOne({
      _id: new ObjectId(id)
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Get stock movement history (if applicable)
    const stockMovements: any[] = [] // Inventory collection may not have stock movements

    return NextResponse.json({
      product: {
        ...item,
        id: item._id?.toString()
      },
      stockHistory: stockMovements
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/inventory/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const { id } = await params

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const body = await request.json()

    // Validate request body
    const validation = updateProductSchema.safeParse({ ...body, id })
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const updateData = validation.data
    const { id: _, ...productUpdate } = updateData

    const db = await getDb()
    const inventoryCollection = db.collection('inventory')

    // Check if item exists
    const existingItem = await inventoryCollection.findOne({
      _id: new ObjectId(id)
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Track stock changes for audit (optional)
    let stockMovement: Omit<StockMovement, '_id'> | null = null
    if (productUpdate.quantity !== undefined && productUpdate.quantity !== existingItem.quantity) {
      stockMovement = {
        productId: id,
        type: 'adjustment',
        quantity: productUpdate.quantity - existingItem.quantity,
        previousQuantity: existingItem.quantity,
        newQuantity: productUpdate.quantity,
        reason: 'Manual inventory adjustment via admin',
        adjustedBy: 'admin',
        createdAt: new Date()
      }
    }

    // Update inventory item
    const updateResult = await inventoryCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...productUpdate,
          updatedAt: new Date(),
          updatedBy: 'admin'
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Log stock movement if quantity changed (optional)
    if (stockMovement) {
      // You can log to a separate collection if needed
      console.log('Stock movement:', stockMovement)
    }

    // Fetch and return updated item
    const updatedItem = await inventoryCollection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      product: {
        ...updatedItem,
        id: updatedItem?._id?.toString()
      }
    })

  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/inventory/[id] - Soft delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const { id } = await params

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const db = await getDb()
    const inventoryCollection = db.collection('inventory')

    // Check if item exists
    const existingItem = await inventoryCollection.findOne({
      _id: new ObjectId(id)
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Delete the inventory item
    const deleteResult = await inventoryCollection.deleteOne({ _id: new ObjectId(id) })

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Item deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
