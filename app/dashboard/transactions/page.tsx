import { TransactionsList } from "@/components/transactions-list"

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Manage your income and expenses
        </p>
      </div>

      <TransactionsList />
    </div>
  )
}
