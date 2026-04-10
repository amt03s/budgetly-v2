// Recharts-powered insight charts: a pie chart for spending by category and a line chart for income vs. expense trends, filterable by time period.

"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { getTransactionCategoryLabel, type Category } from "@/lib/types"
import { isDateInPeriod, type TimePeriod } from "@/lib/time-period"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const COLORS = [
  "#000000",
  "#333333",
  "#555555",
  "#777777",
  "#999999",
  "#AAAAAA",
  "#BBBBBB",
  "#CCCCCC",
]

export function InsightsCharts() {
  const { transactions } = useBudget()
  const { formatAmount } = useCurrency()
  const [period, setPeriod] = useState<TimePeriod>("monthly")

  const filteredTransactions = useMemo(
    () => transactions.filter((transaction) => isDateInPeriod(transaction.date, period)),
    [transactions, period]
  )

  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === "expense" && !t.transferId)
    const categoryTotals: Record<string, number> = {}

    expenses.forEach((t) => {
      const label = getTransactionCategoryLabel(t)
      categoryTotals[label] = (categoryTotals[label] || 0) + t.amount
    })

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions])

  const timelineData = useMemo(() => {
    const dailyTotals: Record<string, { date: string; income: number; expenses: number }> = {}

    filteredTransactions.forEach((t) => {
      if (t.transferId) {
        return
      }

      if (!dailyTotals[t.date]) {
        dailyTotals[t.date] = { date: t.date, income: 0, expenses: 0 }
      }
      if (t.type === "income") {
        dailyTotals[t.date].income += t.amount
      } else {
        dailyTotals[t.date].expenses += t.amount
      }
    })

    return Object.values(dailyTotals)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
  }, [filteredTransactions])

  const totalExpenses = categoryData.reduce((sum, item) => sum + item.value, 0)

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

      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No expense data to display
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6 lg:flex-row">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {categoryData.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({Math.round((item.value / totalExpenses) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No data to display
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e5e5" }}
                />
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
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ fill: "#16a34a", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ fill: "#dc2626", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
