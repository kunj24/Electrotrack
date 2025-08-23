import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  parentCategory: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional()
})

// Get categories
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const parentCategory = url.searchParams.get('parent')
    const activeOnly = url.searchParams.get('activeOnly') !== 'false'
    
    const db = await getDb()
    const categories = db.collection('categories')
    
    // Build query
    const query: any = {}
    
    if (activeOnly) {
      query.isActive = { $ne: false }
    }
    
    if (parentCategory) {
      query.parentCategory = parentCategory
    } else if (parentCategory === null) {
      query.parentCategory = { $exists: false }
    }
    
    const categoryList = await categories.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .toArray()
    
    // Get product counts for each category
    const products = db.collection('products')
    const categoriesWithCounts = await Promise.all(
      categoryList.map(async (category) => {
        const productCount = await products.countDocuments({
          category: category.slug,
          isActive: { $ne: false }
        })
        
        return {
          ...category,
          productCount
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts
    })
    
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate category data
    const validatedData = categorySchema.parse(body)
    
    const db = await getDb()
    const categories = db.collection('categories')
    
    // Check if slug already exists
    const existingCategory = await categories.findOne({ slug: validatedData.slug })
    if (existingCategory) {
      return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 })
    }
    
    // Create category record
    const newCategory = {
      ...validatedData,
      isActive: validatedData.isActive ?? true,
      sortOrder: validatedData.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await categories.insertOne(newCategory)
    
    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      categoryId: result.insertedId,
      category: newCategory
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Create category error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoryId, ...updateData } = body
    
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    
    const db = await getDb()
    const categories = db.collection('categories')
    
    const result = await categories.updateOne(
      { _id: categoryId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category updated successfully'
    })
    
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
