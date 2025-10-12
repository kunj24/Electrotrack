import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CART CLEANUP API CALLED ===')
    
    const db = await getDb('electrotrack')
    const cartsCollection = db.collection('carts')

    // Get current indexes
    const indexes = await cartsCollection.indexes()
    console.log('Current indexes:', indexes)

    // Check if userId_1 index exists and drop it
    const userIdIndex = indexes.find(index => index.name === 'userId_1')
    if (userIdIndex) {
      console.log('Dropping userId_1 index...')
      await cartsCollection.dropIndex('userId_1')
      console.log('✓ userId_1 index dropped')
    } else {
      console.log('userId_1 index not found')
    }

    // Clear existing cart data that might have conflicting schema
    console.log('Clearing existing carts collection...')
    const deleteResult = await cartsCollection.deleteMany({})
    console.log('✓ Cleared', deleteResult.deletedCount, 'documents from carts collection')

    // Create new index on userEmail (unique)
    console.log('Creating new index on userEmail...')
    await cartsCollection.createIndex({ userEmail: 1 }, { unique: true })
    console.log('✓ Created unique index on userEmail')

    // Verify new indexes
    const newIndexes = await cartsCollection.indexes()
    console.log('New indexes:', newIndexes)

    return NextResponse.json({
      success: true,
      message: 'Cart collection cleaned up successfully',
      deletedDocuments: deleteResult.deletedCount,
      indexes: newIndexes
    })

  } catch (error: any) {
    console.error('=== CLEANUP ERROR ===')
    console.error('Error:', error)
    return NextResponse.json({
      error: 'Cleanup failed',
      details: error.message
    }, { status: 500 })
  }
}