"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, User, Shield, Mail, Lock, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { adminAuth } from "@/lib/admin-auth"

export default function LoginPage() {
  const [userFormData, setUserFormData] = useState({
    email: "",
    password: "",
  })

  const [adminFormData, setAdminFormData] = useState({
    username: "",
    password: "",
  })

  const [showUserPassword, setShowUserPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [userErrors, setUserErrors] = useState<Record<string, string>>({})
  const [adminErrors, setAdminErrors] = useState<Record<string, string>>({})
  const [isUserLoading, setIsUserLoading] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showAdminCredentials, setShowAdminCredentials] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const validateUserForm = () => {
    const newErrors: Record<string, string> = {}

    if (!userFormData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!userFormData.password) {
      newErrors.password = "Password is required"
    }

    setUserErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAdminForm = () => {
    const newErrors: Record<string, string> = {}

    if (!adminFormData.username.trim()) {
      newErrors.username = "Username is required"
    }

    if (!adminFormData.password) {
      newErrors.password = "Password is required"
    }

    setAdminErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateUserForm()) return

    setIsUserLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userFormData.email,
          password: userFormData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user session
        const userSession = {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            businessType: data.user.businessType,
            loginTime: new Date().toISOString(),
          },
        }
        localStorage.setItem("radhika_user_session", JSON.stringify(userSession))

        toast({
          title: "Login successful!",
          description: "Welcome back to Radhika Electronics.",
        })
        // Redirect to user dashboard
        router.push("/dashboard")
      } else {
        setUserErrors({ general: data.error || "Login failed" })
        toast({
          title: "Login failed",
          description: data.error || "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      setUserErrors({ general: "Network error. Please try again." })
      toast({
        title: "Login failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsUserLoading(false)
    }
  }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateAdminForm()) return

    setIsAdminLoading(true)

    // Simulate loading delay
    setTimeout(() => {
      const result = adminAuth.login(adminFormData.username, adminFormData.password)

      if (result.success) {
        toast({
          title: "Admin login successful!",
          description: `Welcome back, ${result.user?.name}`,
        })
        router.push("/admin")
      } else {
        setAdminErrors({ general: result.error || "Login failed" })
      }

      setIsAdminLoading(false)
    }, 1000)
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)

    // Simulate Google OAuth process
    setTimeout(() => {
      const googleUser = {
        email: "user@gmail.com",
        name: "Google User",
        picture: "https://via.placeholder.com/40",
        loginTime: new Date().toISOString(),
        provider: "google",
      }

      // Store user session
      const userSession = {
        user: googleUser,
      }
      localStorage.setItem("radhika_user_session", JSON.stringify(userSession))

      setIsGoogleLoading(false)
      toast({
        title: "Google login successful!",
        description: "Welcome to Radhika Electronics via Google.",
      })
      router.push("/dashboard")
    }, 2000)
  }

  const handleUserInputChange = (field: string, value: string) => {
    setUserFormData((prev) => ({ ...prev, [field]: value }))
    if (userErrors[field]) {
      setUserErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleAdminInputChange = (field: string, value: string) => {
    setAdminFormData((prev) => ({ ...prev, [field]: value }))
    if (adminErrors[field]) {
      setAdminErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const fillAdminCredentials = (username: string, password: string) => {
    setAdminFormData({ username, password })
    setAdminErrors({})
  }

  const adminCredentials = adminAuth.getAdminCredentials()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-600">Welcome Back</CardTitle>
              <CardDescription>Choose your login type and enter your credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="user" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Customer</span>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </TabsTrigger>
                </TabsList>

                {/* Customer Login */}
                <TabsContent value="user" className="space-y-4 mt-6">
                  <div className="text-center mb-4">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <User className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Customer Login</h3>
                    <p className="text-sm text-gray-600">Access your account and orders</p>
                  </div>

                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    {userErrors.general && (
                      <Alert variant="destructive">
                        <AlertDescription>{userErrors.general}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <Label htmlFor="user-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="user-email"
                          type="email"
                          placeholder="Enter your email"
                          value={userFormData.email}
                          onChange={(e) => handleUserInputChange("email", e.target.value)}
                          className={`pl-10 ${userErrors.email ? "border-red-500" : ""}`}
                          disabled={isUserLoading}
                        />
                      </div>
                      {userErrors.email && <p className="text-red-500 text-sm mt-1">{userErrors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="user-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="user-password"
                          type={showUserPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={userFormData.password}
                          onChange={(e) => handleUserInputChange("password", e.target.value)}
                          className={`pl-10 pr-10 ${userErrors.password ? "border-red-500" : ""}`}
                          disabled={isUserLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowUserPassword(!showUserPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={isUserLoading}
                        >
                          {showUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {userErrors.password && <p className="text-red-500 text-sm mt-1">{userErrors.password}</p>}
                    </div>

                    <div className="flex justify-between items-center">
                      <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button type="submit" className="w-full" disabled={isUserLoading}>
                      {isUserLoading ? "Logging in..." : "Login as Customer"}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <Separator className="my-4" />
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoading}
                    >
                      {isGoogleLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Signing in with Google...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Admin Login */}
                <TabsContent value="admin" className="space-y-4 mt-6">
                  <div className="text-center mb-4">
                    <div className="bg-red-100 text-red-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Admin Login</h3>
                    <p className="text-sm text-gray-600">Access admin dashboard and controls</p>
                  </div>

                  <form onSubmit={handleAdminSubmit} className="space-y-4">
                    {adminErrors.general && (
                      <Alert variant="destructive">
                        <AlertDescription>{adminErrors.general}</AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="admin-username">Admin Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="admin-username"
                          type="text"
                          placeholder="Enter admin username"
                          value={adminFormData.username}
                          onChange={(e) => handleAdminInputChange("username", e.target.value)}
                          className={`pl-10 ${adminErrors.username ? "border-red-500" : ""}`}
                          disabled={isAdminLoading}
                        />
                      </div>
                      {adminErrors.username && <p className="text-red-500 text-sm mt-1">{adminErrors.username}</p>}
                    </div>

                    <div>
                      <Label htmlFor="admin-password">Admin Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="admin-password"
                          type={showAdminPassword ? "text" : "password"}
                          placeholder="Enter admin password"
                          value={adminFormData.password}
                          onChange={(e) => handleAdminInputChange("password", e.target.value)}
                          className={`pl-10 pr-10 ${adminErrors.password ? "border-red-500" : ""}`}
                          disabled={isAdminLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={isAdminLoading}
                        >
                          {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {adminErrors.password && <p className="text-red-500 text-sm mt-1">{adminErrors.password}</p>}
                    </div>

                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isAdminLoading}>
                      {isAdminLoading ? "Signing in..." : "Login as Admin"}
                    </Button>
                  </form>

                  {/* Admin Demo Credentials */}
                  <Card className="mt-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        Demo Admin Credentials
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-left justify-start bg-transparent mb-3"
                        onClick={() => setShowAdminCredentials(!showAdminCredentials)}
                      >
                        {showAdminCredentials ? "Hide" : "Show"} Available Admin Accounts
                      </Button>

                      {showAdminCredentials && (
                        <div className="space-y-2 text-sm">
                          {adminCredentials.map((cred, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-red-600">{cred.name}</span>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  {cred.role === "super_admin" ? "Super Admin" : "Admin"}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600">Username:</span>
                                  <div className="font-mono bg-white p-1 rounded border">{cred.username}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Password:</span>
                                  <div className="font-mono bg-white p-1 rounded border">{cred.password}</div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2 bg-transparent"
                                onClick={() => fillAdminCredentials(cred.username, cred.password)}
                              >
                                Use These Credentials
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-blue-600 hover:underline">
                    Sign up here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>🔒 Your data is secure and encrypted</p>
            <p>Admin access is logged and monitored</p>
          </div>
        </div>
      </div>
    </div>
  )
}
