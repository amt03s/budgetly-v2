"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useBudget } from "@/lib/budget-context"
import { useCurrency } from "@/lib/currency-context"
import { useToast } from "@/hooks/use-toast"
import { WalletDialog } from "./wallet-dialog"
import { TransferDialog } from "./transfer-dialog"
import type { Wallet } from "@/lib/types"
import { Plus, Pencil, Trash2, ChevronRight, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function WalletsList() {
  const { wallets, deleteWallet } = useBudget()
  const { formatAmount } = useCurrency()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null)

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

  const handleDelete = async (id: string, name: string) => {
    try {
      setDeletingWalletId(id)
      await deleteWallet(id)
      toast({
        title: "Wallet deleted",
        description: `\"${name}\" has been deleted.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete wallet"
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setDeletingWalletId(null)
    }
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
                <div
                  key={wallet.id}
                  className="group flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                >
                  <Link
                    href={`/dashboard/wallets/${wallet.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium">{wallet.name}</p>
                      <p
                        className={cn(
                          "text-sm",
                          wallet.balance >= 0 ? "text-foreground" : "text-destructive"
                        )}
                      >
                        {formatAmount(wallet.balance)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => handleEdit(wallet, e)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={deletingWalletId === wallet.id}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this wallet?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{wallet.name}", including its transactions, goals, and recurring schedules. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleDelete(wallet.id, wallet.name)}
                            disabled={deletingWalletId === wallet.id}
                          >
                            {deletingWalletId === wallet.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Link href={`/dashboard/wallets/${wallet.id}`}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`Open ${wallet.name}`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
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
