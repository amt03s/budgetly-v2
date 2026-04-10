// Onboarding checklist card shown to new users, tracking setup steps (add wallet, transaction, goal, debt) until manually dismissed.

"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Circle, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useBudget } from "@/lib/budget-context"

interface FirstTimeGuideProps {
  userId?: string
}

export function FirstTimeGuide({ userId }: FirstTimeGuideProps) {
  const { wallets, transactions, savingGoals, debts } = useBudget()
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasVisitedBudge, setHasVisitedBudge] = useState(false)

  useEffect(() => {
    if (!userId) {
      setIsDismissed(true)
      return
    }

    const storageKey = `budgetly:first-time-guide-dismissed:${userId}`
    const dismissed = window.localStorage.getItem(storageKey) === "true"
    setIsDismissed(dismissed)

    const visitedKey = `budgetly:visited-budge:${userId}`
    const visited = window.localStorage.getItem(visitedKey) === "true"
    setHasVisitedBudge(visited)
  }, [userId])

  const steps = useMemo(
    () => [
      {
        id: "wallet",
        title: "Create your first wallet",
        description: "Add where your money lives so Budgetly can track balances.",
        href: "/dashboard/wallets",
        actionLabel: "Add wallet",
        complete: wallets.length > 0,
      },
      {
        id: "transaction",
        title: "Log your first transaction",
        description: "Record one income or expense to start building your money story.",
        href: "/dashboard/transactions",
        actionLabel: "Add transaction",
        complete: transactions.length > 0,
      },
      {
        id: "goal",
        title: "Set a goal or debt plan",
        description: "Add one savings goal or debt to keep your priorities visible.",
        href: "/dashboard/goals",
        actionLabel: "Set a goal",
        complete: savingGoals.length > 0 || debts.length > 0,
      },
      {
        id: "chat",
        title: "Visit Budge",
        description: "Meet your AI budgeting guide and explore what it can do for you.",
        href: "/dashboard/chat",
        actionLabel: "Visit Budge",
        complete: hasVisitedBudge,
      },
    ],
    [wallets.length, transactions.length, savingGoals.length, debts.length, hasVisitedBudge]
  )

  const totalSteps = steps.length
  const completedSteps = steps.filter((step) => step.complete).length
  const progressValue = (completedSteps / totalSteps) * 100
  const isSetupComplete = completedSteps === totalSteps
  const nextStep = steps.find((step) => !step.complete)

  if (!userId || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    if (userId) {
      const storageKey = `budgetly:first-time-guide-dismissed:${userId}`
      window.localStorage.setItem(storageKey, "true")
    }

    setIsDismissed(true)
  }

  const handleStepClick = (stepId: string) => {
    if (stepId === "chat" && userId) {
      const visitedKey = `budgetly:visited-budge:${userId}`
      window.localStorage.setItem(visitedKey, "true")
      setHasVisitedBudge(true)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Rocket className="h-4 w-4" />
          Quick Start Guide
        </div>
        <CardTitle>{isSetupComplete ? "Setup complete" : "Welcome to Budgetly"}</CardTitle>
        <CardDescription>
          {isSetupComplete
            ? "Great job. You finished your setup and Budgetly is ready to support your money goals."
            : "Complete these quick steps to set up your account and start getting useful insights."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Setup progress</span>
            <span className="text-muted-foreground">
              {completedSteps}/{totalSteps} completed
            </span>
          </div>
          <Progress value={progressValue} />
        </div>

        {isSetupComplete && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
            Congratulations on completing your Budgetly setup. Keep logging your activity to get better insights from Budge.
          </div>
        )}

        <div className="grid gap-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                {step.complete ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>

              {!step.complete && (
                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                  <Link href={step.href} onClick={() => handleStepClick(step.id)}>{step.actionLabel}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Dismiss guide
          </Button>

          {nextStep && (
            <Button asChild size="sm">
              <Link href={nextStep.href}>Continue setup</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}