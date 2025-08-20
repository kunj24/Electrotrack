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
import { useRouter } from "next/navigation"

const products = [
  {
    id: 1,
    name: "Bajaj Ceiling Fan 1200mm",
    category: "fans",
    price: 2499,
    originalPrice: 2999,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.5,
    reviews: 128,
    inStock: true,
    description: "High-speed ceiling fan with decorative design",
  },
  {
    id: 2,
    name: 'Samsung 43" Smart TV',
    category: "tvs",
    price: 32999,
    originalPrice: 36999,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.7,
    reviews: 89,
    inStock: true,
    description: "4K Ultra HD Smart LED TV with HDR",
  },
  {
    id: 3,
    name: "LG 1.5 Ton Split AC",
    category: "acs",
    price: 28999,
    originalPrice: 32999,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.6,
    reviews: 156,
    inStock: true,
    description: "Inverter AC with copper condenser",
  },
  {
    id: 4,
    name: "Symphony Desert Air Cooler",
    category: "coolers",
    price: 8999,
    originalPrice: 10999,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.3,
    reviews: 67,
    inStock: true,
    description: "70L capacity with powerful air throw",
  },
  {
    id: 5,
    name: "iPhone 15 128GB",
    category: "mobiles",
    price: 79999,
    originalPrice: 84999,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.8,
    reviews: 234,
    inStock: true,
    description: "Latest iPhone with A17 Pro chip",
  },
  {
    id: 6,
    name: "Dell Inspiron 15 Laptop",
    category: "laptops",
    price: 45999,
    originalPrice: 49999,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.4,
    reviews: 92,
    inStock: true,
    description: "Intel i5, 8GB RAM, 512GB SSD",
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
    { value: "acs", label: "Air Conditioners" },
    { value: "coolers", label: "Coolers" },
    { value: "mobiles", label: "Mobile Phones" },
    { value: "laptops", label: "Laptops" },
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

    try {
      const response = await fetch('/api/user/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.email,
          action: 'add_item',
          item: {
            productId: product.id.toString(),
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image,
            category: product.category
          }
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Added to cart!",
          description: `${product.name} has been added to your cart.`,
        })
        
        // Trigger header refresh by dispatching a custom event
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      } else {
        throw new Error(data.error || 'Failed to add item to cart')
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
