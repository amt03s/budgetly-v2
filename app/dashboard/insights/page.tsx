// Route page combining insight charts, AI spending insights, financial health score, and personalised advice cards.

import { InsightsCharts } from "@/components/insights-charts"
import { AiSpendingInsights } from "@/components/ai-spending-insights"
import { FinancialHealthScore } from "@/components/financial-health-score"
import { PersonalizedFinancialAdvice } from "@/components/personalized-financial-advice"

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Visualize your financial data
        </p>
      </div>

      <FinancialHealthScore />

      <PersonalizedFinancialAdvice />

      <AiSpendingInsights />

      <InsightsCharts />
    </div>
  )
}
