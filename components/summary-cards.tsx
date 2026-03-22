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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold">{formatAmount(totalBalance)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-6 w-6 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold">{formatAmount(totalIncome)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <TrendingUp className="h-6 w-6 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">{formatAmount(totalExpenses)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <TrendingDown className="h-6 w-6 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Debt</p>
              <p className="text-2xl font-bold text-destructive">{formatAmount(totalDebt)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CreditCard className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receivables</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(totalReceivable)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <HandCoins className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
