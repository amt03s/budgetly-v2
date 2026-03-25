"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  MessageSquare,
  LogOut,
  Globe,
  CreditCard,
  PiggyBank,
  Repeat,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useCurrency } from "@/lib/currency-context"
import { getCurrencyConfig } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { CurrencyPickerDialog } from "./currency-picker-dialog"
import { ThemeToggle } from "./theme-toggle"
import { useState } from "react"
import { Spinner } from "@/components/ui/spinner"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/recurring", label: "Recurring", icon: Repeat },
  { href: "/dashboard/wallets", label: "Wallets", icon: Wallet },
  { href: "/dashboard/goals", label: "Saving Goals", icon: PiggyBank },
  { href: "/dashboard/debts", label: "Debts", icon: CreditCard },
  { href: "/dashboard/insights", label: "Insights", icon: PieChart },
  { href: "/dashboard/chat", label: "Budge", icon: MessageSquare },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logOut } = useAuth()
  const { currency, isFetchingRate } = useCurrency()
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false)

  const handleLogout = async () => {
    await logOut()
    router.push("/")
  }

  const currencyConfig = getCurrencyConfig(currency)

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <Wallet className="h-4 w-4 text-background" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Budgetly</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-4 flex flex-col gap-2">
          <Link
            href="/dashboard/profile"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
              pathname === "/dashboard/profile"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{user?.displayName || user?.email}</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setCurrencyDialogOpen(true)}
          >
            <Globe className="h-4 w-4" />
            <span className="flex-1 text-left">Currency</span>
            {isFetchingRate ? (
              <Spinner className="h-3 w-3" />
            ) : (
              <span className="text-xs opacity-70">
                {currencyConfig.symbol} {currencyConfig.code}
              </span>
            )}
          </Button>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <CurrencyPickerDialog
        open={currencyDialogOpen}
        onOpenChange={setCurrencyDialogOpen}
      />
    </aside>
  )
}
