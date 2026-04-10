// Dashboard widget listing upcoming and overdue payment reminders derived from recurring transaction schedules and debt due dates.

"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { getTransactionCategoryLabel } from "@/lib/types"
import { BellRing, CalendarClock, CreditCard, Repeat } from "lucide-react"

interface ReminderItem {
  id: string
  kind: "recurring" | "debt"
  title: string
  subtitle: string
  date: string
  amount: number
  isOverdue: boolean
}

function parseDateOnly(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}

function dateKey(input: Date): string {
  const year = input.getFullYear()
  const month = String(input.getMonth() + 1).padStart(2, "0")
  const day = String(input.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDate(dateString: string): string {
  return parseDateOnly(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function UpcomingReminders() {
  const { recurringTemplates, debts } = useBudget()
  const { formatAmount } = useCurrency()

  const reminders = useMemo(() => {
    const today = parseDateOnly(dateKey(new Date()))
    const nextSevenDays = new Date(today)
    nextSevenDays.setDate(nextSevenDays.getDate() + 7)

    const items: ReminderItem[] = []

    recurringTemplates.forEach((template) => {
      if (template.isPaused) {
        return
      }

      const runDate = parseDateOnly(template.nextRunDate)
      if (runDate > nextSevenDays) {
        return
      }

      const categoryLabel = getTransactionCategoryLabel({
        category: template.category,
        customCategory: template.customCategory,
      })

      items.push({
        id: `recurring-${template.id}`,
        kind: "recurring",
        title: template.name,
        subtitle: `${template.type === "expense" ? "Expense" : "Income"} • ${categoryLabel}`,
        date: template.nextRunDate,
        amount: template.amount,
        isOverdue: runDate < today,
      })
    })

    debts.forEach((debt) => {
      if (debt.status !== "active" || !debt.dueDate) {
        return
      }

      const dueDate = parseDateOnly(debt.dueDate)
      if (dueDate > nextSevenDays) {
        return
      }

      items.push({
        id: `debt-${debt.id}`,
        kind: "debt",
        title: debt.name,
        subtitle: debt.type === "owed_by_me" ? "Debt payment" : "Receivable due",
        date: debt.dueDate,
        amount: Math.max(0, debt.amount - debt.paidAmount),
        isOverdue: dueDate < today,
      })
    })

    return items
      .sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) {
          return a.isOverdue ? -1 : 1
        }

        return a.date.localeCompare(b.date)
      })
      .slice(0, 8)
  }, [recurringTemplates, debts])

  const overdueCount = reminders.filter((item) => item.isOverdue).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Payment Reminders
        </CardTitle>
        <CardDescription>
          Upcoming recurring payments and debt due dates for the next 7 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminders.length === 0 ? (
          <p className="rounded-md border p-3 text-sm text-muted-foreground">
            No due reminders in the next 7 days.
          </p>
        ) : (
          <div className="space-y-3">
            {reminders.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.kind === "recurring" ? (
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant={item.isOverdue ? "destructive" : "outline"}>
                      {item.isOverdue ? "Overdue" : "Upcoming"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-medium">{formatAmount(item.amount)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {overdueCount > 0 ? `${overdueCount} overdue reminder${overdueCount === 1 ? "" : "s"}` : "All reminders are up to date"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/recurring">Recurring</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/debts">Debts</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
