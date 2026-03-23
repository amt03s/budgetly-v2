"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bot } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { SummaryCards } from "@/components/summary-cards"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { RecentTransactions } from "@/components/recent-transactions"
import { AiSpendingInsights } from "@/components/ai-spending-insights"

export default function DashboardPage() {
  const { user } = useAuth()
  const [showBudgeIntro, setShowBudgeIntro] = useState(false)
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening"
  const nickname = user?.displayName?.trim() || "there"

  useEffect(() => {
    if (!user) {
      setShowBudgeIntro(false)
      return
    }

    const storageKey = `budgetly:budge-intro-seen:${user.uid}`
    const hasSeenIntro = window.localStorage.getItem(storageKey)

    if (!hasSeenIntro) {
      setShowBudgeIntro(true)
      window.localStorage.setItem(storageKey, "true")
    }
  }, [user])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {greeting}, {nickname}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your financial status
        </p>
      </div>

      {showBudgeIntro && (
        <div className="rounded-2xl border bg-muted/40 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Bot className="h-4 w-4" />
                Meet Budge
              </div>
              <p className="text-sm text-muted-foreground">
                Budge is your AI budgeting guide. Ask for spending insights, savings ideas, or help understanding where your money is going.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBudgeIntro(false)}>
                Dismiss
              </Button>
              <Button asChild>
                <Link href="/dashboard/chat">Open Budge</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <SummaryCards />

      <UpcomingReminders />

      <AiSpendingInsights />

      <RecentTransactions />
    </div>
  )
}
