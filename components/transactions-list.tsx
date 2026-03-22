"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useBudget } from "@/lib/budget-context"
import { formatCurrency } from "@/lib/currency"
import { getTransactionCategoryLabel, type Transaction } from "@/lib/types"
import { TransactionDialog } from "./transaction-dialog"
import { Pencil, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

interface TransactionsListProps {
  walletId?: string
}

export function TransactionsList({ walletId }: TransactionsListProps) {
  const { transactions, getWalletById, deleteTransaction } = useBudget()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const filteredTransactions = walletId
    ? transactions.filter((t) => t.walletId === walletId)
    : transactions

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateDiff !== 0) {
      return dateDiff
    }

    const createdAtDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0)
    if (createdAtDiff !== 0) {
      return createdAtDiff
    }

    return b.id.localeCompare(a.id)
  })

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingTransaction(null)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteTransaction(id)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {sortedTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet. Add your first transaction to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  {!walletId && <TableHead>Wallet</TableHead>}
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.map((transaction) => {
                  const wallet = getWalletById(transaction.walletId)
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        {transaction.description || "-"}
                      </TableCell>
                      <TableCell>{getTransactionCategoryLabel(transaction)}</TableCell>
                      {!walletId && <TableCell>{wallet?.name || "-"}</TableCell>}
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          transaction.type === "income"
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The transaction of {formatCurrency(transaction.amount)} on {formatDate(transaction.date)} will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(transaction.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editingTransaction}
      />
    </>
  )
}
