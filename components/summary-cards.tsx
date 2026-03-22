"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useBudget } from "@/lib/budget-context"
import { formatCurrency } from "@/lib/currency"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

export function SummaryCards() {
  const { totalBalance, totalIncome, totalExpenses } = useBudget()

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
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
              <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
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
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <TrendingDown className="h-6 w-6 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
