"use client"

import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamically import the chatbot to avoid loading it on server and in admin pages
const ElectrotrackChatbot = dynamic(() => import("./chatbot"), { ssr: false })

export default function ChatbotGuard() {
  const pathname = usePathname() || ""

  // Hide chatbot on any admin pages (and subroutes)
  if (pathname.startsWith("/admin")) return null

  return <ElectrotrackChatbot />
}
