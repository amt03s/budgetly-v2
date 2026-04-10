// Full transactions list with search, type/category/wallet filters, date sorting, and CRUD operations (add, edit, delete).

"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useCurrency } from "@/lib/currency-context"
import {
  getTransactionCategoryLabel,
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  type Transaction,
  type Category,
} from "@/lib/types"
import { TransactionDialog } from "./transaction-dialog"
import { Pencil, Trash2, Plus, Search, X, Repeat } from "lucide-react"
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
  const { transactions, wallets, getWalletById, deleteTransaction } = useBudget()
  const { formatAmount } = useCurrency()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Filter state
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all")
  const [walletFilter, setWalletFilter] = useState<"all" | string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const hasActiveFilters =
    search !== "" ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    walletFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== ""

  const clearFilters = () => {
    setSearch("")
    setTypeFilter("all")
    setCategoryFilter("all")
    setWalletFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  const filteredTransactions = useMemo(() => {
    let result = walletId
      ? transactions.filter((t) => t.walletId === walletId)
      : transactions

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          getTransactionCategoryLabel(t).toLowerCase().includes(q)
      )
    }

    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter)
    }

    if (categoryFilter !== "all") {
      result = result.filter((t) => t.category === categoryFilter)
    }

    if (!walletId && walletFilter !== "all") {
      result = result.filter((t) => t.walletId === walletFilter)
    }

    if (dateFrom) {
      result = result.filter((t) => t.date >= dateFrom)
    }

    if (dateTo) {
      result = result.filter((t) => t.date <= dateTo)
    }

    return [...result].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateDiff !== 0) return dateDiff
      const createdAtDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0)
      if (createdAtDiff !== 0) return createdAtDiff
      return b.id.localeCompare(a.id)
    })
  }, [transactions, walletId, search, typeFilter, categoryFilter, walletFilter, dateFrom, dateTo])

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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Transactions</CardTitle>
          <Button onClick={handleAdd} size="sm" className="w-full sm:w-auto">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search & filters */}
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description or category…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full shrink-0 sm:w-auto">
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger className="w-full lg:w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
                <SelectTrigger className="w-full lg:w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {ALL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!walletId && (
                <Select value={walletFilter} onValueChange={(v) => setWalletFilter(v)}>
                  <SelectTrigger className="w-full lg:w-[150px]">
                    <SelectValue placeholder="Wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All wallets</SelectItem>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full lg:w-[150px]"
                title="From date"
                placeholder="From"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full lg:w-[150px]"
                title="To date"
                placeholder="To"
              />
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No transactions match your filters."
                : "No transactions yet. Add your first transaction to get started."}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3 md:hidden">
                {filteredTransactions.map((transaction) => {
                  const wallet = getWalletById(transaction.walletId)
                  return (
                    <div key={transaction.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {transaction.description || "-"}
                          </p>
                          {transaction.isRecurringInstance && (
                            <Badge variant="outline" className="mt-1 gap-1">
                              <Repeat className="h-3 w-3" />
                              Recurring
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                        <p
                          className={cn(
                            "shrink-0 text-sm font-medium",
                            transaction.type === "income"
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatAmount(transaction.amount)}
                        </p>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{getTransactionCategoryLabel(transaction)}</span>
                        {!walletId && <span>• {wallet?.name || "-"}</span>}
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-1">
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
                                This action cannot be undone. The transaction of {formatAmount(transaction.amount)} on {formatDate(transaction.date)} will be permanently removed.
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
                    </div>
                  )
                })}
              </div>

              <div className="hidden md:block">
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
                    {filteredTransactions.map((transaction) => {
                      const wallet = getWalletById(transaction.walletId)
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-muted-foreground">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{transaction.description || "-"}</span>
                              {transaction.isRecurringInstance && (
                                <Badge variant="outline" className="gap-1">
                                  <Repeat className="h-3 w-3" />
                                  Recurring
                                </Badge>
                              )}
                            </div>
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
                            {formatAmount(transaction.amount)}
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
                                      This action cannot be undone. The transaction of {formatAmount(transaction.amount)} on {formatDate(transaction.date)} will be permanently removed.
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
              </div>
            </>
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
