"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useBudget } from "@/lib/budget-context"
import { formatCurrency } from "@/lib/currency"
import { WalletDialog } from "./wallet-dialog"
import { TransferDialog } from "./transfer-dialog"
import type { Wallet } from "@/lib/types"
import { Plus, Pencil, Trash2, ChevronRight, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function WalletsList() {
  const { wallets, deleteWallet } = useBudget()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)

  const handleEdit = (wallet: Wallet, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingWallet(wallet)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingWallet(null)
    setDialogOpen(true)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    deleteWallet(id)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Wallets</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferOpen(true)}
              disabled={wallets.length < 2}
            >
              <ArrowRightLeft className="mr-1 h-4 w-4" />
              Transfer
            </Button>
            <Button onClick={handleAdd} size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No wallets yet. Add your first wallet to get started.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {wallets.map((wallet) => (
                <Link
                  key={wallet.id}
                  href={`/dashboard/wallets/${wallet.id}`}
                  className="group flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium">{wallet.name}</p>
                    <p
                      className={cn(
                        "text-sm",
                        wallet.balance >= 0 ? "text-foreground" : "text-destructive"
                      )}
                    >
                      {formatCurrency(wallet.balance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => handleEdit(wallet, e)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => handleDelete(wallet.id, e)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WalletDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        wallet={editingWallet}
      />

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
    </>
  )
}
