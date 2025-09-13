import { signIn, signOut, getSession } from "next-auth/react"

interface GoogleUser {
  id: string
  email: string
  name: string
  picture?: string
  provider: string
  loginTime: string
}

class GoogleAuthService {
  private readonly STORAGE_KEY = "radhika_user_session"

  async signInWithGoogle() {
    try {
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/dashboard' 
      })
      
      if (result?.error) {
        throw new Error(result.error)
      }
      
      // Get the session after successful sign-in
      const session = await getSession()
      
      if (session?.user) {
        // Store in your existing localStorage format
        const userSession = {
          user: {
            id: (session.user as any).id || session.user.email,
            email: session.user.email!,
            name: session.user.name!,
            picture: session.user.image,
            provider: 'google',
            loginTime: new Date().toISOString(),
          },
        }
        
        if (typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userSession))
        }
        
        return { success: true, user: userSession.user }
      }
      
      return { success: false, error: 'No user session found' }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Google sign-in failed' 
      }
    }
  }

  async signOutFromGoogle() {
    try {
      // Sign out from NextAuth
      await signOut({ redirect: false })
      
      // Clear your localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(this.STORAGE_KEY)
      }
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      }
    }
  }

  async getCurrentGoogleSession() {
    try {
      const session = await getSession()
      return session
    } catch (error) {
      return null
    }
  }
}

export const googleAuth = new GoogleAuthService()
export type { GoogleUser }