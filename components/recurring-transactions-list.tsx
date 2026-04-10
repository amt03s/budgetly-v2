// Management view for recurring transaction templates: displays schedules, supports pause/resume/delete, and lets users trigger a manual run.

"use client"

import { useMemo, useState } from "react"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { getTransactionCategoryLabel } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pause, Play, Trash2, Zap, Repeat } from "lucide-react"

function formatDate(dateString: string): string {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatFrequency(frequency: "daily" | "weekly" | "monthly" | "yearly"): string {
  if (frequency === "daily") {
    return "Daily"
  }

  if (frequency === "weekly") {
    return "Weekly"
  }

  if (frequency === "monthly") {
    return "Monthly"
  }

  return "Yearly"
}

export function RecurringTransactionsList() {
  const {
    recurringTemplates,
    wallets,
    toggleRecurringTemplatePaused,
    runRecurringTemplateNow,
    deleteRecurringTemplate,
  } = useBudget()
  const { formatAmount } = useCurrency()
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null)

  const sortedTemplates = useMemo(() => {
    return [...recurringTemplates].sort((a, b) => a.nextRunDate.localeCompare(b.nextRunDate))
  }, [recurringTemplates])

  const walletById = useMemo(() => {
    const map = new Map<string, string>()
    wallets.forEach((wallet) => {
      map.set(wallet.id, wallet.name)
    })
    return map
  }, [wallets])

  const runAction = async (templateId: string, action: () => Promise<void>) => {
    setBusyTemplateId(templateId)

    try {
      await action()
    } catch (error) {
      console.error("Recurring transaction action failed:", error)
    } finally {
      setBusyTemplateId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Recurring Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTemplates.length === 0 ? (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">
            No recurring transactions yet. Create one by enabling Make this recurring in the Add Transaction form.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedTemplates.map((template) => {
              const disabled = busyTemplateId === template.id
              const categoryLabel = getTransactionCategoryLabel({
                category: template.category,
                customCategory: template.customCategory,
              })

              return (
                <div key={template.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{template.name}</p>
                        <Badge variant={template.isPaused ? "secondary" : "outline"}>
                          {template.isPaused ? "Paused" : "Active"}
                        </Badge>
                        <Badge variant="outline">{formatFrequency(template.frequency)}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {template.type === "income" ? "Income" : "Expense"} • {categoryLabel} • {walletById.get(template.walletId) || "Unknown wallet"}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Next run: {formatDate(template.nextRunDate)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-base font-semibold">{formatAmount(template.amount)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={disabled}
                      onClick={() => runAction(template.id, () => runRecurringTemplateNow(template.id))}
                    >
                      <Zap className="mr-1 h-4 w-4" />
                      Run now
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={disabled}
                      onClick={() =>
                        runAction(template.id, () => toggleRecurringTemplatePaused(template.id, !template.isPaused))
                      }
                    >
                      {template.isPaused ? (
                        <>
                          <Play className="mr-1 h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="mr-1 h-4 w-4" />
                          Pause
                        </>
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" disabled={disabled}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete recurring transaction?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the recurring schedule only. Existing generated transactions will remain in your history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => runAction(template.id, () => deleteRecurringTemplate(template.id))}
                          >
                            Delete schedule
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
