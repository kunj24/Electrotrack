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

const products = [
  {
    id: 1,
    name: "Bajaj Bahar 1200mm Ceiling Fan",
    category: "fans",
    price: 2499,
    originalPrice: 2999,
    image: "https://images.unsplash.com/photo-1635946510441-2b608f9c4ac3?w=500",
    rating: 4.5,
    reviews: 128,
    inStock: true,
    description: "High-speed ceiling fan with aerodynamic blade design",
  },
  {
    id: 2,
    name: 'Samsung 43" Crystal 4K UHD Smart TV',
    category: "tvs",
    price: 32999,
    originalPrice: 38999,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500",
    rating: 4.7,
    reviews: 89,
    inStock: true,
    description: "Crystal clear 4K UHD display with smart features",
  },
  {
    id: 3,
    name: "LG 1.5 Ton 5 Star Inverter Split AC",
    category: "air-conditioners",
    price: 36999,
    originalPrice: 42999,
    image: "https://images.unsplash.com/photo-1631545806609-7e7c1fb49c2b?w=500",
    rating: 4.6,
    reviews: 156,
    inStock: true,
    description: "Energy-efficient inverter AC with dual inverter technology",
  },
  {
    id: 4,
    name: "Symphony Desert 70L Air Cooler",
    category: "coolers",
    price: 8999,
    originalPrice: 10999,
    image: "https://images.unsplash.com/photo-1597251816261-dccd7b767c7c?w=500",
    rating: 4.3,
    reviews: 67,
    inStock: true,
    description: "Large capacity desert cooler with powerful air throw",
  },
  {
    id: 5,
    name: "Orient Electric 1200mm Ceiling Fan",
    category: "fans",
    price: 2799,
    originalPrice: 3299,
    image: "https://images.unsplash.com/photo-1590642916589-592cbd44de9e?w=500",
    rating: 4.5,
    reviews: 92,
    inStock: true,
    description: "Premium ceiling fan with decorative design",
  },
  {
    id: 6,
    name: "LG 55\" 4K UHD Smart LED TV",
    category: "tvs",
    price: 48999,
    originalPrice: 54999,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500",
    rating: 4.8,
    reviews: 145,
    inStock: true,
    description: "Stunning 4K display with webOS and ThinQ AI",
  },
  {
    id: 7,
    name: "V-Guard VG 400 Fan Regulator",
    category: "accessories",
    price: 299,
    originalPrice: 399,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500",
    rating: 4.2,
    reviews: 234,
    inStock: true,
    description: "5-step electronic fan speed regulator",
  },
  {
    id: 8,
    name: "Daikin 1.5 Ton 3 Star Inverter Split AC",
    category: "air-conditioners",
    price: 38999,
    originalPrice: 44999,
    image: "https://images.unsplash.com/photo-1582560419892-bc1e38540f3e?w=500",
    rating: 4.7,
    reviews: 98,
    inStock: true,
    description: "Reliable inverter AC with PM 2.5 filter",
  },
  {
    id: 9,
    name: "Bajaj Platini 50L Desert Cooler",
    category: "coolers",
    price: 7499,
    originalPrice: 8999,
    image: "https://images.unsplash.com/photo-1616595127405-08f4e65e5ce3?w=500",
    rating: 4.4,
    reviews: 76,
    inStock: true,
    description: "High-performance cooler with 4-way air deflection",
  },
  {
    id: 10,
    name: "V-Guard VWI 400 Voltage Stabilizer",
    category: "accessories",
    price: 2499,
    originalPrice: 2999,
    image: "https://images.unsplash.com/photo-1615715616181-6bf766dea4e5?w=500",
    rating: 4.6,
    reviews: 112,
    inStock: true,
    description: "Wide working range voltage stabilizer",
  },
]

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

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
    { value: "tvs", label: "TVs" },
    { value: "air-conditioners", label: "Air Conditioners" },
    { value: "coolers", label: "Coolers" },
    { value: "accessories", label: "Accessories" },
  ]

  const filteredProducts = products
    .filter(
      (product) =>
        (selectedCategory === "all" || product.category === selectedCategory) &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
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
          image: product.image,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  {product.originalPrice > product.price && (
                    <Badge className="absolute top-2 left-2 bg-red-500">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                  {!product.inStock && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
                <CardDescription className="mb-3">{product.description}</CardDescription>

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
                    {product.originalPrice > product.price && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <Button className="w-full" onClick={() => addToCart(product)} disabled={!product.inStock}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
