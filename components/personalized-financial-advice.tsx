// Card that surfaces rule-based personalised financial advice items (critical → positive) derived from the user's transactions, debts, and goals.

"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { generatePersonalizedAdvice, type AdvicePriority } from "@/lib/personalized-advice"
import { getTransactionCategoryLabel } from "@/lib/types"
import { Bot, Lightbulb } from "lucide-react"

function getBadgeVariant(priority: AdvicePriority): "default" | "secondary" | "destructive" | "outline" {
  if (priority === "critical") {
    return "destructive"
  }

  if (priority === "warning") {
    return "secondary"
  }

  if (priority === "positive") {
    return "default"
  }

  return "outline"
}

function toPriorityLabel(priority: AdvicePriority): string {
  if (priority === "critical") return "Critical"
  if (priority === "warning") return "Warning"
  if (priority === "positive") return "Positive"
  return "Info"
}

export function PersonalizedFinancialAdvice() {
  const {
    transactions,
    debts,
    savingGoals,
    wallets,
    totalIncome,
    totalExpenses,
    totalBalance,
  } = useBudget()
  const { currency } = useCurrency()

  const [loadingAdviceId, setLoadingAdviceId] = useState<string | null>(null)
  const [expandedAdviceId, setExpandedAdviceId] = useState<string | null>(null)
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})

  const adviceItems = useMemo(() => {
    return generatePersonalizedAdvice({
      transactions,
      debts,
      savingGoals,
      totalIncome,
      totalExpenses,
      totalBalance,
    })
  }, [transactions, debts, savingGoals, totalIncome, totalExpenses, totalBalance])

  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {}
    transactions
      .filter((transaction) => transaction.type === "expense" && !transaction.transferId)
      .forEach((transaction) => {
        const label = getTransactionCategoryLabel(transaction)
        spending[label] = (spending[label] ?? 0) + transaction.amount
      })

    return spending
  }, [transactions])

  const financialData = useMemo(
    () => ({
      totalBalance,
      totalIncome,
      totalExpenses,
      walletCount: wallets.length,
      transactionCount: transactions.length,
      categorySpending,
      debtCount: debts.length,
      activeGoalCount: savingGoals.filter((goal) => goal.status === "active").length,
    }),
    [
      totalBalance,
      totalIncome,
      totalExpenses,
      wallets.length,
      transactions.length,
      categorySpending,
      debts.length,
      savingGoals,
    ]
  )

  const requestAiAdvice = async (itemId: string, title: string, description: string, metric: string) => {
    setLoadingAdviceId(itemId)

    try {
      const prompt = `Please expand this financial advice into 3 short, practical next steps tailored to my current data. Advice title: ${title}. Description: ${description}. Supporting metric: ${metric}. Keep it concise and action-oriented.`

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          financialData,
          currency,
        }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const payload = (await response.json()) as { text?: string }
      const explanation = payload.text?.trim() || "No explanation generated."

      setAiExplanations((previous) => ({
        ...previous,
        [itemId]: explanation,
      }))
      setExpandedAdviceId(itemId)
    } catch {
      setAiExplanations((previous) => ({
        ...previous,
        [itemId]: "Budge could not generate an explanation right now. Please try again.",
      }))
      setExpandedAdviceId(itemId)
    } finally {
      setLoadingAdviceId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          <CardTitle>Personalized Financial Advice</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Instant recommendations from your current data, including an ML-based budget forecast, with optional AI explanations from Budge.
        </p>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {adviceItems.map((item) => (
          <div key={item.id} className="rounded-md border p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <Badge variant={getBadgeVariant(item.priority)}>{toPriorityLabel(item.priority)}</Badge>
            </div>

            <p className="text-xs text-muted-foreground">{item.description}</p>
            <p className="mt-2 text-xs font-medium">{item.supportingMetric}</p>

            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => requestAiAdvice(item.id, item.title, item.description, item.supportingMetric)}
                disabled={loadingAdviceId === item.id}
              >
                <Bot className="h-3.5 w-3.5" />
                {loadingAdviceId === item.id ? "Asking Budge..." : "Ask Budge to explain"}
              </Button>
            </div>

            {expandedAdviceId === item.id && aiExplanations[item.id] && (
              <div className="mt-3 rounded-md border bg-muted/40 p-3">
                <p className="whitespace-pre-wrap text-xs text-foreground">{aiExplanations[item.id]}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
