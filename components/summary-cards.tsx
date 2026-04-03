"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { isDateInPeriod, periodLabel, type TimePeriod } from "@/lib/time-period"
import { TrendingUp, TrendingDown, Wallet, CreditCard, HandCoins } from "lucide-react"

export function SummaryCards() {
  const { transactions, totalBalance, totalDebt, totalReceivable } = useBudget()
  const { formatAmount } = useCurrency()
  const [period, setPeriod] = useState<TimePeriod>("monthly")

  const { periodIncome, periodExpenses } = useMemo(() => {
    const scopedTransactions = transactions.filter(
      (transaction) => !transaction.transferId && isDateInPeriod(transaction.date, period)
    )

    const income = scopedTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    const expenses = scopedTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    return {
      periodIncome: income,
      periodExpenses: expenses,
    }
  }, [transactions, period])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as TimePeriod)}
        >
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <Wallet className="h-3 w-3 text-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
          <p className="text-2xl font-bold tracking-tight">{formatAmount(totalBalance)}</p>
          <p className="text-xs text-muted-foreground">Current</p>
        </CardContent>
      </Card>

      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <TrendingUp className="h-3 w-3 text-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Income</p>
          <p className="text-2xl font-bold tracking-tight">{formatAmount(periodIncome)}</p>
          <p className="text-xs text-muted-foreground">{periodLabel(period)}</p>
        </CardContent>
      </Card>

      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <TrendingDown className="h-3 w-3 text-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Expenses</p>
          <p className="text-2xl font-bold tracking-tight">{formatAmount(periodExpenses)}</p>
          <p className="text-xs text-muted-foreground">{periodLabel(period)}</p>
        </CardContent>
      </Card>

      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <CreditCard className="h-3 w-3 text-destructive dark:text-red-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Debt</p>
          <p className="text-2xl font-bold tracking-tight text-destructive dark:text-red-400">{formatAmount(totalDebt)}</p>
          <p className="text-xs text-muted-foreground">Current</p>
        </CardContent>
      </Card>

      <Card className="relative">
        <CardContent className="flex flex-col gap-3 pt-6 pb-5">
          <div className="absolute right-3 bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <HandCoins className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Receivables</p>
          <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">{formatAmount(totalReceivable)}</p>
          <p className="text-xs text-muted-foreground">Current</p>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
