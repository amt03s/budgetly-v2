"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBudget } from "@/lib/budget-context"
import { formatCurrency } from "@/lib/currency"
import { getTransactionCategoryLabel } from "@/lib/types"
import { cn } from "@/lib/utils"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function RecentTransactions() {
  const { transactions, getWalletById } = useBudget()

  const recentTransactions = [...transactions]
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateDiff !== 0) {
        return dateDiff
      }

      const createdAtDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0)
      if (createdAtDiff !== 0) {
        return createdAtDiff
      }

      return b.id.localeCompare(a.id)
    })
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        ) : (
          <div className="flex flex-col gap-4">
            {recentTransactions.map((transaction) => {
              const wallet = getWalletById(transaction.walletId)
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">
                      {transaction.description || getTransactionCategoryLabel(transaction)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {wallet?.name} · {formatDate(transaction.date)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      transaction.type === "income"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
