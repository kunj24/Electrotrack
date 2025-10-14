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
        name: "Crompton HighFlo 1200mm Ceiling Fan",
        category: "Fans",
        brand: "Crompton",
        price: 2299,
        originalPrice: 2799,
        discountPercentage: 18,
        description: "High air delivery ceiling fan with elegant design",
        images: ["https://images.unsplash.com/photo-1635946510441-2b608f9c4ac3?w=500"],
        quantity: 45,
        minStockLevel: 9,
        maxStockLevel: 90,
        isFeatured: true,
        status: "active",
        rating: 4.4,
        reviews: 156,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Havells Efficiencia 400mm Table Fan",
        category: "Fans",
        brand: "Havells",
        price: 1899,
        originalPrice: 2299,
        discountPercentage: 17,
        description: "Powerful table fan with high-speed motor and sweep oscillation",
        images: ["https://images.unsplash.com/photo-1590642916589-592cbd44de9e?w=500"],
        quantity: 35,
        minStockLevel: 7,
        maxStockLevel: 70,
        isFeatured: false,
        status: "active",
        rating: 4.3,
        reviews: 98,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Usha Mist Air Icy 400mm Table Fan",
        category: "Fans",
        brand: "Usha",
        price: 2199,
        originalPrice: 2699,
        discountPercentage: 18,
        description: "Table fan with mist spray cooling technology",
        images: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500"],
        quantity: 28,
        minStockLevel: 6,
        maxStockLevel: 55,
        isFeatured: false,
        status: "active",
        rating: 4.5,
        reviews: 87,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: 'Mi 32" HD Ready Smart LED TV',
        category: "Televisions",
        brand: "Mi",
        price: 13999,
        originalPrice: 16999,
        discountPercentage: 18,
        description: "Affordable smart TV with Android TV and built-in streaming apps",
        images: ["https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500"],
        quantity: 12,
        minStockLevel: 2,
        maxStockLevel: 25,
        isFeatured: true,
        status: "active",
        rating: 4.6,
        reviews: 203,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Voltas 1 Ton 3 Star Split AC",
        category: "Air Conditioners",
        brand: "Voltas",
        price: 27999,
        originalPrice: 32999,
        discountPercentage: 15,
        description: "Fixed speed split AC with copper condenser and anti-dust filter",
        images: ["https://images.unsplash.com/photo-1631545806609-7e7c1fb49c2b?w=500"],
        quantity: 8,
        minStockLevel: 2,
        maxStockLevel: 15,
        isFeatured: true,
        status: "active",
        rating: 4.4,
        reviews: 134,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Carrier 2 Ton 3 Star Inverter Split AC",
        category: "Air Conditioners",
        brand: "Carrier",
        price: 45999,
        originalPrice: 52999,
        discountPercentage: 13,
        description: "High capacity inverter AC with advanced cooling technology",
        images: ["https://images.unsplash.com/photo-1582560419892-bc1e38540f3e?w=500"],
        quantity: 5,
        minStockLevel: 1,
        maxStockLevel: 10,
        isFeatured: true,
        status: "active",
        rating: 4.7,
        reviews: 89,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Blue Star 1.5 Ton 5 Star Window AC",
        category: "Air Conditioners",
        brand: "Blue Star",
        price: 29999,
        originalPrice: 34999,
        discountPercentage: 14,
        description: "Window AC with precision cooling and energy saving features",
        images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500"],
        quantity: 6,
        minStockLevel: 1,
        maxStockLevel: 12,
        isFeatured: false,
        status: "active",
        rating: 4.5,
        reviews: 112,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Crompton Ozone 88L Desert Cooler",
        category: "Coolers",
        brand: "Crompton",
        price: 11999,
        originalPrice: 14999,
        discountPercentage: 20,
        description: "Extra large capacity desert cooler for industrial and commercial use",
        images: ["https://images.unsplash.com/photo-1597251816261-dccd7b767c7c?w=500"],
        quantity: 15,
        minStockLevel: 3,
        maxStockLevel: 30,
        isFeatured: false,
        status: "active",
        rating: 4.3,
        reviews: 78,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Orient Electric 30L Personal Cooler",
        category: "Coolers",
        brand: "Orient Electric",
        price: 4999,
        originalPrice: 5999,
        discountPercentage: 17,
        description: "Compact personal cooler with ice chamber for small rooms",
        images: ["https://images.unsplash.com/photo-1616595127405-08f4e65e5ce3?w=500"],
        quantity: 22,
        minStockLevel: 4,
        maxStockLevel: 45,
        isFeatured: false,
        status: "active",
        rating: 4.2,
        reviews: 145,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Kenstar 60L Desert Cooler",
        category: "Coolers",
        brand: "Kenstar",
        price: 7999,
        originalPrice: 9499,
        discountPercentage: 16,
        description: "Efficient desert cooler with powerful cooling and low power consumption",
        images: ["https://images.unsplash.com/photo-1615715616181-6bf766dea4e5?w=500"],
        quantity: 18,
        minStockLevel: 4,
        maxStockLevel: 35,
        isFeatured: false,
        status: "active",
        rating: 4.4,
        reviews: 167,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Anchor Roma Fan Dimmer Regulator",
        category: "Regulators",
        brand: "Anchor",
        price: 349,
        originalPrice: 449,
        discountPercentage: 22,
        description: "Premium rotary fan speed controller with smooth dimming",
        images: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500"],
        quantity: 85,
        minStockLevel: 15,
        maxStockLevel: 170,
        isFeatured: false,
        status: "active",
        rating: 4.1,
        reviews: 298,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Anchor 16A Heavy Duty Extension Board",
        category: "Accessories",
        brand: "Anchor",
        price: 599,
        originalPrice: 799,
        discountPercentage: 25,
        description: "4-socket extension board with individual switches and surge protection",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"],
        quantity: 65,
        minStockLevel: 10,
        maxStockLevel: 130,
        isFeatured: false,
        status: "active",
        rating: 4.3,
        reviews: 412,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Havells Crabtree 6A Socket",
        category: "Accessories",
        brand: "Havells",
        price: 199,
        originalPrice: 249,
        discountPercentage: 20,
        description: "Premium 3-pin power socket with international standard",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"],
        quantity: 120,
        minStockLevel: 25,
        maxStockLevel: 240,
        isFeatured: false,
        status: "active",
        rating: 4.5,
        reviews: 567,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
        updatedBy: "admin"
      },
      {
        name: "Philips 20W LED Tube Light",
        category: "Accessories",
        brand: "Philips",
        price: 299,
        originalPrice: 399,
        discountPercentage: 25,
        description: "Energy-efficient LED tube light for bright and uniform illumination",
        images: ["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500"],
        quantity: 95,
        minStockLevel: 20,
        maxStockLevel: 190,
        isFeatured: false,
        status: "active",
        rating: 4.6,
        reviews: 723,
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
        displayName: "Ceiling & Table Fans",
        description: "High-quality ceiling and table fans for home and office",
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
        description: "Desert and room air coolers for all seasons",
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
        description: "HD and 4K UHD Smart LED TVs",
        image: "/placeholder.jpg",
        isActive: true,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: "cat_accessories",
        name: "Accessories",
        slug: "accessories",
        displayName: "Electrical Accessories",
        description: "Extension boards, sockets, regulators and lighting",
        image: "/placeholder.jpg",
        isActive: true,
        sortOrder: 5,
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
