import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const db = await getDb()

    // Clear existing collections (except users and carts)
    const collectionsToKeep = ['users', 'carts']
    const allCollections = await db.listCollections().toArray()

    for (const collection of allCollections) {
      if (!collectionsToKeep.includes(collection.name)) {
        await db.collection(collection.name).deleteMany({})
      }
    }

    // 1. PRODUCTS Collection - Electronics inventory
    const products = [
      {
        name: "Bajaj Bahar 1200mm Ceiling Fan",
        sku: "BAJ-BAHAR-1200",
        category: "Fans",
        brand: "Bajaj",
        price: 2499,
        originalPrice: 2999,
        discountPercentage: 17,
        description: "High-speed ceiling fan with aerodynamic blade design",
        images: ["/placeholder.jpg"],
        quantity: 50,
        minStockLevel: 10,
        maxStockLevel: 100,
        isFeatured: false,
        status: "active",
        rating: 4.5,
        reviews: 128,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Bajaj Platini 50L Desert Cooler",
        sku: "BAJ-PLATINI-50L",
        category: "Coolers",
        brand: "Bajaj",
        price: 7499,
        originalPrice: 8999,
        discountPercentage: 17,
        description: "High-performance cooler with 4-way air deflection",
        images: ["/placeholder.jpg"],
        quantity: 30,
        minStockLevel: 5,
        maxStockLevel: 50,
        isFeatured: false,
        status: "active",
        rating: 4.4,
        reviews: 76,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Daikin 1.5 Ton 3 Star Inverter Split AC",
        sku: "DAIKIN-1.5T-3STAR",
        category: "Air Conditioners",
        brand: "Daikin",
        price: 38999,
        originalPrice: 44999,
        discountPercentage: 13,
        description: "Reliable inverter AC with PM 2.5 filter",
        images: ["/placeholder.jpg"],
        quantity: 15,
        minStockLevel: 3,
        maxStockLevel: 30,
        isFeatured: true,
        status: "active",
        rating: 4.7,
        reviews: 98,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "LG 1.5 Ton 5 Star Inverter Split AC",
        sku: "LG-1.5T-5STAR",
        category: "Air Conditioners",
        brand: "LG",
        price: 36999,
        originalPrice: 42999,
        discountPercentage: 14,
        description: "Energy-efficient inverter AC with dual inverter technology",
        images: ["/placeholder.jpg"],
        quantity: 12,
        minStockLevel: 3,
        maxStockLevel: 25,
        isFeatured: true,
        status: "active",
        rating: 4.6,
        reviews: 156,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "LG 55\" 4K UHD Smart LED TV",
        sku: "LG-55-4K-UHD",
        category: "Televisions",
        brand: "LG",
        price: 48999,
        originalPrice: 54999,
        discountPercentage: 11,
        description: "Stunning 4K display with webOS and ThinQ AI",
        images: ["/placeholder.jpg"],
        quantity: 8,
        minStockLevel: 2,
        maxStockLevel: 15,
        isFeatured: true,
        status: "active",
        rating: 4.8,
        reviews: 145,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Orient Electric 1200mm Ceiling Fan",
        sku: "ORIENT-1200MM",
        category: "Fans",
        brand: "Orient Electric",
        price: 2799,
        originalPrice: 3299,
        discountPercentage: 15,
        description: "Premium ceiling fan with decorative design",
        images: ["/placeholder.jpg"],
        quantity: 40,
        minStockLevel: 8,
        maxStockLevel: 80,
        isFeatured: false,
        status: "active",
        rating: 4.5,
        reviews: 92,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Samsung 43\" Crystal 4K UHD Smart TV",
        sku: "SAMSUNG-43-CRYSTAL-4K",
        category: "Televisions",
        brand: "Samsung",
        price: 32999,
        originalPrice: 38999,
        discountPercentage: 15,
        description: "Crystal clear 4K UHD display with smart features",
        images: ["/placeholder.jpg"],
        quantity: 10,
        minStockLevel: 2,
        maxStockLevel: 20,
        isFeatured: false,
        status: "active",
        rating: 4.7,
        reviews: 89,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Symphony Desert 70L Air Cooler",
        sku: "SYMPHONY-DESERT-70L",
        category: "Coolers",
        brand: "Symphony",
        price: 8999,
        originalPrice: 10999,
        discountPercentage: 18,
        description: "Large capacity desert cooler with powerful air throw",
        images: ["/placeholder.jpg"],
        quantity: 20,
        minStockLevel: 4,
        maxStockLevel: 40,
        isFeatured: false,
        status: "active",
        rating: 4.3,
        reviews: 67,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "V-Guard VG 400 Fan Regulator",
        sku: "VGUARD-VG-400",
        category: "Regulators",
        brand: "V-Guard",
        price: 299,
        originalPrice: 399,
        discountPercentage: 25,
        description: "5-step electronic fan speed regulator",
        images: ["/placeholder.jpg"],
        quantity: 100,
        minStockLevel: 20,
        maxStockLevel: 200,
        isFeatured: false,
        status: "active",
        rating: 4.2,
        reviews: 234,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "V-Guard VWI 400 Voltage Stabilizer",
        sku: "VGUARD-VWI-400",
        category: "Stabilizers",
        brand: "V-Guard",
        price: 2499,
        originalPrice: 2999,
        discountPercentage: 17,
        description: "Wide working range voltage stabilizer",
        images: ["/placeholder.jpg"],
        quantity: 25,
        minStockLevel: 5,
        maxStockLevel: 50,
        isFeatured: false,
        status: "active",
        rating: 4.6,
        reviews: 112,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      }
    ]

    await db.collection('products').insertMany(products as any)

    // 2. CATEGORIES Collection - Product categories
    const categories = [
      {
        _id: "cat_fans",
        name: "Fans",
        slug: "fans",
        displayName: "Ceiling Fans",
        description: "High-quality ceiling fans for home and office",
        image: "/placeholder.jpg",
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: "cat_coolers",
        name: "Coolers",
        slug: "coolers",
        displayName: "Air Coolers",
        description: "Desert and room air coolers",
        image: "/placeholder.jpg",
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: "cat_ac",
        name: "Air Conditioners",
        slug: "air-conditioners",
        displayName: "Air Conditioners",
        description: "Split and window ACs with inverter technology",
        image: "/placeholder.jpg",
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: "cat_tv",
        name: "Televisions",
        slug: "televisions",
        displayName: "Smart TVs",
        description: "4K UHD Smart LED TVs",
        image: "/placeholder.jpg",
        isActive: true,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: "cat_regulators",
        name: "Regulators",
        slug: "regulators",
        displayName: "Fan Regulators",
        description: "Electronic fan speed regulators",
        image: "/placeholder.jpg",
        isActive: true,
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: "cat_stabilizers",
        name: "Stabilizers",
        slug: "stabilizers",
        displayName: "Voltage Stabilizers",
        description: "Voltage stabilizers for appliances",
        image: "/placeholder.jpg",
        isActive: true,
        sortOrder: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    await db.collection('categories').insertMany(categories as any)

    // Get collection counts
    const collections = await db.listCollections().toArray()
    const counts: Record<string, number> = {}

    for (const collection of collections) {
      counts[collection.name] = await db.collection(collection.name).countDocuments()
    }

    return NextResponse.json({
      success: true,
      message: "Radhika Electronics database created successfully!",
      collectionsCreated: {
        products: products.length,
        categories: categories.length
      },
      totalCollections: collections.length,
      allCollections: counts,
      summary: {
        totalProducts: products.length,
        totalCategories: categories.length
      }
    })

  } catch (error) {
    console.error('Error creating database collections:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create database collections',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
