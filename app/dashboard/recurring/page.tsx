import { RecurringTransactionsList } from "@/components/recurring-transactions-list"

export default function RecurringTransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recurring</h1>
        <p className="text-sm text-muted-foreground">
          Manage recurring schedules for expenses and income.
        </p>
      </div>

      <RecurringTransactionsList />
    </div>
  )
}
