import { InsightsCharts } from "@/components/insights-charts"
import { AiSpendingInsights } from "@/components/ai-spending-insights"

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Visualize your financial data
        </p>
      </div>

      <AiSpendingInsights />

      <InsightsCharts />
    </div>
  )
}
