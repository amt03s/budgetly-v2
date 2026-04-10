// Pure functions that generate prioritised (critical → positive) rule-based financial advice items from the user's transactions, debts, and saving goals.

import type { Debt, SavingGoal, Transaction } from "@/lib/types"

export type AdvicePriority = "critical" | "warning" | "info" | "positive"

export interface PersonalizedAdviceItem {
  id: string
  title: string
  description: string
  supportingMetric: string
  priority: AdvicePriority
}

interface AdviceInput {
  transactions: Transaction[]
  debts: Debt[]
  savingGoals: SavingGoal[]
  totalIncome: number
  totalExpenses: number
  totalBalance: number
}

function average(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length
}

function linearRegressionForecast(values: number[]): {
  nextValue: number
  rSquared: number
} | null {
  if (values.length < 4) {
    return null
  }

  const n = values.length
  const xValues = values.map((_, index) => index)
  const yMean = average(values)
  const xMean = average(xValues)

  let covariance = 0
  let varianceX = 0

  for (let i = 0; i < n; i += 1) {
    const xDiff = xValues[i] - xMean
    covariance += xDiff * (values[i] - yMean)
    varianceX += xDiff * xDiff
  }

  if (varianceX === 0) {
    return null
  }

  const slope = covariance / varianceX
  const intercept = yMean - slope * xMean
  const nextX = n
  const nextValue = Math.max(0, intercept + slope * nextX)

  // Confidence estimate with coefficient of determination (R^2).
  let ssResidual = 0
  let ssTotal = 0

  for (let i = 0; i < n; i += 1) {
    const predicted = intercept + slope * xValues[i]
    const residual = values[i] - predicted
    ssResidual += residual * residual

    const totalDiff = values[i] - yMean
    ssTotal += totalDiff * totalDiff
  }

  const rSquared = ssTotal === 0 ? 0 : Math.max(0, Math.min(1, 1 - ssResidual / ssTotal))

  return {
    nextValue,
    rSquared,
  }
}

