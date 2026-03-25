"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  PiggyBank,
  PieChart,
  MessageSquare,
  Repeat,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Txns", icon: ArrowLeftRight },
  { href: "/dashboard/recurring", label: "Repeat", icon: Repeat },
  { href: "/dashboard/wallets", label: "Wallets", icon: Wallet },
  { href: "/dashboard/goals", label: "Goals", icon: PiggyBank },
  { href: "/dashboard/debts", label: "Debts", icon: CreditCard },
  { href: "/dashboard/insights", label: "Insights", icon: PieChart },
  { href: "/dashboard/chat", label: "Budge", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <ul className="grid grid-cols-9">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                className={cn(
                  "flex h-16 w-full flex-col items-center justify-center gap-1 border-t-2 border-transparent px-1 text-[10px] font-medium leading-none transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-foreground")} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
