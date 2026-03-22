import { SummaryCards } from "@/components/summary-cards"
import { RecentTransactions } from "@/components/recent-transactions"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your financial status
        </p>
      </div>

      <SummaryCards />

      <RecentTransactions />
    </div>
  )
}
