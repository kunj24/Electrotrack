"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { adminAuth } from "@/lib/admin-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Loader2 } from "lucide-react"

interface AdminRouteGuardProps {
  children: React.ReactNode
  requiredRole?: string
}

export function AdminRouteGuard({ children, requiredRole }: AdminRouteGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = adminAuth.isAuthenticated()

      if (!isAuthenticated) {
        router.push("/admin/login")
        return
      }

      if (requiredRole && !adminAuth.hasRole(requiredRole)) {
        router.push("/admin/unauthorized")
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Access</h2>
            <p className="text-gray-600">Please wait while we verify your credentials...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect
  }

  return <>{children}</>
}
