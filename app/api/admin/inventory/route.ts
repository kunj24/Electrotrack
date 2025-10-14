import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import {
  Product,
  ProductFilters,
  ProductStats,
  createProductSchema,
  updateProductSchema,
  ProductStatus,
  validateSKU,
  isLowStock,
  isOutOfStock
} from '@/lib/models/product'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

// Admin role verification middleware
function verifyAdminRole(request: NextRequest): { isValid: boolean; error?: string } {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Missing or invalid authorization header' }
  }

  // In production, verify JWT token and admin role here
  // For now, we'll simulate admin validation
  const token = authHeader.replace('Bearer ', '')

  // Mock validation - replace with actual JWT verification
  if (!token || token === 'invalid') {
    return { isValid: false, error: 'Invalid or expired token' }
  }

  return { isValid: true }
}

// GET /api/admin/inventory - List products with filters and pagination
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const filters: ProductFilters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      brand: searchParams.get('brand') || undefined,
      status: (searchParams.get('status') as ProductStatus) || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      lowStock: searchParams.get('lowStock') === 'true',
      featured: searchParams.get('featured') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Max 100 items per page
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    const db = await getDb()
    const productsCollection = db.collection<Product>('products')

    // Build MongoDB query
    const query: any = {}

    // Exclude soft-deleted products
    query.deletedAt = { $exists: false }

    // Search functionality
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { brand: { $regex: filters.search, $options: 'i' } }
      ]
    }

    // Category filters
    if (filters.category) query.category = filters.category
    if (filters.subcategory) query.subcategory = filters.subcategory
    if (filters.brand) query.brand = filters.brand
    if (filters.status) query.status = filters.status
    if (filters.featured !== undefined) query.isFeatured = filters.featured

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {}
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice
    }

    // Low stock filter
    if (filters.lowStock) {
      query.$expr = { $lte: ['$quantity', '$minStockLevel'] }
    }

    // Build sort object
    const sort: any = {}
    sort[filters.sortBy!] = filters.sortOrder === 'asc' ? 1 : -1

    // Execute queries
    const skip = (filters.page! - 1) * filters.limit!

    const [products, totalCount] = await Promise.all([
      productsCollection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(filters.limit!)
        .toArray(),
      productsCollection.countDocuments(query)
    ])

    // Calculate stats for the filtered results
    const stats = await calculateProductStats(productsCollection, query)

    // Transform products to include computed fields
    const transformedProducts = products.map(product => ({
      ...product,
      id: product._id?.toString(),
      isLowStock: isLowStock(product),
      isOutOfStock: isOutOfStock(product),
      discountPercentage: product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0
    }))

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / filters.limit!)
      },
      stats,
      filters
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/admin/inventory - Create new product
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authCheck = verifyAdminRole(request)
    if (!authCheck.isValid) {
      return NextResponse.json({ error: authCheck.error }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validation = createProductSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const productData = validation.data

    // Validate SKU format
    if (!validateSKU(productData.sku)) {
      return NextResponse.json(
        { error: 'Invalid SKU format. Use 3-50 alphanumeric characters, hyphens, and underscores only.' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const productsCollection = db.collection<Product>('products')

    // Check for duplicate SKU
    const existingProduct = await productsCollection.findOne({
      sku: productData.sku,
      deletedAt: { $exists: false }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 409 }
      )
    }

    // Create product with metadata
    const now = new Date()
    const newProduct: Omit<Product, '_id'> = {
      ...productData,
      createdAt: now,
      updatedAt: now,
      createdBy: 'admin', // Replace with actual admin user ID from JWT
      updatedBy: 'admin'
    }

    const result = await productsCollection.insertOne(newProduct)

    // Fetch and return the created product
    const createdProduct = await productsCollection.findOne({ _id: result.insertedId })

    return NextResponse.json({
      product: {
        ...createdProduct,
        id: createdProduct?._id?.toString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

// Helper function to calculate product statistics
async function calculateProductStats(collection: any, baseQuery: any): Promise<ProductStats> {
  const [
    totalResult,
    statusCounts,
    stockCounts,
    valueResult
  ] = await Promise.all([
    collection.countDocuments(baseQuery),
    collection.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray(),
    collection.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          lowStock: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0]
            }
          },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ['$quantity', 0] }, 1, 0]
            }
          }
        }
      }
    ]).toArray(),
    collection.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          averagePrice: { $avg: '$price' }
        }
      }
    ]).toArray()
  ])

  // Process status counts
  const statusMap = statusCounts.reduce((acc: any, item: any) => {
    acc[item._id] = item.count
    return acc
  }, {})

  const stockData = stockCounts[0] || { lowStock: 0, outOfStock: 0 }
  const valueData = valueResult[0] || { totalValue: 0, averagePrice: 0 }

  return {
    total: totalResult,
    active: statusMap[ProductStatus.ACTIVE] || 0,
    inactive: statusMap[ProductStatus.INACTIVE] || 0,
    draft: statusMap[ProductStatus.DRAFT] || 0,
    archived: statusMap[ProductStatus.ARCHIVED] || 0,
    lowStock: stockData.lowStock,
    outOfStock: stockData.outOfStock,
    totalValue: valueData.totalValue,
    averagePrice: valueData.averagePrice
  }
}
