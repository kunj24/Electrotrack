"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Star, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { userAuth } from "@/lib/user-auth"
import { CartService, type CartItem } from "@/lib/cart-service"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discountPercentage?: number
  category: string
  subcategory?: string
  brand?: string
  images: string[]
  image?: string
  quantity: number
  rating: number
  reviews: number
  isFeatured: boolean
  inStock: boolean
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Helper function to get the correct image URL for a product
  const getProductImageUrl = (product: Product) => {
    // If product has images array, use the first one
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0]
      // Check if it's already a full URL or relative path starting with /
      if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
        return imageUrl
      }
      // If it's just a filename, assume it's in /uploads/products/
      return `/uploads/products/${imageUrl}`
    }

    // Fallback to legacy image field
    if (product.image) {
      const imageUrl = product.image
      if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
        return imageUrl
      }
      return `/uploads/products/${imageUrl}`
    }

    // Default placeholder
    return "/placeholder.svg"
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        } else {
          toast({
            title: "Error",
            description: "Failed to load products.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        toast({
          title: "Error",
          description: "Failed to load products.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [toast])

  useEffect(() => {
    const checkAuthStatus = () => {
      const loggedIn = userAuth.isLoggedIn()
      const user = userAuth.getCurrentUser()
      setIsLoggedIn(loggedIn)
      setCurrentUser(user)
    }

    checkAuthStatus()
  }, [])

  const categories = [
    { value: "all", label: "All Products" },
    { value: "fans", label: "Fans" },
    { value: "air-conditioners", label: "Air Conditioners" },
    { value: "coolers", label: "Coolers" },
    { value: "accessories", label: "Accessories" },
  ]

  const filteredProducts = products
    .filter((product) => {
      // Exclude specific products from the customer dashboard
      const excludedNames = new Set([
        "crompton highflo 1200mm ceiling fan",
        "voltas 1 ton 3 star split ac",
      ])

      const name = (product.name || "").toLowerCase().trim()
      if (excludedNames.has(name)) return false

      return (
        (selectedCategory === "all" || product.category === selectedCategory) &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const addToCart = async (product: (typeof products)[0]) => {
    if (!isLoggedIn || !currentUser) {
      toast({
        title: "Login required",
        description: "Please login to add items to cart.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // Check if product is in stock
    if (!product.inStock || product.quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock and cannot be added to cart.",
        variant: "destructive",
      })
      return
    }

    if (!product || !product.id || !product.name || typeof product.price !== 'number') {
      toast({
        title: "Invalid product",
        description: "Unable to add this product to cart.",
        variant: "destructive",
      })
      return
    }

    try {
      // Get current cart
      const currentCart = await CartService.getCart(currentUser.email)

      // Check if item already exists in cart
      const existingItemIndex = currentCart.findIndex(item => item.id === product.id.toString())

      let updatedCart: CartItem[]
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        updatedCart = currentCart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: product.id.toString(),
          name: product.name,
          price: product.price,
          quantity: 1,
          image: getProductImageUrl(product),
          category: product.category
        }
        updatedCart = [...currentCart, newItem]
      }

      // Save updated cart
      console.log('Saving cart for user:', currentUser.email, 'with items:', updatedCart)
      const success = await CartService.saveCart(currentUser.email, updatedCart)

      if (success) {
        console.log('Cart saved successfully, dispatching cartUpdated event')
        toast({
          title: "Added to cart!",
          description: `${product.name} has been added to your cart.`,
        })

        // Trigger header refresh by dispatching a custom event
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      } else {
        toast({
          title: "Failed to add to cart",
          description: "Unable to save cart. Please check your connection and try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Add to cart error:', error)
      toast({
        title: "Failed to add to cart",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Our Electronics Collection</h1>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
            <Card key={product.id} className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${!product.inStock ? 'opacity-75 border-red-200' : ''} flex flex-col h-full`}>
              <CardHeader className="p-0">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-t-lg">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className={`w-full h-full object-contain p-2 transition-transform hover:scale-105 ${!product.inStock ? 'grayscale' : ''}`}
                    style={{
                      objectFit: 'contain',
                      mixBlendMode: 'multiply'
                    }}
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                  />
                  {product.originalPrice && product.originalPrice > product.price && (
                    <Badge className="absolute top-2 left-2 bg-red-500">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                  {!product.inStock && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 flex flex-col flex-1">
                <CardTitle className="text-lg mb-2 min-h-[3.5rem] overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</CardTitle>
                <CardDescription className="mb-3 text-sm text-gray-600 flex-1 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.description}</CardDescription>

                {!product.inStock && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm font-medium">This product is currently out of stock</p>
                  </div>
                )}

                {product.inStock && product.quantity <= 5 && (
                  <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-orange-700 text-sm font-medium">Only {product.quantity} stock available</p>
                  </div>
                )}

                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{product.rating}</span>
                    <span className="ml-1 text-sm text-gray-600">({product.reviews} reviews)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">₹{product.price.toLocaleString()}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  className={`w-full ${!product.inStock ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''}`}
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
