// Algorithms that detect spending anomalies (statistical deviation from baseline) and generate behavioural spending insight messages from transaction history.

import type { Category, Transaction } from "@/lib/types"

type InsightPriority = "info" | "warning" | "critical" | "positive"

type AnomalySeverity = "low" | "medium" | "high"

export interface SpendingAnomaly {
  id: string
  date: string
  title: string
  description: string
  category?: Category
  amount: number
  grossExpenseAmount: number
  sameDayIncomeAmount: number
  baselineAmount: number
  deviationScore: number
  severity: AnomalySeverity
}

export interface SpendingInsight {
  id: string
  title: string
  description: string
  supportingMetric: string
  priority: InsightPriority
}

export interface SpendingInsightsResult {
  modelName: string
  evaluatedExpenseCount: number
  anomalies: SpendingAnomaly[]
  insights: SpendingInsight[]
  riskScore: number
  timeline: Array<{
    date: string
    amount: number
    grossExpense: number
    sameDayIncome: number
    baseline: number
    isAnomaly: boolean
  }>
}

interface ExpensePoint {
  amount: number
  category: Category
  dateKey: string
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

const DAILY_Z_THRESHOLD = 2
const DAILY_ABSOLUTE_THRESHOLD = 25
const CATEGORY_RATIO_THRESHOLD = 1.35
const CATEGORY_ABSOLUTE_THRESHOLD = 40

function parseDateKey(rawDate: string): string | null {
  const isoDateMatch = /^\d{4}-\d{2}-\d{2}/.exec(rawDate)
  if (isoDateMatch) {
    return isoDateMatch[0]
  }

  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0
  }

