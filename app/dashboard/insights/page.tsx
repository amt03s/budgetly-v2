import { InsightsCharts } from "@/components/insights-charts"

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Visualize your financial data
        </p>
      </div>

      <InsightsCharts />
    </div>
  )
}
