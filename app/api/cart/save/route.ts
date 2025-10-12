import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

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