// Cart persistence utilities
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
}

export interface Cart {
  _id?: string
  userEmail: string
  items: CartItem[]
  totalAmount: number
  createdAt: Date
  updatedAt: Date
}

export class CartService {
  static calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  static async saveCart(userEmail: string, items: CartItem[]): Promise<boolean> {
    try {
      const totalAmount = this.calculateTotal(items)
      
      const response = await fetch('/api/cart/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          items,
          totalAmount
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error saving cart:', error)
      return false
    }
  }

  static async getCart(userEmail: string): Promise<CartItem[]> {
    try {
      const response = await fetch(`/api/cart/get?userEmail=${encodeURIComponent(userEmail)}`)
      
      if (response.ok) {
        const data = await response.json()
        return data.items || []
      }
      
      return []
    } catch (error) {
      console.error('Error retrieving cart:', error)
      return []
    }
  }

  static async clearCart(userEmail: string): Promise<boolean> {
    try {
      const response = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail }),
      })

      return response.ok
    } catch (error) {
      console.error('Error clearing cart:', error)
      return false
    }
  }
}