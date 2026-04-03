"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useBudget } from "@/lib/budget-context"
import { calculateFinancialHealth } from "@/lib/financial-health"
import { cn } from "@/lib/utils"
import { ShieldCheck, Info } from "lucide-react"

// ── Gauge ─────────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const r = 54
  const total = Math.PI * r // semicircle arc length ≈ 169.6
  const filled = (score / 100) * total

  const strokeColor =
    score >= 80
      ? "#16a34a"
      : score >= 60
        ? "#65a30d"
        : score >= 40
          ? "#d97706"
          : "#dc2626"

  return (
    <div className="relative flex items-center justify-center" style={{ height: 88 }}>
      {/* cx=70 (10+60=70), cy=75, radius=60, arc from (10,75) to (130,75) */}
      <svg width="140" height="80" viewBox="0 0 140 80" aria-hidden>
        {/* Track */}
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={total}
          strokeDashoffset={total - filled}
          style={{ transition: "stroke-dashoffset 0.7s ease, stroke 0.4s ease" }}
        />
      </svg>
      {/* Score overlay */}
      <div className="absolute bottom-0 flex flex-col items-center leading-none">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color: strokeColor }}
        >
          {score}
        </span>
        <span className="text-[11px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

// ── Dimension row ─────────────────────────────────────────────────────────────

function DimensionRow({
  label,
  score,
  maxScore,
  description,
}: {
  label: string
  score: number
  maxScore: number
  description: string
}) {
  const pct = Math.round((score / maxScore) * 100)
  const barColor =
    pct >= 75 ? "bg-green-500" : pct >= 45 ? "bg-amber-500" : "bg-red-500"

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <span className="font-medium">{label}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-52 text-xs">
              {description}
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="tabular-nums text-muted-foreground">
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FinancialHealthScore() {
  const { transactions, debts, savingGoals, totalIncome } = useBudget()

  const health = useMemo(
    () => calculateFinancialHealth(transactions, debts, savingGoals, totalIncome),
    [transactions, debts, savingGoals, totalIncome]
  )

  const labelColor =
    health.total >= 80
      ? "text-green-600 dark:text-green-400"
      : health.total >= 60
        ? "text-lime-600 dark:text-lime-400"
        : health.total >= 40
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400"

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Financial Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Gauge + label */}
        <div className="flex flex-col items-center gap-1">
          <ScoreGauge score={health.total} />
          <span className={cn("text-sm font-semibold", labelColor)}>
            {health.label}
          </span>
        </div>

        {/* Dimension breakdown */}
        <div className="flex flex-col gap-3">
          {health.dimensions.map((dim) => (
            <DimensionRow key={dim.label} {...dim} />
          ))}
        </div>

        {/* Top recommendation */}
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {health.recommendation}
        </p>
      </CardContent>
    </Card>
  )
}
