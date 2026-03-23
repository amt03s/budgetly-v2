"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { TrendingUp, TrendingDown, Wallet, CreditCard, HandCoins } from "lucide-react"

export function SummaryCards() {
  const { totalBalance, totalIncome, totalExpenses, totalDebt, totalReceivable } = useBudget()
  const { formatAmount } = useCurrency()

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <Wallet className="h-3 w-3 text-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
          <p className="text-2xl font-bold tracking-tight">{formatAmount(totalBalance)}</p>
        </CardContent>
      </Card>

      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <TrendingUp className="h-3 w-3 text-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Income</p>
          <p className="text-2xl font-bold tracking-tight">{formatAmount(totalIncome)}</p>
        </CardContent>
      </Card>

      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <TrendingDown className="h-3 w-3 text-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold tracking-tight">{formatAmount(totalExpenses)}</p>
        </CardContent>
      </Card>

      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <CreditCard className="h-3 w-3 text-destructive dark:text-red-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Debt</p>
          <p className="text-2xl font-bold tracking-tight text-destructive dark:text-red-400">{formatAmount(totalDebt)}</p>
        </CardContent>
      </Card>

      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <HandCoins className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Receivables</p>
          <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">{formatAmount(totalReceivable)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