export function generatePersonalizedAdvice(input: AdviceInput): PersonalizedAdviceItem[] {
  const {
    transactions,
    debts,
    savingGoals,
    totalIncome,
    totalExpenses,
    totalBalance,
  } = input

  const advice: PersonalizedAdviceItem[] = []

  const net = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0

  if (totalIncome > 0 && savingsRate < 10) {
    advice.push({
      id: "boost-savings-rate",
      title: "Improve your monthly savings rate",
      description:
        "Your current margin between income and expenses is thin. A small reduction in non-essential spending can improve your resilience quickly.",
      supportingMetric: `Savings rate: ${Math.round(savingsRate)}%`,
      priority: savingsRate < 0 ? "critical" : "warning",
    })
  } else if (totalIncome > 0 && savingsRate >= 20) {
    advice.push({
      id: "strong-savings-rate",
      title: "Your savings pace is strong",
      description:
        "You are maintaining a healthy gap between earnings and spending. Keep this pace and route surplus to goals or an emergency fund.",
      supportingMetric: `Savings rate: ${Math.round(savingsRate)}%`,
      priority: "positive",
    })
  }

  const activePayableDebt = debts
    .filter((debt) => debt.status === "active" && debt.type === "owed_by_me")
    .reduce((sum, debt) => sum + Math.max(0, debt.amount - debt.paidAmount), 0)

  const debtToIncome = totalIncome > 0 ? (activePayableDebt / totalIncome) * 100 : 0

  if (activePayableDebt > 0) {
    advice.push({
      id: "debt-focus",
      title: debtToIncome > 50 ? "Debt is putting pressure on your budget" : "Accelerate debt payoff",
      description:
        debtToIncome > 50
          ? "A large portion of your income is exposed to debt. Prioritizing the highest-interest debt first can reduce long-term burden faster."
          : "Consistent extra payments, even small ones, can shorten payoff timelines and reduce interest costs.",
      supportingMetric: `Active debt: ${Math.round(debtToIncome)}% of total income`,
      priority: debtToIncome > 50 ? "critical" : "warning",
    })
  }

  const activeGoals = savingGoals.filter((goal) => goal.status === "active")

  if (activeGoals.length === 0) {
    advice.push({
      id: "start-goal",
      title: "Create your first active savings goal",
      description:
        "Goals make saving measurable and easier to sustain. Start with one short-term goal to build momentum.",
      supportingMetric: "0 active goals",
      priority: "info",
    })
  } else {
    const progressValues = activeGoals.map((goal) => {
      if (goal.targetAmount <= 0) {
        return 0
      }

      return Math.min(1, goal.savedAmount / goal.targetAmount)
    })

    const averageProgress = average(progressValues) * 100

    if (averageProgress < 25) {
      advice.push({
        id: "goal-contributions",
        title: "Increase consistency on goal contributions",
        description:
          "Your goals are active but still early. Automating a fixed contribution amount can improve completion speed.",
        supportingMetric: `Average goal progress: ${Math.round(averageProgress)}%`,
        priority: "warning",
      })
    } else if (averageProgress >= 70) {
      advice.push({
        id: "goal-momentum",
        title: "You have strong goal momentum",
        description:
          "Keep this rhythm and consider setting your next goal before current ones complete to maintain saving habits.",
        supportingMetric: `Average goal progress: ${Math.round(averageProgress)}%`,
        priority: "positive",
      })
    }
  }

  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "expense" && !transaction.transferId
  )

  const monthlyExpenses = new Map<string, number>()

  expenseTransactions.forEach((transaction) => {
    const monthKey = transaction.date.slice(0, 7)
    monthlyExpenses.set(monthKey, (monthlyExpenses.get(monthKey) ?? 0) + transaction.amount)
  })

  const monthlySeries = Array.from(monthlyExpenses.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map((entry) => entry[1])

  if (monthlySeries.length >= 3) {
    const latest = monthlySeries[monthlySeries.length - 1]
    const previous = monthlySeries[monthlySeries.length - 2]

    if (previous > 0) {
      const increaseRatio = latest / previous

      if (increaseRatio >= 1.2) {
        advice.push({
          id: "expense-creep",
          title: "Watch for expense creep this month",
          description:
            "Recent monthly expenses are rising. Reviewing your top two spending categories can help you course-correct early.",
          supportingMetric: `${Math.round((increaseRatio - 1) * 100)}% higher than last month`,
          priority: "warning",
        })
      }
    }
  }

  const forecast = linearRegressionForecast(monthlySeries)

  if (forecast) {
    const latest = monthlySeries[monthlySeries.length - 1] ?? 0
    const baseline = latest > 0 ? latest : average(monthlySeries)
    const recommendedBudget = Math.max(0, Math.round(forecast.nextValue * 0.95))
    const varianceVsBaseline =
      baseline > 0 ? ((forecast.nextValue - baseline) / baseline) * 100 : 0

    advice.push({
      id: "ml-spending-forecast",
      title: "ML forecast suggests next month budget target",
      description:
        varianceVsBaseline > 8
          ? "Predicted spending is trending upward. Setting a slightly lower target budget can help prevent overrun next month."
          : "Your projected spending is stable. Use this target as a personalized cap and track category overruns weekly.",
      supportingMetric: `Predicted spend: ${Math.round(forecast.nextValue)} | Suggested budget: ${recommendedBudget} | ML confidence: ${Math.round(forecast.rSquared * 100)}%`,
      priority: varianceVsBaseline > 8 ? "warning" : "info",
    })
  }

  if (totalBalance < Math.max(0, totalExpenses * 0.5)) {
    advice.push({
      id: "cash-buffer",
      title: "Strengthen your cash buffer",
      description:
        "Your available balance is relatively low compared with overall expenses. Building a buffer can reduce stress from unexpected costs.",
      supportingMetric: `Balance vs expenses: ${totalExpenses > 0 ? Math.round((totalBalance / totalExpenses) * 100) : 0}%`,
      priority: totalBalance <= 0 ? "critical" : "warning",
    })
  }

  if (advice.length === 0) {
    advice.push({
      id: "steady-habits",
      title: "Your financial habits look stable",
      description:
        "No major pressure signals were detected from your current data. Keep logging activity to maintain visibility and improve planning.",
      supportingMetric: `${transactions.length} transactions analyzed`,
      priority: "positive",
    })
  }

  const priorityRank: Record<AdvicePriority, number> = {
    critical: 4,
    warning: 3,
    info: 2,
    positive: 1,
  }

  return advice.sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]).slice(0, 5)
}
