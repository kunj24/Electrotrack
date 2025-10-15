import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    console.log('Cart save API called')
    const body = await request.json()
    console.log('Request body:', body)
    const { userEmail, items, totalAmount } = body

    if (!userEmail) {
      console.log('No userEmail provided')
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    console.log('Getting database connection')
    const db = await getDb('electrotrack')
    console.log('Database connected, getting carts collection')
    const cartsCollection = db.collection('carts')
    const inventoryCollection = db.collection('inventory')

    // Validate stock levels for all items
    if (items && items.length > 0) {
      console.log('Validating stock levels for', items.length, 'items')

      for (const item of items) {
        if (!item.id) continue

        const inventoryItem = await inventoryCollection.findOne({ _id: new ObjectId(item.id) })
        if (!inventoryItem) {
          console.log('Item not found in inventory:', item.id)
          return NextResponse.json(
            { error: `Product ${item.name || item.id} is no longer available` },
            { status: 400 }
          )
        }

        if (inventoryItem.quantity <= 0) {
          console.log('Item out of stock:', inventoryItem.name, 'quantity:', inventoryItem.quantity)
          return NextResponse.json(
            { error: `Product ${inventoryItem.name} is currently out of stock` },
            { status: 400 }
          )
        }

        // Check if requested quantity exceeds available stock
        if (item.quantity > inventoryItem.quantity) {
          console.log('Insufficient stock for:', inventoryItem.name, 'requested:', item.quantity, 'available:', inventoryItem.quantity)
          return NextResponse.json(
            { error: `Only ${inventoryItem.quantity} units available for ${inventoryItem.name}` },
            { status: 400 }
          )
        }
      }
    }

    console.log('Performing upsert operation for user:', userEmail)
    // Use replaceOne with upsert to handle database conflicts properly
    // This will completely replace the document, avoiding index conflicts
    try {
      const result = await cartsCollection.replaceOne(
        {
          $or: [
            { userEmail: userEmail },
            { userId: userEmail }
          ]
        },
        {
          userEmail,
          userId: userEmail, // Keep for backward compatibility
          items: items || [],
          totalAmount: totalAmount || 0,
          updatedAt: new Date(),
          createdAt: new Date() // Will be ignored if document exists
        },
        { upsert: true }
      )

      console.log('Cart save result:', result)
      return NextResponse.json({
        success: true,
        message: 'Cart saved successfully',
        cartId: result.upsertedId || 'updated'
      })
    } catch (err: any) {
      // Handle duplicate-key specifically to provide a clearer message
      if (err && err.code === 11000) {
        console.error('Duplicate key error while saving cart. Attempting to delete and recreate:', err)

        // Try to delete existing cart and create new one
        try {
          await cartsCollection.deleteMany({
            $or: [
              { userEmail: userEmail },
              { userId: userEmail }
            ]
          })

          const insertResult = await cartsCollection.insertOne({
            userEmail,
            userId: userEmail,
            items: items || [],
            totalAmount: totalAmount || 0,
            updatedAt: new Date(),
            createdAt: new Date()
          })

          console.log('Cart recreated successfully:', insertResult)
          return NextResponse.json({
            success: true,
            message: 'Cart saved successfully (recreated)',
            cartId: insertResult.insertedId
          })
        } catch (secondError) {
          console.error('Failed to recreate cart:', secondError)
          return NextResponse.json({
            error: 'Cart save failed due to database conflict',
            details: secondError
          }, { status: 500 })
        }
      }

      throw err
    }

  } catch (error) {
    console.error('Error saving cart:', error)
    return NextResponse.json(
      { error: 'Failed to save cart' },
      { status: 500 }
    )
  }
}
