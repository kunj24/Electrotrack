interface AdminUser {
  id: string
  username: string
  password: string
  name: string
  role: "super_admin" | "admin"
  email: string
  lastLogin?: Date
}

interface AuthResult {
  success: boolean
  user?: AdminUser
  error?: string
}

class AdminAuthService {
  private readonly STORAGE_KEY = "radhika_admin_session"
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  private adminUsers: AdminUser[] = [
    {
      id: "1",
      username: "admin",
      password: "radhika2024",
      name: "Jayeshbhai Savaliya",
      role: "super_admin",
      email: "jayeshsavaliya3011@gmail.com",
    },
    {
      id: "2",
      username: "jayesh",
      password: "jayesh123",
      name: "Jayeshbhai Savaliya",
      role: "admin",
      email: "jayeshsavaliya3011@gmail.com",
    },
    {
      id: "3",
      username: "radhika",
      password: "electronics2024",
      name: "Radhika Electronics Admin",
      role: "admin",
      email: "admin@radhikaelectronics.com",
    },
  ]

  login(username: string, password: string): AuthResult {
    const user = this.adminUsers.find((u) => u.username === username && u.password === password)

    if (!user) {
      return {
        success: false,
        error: "Invalid username or password",
      }
    }

    // Create session
    const session = {
      user: { ...user, password: undefined }, // Don't store password in session
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.SESSION_DURATION).toISOString(),
    }

    // Store in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))
    }

    return {
      success: true,
      user,
    }
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false

    const sessionData = localStorage.getItem(this.STORAGE_KEY)
    if (!sessionData) return false

    try {
      const session = JSON.parse(sessionData)
      const now = new Date()
      const expiresAt = new Date(session.expiresAt)

      if (now > expiresAt) {
        this.logout()
        return false
      }

      return true
    } catch {
      this.logout()
      return false
    }
  }

  getCurrentUser(): AdminUser | null {
    if (!this.isAuthenticated()) return null

    const sessionData = localStorage.getItem(this.STORAGE_KEY)
    if (!sessionData) return null

    try {
      const session = JSON.parse(sessionData)
      return session.user
    } catch {
      return null
    }
  }

  // Alias for getCurrentUser to maintain compatibility
  getCurrentAdmin(): AdminUser | null {
    return this.getCurrentUser()
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    return user?.role === role || user?.role === "super_admin"
  }

  getAdminCredentials() {
    return this.adminUsers.map((user) => ({
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
    }))
  }
}

export const adminAuth = new AdminAuthService()
