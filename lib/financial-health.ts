import type { Transaction, Debt, SavingGoal } from "./types"
import { generateSpendingInsights } from "./spending-insights"

export interface HealthScoreDimension {
  label: string
  score: number
  maxScore: number
  description: string
}

export interface FinancialHealthScore {
  total: number
  label: "Excellent" | "Good" | "Fair" | "Needs Work" | "Poor"
  dimensions: HealthScoreDimension[]
  recommendation: string
}

// ── Savings Rate (max 30 pts) ─────────────────────────────────────────────────
function computeSavingsRate(transactions: Transaction[]): { score: number; rate: number; hasIncome: boolean } {
  const income = transactions
    .filter((t) => t.type === "income" && !t.transferId)
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === "expense" && !t.transferId)
    .reduce((sum, t) => sum + t.amount, 0)

  if (income === 0) return { score: 0, rate: 0, hasIncome: false }

  const rate = ((income - expenses) / income) * 100

  let score: number
  if (rate >= 30) score = 30
  else if (rate >= 20) score = 24
  else if (rate >= 10) score = 18
  else if (rate >= 5) score = 12
  else if (rate >= 0) score = 6
  else score = 0

  return { score, rate, hasIncome: true }
}

// ── Debt Burden (max 25 pts) ──────────────────────────────────────────────────
function computeDebtBurden(activeDebt: number, totalIncome: number): { score: number; ratio: number } {
  if (activeDebt === 0) return { score: 25, ratio: 0 }
  if (totalIncome === 0) return { score: 0, ratio: 100 }

  const ratio = (activeDebt / totalIncome) * 100

  let score: number
  if (ratio < 5) score = 25
  else if (ratio < 15) score = 20
  else if (ratio < 30) score = 15
  else if (ratio < 50) score = 10
  else if (ratio < 100) score = 5
  else score = 0

  return { score, ratio }
}

// ── Goal Progress (max 20 pts) ────────────────────────────────────────────────
function computeGoalProgress(savingGoals: SavingGoal[]): { score: number; avgProgress: number } {
  const activeGoals = savingGoals.filter((g) => g.status === "active")
  if (activeGoals.length === 0) return { score: 10, avgProgress: -1 } // neutral

  const avgProgress =
    (activeGoals.reduce((sum, g) => sum + Math.min(1, g.savedAmount / Math.max(1, g.targetAmount)), 0) /
      activeGoals.length) *
    100

  let score: number
  if (avgProgress >= 75) score = 20
  else if (avgProgress >= 50) score = 15
  else if (avgProgress >= 25) score = 10
  else if (avgProgress >= 10) score = 6
  else score = 2

  return { score, avgProgress }
}

// ── Spending Stability (max 15 pts) ──────────────────────────────────────────
function computeSpendingStability(riskScore: number): { score: number } {
  // riskScore 0 → stable → 15 pts; riskScore 100 → 0 pts
  const score = Math.round((1 - riskScore / 100) * 15)
  return { score: Math.max(0, score) }
}

// ── Income Consistency (max 10 pts) ──────────────────────────────────────────
function computeIncomeConsistency(transactions: Transaction[]): { score: number; activeMonths: number } {
  const months = new Set<string>()
  transactions
    .filter((t) => t.type === "income" && !t.transferId)
    .forEach((t) => months.add(t.date.slice(0, 7)))

  const activeMonths = months.size

  let score: number
  if (activeMonths >= 6) score = 10
  else if (activeMonths >= 3) score = 8
  else if (activeMonths >= 2) score = 5
  else if (activeMonths >= 1) score = 2
  else score = 0

  return { score, activeMonths }
}

function getLabel(total: number): FinancialHealthScore["label"] {
  if (total >= 80) return "Excellent"
  if (total >= 60) return "Good"
  if (total >= 40) return "Fair"
  if (total >= 20) return "Needs Work"
  return "Poor"
}

function getRecommendation(dimensions: HealthScoreDimension[]): string {
  const weakest = dimensions.reduce((prev, curr) =>
    curr.score / curr.maxScore < prev.score / prev.maxScore ? curr : prev
  )

  const map: Record<string, string> = {
    "Savings Rate":
      "Try to increase your savings rate by reducing discretionary spending or boosting income streams.",
    "Debt Burden":
      "Prioritise paying down active debt to lower your debt-to-income ratio and free up cash flow.",
    "Goal Progress":
      "Make regular contributions toward your savings goals — even small amounts add up over time.",
    "Spending Stability":
      "Review your recent spending anomalies to reduce unexpected expense spikes.",
    "Income Consistency":
      "Aim for reliable income each month to build a more stable financial foundation.",
  }

  return map[weakest.label] ?? "Keep maintaining healthy financial habits."
}

// ── Public API ────────────────────────────────────────────────────────────────
export function calculateFinancialHealth(
  transactions: Transaction[],
  debts: Debt[],
  savingGoals: SavingGoal[],
  totalIncome: number
): FinancialHealthScore {
  const { score: savingsScore, rate: savingsRate, hasIncome } = computeSavingsRate(transactions)

  const activeDebt = debts
    .filter((d) => d.status === "active" && d.type === "owed_by_me")
    .reduce((sum, d) => sum + Math.max(0, d.amount - d.paidAmount), 0)

  const { score: debtScore, ratio: debtRatio } = computeDebtBurden(activeDebt, totalIncome)
  const { score: goalScore, avgProgress } = computeGoalProgress(savingGoals)

  const { riskScore } = generateSpendingInsights(transactions)
  const { score: stabilityScore } = computeSpendingStability(riskScore)
  const { score: incomeScore, activeMonths } = computeIncomeConsistency(transactions)

  const total = Math.min(100, savingsScore + debtScore + goalScore + stabilityScore + incomeScore)

  const dimensions: HealthScoreDimension[] = [
    {
      label: "Savings Rate",
      score: savingsScore,
      maxScore: 30,
      description: !hasIncome
        ? "No income recorded yet"
        : savingsRate < 0
          ? "Spending exceeds income"
          : `${Math.round(savingsRate)}% of income saved`,
    },
    {
      label: "Debt Burden",
      score: debtScore,
      maxScore: 25,
      description:
        activeDebt === 0
          ? "No active debt — great!"
          : `Debt is ${Math.round(debtRatio)}% of total income`,
    },
    {
      label: "Goal Progress",
      score: goalScore,
      maxScore: 20,
      description:
        avgProgress < 0
          ? "No active saving goals"
          : `${Math.round(avgProgress)}% average goal completion`,
    },
    {
      label: "Spending Stability",
      score: stabilityScore,
      maxScore: 15,
      description: `Anomaly risk score: ${riskScore} / 100`,
    },
    {
      label: "Income Consistency",
      score: incomeScore,
      maxScore: 10,
      description:
        activeMonths === 0
          ? "No income recorded yet"
          : `Income tracked across ${activeMonths} month${activeMonths !== 1 ? "s" : ""}`,
    },
  ]

  return {
    total,
    label: getLabel(total),
    dimensions,
    recommendation: getRecommendation(dimensions),
  }
}
