import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

// GET /api/chatbot/products - Get products from inventory for chatbot
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '8')
    const category = searchParams.get('category')

    const db = await getDb()
    const inventoryCollection = db.collection('inventory')

    // Build query for active products only
    const query: any = {
      status: 'active',
      quantity: { $gt: 0 } // Only show products in stock
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' }
    }

    // Get products from inventory
    const products = await inventoryCollection
      .find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit)
      .toArray()

    // Transform for chatbot
    const chatbotProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '🔌',
      description: product.description || 'Quality electronics',
      category: product.category,
      stock: product.quantity || 0,
      brand: product.brand
    }))

    return NextResponse.json({
      success: true,
      products: chatbotProducts,
      total: chatbotProducts.length
    })

  } catch (error) {
    console.error('Chatbot products API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        products: []
      },
      { status: 500 }
    )
  }
}
