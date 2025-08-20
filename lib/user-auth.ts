interface User {
  email: string
  name: string
  picture?: string
  provider?: string
  loginTime: string
}

interface UserSession {
  user: User
}

class UserAuthService {
  private readonly STORAGE_KEY = "radhika_user_session"

  isLoggedIn(): boolean {
    if (typeof window === "undefined") return false

    const session = localStorage.getItem(this.STORAGE_KEY)
    return !!session
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null

    const sessionData = localStorage.getItem(this.STORAGE_KEY)
    if (!sessionData) return null

    try {
      const session: UserSession = JSON.parse(sessionData)
      return session.user
    } catch {
      return null
    }
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  login(user: User): void {
    if (typeof window !== "undefined") {
      const session: UserSession = { user }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))
    }
  }
}

export const userAuth = new UserAuthService()