  const avg = mean(values)
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function linearRegressionSlope(values: number[]): number {
  if (values.length < 2) {
    return 0
  }

  const xMean = (values.length - 1) / 2
  const yMean = mean(values)

  let numerator = 0
  let denominator = 0

  values.forEach((value, index) => {
    const xDiff = index - xMean
    numerator += xDiff * (value - yMean)
    denominator += xDiff * xDiff
  })

  if (denominator === 0) {
    return 0
  }

  return numerator / denominator
}

function getSeverity(zScore: number): AnomalySeverity {
  if (zScore >= 3.5) {
    return "high"
  }

  if (zScore >= 2.7) {
    return "medium"
  }

  return "low"
}

function calculateRiskScore(anomalies: SpendingAnomaly[]): number {
  const weightedScore = anomalies.slice(0, 6).reduce((score, anomaly) => {
    const weight = anomaly.severity === "high" ? 1.8 : anomaly.severity === "medium" ? 1.2 : 0.7
    return score + anomaly.deviationScore * weight
  }, 0)

  return Math.max(0, Math.min(100, Math.round(weightedScore * 8)))
}

export function generateSpendingInsights(transactions: Transaction[]): SpendingInsightsResult {
  const expenses: ExpensePoint[] = transactions
    .filter((transaction) => transaction.type === "expense" && !transaction.transferId && transaction.amount > 0)
    .map((transaction) => {
      const dateKey = parseDateKey(transaction.date)
      if (!dateKey) {
        return null
      }

      return {
        amount: transaction.amount,
        category: transaction.category,
        dateKey,
      }
    })
    .filter((point): point is ExpensePoint => point !== null)

  if (expenses.length === 0) {
    return {
      modelName: "Rolling Z-Score + Trend Regression",
      evaluatedExpenseCount: 0,
      anomalies: [],
      insights: [
        {
          id: "not-enough-data",
          title: "No expense history yet",
          description: "Add expense transactions to unlock AI-driven anomaly detection and trend insights.",
          supportingMetric: "0 expense records",
          priority: "info",
        },
      ],
      riskScore: 0,
      timeline: [],
    }
  }

  const dailyTotalsMap = new Map<string, number>()
  const dailyIncomeMap = new Map<string, number>()
  const categoryMonthlyMap = new Map<string, number>()

  expenses.forEach((expense) => {
    dailyTotalsMap.set(expense.dateKey, (dailyTotalsMap.get(expense.dateKey) ?? 0) + expense.amount)

    const monthKey = expense.dateKey.slice(0, 7)
    const categoryMonthKey = `${expense.category}|${monthKey}`
    categoryMonthlyMap.set(
      categoryMonthKey,
      (categoryMonthlyMap.get(categoryMonthKey) ?? 0) + expense.amount
    )
  })

  transactions
    .filter((transaction) => transaction.type === "income" && !transaction.transferId && transaction.amount > 0)
    .forEach((income) => {
      const dateKey = parseDateKey(income.date)
      if (!dateKey) {
        return
      }

      dailyIncomeMap.set(dateKey, (dailyIncomeMap.get(dateKey) ?? 0) + income.amount)
    })

  const dailySeries = Array.from(dailyTotalsMap.entries())
    .map(([date, grossExpense]) => {
      const sameDayIncome = dailyIncomeMap.get(date) ?? 0
      const netOutflow = Math.max(grossExpense - sameDayIncome, 0)

      return {
        date,
        amount: netOutflow,
        grossExpense,
        sameDayIncome,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const anomalies: SpendingAnomaly[] = []
  const rollingWindow = Math.min(10, Math.max(5, Math.floor(dailySeries.length / 3)))
  const timeline: Array<{
    date: string
    amount: number
    grossExpense: number
    sameDayIncome: number
    baseline: number
    isAnomaly: boolean
  }> = []

  for (let index = rollingWindow; index < dailySeries.length; index += 1) {
    const baselineWindow = dailySeries.slice(index - rollingWindow, index).map((entry) => entry.amount)
    const baseline = mean(baselineWindow)
    const deviation = standardDeviation(baselineWindow)
    const current = dailySeries[index]

    if (baseline <= 0) {
      continue
    }

    const normalizedDeviation = deviation < 1 ? 1 : deviation
    const zScore = (current.amount - baseline) / normalizedDeviation
    const isAnomaly =
      zScore >= DAILY_Z_THRESHOLD &&
      current.amount - baseline >= DAILY_ABSOLUTE_THRESHOLD

    timeline.push({
      date: current.date,
      amount: current.amount,
      grossExpense: current.grossExpense,
      sameDayIncome: current.sameDayIncome,
      baseline,
      isAnomaly,
    })

    if (isAnomaly) {
      anomalies.push({
        id: `daily-${current.date}`,
        date: current.date,
        title: "Daily spending anomaly",
        description:
          current.sameDayIncome > 0
            ? `Net spending (expenses - same-day income) was ${Math.round((current.amount / baseline - 1) * 100)}% above your expected daily baseline.`
            : `Spending was ${Math.round((current.amount / baseline - 1) * 100)}% above your expected daily baseline.`,
        amount: current.amount,
        grossExpenseAmount: current.grossExpense,
        sameDayIncomeAmount: current.sameDayIncome,
        baselineAmount: baseline,
        deviationScore: zScore,
        severity: getSeverity(zScore),
      })
    }
  }

  const latestDate = dailySeries[dailySeries.length - 1]?.date

  if (latestDate) {
    const currentMonth = latestDate.slice(0, 7)
    const historicalMonthTotalsByCategory = new Map<Category, number[]>()
    const currentMonthTotalsByCategory = new Map<Category, number>()

    categoryMonthlyMap.forEach((amount, key) => {
      const [rawCategory, monthKey] = key.split("|")
      const category = rawCategory as Category

      if (monthKey === currentMonth) {
        currentMonthTotalsByCategory.set(category, amount)
        return
      }

      if (!historicalMonthTotalsByCategory.has(category)) {
        historicalMonthTotalsByCategory.set(category, [])
      }

      historicalMonthTotalsByCategory.get(category)?.push(amount)
    })

    currentMonthTotalsByCategory.forEach((currentAmount, category) => {
      const history = (historicalMonthTotalsByCategory.get(category) ?? [])
        .sort((a, b) => b - a)
        .slice(0, 4)

      if (history.length < 2) {
        return
      }

      const categoryBaseline = mean(history)
      if (categoryBaseline <= 0) {
        return
      }

      const ratio = currentAmount / categoryBaseline
      if (
        ratio >= CATEGORY_RATIO_THRESHOLD &&
        currentAmount - categoryBaseline >= CATEGORY_ABSOLUTE_THRESHOLD
      ) {
        const score = Math.min(5, ratio * 1.5)
        anomalies.push({
          id: `category-${category}-${currentMonth}`,
          date: currentMonth,
          title: "Category overspending anomaly",
          description: `Spending in ${category} is ${Math.round((ratio - 1) * 100)}% above your monthly trend.`,
          category,
          amount: currentAmount,
          grossExpenseAmount: currentAmount,
          sameDayIncomeAmount: 0,
          baselineAmount: categoryBaseline,
          deviationScore: score,
          severity: score >= 3.5 ? "high" : "medium",
        })
      }
    })
  }

  const insights: SpendingInsight[] = []

  if (latestDate) {
    const latestDateValue = new Date(`${latestDate}T00:00:00`).getTime()

    const sumInRange = (startOffsetDays: number, endOffsetDays: number): number => {
      return dailySeries.reduce((sum, entry) => {
        const entryTime = new Date(`${entry.date}T00:00:00`).getTime()
        const diffInDays = Math.floor((latestDateValue - entryTime) / DAY_IN_MS)

        if (diffInDays >= startOffsetDays && diffInDays <= endOffsetDays) {
          return sum + entry.amount
        }

        return sum
      }, 0)
    }

    const recentWindow = sumInRange(0, 13)
    const previousWindow = sumInRange(14, 27)
    const recentWeek = sumInRange(0, 6)
    const previousWeek = sumInRange(7, 13)

    if (previousWeek > 0) {
      const weekChangeRatio = recentWeek / previousWeek
      const weekDeltaPercent = Math.round(Math.abs(weekChangeRatio - 1) * 100)

      if (weekChangeRatio >= 1.1) {
        insights.push({
          id: "week-over-week-up",
          title: "Week-over-week spending increased",
          description: "You spent more this week compared with the previous week.",
          supportingMetric: `${weekDeltaPercent}% more than last week`,
          priority: "warning",
        })
      } else if (weekChangeRatio <= 0.9) {
        insights.push({
          id: "week-over-week-down",
          title: "Week-over-week spending decreased",
          description: "Your current week spending is lower than the previous week.",
          supportingMetric: `${weekDeltaPercent}% less than last week`,
          priority: "positive",
        })
      }
    }

    if (previousWindow > 0) {
      const changeRatio = recentWindow / previousWindow
      if (changeRatio >= 1.2) {
        insights.push({
          id: "spend-velocity-up",
          title: "Spending velocity is increasing",
          description: "Your last 14 days of spending are significantly higher than the prior 14-day period.",
          supportingMetric: `${Math.round((changeRatio - 1) * 100)}% increase`,
          priority: "warning",
        })
      } else if (changeRatio <= 0.85) {
        insights.push({
          id: "spend-velocity-down",
          title: "Spending velocity is improving",
          description: "Your recent spending pace is lower than the previous two-week period.",
          supportingMetric: `${Math.round((1 - changeRatio) * 100)}% lower`,
          priority: "positive",
        })
      }
    }
  }

  const weekdayTotals = new Array<number>(7).fill(0)
  expenses.forEach((expense) => {
    const dayOfWeek = new Date(`${expense.dateKey}T00:00:00`).getDay()
    weekdayTotals[dayOfWeek] += expense.amount
  })

  const totalSpend = weekdayTotals.reduce((sum, amount) => sum + amount, 0)
  if (totalSpend > 0) {
    const topWeekdayAmount = Math.max(...weekdayTotals)
    const topWeekday = weekdayTotals.findIndex((amount) => amount === topWeekdayAmount)
    const concentrationRatio = topWeekdayAmount / totalSpend

    if (concentrationRatio >= 0.35) {
      const weekdayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][topWeekday]
      insights.push({
        id: "weekday-concentration",
        title: "Spending is concentrated on specific days",
        description: `${weekdayName} contributes an unusually large share of your expenses.`,
        supportingMetric: `${Math.round(concentrationRatio * 100)}% of total expenses`,
        priority: "info",
      })
    }
  }

  const monthlyTotalsMap = new Map<string, number>()
  dailySeries.forEach((entry) => {
    const monthKey = entry.date.slice(0, 7)
    monthlyTotalsMap.set(monthKey, (monthlyTotalsMap.get(monthKey) ?? 0) + entry.amount)
  })

  const monthlySeries = Array.from(monthlyTotalsMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))

  if (monthlySeries.length >= 2) {
    const currentMonthSpend = monthlySeries[monthlySeries.length - 1].amount
    const previousMonthSpend = monthlySeries[monthlySeries.length - 2].amount

    if (previousMonthSpend > 0) {
      const monthChangeRatio = currentMonthSpend / previousMonthSpend
      const monthDeltaPercent = Math.round(Math.abs(monthChangeRatio - 1) * 100)

      if (monthChangeRatio >= 1.1) {
        insights.push({
          id: "month-over-month-up",
          title: "Month-over-month spending increased",
          description: "This month's spending is higher than last month.",
          supportingMetric: `${monthDeltaPercent}% more than last month`,
          priority: "warning",
        })
      } else if (monthChangeRatio <= 0.9) {
        insights.push({
          id: "month-over-month-down",
          title: "Month-over-month spending decreased",
          description: "This month's spending is lower than last month.",
          supportingMetric: `${monthDeltaPercent}% less than last month`,
          priority: "positive",
        })
      }
    }
  }

  if (monthlySeries.length >= 4) {
    const slope = linearRegressionSlope(monthlySeries.map((item) => item.amount))

    if (slope >= 35) {
      insights.push({
        id: "monthly-trend-up",
        title: "Upward spending trend detected",
        description: "Your monthly expenses are trending upward based on regression analysis.",
        supportingMetric: `+${Math.round(slope)} per month`,
        priority: "critical",
      })
    } else if (slope <= -35) {
      insights.push({
        id: "monthly-trend-down",
        title: "Long-term spending trend is decreasing",
        description: "Your monthly expenses show a sustained downward trend.",
        supportingMetric: `${Math.round(slope)} per month`,
        priority: "positive",
      })
    }
  }

  const rankedAnomalies = anomalies
    .sort((a, b) => {
      const severityRank = { high: 3, medium: 2, low: 1 }
      const severityDiff = severityRank[b.severity] - severityRank[a.severity]
      if (severityDiff !== 0) {
        return severityDiff
      }

      return b.deviationScore - a.deviationScore
    })
    .slice(0, 8)

  if (insights.length === 0) {
    insights.push({
      id: "stable-pattern",
      title: "Spending pattern appears stable",
      description: "No strong behavioral shifts were detected in your current expense history.",
      supportingMetric: `${dailySeries.length} tracked spending days`,
      priority: "info",
    })
  }

  return {
    modelName: "Rolling Z-Score + Trend Regression",
    evaluatedExpenseCount: expenses.length,
    anomalies: rankedAnomalies,
    insights,
    riskScore: calculateRiskScore(rankedAnomalies),
    timeline,
  }
}
