"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShoppingCart, User, LogOut, Package, Settings, Menu, X, UserCircle } from "lucide-react"
import { userAuth } from "@/lib/user-auth"
import { useToast } from "@/hooks/use-toast"
import { CartService } from "@/lib/cart-service"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [isLoadingCart, setIsLoadingCart] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const fetchCartCount = async (userEmail: string) => {
    if (isLoadingCart) return // Prevent multiple simultaneous requests

    console.log('fetchCartCount called for user:', userEmail)
    setIsLoadingCart(true)
    try {
      const cartItems = await CartService.getCart(userEmail)
      console.log('Retrieved cart items:', cartItems)

      if (cartItems && Array.isArray(cartItems)) {
        const totalItems = cartItems.reduce((total: number, item: any) => total + (item.quantity || 0), 0)
        console.log('Total cart items:', totalItems)
        setCartItemCount(totalItems)
      } else {
        console.log('No cart items found, setting count to 0')
        setCartItemCount(0)
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error)
      setCartItemCount(0)
    } finally {
      setIsLoadingCart(false)
    }
  }

  // Separate effect for initial auth check
  useEffect(() => {
    const checkAuthStatus = () => {
      const loggedIn = userAuth.isLoggedIn()
      const user = userAuth.getCurrentUser()
      setIsLoggedIn(loggedIn)
      setCurrentUser(user)

      // Fetch cart count if user is logged in
      if (loggedIn && user) {
        fetchCartCount(user.email)
      } else {
        setCartItemCount(0)
      }
    }

    checkAuthStatus()
  }, []) // Only run once on mount

  // Separate effect for event listeners
  useEffect(() => {
    // Listen for storage changes to update auth status
    const handleStorageChange = () => {
      const loggedIn = userAuth.isLoggedIn()
      const user = userAuth.getCurrentUser()
      setIsLoggedIn(loggedIn)
      setCurrentUser(user)

      if (loggedIn && user) {
        fetchCartCount(user.email)
      } else {
        setCartItemCount(0)
      }
    }

    // Listen for cart updates
    const handleCartUpdate = () => {
      console.log('cartUpdated event received in header')
      const user = userAuth.getCurrentUser()
      if (user && user.email) {
        console.log('Fetching cart count for user:', user.email)
        fetchCartCount(user.email)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("cartUpdated", handleCartUpdate)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("cartUpdated", handleCartUpdate)
    }
  }, []) // Only run once on mount

  const handleLogout = () => {
    userAuth.logout()
    setIsLoggedIn(false)
    setCurrentUser(null)
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    })
    router.push("/")
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <span className="font-bold text-xl">RE</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">RADHIKA ELECTRONICS</h1>
              <p className="text-sm text-gray-600">Premium Electronics Store</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 font-medium border-b-2 border-transparent hover:border-blue-600 pb-1"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 font-medium border-b-2 border-transparent hover:border-blue-600 pb-1"
            >
              Products
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-blue-600 font-medium border-b-2 border-transparent hover:border-blue-600 pb-1"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-blue-600 font-medium border-b-2 border-transparent hover:border-blue-600 pb-1"
            >
              Contact
            </Link>
            <Link href="/cart" className="relative">
              <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                <ShoppingCart className="h-4 w-4" />
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Authentication Section */}
            {isLoggedIn && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={currentUser.picture || "/placeholder.svg"} alt={currentUser.name} />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {currentUser.name?.charAt(0)?.toUpperCase() ||
                          currentUser.email?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-24 truncate">{currentUser.name || currentUser.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                      {currentUser.provider && (
                        <p className="text-xs leading-none text-blue-600">
                          via {currentUser.provider === "google" ? "Google" : currentUser.provider}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden bg-transparent"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                Home
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                Products
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
                Contact
              </Link>
              <Link href="/cart" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                <ShoppingCart className="h-4 w-4" />
                <span>Cart ({cartItemCount})</span>
              </Link>

              {/* Mobile User Section */}
              {isLoggedIn && currentUser ? (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center space-x-3 mb-3 p-2 bg-gray-50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.picture || "/placeholder.svg"} alt={currentUser.name} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {currentUser.name?.charAt(0)?.toUpperCase() ||
                          currentUser.email?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{currentUser.name || "User"}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                    </div>
                  </div>
                  <Link href="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 py-2">
                    <UserCircle className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <Link href="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 py-2">
                    <Package className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 py-2 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link href="/login" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
