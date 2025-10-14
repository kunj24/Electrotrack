import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { Product, ProductStatus } from '@/lib/models/product'
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

// POST /api/admin/inventory/restore/[id] - Restore soft-deleted product
export async function POST(
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

    // Check if product exists and is deleted
    const existingProduct = await productsCollection.findOne({
      _id: new ObjectId(id),
      deletedAt: { $exists: true }
    })

    if (!existingProduct) {
      return NextResponse.json({
        error: 'Product not found or not deleted'
      }, { status: 404 })
    }

    // Check if SKU conflicts with existing active products
    const skuConflict = await productsCollection.findOne({
      sku: existingProduct.sku,
      _id: { $ne: new ObjectId(id) },
      deletedAt: { $exists: false }
    })

    if (skuConflict) {
      return NextResponse.json({
        error: 'Cannot restore: SKU conflicts with existing product'
      }, { status: 409 })
    }

    // Restore the product
    const updateResult = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $unset: { deletedAt: 1 },
        $set: {
          status: ProductStatus.ACTIVE,
          updatedAt: new Date(),
          updatedBy: 'admin' // Replace with actual admin user ID from JWT
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Fetch and return restored product
    const restoredProduct = await productsCollection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      message: 'Product restored successfully',
      product: {
        ...restoredProduct,
        id: restoredProduct?._id?.toString()
      }
    })

  } catch (error) {
    console.error('Error restoring product:', error)
    return NextResponse.json(
      { error: 'Failed to restore product' },
      { status: 500 }
    )
  }
}
