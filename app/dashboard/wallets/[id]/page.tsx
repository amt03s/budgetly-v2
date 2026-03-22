"use client"

import { use } from "react"
import Link from "next/link"
import { useBudget } from "@/lib/budget-context"
import { formatCurrency } from "@/lib/currency"
import { TransactionsList } from "@/components/transactions-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { getWalletById } = useBudget()
  const wallet = getWalletById(id)

  if (!wallet) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/dashboard/wallets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wallets
          </Button>
        </Link>
        <p className="text-muted-foreground">Wallet not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/wallets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{wallet.name}</h1>
          <p className="text-sm text-muted-foreground">
            Transactions for this wallet
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(wallet.balance)}</p>
          </div>
        </CardContent>
      </Card>

      <TransactionsList walletId={id} />
    </div>
  )
}
