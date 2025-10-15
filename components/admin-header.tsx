"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Settings, User, Home, ExternalLink } from "lucide-react"
import { adminAuth } from "@/lib/admin-auth"
import { useToast } from "@/hooks/use-toast"

export function AdminHeader() {
  const [currentAdmin, setCurrentAdmin] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const admin = adminAuth.getCurrentAdmin()
    setCurrentAdmin(admin)
  }, [])

  const handleLogout = () => {
    adminAuth.logout()
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of the admin panel.",
    })
    // Redirect to Radhika Electronics home page instead of admin login
    router.push("/")
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/admin" className="flex items-center space-x-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Owner Panel</h1>
              <p className="text-xs text-gray-500">Radhika Electronics</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/admin"
              className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/inventory"
              className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Inventory
            </Link>
            <Link
              href="/admin/analytics"
              className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Analytics
            </Link>
            <Link
              href="/admin/transactions"
              className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Transactions
            </Link>
            <Link
              href="/admin/transactions/manage"
              className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Manage
            </Link>
          </nav>

          {/* Right side - Visit Store and Admin Profile */}
          <div className="flex items-center space-x-4">
            {/* Visit Store Button */}
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Visit Store</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>

            {/* Admin Profile */}
            {currentAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-red-600 text-white">
                        {currentAdmin.username?.charAt(0)?.toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentAdmin.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">Administrator</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
