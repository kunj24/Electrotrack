import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { z } from 'zod'
import { Product, ProductStatus } from '@/lib/models/product'

// Customer-facing product schema (simplified)
const customerProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'), // Legacy field for backwards compatibility
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  images: z.array(z.string()).optional(),
  specifications: z.record(z.string()).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional()
})

// Get products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const subcategory = url.searchParams.get('subcategory')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const featured = url.searchParams.get('featured') === 'true'

    const db = await getDb()
    const products = db.collection('inventory')

    // Build query - only show active products to customers
    const query: any = {
      status: 'active',
      quantity: { $gt: 0 } // Only show products in stock
    }

    if (category) {
      query.category = category
    }

    if (subcategory) {
      query.subcategory = subcategory
    }

    if (featured) {
      query.isFeatured = true
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ]
    }

    // Get total count for pagination
    const totalProducts = await products.countDocuments(query)

    // Get products with pagination
    const productList = await products.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    // Transform products for customer-facing API
    const transformedProducts = productList.map(product => ({
      _id: product._id,
      id: product._id?.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      stock: product.quantity, // Legacy field
      quantity: product.quantity,
      images: product.images,
      specifications: product.specifications,
      features: product.features,
      isFeatured: product.isFeatured,
      isActive: product.status === ProductStatus.ACTIVE,
      // Add computed fields
      discountPercentage: product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0,
      inStock: product.quantity > 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }))

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNext: page < Math.ceil(totalProducts / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new product (admin only - should use admin API instead)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate product data
    const validatedData = customerProductSchema.parse(body)

    const db = await getDb()
    const products = db.collection<Product>('products')

    // Create product record with new schema
    const newProduct: Omit<Product, '_id'> = {
      name: validatedData.name,
      description: validatedData.description,
      price: validatedData.price,
      originalPrice: validatedData.originalPrice,
      quantity: validatedData.quantity || validatedData.stock || 0, // Support both fields
      category: validatedData.category,
      subcategory: validatedData.subcategory,
      brand: validatedData.brand,
      status: ProductStatus.ACTIVE,
      images: validatedData.images || [],
      specifications: validatedData.specifications,
      features: validatedData.features,
      minStockLevel: 10,
      maxStockLevel: 1000,
      isFeatured: validatedData.isFeatured || false,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system'
    }

    const result = await products.insertOne(newProduct)

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      productId: result.insertedId,
      product: newProduct
    }, { status: 201 })

  } catch (error: any) {
    console.error('Create product error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update product (admin only - should use admin API instead)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, ...updateData } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const db = await getDb()
    const products = db.collection<Product>('products')

    // Map legacy field names to new schema
    const mappedData: any = { ...updateData }
    if (updateData.stock !== undefined) {
      mappedData.quantity = updateData.stock
      delete mappedData.stock
    }
    if (updateData.isActive !== undefined) {
      mappedData.status = updateData.isActive ? ProductStatus.ACTIVE : ProductStatus.INACTIVE
      delete mappedData.isActive
    }

    const result = await products.updateOne(
      {
        _id: productId,
        deletedAt: { $exists: false }
      },
      {
        $set: {
          ...mappedData,
          updatedAt: new Date(),
          updatedBy: 'system'
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
