"use client"

import { useAuth } from "@/lib/auth-context"
import { SummaryCards } from "@/components/summary-cards"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { RecentTransactions } from "@/components/recent-transactions"
import { AiSpendingInsights } from "@/components/ai-spending-insights"
import { FirstTimeGuide } from "@/components/first-time-guide"

export default function DashboardPage() {
  const { user } = useAuth()
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening"
  const nickname = user?.displayName?.trim() || "there"

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

      <FirstTimeGuide userId={user?.uid} />

      <SummaryCards />

      <UpcomingReminders />

      <AiSpendingInsights />

      <RecentTransactions />
    </div>
  )
}
