"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AppSidebar } from "./app-sidebar"
import { MobileNav } from "./mobile-nav"
import { Spinner } from "@/components/ui/spinner"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <main className="flex-1 pb-20 md:ml-64 md:pb-0">
        <div className="container mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
