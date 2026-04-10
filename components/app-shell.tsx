// Authenticated layout shell: handles auth redirect, currency loading spinner, idle-timeout guard, desktop sidebar, mobile nav, and the top bar with currency/theme controls.

"use client"

import { useAuth } from "@/lib/auth-context"
import { useCurrency } from "@/lib/currency-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppSidebar } from "./app-sidebar"
import { MobileNav } from "./mobile-nav"
import { Spinner } from "@/components/ui/spinner"
import { CurrencyPickerDialog } from "./currency-picker-dialog"
import { IdlePresenceGuard } from "./idle-presence-guard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { Menu, Wallet, Globe, LogOut } from "lucide-react"
import { getCurrencyConfig } from "@/lib/currency"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logOut } = useAuth()
  const { currency, isFirstTime, isLoading: isCurrencyLoading, isFetchingRate } = useCurrency()
  const router = useRouter()
  const currencyConfig = getCurrencyConfig(currency)
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || (user && isCurrencyLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logOut()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen">
      <IdlePresenceGuard />
      <CurrencyPickerDialog
        open={isFirstTime || currencyDialogOpen}
        onOpenChange={setCurrencyDialogOpen}
        required={isFirstTime}
      />
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <main className="flex-1 pb-20 md:ml-64 md:pb-0">
        <div className="container mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6 flex items-center justify-between md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
                <Wallet className="h-4 w-4 text-background" />
              </div>
              <div>
                <p className="text-sm font-semibold">Budgetly</p>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open dashboard menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="md:hidden">
                <SheetHeader>
                  <SheetTitle>{user.displayName || user.email || "Account"}</SheetTitle>
                  <SheetDescription>Quick access to settings and account actions.</SheetDescription>
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Appearance</p>
                      <p className="text-xs text-muted-foreground">Switch light or dark mode</p>
                    </div>
                    <ThemeToggle />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setCurrencyDialogOpen(true)}
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Currency
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isFetchingRate ? "Updating..." : `${currencyConfig.symbol} ${currencyConfig.code}`}
                    </span>
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
