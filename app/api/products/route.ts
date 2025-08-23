import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
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
    const products = db.collection('products')
    
    // Build query
    const query: any = { isActive: { $ne: false } }
    
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
    
    return NextResponse.json({
      success: true,
      products: productList,
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

// Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate product data
    const validatedData = productSchema.parse(body)
    
    const db = await getDb()
    const products = db.collection('products')
    
    // Generate SKU if not provided
    if (!validatedData.sku) {
      validatedData.sku = `PRD-${Date.now()}`
    }
    
    // Create product record
    const newProduct = {
      ...validatedData,
      isActive: validatedData.isActive ?? true,
      isFeatured: validatedData.isFeatured ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      salesCount: 0,
      viewCount: 0
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

// Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, ...updateData } = body
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }
    
    const db = await getDb()
    const products = db.collection('products')
    
    const result = await products.updateOne(
      { _id: productId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
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
