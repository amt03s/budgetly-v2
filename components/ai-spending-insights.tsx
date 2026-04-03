"use client"

import { useMemo } from "react"
import { AlertTriangle, Brain, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { generateSpendingInsights } from "@/lib/spending-insights"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

function getInsightBadgeVariant(priority: "info" | "warning" | "critical" | "positive") {
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

function getAnomalyBadgeVariant(severity: "low" | "medium" | "high") {
  if (severity === "high") {
    return "destructive"
  }

  if (severity === "medium") {
    return "secondary"
  }

  return "outline"
}

export function AiSpendingInsights() {
  const { transactions } = useBudget()
  const { formatAmount } = useCurrency()

  const insightsResult = useMemo(() => {
    return generateSpendingInsights(transactions)
  }, [transactions])

  const timelineData = useMemo(() => {
    return insightsResult.timeline.map((point) => ({
      ...point,
      label: new Date(`${point.date}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }))
  }, [insightsResult.timeline])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>AI Spending Insights</CardTitle>
          </div>
          <Badge variant={insightsResult.riskScore >= 70 ? "destructive" : insightsResult.riskScore >= 40 ? "secondary" : "outline"}>
            Risk score: {insightsResult.riskScore}/100
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Model: {insightsResult.modelName} · {insightsResult.evaluatedExpenseCount} expense records analyzed
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div>
          <p className="mb-2 text-sm font-medium">Anomaly Timeline</p>
          {timelineData.length === 0 ? (
            <p className="rounded-md border p-3 text-sm text-muted-foreground">
              Add more days of expense history to unlock anomaly timeline tracking.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e5e5" }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e5e5" }}
                  tickFormatter={(value) => formatAmount(value, { maximumFractionDigits: 0 })}
                />
                <Tooltip
                  formatter={(value: number) => formatAmount(value)}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="baseline" name="Baseline" stroke="#8b8b8b" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="amount" name="Actual" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Detected Anomalies
          </div>

          {insightsResult.anomalies.length === 0 ? (
            <p className="rounded-md border p-3 text-sm text-muted-foreground">
              No anomalies detected in your current spending history.
            </p>
          ) : (
            <div className="space-y-3">
              {insightsResult.anomalies.slice(0, 4).map((anomaly) => (
                <div key={anomaly.id} className="rounded-md border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{anomaly.title}</p>
                    <Badge variant={getAnomalyBadgeVariant(anomaly.severity)}>{anomaly.severity}</Badge>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">{anomaly.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Observed {formatAmount(anomaly.amount)} vs baseline {formatAmount(anomaly.baselineAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Behavioral Trends
          </div>

          <div className="space-y-3">
            {insightsResult.insights.map((insight) => (
              <div key={insight.id} className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{insight.title}</p>
                  {insight.priority !== "info" && (
                    <Badge variant={getInsightBadgeVariant(insight.priority)}>{insight.priority}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
                <p className="mt-2 text-xs font-medium text-foreground">{insight.supportingMetric}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}
