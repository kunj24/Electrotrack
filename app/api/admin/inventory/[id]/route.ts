import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import {
  Product,
  updateProductSchema,
  ProductStatus,
  validateSKU,
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
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const { id } = params

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const db = await getDb()
    const productsCollection = db.collection<Product>('products')

    const product = await productsCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: { $exists: false }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get stock movement history
    const stockMovements = await db.collection<StockMovement>('stock_movements')
      .find({ productId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    return NextResponse.json({
      product: {
        ...product,
        id: product._id?.toString()
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
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const { id } = params

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

    // Validate SKU format if SKU is being updated
    if (productUpdate.sku && !validateSKU(productUpdate.sku)) {
      return NextResponse.json(
        { error: 'Invalid SKU format. Use 3-50 alphanumeric characters, hyphens, and underscores only.' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const productsCollection = db.collection<Product>('products')

    // Check if product exists
    const existingProduct = await productsCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: { $exists: false }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check for duplicate SKU if SKU is being changed
    if (productUpdate.sku && productUpdate.sku !== existingProduct.sku) {
      const duplicateProduct = await productsCollection.findOne({
        sku: productUpdate.sku,
        _id: { $ne: new ObjectId(id) },
        deletedAt: { $exists: false }
      })

      if (duplicateProduct) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 409 }
        )
      }
    }

    // Track stock changes for audit
    let stockMovement: Omit<StockMovement, '_id'> | null = null
    if (productUpdate.quantity !== undefined && productUpdate.quantity !== existingProduct.quantity) {
      stockMovement = {
        productId: id,
        productSku: existingProduct.sku,
        type: 'adjustment',
        quantity: productUpdate.quantity - existingProduct.quantity,
        previousQuantity: existingProduct.quantity,
        newQuantity: productUpdate.quantity,
        reason: 'Manual inventory adjustment via admin',
        adjustedBy: 'admin', // Replace with actual admin user ID from JWT
        createdAt: new Date()
      }
    }

    // Update product
    const updateResult = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...productUpdate,
          updatedAt: new Date(),
          updatedBy: 'admin' // Replace with actual admin user ID from JWT
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Log stock movement if quantity changed
    if (stockMovement) {
      await db.collection<StockMovement>('stock_movements').insertOne(stockMovement)
    }

    // Fetch and return updated product
    const updatedProduct = await productsCollection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      product: {
        ...updatedProduct,
        id: updatedProduct?._id?.toString()
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
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const { id } = params

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const db = await getDb()
    const productsCollection = db.collection<Product>('products')

    // Check if product exists and is not already deleted
    const existingProduct = await productsCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: { $exists: false }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Soft delete the product
    const updateResult = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          deletedAt: new Date(),
          status: ProductStatus.ARCHIVED,
          updatedAt: new Date(),
          updatedBy: 'admin' // Replace with actual admin user ID from JWT
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
