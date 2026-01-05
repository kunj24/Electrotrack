import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import AuthProvider from "@/components/auth-provider"
// Client-side guard that conditionally renders the chatbot (hides on admin pages)
import ChatbotGuard from "@/components/chatbot-guard"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Radhika Electronics - Premium Electronics Store",
  description: "Your trusted electronics store for fans, TVs, ACs, coolers and more",
    generator: 'v0.dev'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
          <ChatbotGuard />
        </AuthProvider>
      </body>
    </html>
  )
}
