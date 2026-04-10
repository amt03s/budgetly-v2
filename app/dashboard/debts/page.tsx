// Route page for the debts and receivables management view.

import { DebtsList } from "@/components/debts-list"

export default function DebtsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Debts &amp; Receivables</h1>
        <p className="text-sm text-muted-foreground">
          Track money you owe and money owed to you
        </p>
      </div>

      <DebtsList />
    </div>
  )
}
